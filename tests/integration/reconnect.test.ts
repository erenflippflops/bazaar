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

describe('Reconnect', () => {
  it('player disconnects and rejoins with token: same gold, slots, turn position', async () => {
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
    const token = joinResult.token;

    await client1.emitWithAck('start_game', {});
    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    await client1.emitWithAck('spin_wheel', {});
    await client1.emitWithAck('place_bid', { amount: 5 });

    const stateBefore = client2.getLastState();
    const p2Before = stateBefore.players.find((p: any) => p.nickname === 'P2');

    // Disconnect client2
    client2.close();
    clients = clients.filter(c => c !== client2);

    // Reconnect with token
    const client2New = connectClient(server.port);
    clients.push(client2New);
    await waitForConnect(client2New);
    const reconnectResult = await client2New.emitWithAck('join_room', { roomCode, playerToken: token });

    expect(reconnectResult.success).toBe(true);
    expect(reconnectResult.reconnected).toBe(true);

    // State comes from reconnect ack, not from state field
    const reconnectState = reconnectResult.state;
    const p2After = reconnectState.players.find((p: any) => p.nickname === 'P2');

    expect(p2After.gold).toBe(p2Before.gold);
    expect(p2After.slots).toEqual(p2Before.slots);
    expect(reconnectState.phase).toBe('bidding');

    clients.push(client1);
  }, 15000);

  it('wrong token does not take over any player', async () => {
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

    const result = await client2.emitWithAck('join_room', { roomCode, playerToken: 'wrong-token' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    clients.push(client1);
  }, 10000);

  it('tokens are secret: no message contains another player\'s token', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', { nickname: 'P1' });
    const roomCode = createResult.roomCode;
    const token1 = createResult.token;

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    const joinResult = await client2.emitWithAck('join_room', { roomCode, nickname: 'P2' });
    const token2 = joinResult.token;

    await client1.emitWithAck('start_game', {});

    // Play a few rounds to generate messages
    try {
      for (let i = 0; i < 2; i++) {
        await client1.waitForState((s: any) => s.phase === 'playing', 10000);
        const opener = i % 2 === 0 ? client1 : client2;
        await opener.emitWithAck('spin_wheel', {});
        await opener.emitWithAck('place_bid', { amount: 1 });
        await opener.waitForState((s: any) => {
          const p = s.players.find((p: any) => p.nickname === (i % 2 === 0 ? 'P1' : 'P2'));
          return p && p.slots[i % 3] !== null;
        }, 2000);
      }
    } catch (e) {
      throw new Error('SERVER BUG: Auction never resolved (manual bid timer issue)');
    }

    // Check client1 never received token2
    for (const msg of client1.messages) {
      const msgStr = JSON.stringify(msg.payload);
      expect(msgStr).not.toContain(token2);
    }

    // Check client2 never received token1
    for (const msg of client2.messages) {
      const msgStr = JSON.stringify(msg.payload);
      expect(msgStr).not.toContain(token1);
    }

    clients.push(client1);
  }, 20000);
});
