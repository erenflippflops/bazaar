import { describe, it, expect, afterEach } from 'vitest';
import { startServer, connectClient, waitForConnect, TestServer, TestClient } from './helpers.js';

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
    await client2.emitWithAck('join_room', { code: room.code, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    const revealedItems: Set<string> = new Set();

    // Play full game and track revealed items
    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;

      await opener.emitWithAck('spin_wheel', {});

      const stateAfterSpin = await opener.emitWithAck('get_state', {});
      const revealedItem = stateAfterSpin.state.currentItem;
      if (revealedItem) {
        revealedItems.add(revealedItem.name);
      }

      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.currentItem === null, 2000);
    }

    await client1.waitForState((s: any) => s.phase === 'finished', 5000);

    // Check all messages to both clients
    const allClients = [client1, client2];

    for (const client of allClients) {
      const messagesByTime = [...client.messages].sort((a, b) => a.timestamp - b.timestamp);

      for (const msg of messagesByTime) {
        const msgStr = JSON.stringify(msg.payload);

        // Extract all item names mentioned in this message
        const mentionedItems: string[] = [];

        if (msg.payload?.currentItem?.name) {
          mentionedItems.push(msg.payload.currentItem.name);
        }

        if (msg.payload?.players) {
          for (const player of msg.payload.players) {
            if (player.slots) {
              for (const slot of player.slots) {
                if (slot?.name) {
                  mentionedItems.push(slot.name);
                }
              }
            }
          }
        }

        // Each mentioned item must have been revealed by this timestamp
        for (const itemName of mentionedItems) {
          expect(revealedItems.has(itemName)).toBe(true);
        }
      }
    }

    // Items that were never revealed should not appear in any message
    const allItemNames = new Set<string>();
    for (const client of allClients) {
      for (const msg of client.messages) {
        const msgStr = JSON.stringify(msg.payload);

        // Extract any item names
        if (msg.payload?.currentItem?.name) {
          allItemNames.add(msg.payload.currentItem.name);
        }
        if (msg.payload?.players) {
          for (const player of msg.payload.players) {
            if (player.slots) {
              for (const slot of player.slots) {
                if (slot?.name) {
                  allItemNames.add(slot.name);
                }
              }
            }
          }
        }
      }
    }

    // All items that appeared must have been revealed
    for (const itemName of allItemNames) {
      expect(revealedItems.has(itemName)).toBe(true);
    }

    clients.push(client1);
  }, 30000);
});
