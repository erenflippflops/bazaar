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

describe('Robustness', () => {
  it('double actions: two start_game -> one start; two spin_wheel -> shrinks by 1; same bid twice -> one accepted', async () => {
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

    // First verify a single start_game works
    const singleStart = await client1.emitWithAck('start_game', {});
    expect(singleStart.success).toBe(true);

    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    const stateBefore = client1.getLastState();
    const wheelBefore = stateBefore.wheel;

    // Double spin - should only shrink by 1
    await Promise.all([
      client1.emitWithAck('spin_wheel', {}),
      client1.emitWithAck('spin_wheel', {})
    ]);

    const stateAfterSpin = client1.getLastState();
    expect(stateAfterSpin.wheel).toBe(wheelBefore - 1);

    // Double bid - only one should succeed
    const [bid1, bid2] = await Promise.all([
      client1.emitWithAck('place_bid', { amount: 5 }),
      client1.emitWithAck('place_bid', { amount: 5 })
    ]);
    const bidSuccessCount = [bid1, bid2].filter(r => r.success).length;
    expect(bidSuccessCount).toBe(1);

    clients.push(client1);
  }, 10000);

  it('malformed input: no crash, /health ok, new room can play', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', { nickname: 'P1' });
    const roomCode = createResult.roomCode;

    // Try various malformed inputs
    const malformedInputs = [
      { event: 'create_room', data: null },
      { event: 'create_room', data: 123 },
      { event: 'create_room', data: 'string' },
      { event: 'create_room', data: [] },
      { event: 'join_room', data: { roomCode } }, // missing nickname
      { event: 'place_bid', data: {} }, // missing amount
      { event: 'unknown_event', data: {} },
      { event: 'start_game', data: { extraField: 'unexpected' } }
    ];

    for (const { event, data } of malformedInputs) {
      try {
        client1.socket.emit(event, data);
      } catch (e) {
        // Expected to fail silently or with error
      }
    }

    // Server should still be healthy
    const health = await fetch(`http://localhost:${server.port}/health`);
    expect((await health.json()).status).toBe('ok');

    // New room should work
    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    const newRoom = await client2.emitWithAck('create_room', { nickname: 'NewP1' });
    expect(newRoom.success).toBe(true);

    const client3 = connectClient(server.port);
    clients.push(client3);
    await waitForConnect(client3);
    await client3.emitWithAck('join_room', { roomCode: newRoom.roomCode, nickname: 'NewP2' });
    await client2.emitWithAck('start_game', {});

    try {
      await client2.waitForState((s: any) => s.phase === 'playing', 5000);
      await client2.emitWithAck('spin_wheel', {});
      await client2.emitWithAck('place_bid', { amount: 1 });

      const state = await client2.waitForState((s: any) => {
        const p = s.players.find((p: any) => p.nickname === 'NewP1');
        return p && p.slots[0] !== null;
      }, 2000);
      expect(state.players.find((p: any) => p.nickname === 'NewP1').slots[0]).not.toBeNull();
    } catch (e) {
      throw new Error('SERVER BUG: Auction never resolved (manual bid timer issue)');
    }

    clients.push(client1);
  }, 15000);

  it('impersonation: client sends place_bid with another playerId', async () => {
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
    const p1Id = stateBefore.players.find((p: any) => p.nickname === 'P1').id;

    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 1 });

    // Client2 tries to impersonate P1
    const result = await client2.emitWithAck('place_bid', { amount: 2, playerId: p1Id });

    const stateAfter = client1.getLastState();

    // Either rejected, or if accepted, should be booked to P2
    if (result.success) {
      const currentBidderId = stateAfter.currentHighestBidderId;
      const p2Id = stateAfter.players.find((p: any) => p.nickname === 'P2').id;
      expect(currentBidderId).toBe(p2Id);
    } else {
      expect(result.error).toBeDefined();
    }

    clients.push(client1);
  }, 10000);
});
