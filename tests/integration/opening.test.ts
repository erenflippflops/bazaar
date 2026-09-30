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

describe('Opening', () => {
  it('after opener spins, non-opener bid is rejected', async () => {
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

    const stateBefore = client1.getLastState();
    const wheelBefore = stateBefore.wheel;

    await client1.emitWithAck('spin_wheel', {});

    const result = await client2.emitWithAck('place_bid', { amount: 1 });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    const stateAfter = client1.getLastState();
    expect(stateAfter.wheel).toBe(wheelBefore - 1);
    expect(stateAfter.phase).toBe('opening');

    clients.push(client1);
  });

  it('opener does nothing: server spins and opens with 1 gold after ~2s', async () => {
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

    const startTime = Date.now();

    const state = await client1.waitForState(
      (s: any) => s.phase === 'bidding' && s.currentHighestBid === 1,
      3000
    );

    const elapsed = (Date.now() - startTime) / 1000;

    expect(elapsed).toBeGreaterThanOrEqual(1.8);
    expect(elapsed).toBeLessThanOrEqual(2.5);
    expect(state.currentHighestBid).toBe(1);

    clients.push(client1);
  }, 10000);

  it('opener spins but does not bid: server opens with 1 gold after ~2s, wheel shrinks by 1', async () => {
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

    const stateBefore = client1.getLastState();
    const wheelBefore = stateBefore.wheel;

    await client1.emitWithAck('spin_wheel', {});
    const startTime = Date.now();

    const state = await client1.waitForState(
      (s: any) => s.phase === 'bidding' && s.currentHighestBid === 1,
      3000
    );

    const elapsed = (Date.now() - startTime) / 1000;

    expect(elapsed).toBeGreaterThanOrEqual(1.8);
    expect(elapsed).toBeLessThanOrEqual(2.5);
    expect(state.currentHighestBid).toBe(1);
    expect(state.wheel).toBe(wheelBefore - 1);

    clients.push(client1);
  }, 10000);

  it('stale timer: opener spins and opens immediately, next opener auto-opens ~2s after ITS turn', async () => {
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

    // P1 immediately spins and opens
    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 1 });

    // Wait for auction to resolve - first player wins item
    await client1.waitForState((s: any) => {
      const p1 = s.players.find((p: any) => p.nickname === 'P1');
      return p1 && p1.slots[0] !== null;
    }, 1500);

    // Now phase should be back to 'playing' and opener should move to P2
    const p2TurnStart = Date.now();

    // P2 does nothing, wait for auto-spin and auto-open
    const state = await client1.waitForState(
      (s: any) => s.phase === 'bidding' && s.currentHighestBid === 1 && s.currentOpenerIndex === 1,
      3000
    );

    const elapsed = (Date.now() - p2TurnStart) / 1000;

    expect(elapsed).toBeGreaterThanOrEqual(1.8);
    expect(elapsed).toBeLessThanOrEqual(2.5);
    expect(state.currentHighestBid).toBe(1);

    clients.push(client1);
  }, 15000);
});
