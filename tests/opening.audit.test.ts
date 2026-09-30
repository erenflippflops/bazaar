import { describe, it, expect } from 'vitest';
import * as engine from '../server/engine/game.js';
import type { Item, RNG } from '../server/engine/types.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const superpowers: Item[] = JSON.parse(
  readFileSync(join(__dirname, '../server/superpowers.json'), 'utf-8')
);

function seededRNG(seed: number): RNG {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('Opening Bid Turn Order (Rule 4 & 5)', () => {
  it('after opener spins, non-opener cannot bid before the opener places opening bid', () => {
    const rng = seededRNG(100);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;
    result = engine.joinGame(state, 'p3', 'P3', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    // P2 tries to bid before host places opening bid
    result = engine.placeBid(state, 'p2', 1, 1000);
    expect(result.error).toBeDefined();
    expect(result.state.currentHighestBid).toBe(0);
    expect(result.state.currentHighestBidderId).toBeNull();
  });

  it('before spinning, nobody can bid, including the opener', () => {
    const rng = seededRNG(101);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    // Opener tries to bid without spinning
    result = engine.placeBid(state, 'host', 1, 1000);
    expect(result.error).toBeDefined();

    // Non-opener tries to bid
    result = engine.placeBid(state, 'p2', 1, 1000);
    expect(result.error).toBeDefined();
  });

  it('after spin, opener bids 0 rejected; opener bids 1 accepted and becomes highest bidder', () => {
    const rng = seededRNG(102);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    // Opener bids 0 - rejected
    result = engine.placeBid(state, 'host', 0, 1000);
    expect(result.error).toBeDefined();

    // Opener bids 1 - accepted
    result = engine.placeBid(state, 'host', 1, 1000);
    expect(result.error).toBeUndefined();
    state = result.state;
    expect(state.currentHighestBid).toBe(1);
    expect(state.currentHighestBidderId).toBe('host');
  });

  it('after opening bid, other players can bid (current + 1); opener cannot raise own bid', () => {
    const rng = seededRNG(103);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    result = engine.placeBid(state, 'host', 2, 1000);
    state = result.state;

    // Host tries to raise own bid
    result = engine.placeBid(state, 'host', 3, 1100);
    expect(result.error).toBeDefined();

    // P2 bids 3
    result = engine.placeBid(state, 'p2', 3, 1200);
    expect(result.error).toBeUndefined();
    state = result.state;
    expect(state.currentHighestBidderId).toBe('p2');

    // P2 tries to raise own bid
    result = engine.placeBid(state, 'p2', 4, 1300);
    expect(result.error).toBeDefined();
  });

  it('opening bid respects gold reserve: 20 gold, 3 empty slots -> 19 rejected, 18 accepted', () => {
    const rng = seededRNG(104);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    // Opening bid 19 rejected
    result = engine.placeBid(state, 'host', 19, 1000);
    expect(result.error).toBeDefined();

    // Opening bid 18 accepted
    result = engine.placeBid(state, 'host', 18, 1000);
    expect(result.error).toBeUndefined();
  });

  it('timeout after opener spun but did not bid: places 1-gold opening bid for opener', () => {
    const rng = seededRNG(105);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    const wheelSizeAfterSpin = state.wheel.length;

    // Timeout without opener bidding
    result = engine.timeoutBid(state, rng, 21000);
    state = result.state;

    expect(state.currentHighestBid).toBe(1);
    expect(state.currentHighestBidderId).toBe('host');
    expect(state.wheel.length).toBe(wheelSizeAfterSpin);
  });

  it('timeout when opener did not spin: spins and places 1-gold opening bid, wheel shrinks by 1', () => {
    const rng = seededRNG(106);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    const wheelSizeBefore = state.wheel.length;

    // Timeout without spinning or bidding
    result = engine.timeoutBid(state, rng, 21000);
    state = result.state;

    expect(state.currentHighestBid).toBe(1);
    expect(state.currentHighestBidderId).toBe('host');
    expect(state.wheel.length).toBe(wheelSizeBefore - 1);
  });
});
