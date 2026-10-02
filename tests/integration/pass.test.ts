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

describe('Pass Rule', () => {
  it('S1: P1 opens 1, P2-P4 all pass -> auction ends immediately, P1 pays 1', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', { nickname: 'P1' });
    const roomCode = createResult.roomCode;

    const client2 = connectClient(server.port);
    const client3 = connectClient(server.port);
    const client4 = connectClient(server.port);
    clients.push(client2, client3, client4);

    await waitForConnect(client2);
    await waitForConnect(client3);
    await waitForConnect(client4);

    await client2.emitWithAck('join_room', { roomCode, nickname: 'P2' });
    await client3.emitWithAck('join_room', { roomCode, nickname: 'P3' });
    await client4.emitWithAck('join_room', { roomCode, nickname: 'P4' });

    await client1.emitWithAck('start_game', {});
    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 1 });

    const bidTime = Date.now();

    // All others pass
    await client2.emitWithAck('pass_bid', {});
    await client3.emitWithAck('pass_bid', {});
    await client4.emitWithAck('pass_bid', {});

    // Auction should end immediately
    const state = await client1.waitForState(
      (s: any) => {
        const p1 = s.players.find((p: any) => p.nickname === 'P1');
        return p1 && p1.slots[0] !== null && p1.gold === 19;
      },
      1000
    );

    const elapsed = Date.now() - bidTime;

    // Should settle immediately (within 200ms), not wait for timer
    expect(elapsed).toBeLessThan(500);
    expect(state.players.find((p: any) => p.nickname === 'P1').gold).toBe(19);
    expect(state.players.find((p: any) => p.nickname === 'P1').slots[0]).not.toBeNull();
    expect(state.phase).toBe('playing');

    clients.push(client1);
  }, 10000);

  it('S2: P1 opens 1, P3 bids 15, P1/P2/P4 pass -> ends at once, P3 pays 15', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', { nickname: 'P1' });
    const roomCode = createResult.roomCode;

    const client2 = connectClient(server.port);
    const client3 = connectClient(server.port);
    const client4 = connectClient(server.port);
    clients.push(client2, client3, client4);

    await waitForConnect(client2);
    await waitForConnect(client3);
    await waitForConnect(client4);

    await client2.emitWithAck('join_room', { roomCode, nickname: 'P2' });
    await client3.emitWithAck('join_room', { roomCode, nickname: 'P3' });
    await client4.emitWithAck('join_room', { roomCode, nickname: 'P4' });

    await client1.emitWithAck('start_game', {});
    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 1 });

    await client3.emitWithAck('place_bid', { amount: 15 });

    const bidTime = Date.now();

    // All others pass
    await client1.emitWithAck('pass_bid', {});
    await client2.emitWithAck('pass_bid', {});
    await client4.emitWithAck('pass_bid', {});

    // Auction should end immediately
    const state = await client1.waitForState(
      (s: any) => {
        const p3 = s.players.find((p: any) => p.nickname === 'P3');
        return p3 && p3.slots[0] !== null && p3.gold === 5;
      },
      1000
    );

    const elapsed = Date.now() - bidTime;

    // Should settle immediately (within 200ms)
    expect(elapsed).toBeLessThan(500);
    expect(state.players.find((p: any) => p.nickname === 'P3').gold).toBe(5);
    expect(state.players.find((p: any) => p.nickname === 'P3').slots[0]).not.toBeNull();

    clients.push(client1);
  }, 10000);

  it('passed player cannot bid again', async () => {
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

    // P2 passes
    const passResult = await client2.emitWithAck('pass_bid', {});
    expect(passResult.success).toBe(true);

    // P2 tries to bid - should be rejected
    const bidResult = await client2.emitWithAck('place_bid', { amount: 2 });
    expect(bidResult.success).toBe(false);
    expect(bidResult.error).toBeDefined();

    clients.push(client1);
  }, 10000);

  it('highest bidder cannot pass', async () => {
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
    await client1.emitWithAck('place_bid', { amount: 5 });

    // P1 is highest bidder, tries to pass
    const passResult = await client1.emitWithAck('pass_bid', {});
    expect(passResult.success).toBe(false);
    expect(passResult.error).toBeDefined();

    clients.push(client1);
  }, 10000);

  it('player with full slots counts as passed (automatic out)', async () => {
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

    // P1 wins first item
    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 1 });
    await client1.waitForState((s: any) => {
      const p1 = s.players.find((p: any) => p.nickname === 'P1');
      return p1 && p1.slots[0] !== null;
    }, 1500);

    // P2 wins second item
    await client2.emitWithAck('spin_wheel', {});
    await client2.emitWithAck('place_bid', { amount: 1 });
    await client1.waitForState((s: any) => {
      const p2 = s.players.find((p: any) => p.nickname === 'P2');
      return p2 && p2.slots[0] !== null;
    }, 1500);

    // P1 wins third item
    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 1 });
    await client1.waitForState((s: any) => {
      const p1 = s.players.find((p: any) => p.nickname === 'P1');
      return p1 && p1.slots[1] !== null;
    }, 1500);

    // P2 wins fourth item
    await client2.emitWithAck('spin_wheel', {});
    await client2.emitWithAck('place_bid', { amount: 1 });
    await client1.waitForState((s: any) => {
      const p2 = s.players.find((p: any) => p.nickname === 'P2');
      return p2 && p2.slots[1] !== null;
    }, 1500);

    // P1 wins fifth item
    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 1 });
    await client1.waitForState((s: any) => {
      const p1 = s.players.find((p: any) => p.nickname === 'P1');
      return p1 && p1.slots[2] !== null;
    }, 1500);

    // P2's turn, P1 has full slots so counts as out
    // P2 opens, auction should settle immediately
    await client2.emitWithAck('spin_wheel', {});
    const bidTime = Date.now();
    await client2.emitWithAck('place_bid', { amount: 1 });

    const state = await client1.waitForState(
      (s: any) => {
        const p2 = s.players.find((p: any) => p.nickname === 'P2');
        return p2 && p2.slots[2] !== null;
      },
      1000
    );

    const elapsed = Date.now() - bidTime;

    // Should settle immediately because P1 is automatically out
    expect(elapsed).toBeLessThan(500);
    expect(state.players.find((p: any) => p.nickname === 'P2').slots[2]).not.toBeNull();

    clients.push(client1);
  }, 20000);

  it('pass in opening phase is rejected', async () => {
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

    // Try to pass in opening phase
    const passResult = await client1.emitWithAck('pass_bid', {});
    expect(passResult.success).toBe(false);
    expect(passResult.error).toBeDefined();

    clients.push(client1);
  }, 10000);

  it('passedPlayerIds resets when auction ends', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', { nickname: 'P1' });
    const roomCode = createResult.roomCode;

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    const joinResult = await client2.emitWithAck('join_room', { roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});
    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    // First auction: P1 opens, P2 passes
    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 1 });
    await client2.emitWithAck('pass_bid', {});

    await client1.waitForState((s: any) => {
      const p1 = s.players.find((p: any) => p.nickname === 'P1');
      return p1 && p1.slots[0] !== null;
    }, 1500);

    // Second auction: P2 opens, should be able to bid normally (pass was reset)
    await client2.emitWithAck('spin_wheel', {});
    await client2.emitWithAck('place_bid', { amount: 1 });

    // P2 should now be the highest bidder (pass was reset from previous auction)
    const state = client1.getLastState();
    expect(state.currentHighestBidderId).toBe(joinResult.playerId); // P2's ID

    clients.push(client1);
  }, 10000);
});
