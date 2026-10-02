import { describe, it, expect } from 'vitest';
import * as engine from '../server/engine/game.js';
import type { Item, RNG } from '../server/engine/types.js';

const mockItems: Item[] = Array.from({ length: 40 }, (_, i) => ({
  name: `Item${i + 1}`,
  description: `Description ${i + 1}`
}));

function seededRNG(seed: number): RNG {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('Task 16: Themes - 4-slot games', () => {
  it('4-slot game with 2 players ends after 2 × 4 = 8 auctions', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng, 4);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng, 4);
    state = result.state;

    result = engine.startPlaying(state);
    state = result.state;

    // Verify initial slots are 4
    expect(state.players[0].slots.length).toBe(4);
    expect(state.players[1].slots.length).toBe(4);

    // Play 8 auctions (2 players × 4 slots)
    let auctionCount = 0;
    while (state.phase !== 'judging' && auctionCount < 10) {
      const opener = state.players[state.currentOpenerIndex];

      result = engine.spinWheel(state, opener.id, rng, 1000 * (auctionCount + 1));
      if (result.error) break;
      state = result.state;

      result = engine.placeBid(state, opener.id, 1, 1000 * (auctionCount + 1));
      if (result.error) break;
      state = result.state;

      result = engine.resolveBid(state);
      if (result.error) break;
      state = result.state;

      auctionCount++;
    }

    expect(auctionCount).toBe(8);
    expect(state.phase).toBe('judging');
    expect(state.players.every(p => p.slots.every(s => s !== null))).toBe(true);
  });

  it('4-slot game with 6 players ends after 6 × 4 = 24 auctions', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng, 4);
    let state = result.state;

    // Add 5 more players (total 6)
    for (let i = 2; i <= 6; i++) {
      result = engine.joinGame(state, `p${i}`, `Player${i}`, rng);
      state = result.state;
    }

    result = engine.startGame(state, 'host', mockItems, rng, 4);
    state = result.state;

    result = engine.startPlaying(state);
    state = result.state;

    // Verify initial slots are 4
    expect(state.players.every(p => p.slots.length === 4)).toBe(true);

    // Play 24 auctions (6 players × 4 slots)
    let auctionCount = 0;
    while (state.phase !== 'judging' && auctionCount < 30) {
      const opener = state.players[state.currentOpenerIndex];

      result = engine.spinWheel(state, opener.id, rng, 1000 * (auctionCount + 1));
      if (result.error) break;
      state = result.state;

      result = engine.placeBid(state, opener.id, 1, 1000 * (auctionCount + 1));
      if (result.error) break;
      state = result.state;

      result = engine.resolveBid(state);
      if (result.error) break;
      state = result.state;

      auctionCount++;
    }

    expect(auctionCount).toBe(24);
    expect(state.phase).toBe('judging');
    expect(state.players.every(p => p.slots.every(s => s !== null))).toBe(true);
    expect(state.wheel.length).toBe(16); // 40 - 24 = 16 items remaining
  });

  it('gold reserve works correctly with 4 slots', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng, 4);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng, 4);
    state = result.state;

    result = engine.startPlaying(state);
    state = result.state;

    // Host has 20 gold, 4 empty slots
    // Max bid = 20 - (4-1) = 17

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    result = engine.placeBid(state, 'host', 18, 1000);
    expect(result.error).toBe('Maksimum 17 altın teklif edebilirsin');

    result = engine.placeBid(state, 'host', 17, 1000);
    expect(result.error).toBeUndefined();
    state = result.state;

    expect(state.currentHighestBid).toBe(17);

    // Resolve and check updated max bid
    result = engine.resolveBid(state);
    state = result.state;

    // Host now has 3 gold (20-17), 3 empty slots
    // Max bid = 3 - (3-1) = 1

    result = engine.spinWheel(state, state.players[state.currentOpenerIndex].id, rng, 2000);
    state = result.state;

    const opener = state.players[state.currentOpenerIndex];
    if (opener.id === 'host') {
      result = engine.placeBid(state, opener.id, 2, 2000);
      expect(result.error).toBeTruthy();

      result = engine.placeBid(state, opener.id, 1, 2000);
      expect(result.error).toBeUndefined();
    }
  });
});
