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

describe('Judge', () => {
  it('valid JSON -> finished with ranking, reasons, commentary', async () => {
    const fakeJudge = async (players: any[]) => {
      const ranking = players.map((p, i) => ({
        player: p.nickname,
        rank: i + 1,
        reason: 'Good collection'
      }));
      return JSON.stringify({ ranking, commentary: 'Well played game' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    const finalState = await client1.waitForState((s: any) => s.phase === 'finished', 5000);

    expect(finalState.phase).toBe('finished');
    expect(finalState.ranking).toHaveLength(2);
    expect(finalState.ranking[0].reason).toBe('Good collection');
    expect(finalState.commentary).toBe('Well played game');

    clients.push(client1);
  }, 30000);

  it('judge throws -> judge_failed', async () => {
    const fakeJudge = async () => {
      throw new Error('Judge error');
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    const finalState = await client1.waitForState((s: any) => s.phase === 'judge_failed', 5000);
    expect(finalState.phase).toBe('judge_failed');

    clients.push(client1);
  }, 30000);

  it('invalid JSON text -> judge_failed', async () => {
    const fakeJudge = async () => 'not valid json at all';

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    const finalState = await client1.waitForState((s: any) => s.phase === 'judge_failed', 5000);
    expect(finalState.phase).toBe('judge_failed');

    clients.push(client1);
  }, 30000);

  it('judge never settles -> judge_failed within ~3s + margin', async () => {
    const fakeJudge = async () => {
      return new Promise<string>(() => {}); // Never resolves
    };

    server = await startServer(fakeJudge, 0.1);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    await client1.waitForState((s: any) => s.phase === 'judging', 5000);
    const startTime = Date.now();

    const finalState = await client1.waitForState((s: any) => s.phase === 'judge_failed', 5000);
    const elapsed = (Date.now() - startTime) / 1000;

    expect(finalState.phase).toBe('judge_failed');
    expect(elapsed).toBeGreaterThanOrEqual(2.5);
    expect(elapsed).toBeLessThanOrEqual(4.0);

    clients.push(client1);
  }, 30000);

  it('player missing -> judge_failed', async () => {
    const fakeJudge = async (players: any[]) => {
      const ranking = [{ player: players[0].nickname, rank: 1, reason: 'Winner' }]; // Missing P2
      return JSON.stringify({ ranking, commentary: 'Test' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    const finalState = await client1.waitForState((s: any) => s.phase === 'judge_failed', 5000);
    expect(finalState.phase).toBe('judge_failed');

    clients.push(client1);
  }, 30000);

  it('player twice -> judge_failed', async () => {
    const fakeJudge = async (players: any[]) => {
      const ranking = [
        { player: players[0].nickname, rank: 1, reason: 'Winner' },
        { player: players[0].nickname, rank: 2, reason: 'Also winner' }
      ];
      return JSON.stringify({ ranking, commentary: 'Test' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    const finalState = await client1.waitForState((s: any) => s.phase === 'judge_failed', 5000);
    expect(finalState.phase).toBe('judge_failed');

    clients.push(client1);
  }, 30000);

  it('ranks not 1..n -> judge_failed', async () => {
    const fakeJudge = async (players: any[]) => {
      const ranking = [
        { player: players[0].nickname, rank: 1, reason: 'Winner' },
        { player: players[1].nickname, rank: 3, reason: 'Skip 2' }
      ];
      return JSON.stringify({ ranking, commentary: 'Test' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    const finalState = await client1.waitForState((s: any) => s.phase === 'judge_failed', 5000);
    expect(finalState.phase).toBe('judge_failed');

    clients.push(client1);
  }, 30000);

  it('empty reason -> judge_failed', async () => {
    const fakeJudge = async (players: any[]) => {
      const ranking = [
        { player: players[0].nickname, rank: 1, reason: '' },
        { player: players[1].nickname, rank: 2, reason: 'Good' }
      ];
      return JSON.stringify({ ranking, commentary: 'Test' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    const finalState = await client1.waitForState((s: any) => s.phase === 'judge_failed', 5000);
    expect(finalState.phase).toBe('judge_failed');

    clients.push(client1);
  }, 30000);

  it('empty commentary -> judge_failed', async () => {
    const fakeJudge = async (players: any[]) => {
      const ranking = players.map((p, i) => ({
        player: p.nickname,
        rank: i + 1,
        reason: 'Good'
      }));
      return JSON.stringify({ ranking, commentary: '' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    const finalState = await client1.waitForState((s: any) => s.phase === 'judge_failed', 5000);
    expect(finalState.phase).toBe('judge_failed');

    clients.push(client1);
  }, 30000);

  it('judge_failed: only host can retry; retry with valid judge -> finished', async () => {
    let shouldFail = true;
    const fakeJudge = async (players: any[]) => {
      if (shouldFail) {
        throw new Error('Judge error');
      }
      const ranking = players.map((p, i) => ({
        player: p.nickname,
        rank: i + 1,
        reason: 'Good'
      }));
      return JSON.stringify({ ranking, commentary: 'Test' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'Host' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    await client1.waitForState((s: any) => s.phase === 'judge_failed', 5000);

    // Non-host tries to retry
    const nonHostRetry = await client2.emitWithAck('retry_judge', {});
    expect(nonHostRetry.error).toBeDefined();

    // Host retries with valid judge
    shouldFail = false;
    await client1.emitWithAck('retry_judge', {});

    const finalState = await client1.waitForState((s: any) => s.phase === 'finished', 5000);
    expect(finalState.phase).toBe('finished');

    clients.push(client1);
  }, 40000);

  it('rematch: only host; afterwards same players, 20 gold, 3 empty slots, wheel 40', async () => {
    const fakeJudge = async (players: any[]) => {
      const ranking = players.map((p, i) => ({
        player: p.nickname,
        rank: i + 1,
        reason: 'Good'
      }));
      return JSON.stringify({ ranking, commentary: 'Test' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'Host' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;
      await opener.emitWithAck('spin_wheel', {});
      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    await client1.waitForState((s: any) => s.phase === 'finished', 5000);

    // Non-host tries rematch
    const nonHostRematch = await client2.emitWithAck('rematch', {});
    expect(nonHostRematch.error).toBeDefined();

    // Host rematches
    await client1.emitWithAck('rematch', {});

    const rematchState = await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    expect(rematchState.phase).toBe('playing');
    expect(rematchState.players).toHaveLength(2);
    expect(rematchState.players.every((p: any) => p.gold === 20)).toBe(true);
    expect(rematchState.players.every((p: any) => p.slots.every((s: any) => s === null))).toBe(true);
    expect(rematchState.wheel).toBe(40);

    clients.push(client1);
  }, 40000);
});
