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

describe('Halisaha Integration', () => {
  it('2-player halisaha full game completes with 1 GK + 3 field players each', async () => {
    const fakeJudge = async (players: any[]) => {
      const ranking = players.map((p, i) => ({
        player: p.nickname,
        rank: i + 1,
        reason: 'Test reason'
      }));
      return JSON.stringify({ ranking, commentary: 'Test commentary' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1', themeId: 'halisaha' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    // Mark both players ready for briefing
    await client1.emitWithAck('ready_briefing', {});
    await client2.emitWithAck('ready_briefing', {});

    // Wait for briefing to complete
    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    // Play through the game - bid 1 gold on every auction
    let auctionsPlayed = 0;
    const maxAuctions = 20; // Safety limit

    while (auctionsPlayed < maxAuctions) {
      const state = client1.getLastState();

      if (state.phase === 'finished' || state.phase === 'judging') {
        break;
      }

      if (state.phase === 'playing') {
        const opener = state.players[state.currentOpenerIndex];
        const currentClient = opener.nickname === 'P1' ? client1 : client2;

        await currentClient.emitWithAck('spin_wheel', {});

        // Wait for opening or playing phase (item might be discarded)
        const afterSpin = await currentClient.waitForState(
          (s: any) => s.phase === 'opening' || s.phase === 'playing' || s.phase === 'finished',
          2000
        );

        if (afterSpin.phase === 'opening') {
          await currentClient.emitWithAck('place_bid', { amount: 1 });
          auctionsPlayed++;

          // Wait for auction to resolve
          await currentClient.waitForState(
            (s: any) => s.phase === 'playing' || s.phase === 'judging' || s.phase === 'finished',
            2000
          );
        }
      }
    }

    // Wait for game to finish
    const finalState = await client1.waitForState((s: any) => s.phase === 'finished', 10000);

    expect(finalState.phase).toBe('finished');

    // Check that both players have exactly 1 GK and 3 field players
    for (const player of finalState.players) {
      const slots = player.slots.filter((s: any) => s !== null);
      expect(slots.length).toBe(4);

      const gkCount = slots.filter((s: any) => s.position === 'GK').length;
      const fieldCount = slots.filter((s: any) => s.position !== 'GK').length;

      expect(gkCount).toBe(1);
      expect(fieldCount).toBe(3);
    }

    clients.push(client1);
  }, 60000);

  it('out-message state shows for player with full slots', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge, 0.1);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1', themeId: 'halisaha' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});
    await client1.emitWithAck('ready_briefing', {});
    await client2.emitWithAck('ready_briefing', {});

    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    // Play until P1 has all 4 slots filled
    let filled = false;
    let rounds = 0;

    while (!filled && rounds < 10) {
      rounds++;
      const state = client1.getLastState();
      const p1 = state.players.find((p: any) => p.nickname === 'P1');

      if (p1.slots.every((s: any) => s !== null)) {
        filled = true;
        break;
      }

      const opener = state.players[state.currentOpenerIndex];
      const currentClient = opener.nickname === 'P1' ? client1 : client2;

      await currentClient.emitWithAck('spin_wheel', {});

      const afterSpin = await currentClient.waitForState(
        (s: any) => s.phase === 'opening' || s.phase === 'playing' || s.phase === 'judging' || s.phase === 'finished',
        2000
      );

      // If game ended, exit loop
      if (afterSpin.phase === 'judging' || afterSpin.phase === 'finished') {
        break;
      }

      if (afterSpin.phase === 'opening') {
        // Always let P1 win
        if (afterSpin.currentOpenerIndex === 0) {
          await client1.emitWithAck('place_bid', { amount: 1 });
        } else {
          await client2.emitWithAck('place_bid', { amount: 1 });
          await client1.emitWithAck('place_bid', { amount: 2 });
        }

        await currentClient.waitForState(
          (s: any) => s.phase === 'playing' || s.phase === 'judging' || s.phase === 'finished',
          2000
        );
      }
    }

    // Now P1 has full slots, spin again
    const state = client1.getLastState();
    const opener = state.players[state.currentOpenerIndex];
    const currentClient = opener.nickname === 'P1' ? client1 : client2;

    await currentClient.emitWithAck('spin_wheel', {});
    await currentClient.waitForState(
      (s: any) => s.phase === 'opening' || s.phase === 'bidding',
      2000
    );

    const auctionState = client1.getLastState();
    const p1 = auctionState.players.find((p: any) => p.nickname === 'P1');

    // P1 should have outReason set
    expect(p1.outReason).toBeDefined();
    expect(p1.outReason).toMatch(/slot/i);

    clients.push(client1);
  }, 30000);

  it('P1 opens while P2 is out -> auction ends at once', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    server = await startServer(fakeJudge, 0.1);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1', themeId: 'halisaha' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});
    await client1.emitWithAck('ready_briefing', {});
    await client2.emitWithAck('ready_briefing', {});

    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    // Fill P2's slots by making P2 win all auctions
    let p2Filled = false;
    let rounds = 0;

    while (!p2Filled && rounds < 10) {
      rounds++;
      const state = client1.getLastState();
      const p2 = state.players.find((p: any) => p.nickname === 'P2');

      if (p2.slots.every((s: any) => s !== null)) {
        p2Filled = true;
        break;
      }

      const opener = state.players[state.currentOpenerIndex];
      const currentClient = opener.nickname === 'P1' ? client1 : client2;

      await currentClient.emitWithAck('spin_wheel', {});

      const afterSpin = await currentClient.waitForState(
        (s: any) => s.phase === 'opening' || s.phase === 'playing' || s.phase === 'judging' || s.phase === 'finished',
        2000
      );

      if (afterSpin.phase === 'opening') {
        // Always let P2 win
        if (afterSpin.currentOpenerIndex === 1) {
          await client2.emitWithAck('place_bid', { amount: 1 });
        } else {
          await client1.emitWithAck('place_bid', { amount: 1 });
          await client2.emitWithAck('place_bid', { amount: 2 });
        }

        await currentClient.waitForState((s: any) => s.phase === 'playing', 2000);
      }
    }

    // Now P2 has full slots, P1 should open
    // Wait until it's P1's turn
    let p1Turn = false;
    let waitRounds = 0;
    while (!p1Turn && waitRounds < 5) {
      waitRounds++;
      const state = client1.getLastState();
      if (state.currentOpenerIndex === 0) {
        p1Turn = true;
        break;
      }

      // Pass this turn quickly
      const opener = state.players[state.currentOpenerIndex];
      const currentClient = opener.nickname === 'P1' ? client1 : client2;
      await currentClient.emitWithAck('spin_wheel', {});
      await currentClient.waitForState((s: any) => s.phase === 'playing', 2000);
    }

    const beforeState = client1.getLastState();
    expect(beforeState.currentOpenerIndex).toBe(0);

    // P1 opens
    const startTime = Date.now();
    await client1.emitWithAck('spin_wheel', {});

    const afterSpin = await client1.waitForState(
      (s: any) => s.phase === 'opening' || s.phase === 'playing',
      2000
    );

    if (afterSpin.phase === 'opening') {
      await client1.emitWithAck('place_bid', { amount: 1 });

      // Auction should settle immediately since P2 is out
      const afterBid = await client1.waitForState(
        (s: any) => s.phase === 'playing',
        1000
      );

      const elapsed = Date.now() - startTime;

      // Should settle in under 500ms (much faster than normal timeout)
      expect(elapsed).toBeLessThan(500);
      expect(afterBid.phase).toBe('playing');
    }

    clients.push(client1);
  }, 30000);
});
