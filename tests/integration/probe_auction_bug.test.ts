import { describe, it, expect } from 'vitest';
import { startServer, connectClient, waitForConnect } from './helpers.js';

describe('Probe: Auction Timer Bug', () => {
  it('manual spin + opening bid: auction should resolve but does not', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';
    const server = await startServer(fakeJudge, 0.1); // 1s bidding timeout

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const createResult = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: createResult.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});
    await client1.waitForState((s: any) => s.phase === 'playing', 5000);

    console.log('\n=== PROBE: Manual spin + opening bid ===');

    const startTime = Date.now();
    console.log(`T+0ms: Spinning wheel`);
    await client1.emitWithAck('spin_wheel', {});

    console.log(`T+${Date.now() - startTime}ms: Placing opening bid (amount=1)`);
    await client1.emitWithAck('place_bid', { amount: 1 });

    // Record all state_update messages for next 4s (scaled = 40s real)
    const states: Array<{ elapsed: number; phase: string; bid: number; turnStartTime: number | null }> = [];

    const recordState = (s: any) => {
      states.push({
        elapsed: Date.now() - startTime,
        phase: s.phase,
        bid: s.currentHighestBid,
        turnStartTime: s.turnStartTime
      });
      console.log(`T+${Date.now() - startTime}ms: phase=${s.phase}, bid=${s.currentHighestBid}, turnStartTime=${s.turnStartTime}`);
    };

    client1.socket.on('state_update', recordState);

    // Wait 4s scaled time = 40s real time for auction to resolve
    await new Promise(resolve => setTimeout(resolve, 4000));

    client1.socket.off('state_update', recordState);

    console.log(`\nTotal state_updates received: ${states.length}`);
    console.log(`Final state: phase=${states[states.length - 1]?.phase}, bid=${states[states.length - 1]?.bid}`);

    const finalState = client1.getLastState();
    console.log(`\nExpected: auction resolves, P1 wins item, phase returns to 'playing'`);
    console.log(`Actual: phase=${finalState.phase}, P1.slots[0]=${finalState.players.find((p: any) => p.nickname === 'P1')?.slots[0]}`);

    // The bug: auction never resolves because timer was never scheduled
    expect(finalState.phase).toBe('playing'); // Will fail

    client1.close();
    client2.close();
    await server.close();
  }, 50000);
});
