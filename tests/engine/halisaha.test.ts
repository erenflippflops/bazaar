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

interface HalisahaItem extends Item {
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
}

function createTestState(players: Partial<Player>[], slotTypes?: string[]): GameState {
  const fullPlayers: Player[] = players.map((p, i) => ({
    id: p.id || `p${i + 1}`,
    nickname: p.nickname || `P${i + 1}`,
    gold: p.gold ?? 20,
    slots: p.slots || [null, null, null, null],
    token: p.token || `token${i + 1}`,
    maxBid: p.maxBid ?? 17
  }));

  return {
    phase: 'bidding',
    hostId: fullPlayers[0].id,
    players: fullPlayers,
    wheel: [],
    revealedItem: { name: 'Test Item', description: 'Test', position: 'DEF' } as HalisahaItem,
    currentOpenerIndex: 0,
    currentHighestBid: 5,
    currentHighestBidderId: fullPlayers[0].id,
    turnStartTime: Date.now(),
    ranking: null,
    commentary: null,
    auctionNumber: 1,
    passedPlayerIds: [],
    briefingReadyPlayers: [],
    slotTypes: slotTypes || ['GK', 'FIELD', 'FIELD', 'FIELD']
  };
}

describe('Halisaha: Fitting-slot placement', () => {
  it('places GK item in GK slot', () => {
    const gkItem: HalisahaItem = { name: 'Goalkeeper', description: 'GK', position: 'GK' };
    const state = createTestState([
      { id: 'p1', slots: [null, null, null, null] }
    ]);
    state.revealedItem = gkItem;

    const result = engine.settleBid(state, 123456);

    expect(result.error).toBeUndefined();
    expect(result.state.players[0].slots[0]).toEqual(gkItem);
    expect(result.state.players[0].slots[1]).toBeNull();
  });

  it('places field player in first empty FIELD slot', () => {
    const defItem: HalisahaItem = { name: 'Defender', description: 'DEF', position: 'DEF' };
    const state = createTestState([
      { id: 'p1', slots: [null, null, null, null] }
    ]);
    state.revealedItem = defItem;

    const result = engine.settleBid(state, 123456);

    expect(result.error).toBeUndefined();
    expect(result.state.players[0].slots[0]).toBeNull();
    expect(result.state.players[0].slots[1]).toEqual(defItem);
  });

  it('places field player in second FIELD slot when first is occupied', () => {
    const midItem: HalisahaItem = { name: 'Midfielder', description: 'MID', position: 'MID' };
    const existingDef: HalisahaItem = { name: 'Defender', description: 'DEF', position: 'DEF' };
    const state = createTestState([
      { id: 'p1', slots: [null, existingDef, null, null] }
    ]);
    state.revealedItem = midItem;

    const result = engine.settleBid(state, 123456);

    expect(result.error).toBeUndefined();
    expect(result.state.players[0].slots[2]).toEqual(midItem);
  });

  it('places FWD in first empty FIELD slot', () => {
    const fwdItem: HalisahaItem = { name: 'Forward', description: 'FWD', position: 'FWD' };
    const state = createTestState([
      { id: 'p1', slots: [null, null, null, null] }
    ]);
    state.revealedItem = fwdItem;

    const result = engine.settleBid(state, 123456);

    expect(result.error).toBeUndefined();
    expect(result.state.players[0].slots[1]).toEqual(fwdItem);
  });
});

describe('Halisaha: Auto-out for no fitting slot', () => {
  it('player with full GK slot is auto-out from GK auction', () => {
    const gkItem: HalisahaItem = { name: 'GK', description: 'GK', position: 'GK' };
    const existingGK: HalisahaItem = { name: 'Old GK', description: 'GK', position: 'GK' };
    const state = createTestState([
      { id: 'p1', slots: [existingGK, null, null, null], gold: 20, maxBid: 17 },
      { id: 'p2', slots: [null, null, null, null], gold: 20, maxBid: 17 }
    ]);
    state.revealedItem = gkItem;
    state.currentHighestBidderId = 'p2';
    state.currentHighestBid = 5;

    const player1 = state.players[0];
    const isOut = engine.isOutOfAuction(state, player1);

    expect(isOut).toBe(true);
  });

  it('player with all FIELD slots full is auto-out from DEF auction', () => {
    const defItem: HalisahaItem = { name: 'Defender', description: 'DEF', position: 'DEF' };
    const existingDef: HalisahaItem = { name: 'D1', description: 'DEF', position: 'DEF' };
    const existingMid: HalisahaItem = { name: 'M1', description: 'MID', position: 'MID' };
    const existingFwd: HalisahaItem = { name: 'F1', description: 'FWD', position: 'FWD' };
    const state = createTestState([
      { id: 'p1', slots: [null, existingDef, existingMid, existingFwd], gold: 20, maxBid: 17 },
      { id: 'p2', slots: [null, null, null, null], gold: 20, maxBid: 17 }
    ]);
    state.revealedItem = defItem;
    state.currentHighestBidderId = 'p2';

    const player1 = state.players[0];
    const isOut = engine.isOutOfAuction(state, player1);

    expect(isOut).toBe(true);
  });

  it('player with empty GK slot can participate in GK auction', () => {
    const gkItem: HalisahaItem = { name: 'GK', description: 'GK', position: 'GK' };
    const state = createTestState([
      { id: 'p1', slots: [null, null, null, null], gold: 20, maxBid: 17 }
    ]);
    state.revealedItem = gkItem;
    state.currentHighestBidderId = 'p1';
    state.currentHighestBid = 5;

    const player1 = state.players[0];
    const isOut = engine.isOutOfAuction(state, player1);

    expect(isOut).toBe(false);
  });

  it('player with one empty FIELD slot can participate in MID auction', () => {
    const midItem: HalisahaItem = { name: 'Midfielder', description: 'MID', position: 'MID' };
    const existingDef: HalisahaItem = { name: 'D1', description: 'DEF', position: 'DEF' };
    const existingFwd: HalisahaItem = { name: 'F1', description: 'FWD', position: 'FWD' };
    const state = createTestState([
      { id: 'p1', slots: [null, existingDef, null, existingFwd], gold: 20, maxBid: 18 }
    ]);
    state.revealedItem = midItem;
    state.currentHighestBidderId = 'p1';

    const player1 = state.players[0];
    const isOut = engine.isOutOfAuction(state, player1);

    expect(isOut).toBe(false);
  });
});

describe('Halisaha: Discard when nobody fits', () => {
  it('discards GK item when all players have full GK slots', () => {
    const gkItem: HalisahaItem = { name: 'GK', description: 'GK', position: 'GK' };
    const existingGK1: HalisahaItem = { name: 'GK1', description: 'GK', position: 'GK' };
    const existingGK2: HalisahaItem = { name: 'GK2', description: 'GK', position: 'GK' };
    const rng = createMockRNG();
    const state = createTestState([
      { id: 'p1', slots: [existingGK1, null, null, null] },
      { id: 'p2', slots: [existingGK2, null, null, null] }
    ]);
    state.phase = 'playing';
    state.wheel = [gkItem];
    state.revealedItem = null;
    state.currentOpenerIndex = 0;

    const result = engine.spinWheel(state, 'p1', rng, Date.now());

    expect(result.error).toBeUndefined();
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'item_discarded' })
    );
    expect(result.state.phase).toBe('playing');
    expect(result.state.currentOpenerIndex).toBe(1);
  });

  it('discards field player when all players have full FIELD slots', () => {
    const defItem: HalisahaItem = { name: 'Defender', description: 'DEF', position: 'DEF' };
    const d1: HalisahaItem = { name: 'D1', description: 'DEF', position: 'DEF' };
    const m1: HalisahaItem = { name: 'M1', description: 'MID', position: 'MID' };
    const f1: HalisahaItem = { name: 'F1', description: 'FWD', position: 'FWD' };
    const rng = createMockRNG();
    const state = createTestState([
      { id: 'p1', slots: [null, d1, m1, f1] },
      { id: 'p2', slots: [null, d1, m1, f1] }
    ]);
    state.phase = 'playing';
    state.wheel = [defItem];
    state.revealedItem = null;
    state.currentOpenerIndex = 0;

    const result = engine.spinWheel(state, 'p1', rng, Date.now());

    expect(result.error).toBeUndefined();
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'item_discarded' })
    );
    expect(result.state.currentOpenerIndex).toBe(1);
  });

  it('does not discard when at least one player has a fitting slot', () => {
    const gkItem: HalisahaItem = { name: 'GK', description: 'GK', position: 'GK' };
    const existingGK: HalisahaItem = { name: 'GK1', description: 'GK', position: 'GK' };
    const rng = createMockRNG();
    const state = createTestState([
      { id: 'p1', slots: [existingGK, null, null, null] },
      { id: 'p2', slots: [null, null, null, null] }
    ]);
    state.phase = 'playing';
    state.wheel = [gkItem];
    state.revealedItem = null;
    state.currentOpenerIndex = 0;

    const result = engine.spinWheel(state, 'p1', rng, Date.now());

    expect(result.error).toBeUndefined();
    expect(result.events).not.toContainEqual(
      expect.objectContaining({ type: 'item_discarded' })
    );
    expect(result.state.phase).toBe('opening');
    expect(result.state.revealedItem).toEqual(gkItem);
  });
});

describe('Halisaha: Opener handoff', () => {
  it('passes opening to next player when opener has no fitting slot', () => {
    const gkItem: HalisahaItem = { name: 'GK', description: 'GK', position: 'GK' };
    const existingGK: HalisahaItem = { name: 'GK1', description: 'GK', position: 'GK' };
    const rng = createMockRNG();
    const state = createTestState([
      { id: 'p1', slots: [existingGK, null, null, null] },
      { id: 'p2', slots: [null, null, null, null] },
      { id: 'p3', slots: [null, null, null, null] }
    ]);
    state.phase = 'playing';
    state.wheel = [gkItem];
    state.revealedItem = null;
    state.currentOpenerIndex = 0;

    const result = engine.spinWheel(state, 'p1', rng, Date.now());

    expect(result.error).toBeUndefined();
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'opener_changed' })
    );
    expect(result.state.phase).toBe('opening');
    expect(result.state.currentOpenerIndex).toBe(1);
  });

  it('passes opening to next available player, skipping those without fitting slots', () => {
    const gkItem: HalisahaItem = { name: 'GK', description: 'GK', position: 'GK' };
    const existingGK: HalisahaItem = { name: 'GK1', description: 'GK', position: 'GK' };
    const rng = createMockRNG();
    const state = createTestState([
      { id: 'p1', slots: [existingGK, null, null, null] },
      { id: 'p2', slots: [existingGK, null, null, null] },
      { id: 'p3', slots: [null, null, null, null] }
    ]);
    state.phase = 'playing';
    state.wheel = [gkItem];
    state.revealedItem = null;
    state.currentOpenerIndex = 0;

    const result = engine.spinWheel(state, 'p1', rng, Date.now());

    expect(result.error).toBeUndefined();
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'opener_changed' })
    );
    expect(result.state.currentOpenerIndex).toBe(2);
  });

  it('does not change opener when opener has fitting slot', () => {
    const gkItem: HalisahaItem = { name: 'GK', description: 'GK', position: 'GK' };
    const rng = createMockRNG();
    const state = createTestState([
      { id: 'p1', slots: [null, null, null, null] },
      { id: 'p2', slots: [null, null, null, null] }
    ]);
    state.phase = 'playing';
    state.wheel = [gkItem];
    state.revealedItem = null;
    state.currentOpenerIndex = 0;

    const result = engine.spinWheel(state, 'p1', rng, Date.now());

    expect(result.error).toBeUndefined();
    expect(result.events).not.toContainEqual(
      expect.objectContaining({ type: 'opener_changed' })
    );
    expect(result.state.currentOpenerIndex).toBe(0);
    expect(result.state.phase).toBe('opening');
  });
});

describe('Halisaha: Game always ends', () => {
  it('200 random halisaha games always end with each player having 1 GK and 3 non-GK', () => {
    const createHalisahaItems = (): HalisahaItem[] => {
      const items: HalisahaItem[] = [];
      for (let i = 1; i <= 6; i++) {
        items.push({ name: `GK${i}`, description: 'Goalkeeper', position: 'GK' });
      }
      for (let i = 1; i <= 10; i++) {
        items.push({ name: `DEF${i}`, description: 'Defender', position: 'DEF' });
      }
      for (let i = 1; i <= 12; i++) {
        items.push({ name: `MID${i}`, description: 'Midfielder', position: 'MID' });
      }
      for (let i = 1; i <= 12; i++) {
        items.push({ name: `FWD${i}`, description: 'Forward', position: 'FWD' });
      }
      return items;
    };

    const runGame = (playerCount: number, seed: number): boolean => {
      let rng = createMockRNG();
      // Seed the RNG
      for (let i = 0; i < seed; i++) {
        rng();
      }

      const items = createHalisahaItems();
      const createResult = engine.createGame('host', 'Host', items, rng, 4);
      let state = createResult.state;

      for (let i = 2; i <= playerCount; i++) {
        const joinResult = engine.joinGame(state, `p${i}`, `P${i}`, rng);
        state = joinResult.state;
      }

      const startResult = engine.startGame(state, 'host', items, rng, 4);
      state = startResult.state;
      state.slotTypes = ['GK', 'FIELD', 'FIELD', 'FIELD'];

      // Skip briefing
      state.phase = 'playing';
      state.briefingReadyPlayers = state.players.map(p => p.id);

      let iterations = 0;
      const maxIterations = 1000;

      while (state.phase === 'playing' && iterations < maxIterations) {
        iterations++;
        const opener = state.players[state.currentOpenerIndex];

        // Spin wheel
        const spinResult = engine.spinWheel(state, opener.id, rng, Date.now());
        if (spinResult.error) {
          return false;
        }
        state = spinResult.state;

        // If item was discarded, continue to next turn
        if (spinResult.events.some(e => e.type === 'item_discarded')) {
          continue;
        }

        // If opener changed, use new opener
        const openerChangedEvent = spinResult.events.find(e => e.type === 'opener_changed');
        let actualOpener = opener;
        if (openerChangedEvent) {
          actualOpener = state.players[state.currentOpenerIndex];
        }

        // Opening phase - place opening bid
        if (state.phase === 'opening') {
          const bidResult = engine.placeBid(state, actualOpener.id, 1, Date.now());
          if (bidResult.error) {
            return false;
          }
          state = bidResult.state;
        }

        // Wait for auction to settle or bid if needed
        while (state.phase === 'bidding') {
          // Check if auction is settled
          const settleResult = engine.settleBid(state, Date.now());
          if (settleResult.state.phase !== 'bidding') {
            state = settleResult.state;
            break;
          }

          // If not settled, someone needs to bid or pass
          const activePlayers = state.players.filter(p => !engine.isOutOfAuction(state, p));
          if (activePlayers.length <= 1) {
            state = settleResult.state;
            break;
          }

          // Random player passes
          const randomPlayer = activePlayers[Math.floor(rng() * activePlayers.length)];
          if (randomPlayer.id !== state.currentHighestBidderId) {
            const passResult = engine.passBid(state, randomPlayer.id);
            if (!passResult.error) {
              state = passResult.state;
            }
          }
        }
      }

      if (iterations >= maxIterations) {
        return false;
      }

      // Verify all players have exactly 1 GK and 3 non-GK
      for (const player of state.players) {
        const gkCount = player.slots.filter(s => s && (s as HalisahaItem).position === 'GK').length;
        const nonGkCount = player.slots.filter(s => s && (s as HalisahaItem).position !== 'GK').length;
        if (gkCount !== 1 || nonGkCount !== 3) {
          return false;
        }
      }

      return true;
    };

    let successCount = 0;
    for (let i = 0; i < 200; i++) {
      const playerCount = 2 + (i % 5); // 2 to 6 players
      const success = runGame(playerCount, i);
      if (success) {
        successCount++;
      }
    }

    expect(successCount).toBe(200);
  }, 60000);
});
