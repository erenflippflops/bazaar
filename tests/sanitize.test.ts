import { describe, it, expect } from 'vitest';
import * as engine from '../server/engine/game.js';
import type { Item, RNG, GameState } from '../server/engine/types.js';

const mockItems: Item[] = [
  { name: 'Item1', description: 'Desc1' },
  { name: 'Item2', description: 'Desc2' },
  { name: 'Item3', description: 'Desc3' },
  { name: 'Item4', description: 'Desc4' },
  { name: 'Item5', description: 'Desc5' }
];

function seededRNG(seed: number): RNG {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Simulate server sanitization
function sanitizeStateForAll(state: GameState): unknown {
  return {
    ...state,
    wheel: state.wheel.length, // Only send count, not items
    deck: state.deck.length,
    players: state.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      gold: p.gold,
      slots: p.slots
    }))
  };
}

describe('Rule 3: Public state sanitization', () => {
  it('public room state contains wheel COUNT but no hidden item names', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    // Sanitize state as server would send to clients
    const publicState = sanitizeStateForAll(state) as any;

    // Check wheel is a number (count), not an array
    expect(typeof publicState.wheel).toBe('number');
    expect(publicState.wheel).toBe(5); // All 5 items

    // Ensure wheel items are not exposed
    expect(Array.isArray(publicState.wheel)).toBe(false);

    // Spin one item
    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    const publicStateAfterSpin = sanitizeStateForAll(state) as any;
    expect(publicStateAfterSpin.wheel).toBe(4); // One less

    // Revealed item should still be visible
    expect(publicStateAfterSpin.revealedItem).not.toBeNull();
    expect(publicStateAfterSpin.revealedItem.name).toBe(state.revealedItem!.name);
  });
});
