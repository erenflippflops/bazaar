import { describe, it, expect, afterEach } from 'vitest';
import { startServer, connectClient, waitForConnect, TestServer, TestClient } from './helpers.js';
import * as fs from 'fs';
import * as path from 'path';

let server: TestServer | null = null;
let clients: TestClient[] = [];

afterEach(async () => {
  for (const client of clients) {
    client.close();
  }
  clients = [];
  if (server) {
    await server.close();
    server = null;
  }
});

describe('Secrecy', () => {
  it('no item name appears before it becomes revealed; unrevealed items never appear', async () => {
    const fakeJudge = async (players: any[]) => {
      const ranking = players.map((p, i) => ({
        player: p.nickname,
        rank: i + 1,
        reason: 'Test reason'
      }));
      return JSON.stringify({ ranking, commentary: 'Test commentary' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    // Load exact item names from the superpowers theme file
    const themePath = path.join(process.cwd(), 'server', 'themes', 'superpowers.json');
    const themeData = JSON.parse(fs.readFileSync(themePath, 'utf-8'));
    const allThemeItems: string[] = themeData.items.map((item: any) => item.name.tr);

    // Track revealed items with their timestamps
    const revealedItemsTimestamps: Map<string, number> = new Map();

    // Play full game and track revealed items
    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;

      await opener.emitWithAck('spin_wheel', {});

      const stateAfterSpin = await opener.waitForState((s: any) => s.revealedItem !== null, 2000);
      const revealedItem = stateAfterSpin.revealedItem;
      if (revealedItem) {
        revealedItemsTimestamps.set(revealedItem.name, Date.now());
      }

      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    await client1.waitForState((s: any) => s.phase === 'finished', 5000);

    // Check all state_update messages to both clients
    const allClients = [client1, client2];

    for (const client of allClients) {
      const stateUpdates = client.messages.filter(m => m.event === 'state_update');

      for (const msg of stateUpdates) {
        const msgJSON = JSON.stringify(msg.payload);
        const msgTimestamp = msg.timestamp || 0;

        // Search for every theme item name as an exact JSON string value
        for (const themeName of allThemeItems) {
          // Match as a JSON string value: "\"ItemName\""
          const exactPattern = `"${themeName}"`;
          if (msgJSON.includes(exactPattern)) {
            // If found, it must have been revealed before or at this message's timestamp
            const revealTimestamp = revealedItemsTimestamps.get(themeName);
            expect(revealTimestamp).toBeDefined();
            expect(revealTimestamp!).toBeLessThanOrEqual(msgTimestamp);
          }
        }
      }
    }

    clients.push(client1);
  }, 30000);
});
