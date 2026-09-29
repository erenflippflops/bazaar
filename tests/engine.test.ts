import { describe, it, expect } from 'vitest';
import * as engine from '../server/engine/game.js';
import type { Item, RNG } from '../server/engine/types.js';

const mockItems: Item[] = [
  { name: 'Item1', description: 'Desc1' },
  { name: 'Item2', description: 'Desc2' },
  { name: 'Item3', description: 'Desc3' },
  { name: 'Item4', description: 'Desc4' },
  { name: 'Item5', description: 'Desc5' },
  { name: 'Item6', description: 'Desc6' },
  { name: 'Item7', description: 'Desc7' },
  { name: 'Item8', description: 'Desc8' },
  { name: 'Item9', description: 'Desc9' },
  { name: 'Item10', description: 'Desc10' }
];

function seededRNG(seed: number): RNG {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('Rule 3: Deck and Wheel', () => {
  it('wheel starts with all items and shrinks without refilling', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    expect(state.wheel.length).toBe(10); // All items

    // Spin and reveal
    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    expect(state.wheel.length).toBe(9); // Shrinks to 9
    expect(state.revealedItem).not.toBeNull();

    // Place bid and resolve
    result = engine.placeBid(state, 'host', 1, 1000);
    state = result.state;

    result = engine.resolveBid(state);
    state = result.state;

    expect(state.phase).toBe('playing');

    // Next turn - wheel should still be 9
    result = engine.spinWheel(state, state.players[state.currentOpenerIndex].id, rng, 2000);
    state = result.state;

    expect(state.wheel.length).toBe(8); // Shrinks again, no refill
  });

  it('wheel holds all 40 items at game start', async () => {
    // Load real superpowers data
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const superpowers = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../server/superpowers.json'), 'utf-8')
    );

    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    expect(state.wheel.length).toBe(40);
    expect(state.deck.length).toBe(0); // No separate deck
  });

  it('each spin removes exactly the revealed item and nothing else', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    const initialWheel = [...state.wheel];
    const initialCount = initialWheel.length;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    const revealed = state.revealedItem!;

    // Check wheel is smaller by exactly 1
    expect(state.wheel.length).toBe(initialCount - 1);

    // Check revealed item is not in wheel anymore
    expect(state.wheel.find(i => i.name === revealed.name)).toBeUndefined();

    // Check all other items are still there
    const remainingNames = state.wheel.map(i => i.name).sort();
    const expectedNames = initialWheel
      .filter(i => i.name !== revealed.name)
      .map(i => i.name)
      .sort();
    expect(remainingNames).toEqual(expectedNames);
  });

  it('full 6-player game completes with 22 items remaining', async () => {
    // Load real superpowers
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const superpowers = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../server/superpowers.json'), 'utf-8')
    );

    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    // Add 5 more players (total 6)
    for (let i = 2; i <= 6; i++) {
      result = engine.joinGame(state, `p${i}`, `Player${i}`, rng);
      state = result.state;
    }

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    expect(state.wheel.length).toBe(40);

    // Play 18 auctions (6 players × 3 slots)
    let auctionCount = 0;
    while (state.phase !== 'judging' && auctionCount < 20) {
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

    expect(auctionCount).toBe(18);
    expect(state.phase).toBe('judging');
    expect(state.wheel.length).toBe(22); // 40 - 18 = 22
    expect(state.players.every(p => p.slots.every(s => s !== null))).toBe(true);
  });
});

describe('Rule 4: Opening Order', () => {
  it('skips players with 3 filled slots', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    // Host opens first auction normally
    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    result = engine.placeBid(state, 'host', 1, 1000);
    state = result.state;

    result = engine.resolveBid(state);
    state = result.state;

    // Now artificially fill host's remaining slots
    state.players[0].slots = [
      state.players[0].slots[0], // Keep the one they won
      { name: 'B', description: 'B' },
      { name: 'C', description: 'C' }
    ];

    // Current opener should now be p2 (index 1)
    expect(state.currentOpenerIndex).toBe(1);

    // Next turn should work with p2
    result = engine.spinWheel(state, 'p2', rng, 2000);
    expect(result.error).toBeUndefined();
    state = result.state;

    result = engine.placeBid(state, 'p2', 1, 2000);
    state = result.state;

    result = engine.resolveBid(state);
    state = result.state;

    // After p2's turn, next opener should still be p2 (skipping filled host)
    expect(state.currentOpenerIndex).toBe(1);
  });

  it('auto-bids 1 gold after 20s timeout', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    // Timeout - should auto-spin and bid
    result = engine.timeoutBid(state, rng, 1000);
    state = result.state;

    expect(state.phase).toBe('bidding');
    expect(state.currentHighestBid).toBe(1);
    expect(state.revealedItem).not.toBeNull();
  });
});

describe('Rule 5: Bidding', () => {
  it('enforces minimum bid of current highest + 1', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    result = engine.placeBid(state, 'host', 5, 1000);
    state = result.state;

    // Try to bid 5 (same as current)
    result = engine.placeBid(state, 'p2', 5, 1500);
    expect(result.error).toBeTruthy();

    // Bid 6 (valid)
    result = engine.placeBid(state, 'p2', 6, 1500);
    expect(result.error).toBeUndefined();
    state = result.state;

    expect(state.currentHighestBid).toBe(6);
    expect(state.currentHighestBidderId).toBe('p2');
  });

  it('prevents highest bidder from raising their own bid', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    result = engine.placeBid(state, 'host', 5, 1000);
    state = result.state;

    // Host tries to raise
    result = engine.placeBid(state, 'host', 6, 1500);
    expect(result.error).toBe('Kendi teklifini arttıramazsın');
  });

  it('awards item to highest bidder on timeout', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    const item = state.revealedItem!;

    result = engine.placeBid(state, 'host', 5, 1000);
    state = result.state;

    result = engine.placeBid(state, 'p2', 8, 1500);
    state = result.state;

    // Resolve
    result = engine.resolveBid(state);
    state = result.state;

    const winner = state.players.find(p => p.id === 'p2')!;
    expect(winner.gold).toBe(12); // 20 - 8
    expect(winner.slots.filter(s => s !== null).length).toBe(1);
    expect(winner.slots.find(s => s?.name === item.name)).toBeTruthy();
  });
});

describe('Rule 6: Gold Reserve', () => {
  it('enforces gold reserve: cannot bid more than gold - (emptySlots - 1)', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    // Host has 20 gold, 3 empty slots
    // Max bid = 20 - (3-1) = 18

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    result = engine.placeBid(state, 'host', 19, 1000);
    expect(result.error).toBe('Maksimum 18 altın teklif edebilirsin');

    result = engine.placeBid(state, 'host', 18, 1000);
    expect(result.error).toBeUndefined();
    state = result.state;

    expect(state.currentHighestBid).toBe(18);
  });

  it('updates max bid as slots fill', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    // Fill one slot
    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    result = engine.placeBid(state, 'host', 5, 1000);
    state = result.state;

    result = engine.resolveBid(state);
    state = result.state;

    // Host now has 15 gold, 2 empty slots
    // Max bid = 15 - (2-1) = 14

    result = engine.spinWheel(state, state.players[state.currentOpenerIndex].id, rng, 2000);
    state = result.state;

    const opener = state.players[state.currentOpenerIndex];
    const emptySlots = opener.slots.filter(s => s === null).length;
    const maxBid = opener.gold - (emptySlots - 1);

    result = engine.placeBid(state, opener.id, maxBid + 1, 2000);
    expect(result.error).toBeTruthy();

    result = engine.placeBid(state, opener.id, maxBid, 2000);
    expect(result.error).toBeUndefined();
  });
});

describe('Rule 7: End of Auction', () => {
  it('transitions to judging when all players have 3 filled slots', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    // Fill slots for both players (6 auctions)
    for (let i = 0; i < 6; i++) {
      result = engine.spinWheel(state, state.players[state.currentOpenerIndex].id, rng, 1000 * (i + 1));
      state = result.state;

      result = engine.placeBid(state, state.players[state.currentOpenerIndex].id, 1, 1000 * (i + 1));
      state = result.state;

      result = engine.resolveBid(state);
      state = result.state;

      if (state.phase === 'judging') {
        break;
      }
    }

    expect(state.phase).toBe('judging');
    expect(state.players.every(p => p.slots.every(s => s !== null))).toBe(true);
  });
});

describe('Rule 10: Reconnect', () => {
  it('allows reconnect with valid playerToken', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    const token = result.events[0]?.token as string;
    expect(token).toBeTruthy();

    // Reconnect
    const reconnected = engine.reconnect(state, token);
    expect(reconnected.playerId).toBe('host');
    expect(reconnected.nickname).toBe('Host');
  });

  it('rejects reconnect with invalid token', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    const reconnected = engine.reconnect(state, 'invalid_token');
    expect(reconnected.playerId).toBeNull();
    expect(reconnected.nickname).toBeNull();
  });

  it('preserves player state on reconnect', () => {
    const rng = seededRNG(42);
    let result = engine.createGame('host', 'Host', mockItems, rng);
    let state = result.state;

    const token = result.events[0]?.token as string;

    result = engine.joinGame(state, 'p2', 'Player2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', mockItems, rng);
    state = result.state;

    // Play a round
    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    result = engine.placeBid(state, 'host', 10, 1000);
    state = result.state;

    result = engine.resolveBid(state);
    state = result.state;

    // Host now has 10 gold, 1 filled slot
    const hostBefore = state.players.find(p => p.id === 'host')!;
    expect(hostBefore.gold).toBe(10);
    expect(hostBefore.slots.filter(s => s !== null).length).toBe(1);

    // Reconnect
    const reconnected = engine.reconnect(state, token);
    expect(reconnected.playerId).toBe('host');

    const hostAfter = state.players.find(p => p.id === 'host')!;
    expect(hostAfter.gold).toBe(10);
    expect(hostAfter.slots.filter(s => s !== null).length).toBe(1);
  });
});
