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

describe('Task 16: Themes - Integration', () => {
  it('create_room with superpowers theme', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', {
      nickname: 'P1',
      themeId: 'superpowers'
    });

    expect(createResult.success).toBe(true);
    expect(createResult.roomCode).toBeTruthy();

    clients.push(client1);
  });

  it('create_room with legendary-fighters theme', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', {
      nickname: 'P1',
      themeId: 'legendary-fighters'
    });

    expect(createResult.success).toBe(true);
    expect(createResult.roomCode).toBeTruthy();

    clients.push(client1);
  });

  it('create_room with halisaha theme', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', {
      nickname: 'P1',
      themeId: 'halisaha'
    });

    expect(createResult.success).toBe(true);
    expect(createResult.roomCode).toBeTruthy();

    clients.push(client1);
  });

  it('create_room with mythical-creatures theme', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', {
      nickname: 'P1',
      themeId: 'mythical-creatures'
    });

    expect(createResult.success).toBe(true);
    expect(createResult.roomCode).toBeTruthy();

    clients.push(client1);
  });

  it('create_room with invalid themeId is rejected', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', {
      nickname: 'P1',
      themeId: 'invalid-theme'
    });

    expect(createResult.success).toBe(false);
    expect(createResult.error).toBeTruthy();

    clients.push(client1);
  });

  it('judge prompt contains theme criterion', async () => {
    let receivedPrompt = '';
    const fakeJudge = async (players: any[], prompt?: string) => {
      if (prompt) {
        receivedPrompt = prompt;
      }
      const ranking = players.map((p, i) => ({
        player: p.nickname,
        rank: i + 1,
        reason: 'Test reason'
      }));
      return JSON.stringify({ ranking, commentary: 'Test' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', {
      nickname: 'P1',
      themeId: 'halisaha'
    });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    // Play through all auctions (2 players × 4 slots for halisaha = 8 auctions)
    for (let i = 0; i < 8; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    await client1.waitForState((s: any) => s.phase === 'judging' || s.phase === 'finished', 5000);

    // Check that judge received a prompt containing the theme criterion
    expect(receivedPrompt).toBeTruthy();
    expect(receivedPrompt.toLowerCase()).toContain('halı saha');

    clients.push(client1);
  }, 30000);

  it('create_room defaults to superpowers when themeId is omitted', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', {
      nickname: 'P1'
      // themeId omitted
    });

    expect(createResult.success).toBe(true);
    expect(createResult.roomCode).toBeTruthy();

    clients.push(client1);
  });
});
