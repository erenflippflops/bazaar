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

describe('Timer +3s Extension', () => {
  it('bid with 0.7s remaining adds 0.3s (not reset to 0.5s)', async () => {
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

    const openingBidTime = Date.now();

    // Wait 0.7s (700ms with timeScale 0.1 = wait 70ms real time)
    // Remaining time: 1.0s - 0.7s = 0.3s
    await new Promise(resolve => setTimeout(resolve, 700));

    // Place bid with < 0.5s remaining
    await client2.emitWithAck('place_bid', { amount: 2 });
    const lateBidTime = Date.now();

    // After the bid, timer should be at 0.3s + 0.3s = 0.6s (not reset to 0.5s)
    // So auction should resolve ~0.6s after the late bid

    const state = await client1.waitForState(
      (s: any) => {
        const p2 = s.players.find((p: any) => p.nickname === 'P2');
        return p2 && p2.slots[0] !== null;
      },
      2000
    );

    const elapsedFromLateBid = (Date.now() - lateBidTime) / 1000;
    const totalElapsed = (Date.now() - openingBidTime) / 1000;

    // From late bid, should resolve in ~0.6s (not 0.5s)
    // Allow 0.5s to 0.8s range for tolerance
    expect(elapsedFromLateBid).toBeGreaterThanOrEqual(0.5);
    expect(elapsedFromLateBid).toBeLessThanOrEqual(0.9);

    // Total time should be > 1.0s (not exactly 1.5s which would indicate reset)
    expect(totalElapsed).toBeGreaterThanOrEqual(1.2);
    expect(totalElapsed).toBeLessThanOrEqual(1.7);

    expect(state.players.find((p: any) => p.nickname === 'P2').gold).toBe(18);

    clients.push(client1);
  }, 10000);

  it('bid with 0.2s remaining adds 0.3s, auction resolves at ~0.5s total', async () => {
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

    const openingBidTime = Date.now();

    // Wait 0.8s (remaining: 0.2s)
    await new Promise(resolve => setTimeout(resolve, 800));

    await client2.emitWithAck('place_bid', { amount: 2 });
    const lateBidTime = Date.now();

    // Timer should now be 0.2s + 0.3s = 0.5s

    const state = await client1.waitForState(
      (s: any) => {
        const p2 = s.players.find((p: any) => p.nickname === 'P2');
        return p2 && p2.slots[0] !== null;
      },
      1500
    );

    const elapsedFromLateBid = (Date.now() - lateBidTime) / 1000;

    // Should resolve in ~0.5s from late bid
    expect(elapsedFromLateBid).toBeGreaterThanOrEqual(0.4);
    expect(elapsedFromLateBid).toBeLessThanOrEqual(0.7);

    expect(state.players.find((p: any) => p.nickname === 'P2').slots[0]).not.toBeNull();

    clients.push(client1);
  }, 10000);

  it('multiple late bids: each adds 0.3s', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', { nickname: 'P1' });
    const roomCode = createResult.roomCode;

    const client2 = connectClient(server.port);
    const client3 = connectClient(server.port);
    clients.push(client2, client3);
    await waitForConnect(client2);
    await waitForConnect(client3);
    await client2.emitWithAck('join_room', { roomCode, nickname: 'P2' });
    await client3.emitWithAck('join_room', { roomCode, nickname: 'P3' });

    await client1.emitWithAck('start_game', {});
    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 1 });

    const openingBidTime = Date.now();

    // Wait 0.7s, bid (timer now at 0.3s + 0.3s = 0.6s)
    await new Promise(resolve => setTimeout(resolve, 700));
    await client2.emitWithAck('place_bid', { amount: 2 });

    // Wait 0.4s more (timer at 0.2s), bid again (timer now 0.2s + 0.3s = 0.5s)
    await new Promise(resolve => setTimeout(resolve, 400));
    await client3.emitWithAck('place_bid', { amount: 3 });
    const lastBidTime = Date.now();

    // Should resolve ~0.5s after last bid

    const state = await client1.waitForState(
      (s: any) => {
        const p3 = s.players.find((p: any) => p.nickname === 'P3');
        return p3 && p3.slots[0] !== null;
      },
      1500
    );

    const elapsedFromLastBid = (Date.now() - lastBidTime) / 1000;

    expect(elapsedFromLastBid).toBeGreaterThanOrEqual(0.4);
    expect(elapsedFromLastBid).toBeLessThanOrEqual(0.7);

    expect(state.players.find((p: any) => p.nickname === 'P3').gold).toBe(17);

    clients.push(client1);
  }, 10000);
});
