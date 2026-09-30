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

describe('Lobby', () => {
  it('GET /health returns ok', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const response = await fetch(`http://localhost:${server.port}/health`);
    const data = await response.json();

    expect(data).toEqual({ status: 'ok' });
  });

  it('6 players join; the 7th is rejected', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', { nickname: 'P1' });
    expect(createResult.success).toBe(true);
    const roomCode = createResult.roomCode;

    for (let i = 2; i <= 6; i++) {
      const client = connectClient(server.port);
      clients.push(client);
      await waitForConnect(client);
      const result = await client.emitWithAck('join_room', { roomCode, nickname: `P${i}` });
      expect(result.success).toBe(true);
    }

    const client7 = connectClient(server.port);
    clients.push(client7);
    await waitForConnect(client7);
    const result7 = await client7.emitWithAck('join_room', { roomCode, nickname: 'P7' });
    expect(result7.success).toBe(false);
    expect(result7.error).toBeDefined();

    clients.push(client1);
  });

  it('join after start is rejected', async () => {
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

    const client3 = connectClient(server.port);
    clients.push(client3);
    await waitForConnect(client3);
    const result = await client3.emitWithAck('join_room', { roomCode, nickname: 'P3' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    clients.push(client1);
  });

  it('only the host can start; the host cannot start alone', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', { nickname: 'Host' });
    const roomCode = createResult.roomCode;

    const aloneStart = await client1.emitWithAck('start_game', {});
    expect(aloneStart.success).toBe(false);
    expect(aloneStart.error).toBeDefined();

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode, nickname: 'P2' });

    const nonHostStart = await client2.emitWithAck('start_game', {});
    expect(nonHostStart.success).toBe(false);
    expect(nonHostStart.error).toBeDefined();

    const hostStart = await client1.emitWithAck('start_game', {});
    expect(hostStart.success).toBe(true);

    clients.push(client1);
  });
});
