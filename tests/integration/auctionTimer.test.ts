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

describe('Auction Timer', () => {
  it('no further bids: auction resolves ~1s after opening (not before 0.8s, by 1.6s)', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', { nickname: 'P1' });
    const roomCode = createResult.roomCode;

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});
    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 1 });

    const bidTime = Date.now();

    try {
      const state = await client1.waitForState(
        (s: any) => {
          const p1 = s.players.find((p: any) => p.nickname === 'P1');
          return p1 && p1.slots[0] !== null && p1.gold === 19;
        },
        2000
      );

      const elapsed = (Date.now() - bidTime) / 1000;

      expect(elapsed).toBeGreaterThanOrEqual(0.8);
      expect(elapsed).toBeLessThanOrEqual(1.6);
      expect(state.players.find((p: any) => p.nickname === 'P1').gold).toBe(19);
    } catch (e) {
      throw new Error('SERVER BUG: Auction never resolved after manual opening bid (timer not scheduled)');
    }

    clients.push(client1);
  }, 10000);

  it('late bid at ~0.7s: auction does not resolve before ~1.1s and resolves by ~1.7s', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', { nickname: 'P1' });
    const roomCode = createResult.roomCode;

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});
    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 1 });

    const bidTime = Date.now();

    // Wait ~0.7s then place late bid
    await new Promise(resolve => setTimeout(resolve, 700));
    await client2.emitWithAck('place_bid', { amount: 2 });

    try {
      const state = await client1.waitForState(
        (s: any) => {
          const p2 = s.players.find((p: any) => p.nickname === 'P2');
          return p2 && p2.slots[0] !== null;
        },
        2000
      );

      const elapsedFromOpening = (Date.now() - bidTime) / 1000;

      expect(elapsedFromOpening).toBeGreaterThanOrEqual(1.1);
      expect(elapsedFromOpening).toBeLessThanOrEqual(1.7);
      expect(state.players.find((p: any) => p.nickname === 'P2').gold).toBe(18);
      expect(state.players.find((p: any) => p.nickname === 'P2').slots[0]).not.toBeNull();
    } catch (e) {
      throw new Error('SERVER BUG: Auction never resolved / extension never triggered (timer not scheduled after manual bid)');
    }

    clients.push(client1);
  }, 10000);
});
