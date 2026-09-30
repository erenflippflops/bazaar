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

describe('Full Game', () => {
  it('2 players play a whole game until finished', async () => {
    const fakeJudge = async (players: any[]) => {
      const ranking = players.map((p, i) => ({
        player: p.nickname,
        rank: i + 1,
        reason: 'Test reason'
      }));
      return JSON.stringify({ ranking, commentary: 'Test commentary' });
    };

    server = await startServer(fakeJudge, 0.01); // Very fast for full game

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    // Play through by always bidding 1 gold on every auction
    for (let round = 0; round < 3; round++) {
      for (let playerTurn = 0; playerTurn < 2; playerTurn++) {
        const currentClient = playerTurn === 0 ? client1 : client2;

        await currentClient.waitForState((s: any) => s.phase === 'playing', 10000);
        await currentClient.emitWithAck('spin_wheel', {});
        await currentClient.emitWithAck('place_bid', { amount: 1 });

        // Wait for auction to resolve
        await currentClient.waitForState((s: any) =>
          s.phase === 'playing' || s.phase === 'judging', 2000);
      }
    }

    // Wait for judging to complete
    const finalState = await client1.waitForState((s: any) => s.phase === 'finished', 5000);

    expect(finalState.phase).toBe('finished');
    expect(finalState.players.every((p: any) => p.slots.filter((s: any) => s !== null).length === 3)).toBe(true);
    expect(finalState.players.every((p: any) => p.gold >= 0)).toBe(true);
    expect(finalState.ranking.length).toBe(2);
    expect(finalState.wheel).toBe(40 - 6);

    clients.push(client1);
  }, 30000);

  it('6 players play a whole game until finished', async () => {
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

    const allClients = [client1];
    for (let i = 2; i <= 6; i++) {
      const client = connectClient(server.port);
      clients.push(client);
      await waitForConnect(client);
      await client.emitWithAck('join_room', { roomCode: room.roomCode, nickname: `P${i}` });
      allClients.push(client);
    }

    await client1.emitWithAck('start_game', {});

    // Play through 18 auctions (6 players × 3 items each)
    for (let round = 0; round < 18; round++) {
      const opener = allClients[round % 6];

      await opener.waitForState((s: any) => s.phase === 'playing', 10000);
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });

      await opener.waitForState((s: any) =>
        s.phase === 'playing' || s.phase === 'judging', 2000);
    }

    const finalState = await client1.waitForState((s: any) => s.phase === 'finished', 5000);

    expect(finalState.phase).toBe('finished');
    expect(finalState.players.every((p: any) => p.slots.filter((s: any) => s !== null).length === 3)).toBe(true);
    expect(finalState.players.every((p: any) => p.gold >= 0)).toBe(true);
    expect(finalState.ranking.length).toBe(6);
    expect(finalState.wheel).toBe(40 - 18);
  }, 60000);
});
