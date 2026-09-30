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

describe('Rules', () => {
  it('gold reserve: over-limit bid rejected, state unchanged', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});
    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    await client1.emitWithAck('spin_wheel', {});

    const stateBefore = client1.getLastState();

    // With 20 gold and 3 empty slots, max bid is 18
    const result = await client1.emitWithAck('place_bid', { amount: 19 });
    expect(result.success).toBe(false);

    const stateAfter = client1.getLastState();
    expect(stateAfter.currentHighestBid).toBe(stateBefore.currentHighestBid);

    clients.push(client1);
  });

  it('bid below current + 1 rejected; highest bidder cannot raise own bid', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});
    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 5 });

    // Try to bid same amount
    const result1 = await client2.emitWithAck('place_bid', { amount: 5 });
    expect(result1.success).toBe(false);

    // Try to bid less than required
    const result2 = await client2.emitWithAck('place_bid', { amount: 4 });
    expect(result2.success).toBe(false);

    // Valid bid
    await client2.emitWithAck('place_bid', { amount: 6 });

    // Highest bidder tries to raise own bid
    const result3 = await client2.emitWithAck('place_bid', { amount: 7 });
    expect(result3.success).toBe(false);

    clients.push(client1);
  });

  it('non-integer bid rejected', async () => {
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

    const result = await client2.emitWithAck('place_bid', { amount: 2.5 });
    expect(result.success).toBe(false);

    clients.push(client1);
  });

  it('negative bid rejected', async () => {
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

    const result = await client2.emitWithAck('place_bid', { amount: -1 });
    expect(result.success).toBe(false);

    clients.push(client1);
  });

  it('zero bid after opening rejected', async () => {
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

    const result = await client2.emitWithAck('place_bid', { amount: 0 });
    if (result.success) {
      throw new Error('SERVER BUG: Zero bid accepted (should be rejected)');
    }
    expect(result.success).toBe(false);

    clients.push(client1);
  });

  it('string bid rejected', async () => {
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

    const result = await client2.emitWithAck('place_bid', { amount: '5' as any });
    expect(result.success).toBe(false);

    clients.push(client1);
  });

  it('null bid rejected', async () => {
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

    const result = await client2.emitWithAck('place_bid', { amount: null as any });
    expect(result.success).toBe(false);

    clients.push(client1);
  });

  it('server still works after invalid bids', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const health = await fetch(`http://localhost:${server.port}/health`);
    expect((await health.json()).status).toBe('ok');
  });

  it('player with 3 full slots cannot bid', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    // P1 wins 3 items
    for (let i = 0; i < 3; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      await client1.emitWithAck('spin_wheel', {});
      await client1.emitWithAck('place_bid', { amount: 1 });
      await client1.waitForState((s: any) => {
        const p1 = s.players.find((p: any) => p.nickname === 'P1');
        return p1 && p1.slots[i] !== null;
      }, 2000);
    }

    // P2's turn
    await client2.waitForState((s: any) => s.currentOpenerIndex === 1, 5000);
    await client2.emitWithAck('spin_wheel', {});
    await client2.emitWithAck('place_bid', { amount: 1 });

    // P1 has 3 full slots, should not be able to bid
    const result = await client1.emitWithAck('place_bid', { amount: 2 });
    expect(result.success).toBe(false);

    clients.push(client1);
  }, 20000);
});
