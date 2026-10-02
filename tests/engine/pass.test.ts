import { describe, it, expect } from 'vitest';
import * as engine from '../../server/engine/game.js';
import type { GameState, Player, Item } from '../../server/engine/types.js';

function createMockRNG() {
  let counter = 0;
  return () => {
    counter++;
    return (counter * 0.1234567) % 1;
  };
}

function createTestState(players: Partial<Player>[]): GameState {
  const fullPlayers: Player[] = players.map((p, i) => ({
    id: p.id || `p${i + 1}`,
    nickname: p.nickname || `P${i + 1}`,
    gold: p.gold ?? 20,
    slots: p.slots || [null, null, null],
    token: p.token || `token${i + 1}`,
    maxBid: p.maxBid ?? 18
  }));

  return {
    phase: 'bidding',
    hostId: fullPlayers[0].id,
    players: fullPlayers,
    wheel: [],
    revealedItem: { name: 'Test Item', description: 'Test' },
    currentOpenerIndex: 0,
    currentHighestBid: 5,
    currentHighestBidderId: fullPlayers[0].id,
    turnStartTime: Date.now(),
    ranking: null,
    commentary: null,
    auctionNumber: 1,
    passedPlayerIds: []
  };
}

describe('passBid', () => {
  it('allows a player to pass when not the highest bidder', () => {
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10 },
      { id: 'p2', nickname: 'P2', gold: 10 }
    ]);
    state.currentHighestBidderId = 'p1';
    state.currentHighestBid = 5;

    const result = engine.passBid(state, 'p2');

    expect(result.error).toBeUndefined();
    expect(result.state.passedPlayerIds).toContain('p2');
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'bid_passed', playerId: 'p2' })
    );
  });

  it('rejects pass from the current highest bidder', () => {
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10 },
      { id: 'p2', nickname: 'P2', gold: 10 }
    ]);
    state.currentHighestBidderId = 'p1';
    state.currentHighestBid = 5;

    const result = engine.passBid(state, 'p1');

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/en yüksek teklif sahibi/i);
    expect(result.state.passedPlayerIds).not.toContain('p1');
  });

  it('rejects pass in opening phase', () => {
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10 },
      { id: 'p2', nickname: 'P2', gold: 10 }
    ]);
    state.phase = 'opening';
    state.currentHighestBidderId = null;

    const result = engine.passBid(state, 'p1');

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/açılış/i);
    expect(result.state.passedPlayerIds).not.toContain('p1');
  });

  it('rejects pass from already passed player', () => {
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10 },
      { id: 'p2', nickname: 'P2', gold: 10 }
    ]);
    state.currentHighestBidderId = 'p1';
    state.passedPlayerIds = ['p2'];

    const result = engine.passBid(state, 'p2');

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/zaten pas dedin/i);
  });

  it('rejects pass from player with full slots', () => {
    const item: Item = { name: 'Item', description: 'Desc' };
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10, slots: [null, null, null] },
      { id: 'p2', nickname: 'P2', gold: 10, slots: [item, item, item] }
    ]);
    state.currentHighestBidderId = 'p1';

    const result = engine.passBid(state, 'p2');

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/slot/i);
  });
});

describe('isOutOfAuction', () => {
  it('returns true for passed player', () => {
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10 }
    ]);
    state.passedPlayerIds = ['p1'];

    const player = state.players[0];
    const result = engine.isOutOfAuction(state, player);

    expect(result).toBe(true);
  });

  it('returns true for player with full slots', () => {
    const item: Item = { name: 'Item', description: 'Desc' };
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10, slots: [item, item, item] }
    ]);

    const player = state.players[0];
    const result = engine.isOutOfAuction(state, player);

    expect(result).toBe(true);
  });

  it('returns true for player with maxBid below current + 1', () => {
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 5, maxBid: 3 }
    ]);
    state.currentHighestBid = 5;

    const player = state.players[0];
    const result = engine.isOutOfAuction(state, player);

    expect(result).toBe(true);
  });

  it('returns false for player who can still bid', () => {
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10, maxBid: 8 }
    ]);
    state.currentHighestBid = 5;

    const player = state.players[0];
    const result = engine.isOutOfAuction(state, player);

    expect(result).toBe(false);
  });
});

describe('isAuctionSettled', () => {
  it('returns true when all except highest bidder are out', () => {
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10 },
      { id: 'p2', nickname: 'P2', gold: 10 },
      { id: 'p3', nickname: 'P3', gold: 10 }
    ]);
    state.currentHighestBidderId = 'p1';
    state.passedPlayerIds = ['p2', 'p3'];

    const result = engine.isAuctionSettled(state);

    expect(result).toBe(true);
  });

  it('returns false when at least one other player can bid', () => {
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10 },
      { id: 'p2', nickname: 'P2', gold: 10 },
      { id: 'p3', nickname: 'P3', gold: 10 }
    ]);
    state.currentHighestBidderId = 'p1';
    state.passedPlayerIds = ['p2'];

    const result = engine.isAuctionSettled(state);

    expect(result).toBe(false);
  });

  it('returns false in opening phase', () => {
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10 },
      { id: 'p2', nickname: 'P2', gold: 10 }
    ]);
    state.phase = 'opening';

    const result = engine.isAuctionSettled(state);

    expect(result).toBe(false);
  });

  it('counts full-slot players as out', () => {
    const item: Item = { name: 'Item', description: 'Desc' };
    const state = createTestState([
      { id: 'p1', nickname: 'P1', gold: 10, slots: [null, null, null] },
      { id: 'p2', nickname: 'P2', gold: 10, slots: [item, item, item] },
      { id: 'p3', nickname: 'P3', gold: 10, slots: [null, null, null] }
    ]);
    state.currentHighestBidderId = 'p1';
    state.passedPlayerIds = ['p3'];

    const result = engine.isAuctionSettled(state);

    expect(result).toBe(true);
  });
});
