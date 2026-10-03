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

function createBriefingState(players: Partial<Player>[]): GameState {
  const fullPlayers: Player[] = players.map((p, i) => ({
    id: p.id || `p${i + 1}`,
    nickname: p.nickname || `P${i + 1}`,
    gold: p.gold ?? 20,
    slots: p.slots || [null, null, null],
    token: p.token || `token${i + 1}`,
    maxBid: p.maxBid ?? 18
  }));

  return {
    phase: 'briefing',
    hostId: fullPlayers[0].id,
    players: fullPlayers,
    wheel: Array(18).fill({ name: 'Item', description: 'Test' }),
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    turnStartTime: null,
    ranking: null,
    commentary: null,
    auctionNumber: 1,
    passedPlayerIds: [],
    briefingReadyPlayers: []
  };
}

describe('Briefing: Waits for all connected players', () => {
  it('does not transition to playing until all players are ready', () => {
    const state = createBriefingState([
      { id: 'p1', nickname: 'P1' },
      { id: 'p2', nickname: 'P2' },
      { id: 'p3', nickname: 'P3' }
    ]);

    // Mark first player ready
    const result1 = engine.markBriefingReady(state, 'p1');
    expect(result1.error).toBeUndefined();
    expect(result1.state.phase).toBe('briefing');
    expect(result1.state.briefingReadyPlayers).toContain('p1');

    // Mark second player ready
    const result2 = engine.markBriefingReady(result1.state, 'p2');
    expect(result2.error).toBeUndefined();
    expect(result2.state.phase).toBe('briefing');
    expect(result2.state.briefingReadyPlayers).toContain('p2');

    // Mark third player ready - should transition
    const result3 = engine.markBriefingReady(result2.state, 'p3');
    expect(result3.error).toBeUndefined();
    expect(result3.state.phase).toBe('playing');
    expect(result3.events).toContainEqual(
      expect.objectContaining({ type: 'briefing_complete' })
    );
  });

  it('allows same player to mark ready multiple times without error', () => {
    const state = createBriefingState([
      { id: 'p1', nickname: 'P1' },
      { id: 'p2', nickname: 'P2' }
    ]);

    const result1 = engine.markBriefingReady(state, 'p1');
    expect(result1.error).toBeUndefined();

    const result2 = engine.markBriefingReady(result1.state, 'p1');
    expect(result2.error).toBeUndefined();
    expect(result2.state.briefingReadyPlayers.filter(id => id === 'p1').length).toBe(1);
  });

  it('transitions immediately when only one player', () => {
    const state = createBriefingState([
      { id: 'p1', nickname: 'P1' }
    ]);

    const result = engine.markBriefingReady(state, 'p1');
    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('playing');
  });
});

describe('Briefing: Disconnected players count as ready', () => {
  it('disconnected player is automatically ready', () => {
    const state = createBriefingState([
      { id: 'p1', nickname: 'P1' },
      { id: 'p2', nickname: 'P2' },
      { id: 'p3', nickname: 'P3' }
    ]);

    // Mark p1 and p2 ready
    let currentState = engine.markBriefingReady(state, 'p1').state;
    currentState = engine.markBriefingReady(currentState, 'p2').state;

    // P3 disconnects - pass empty array to simulate only p1 and p2 connected
    const connectedPlayerIds = ['p1', 'p2'];
    const result = engine.checkBriefingComplete(currentState, connectedPlayerIds);

    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('playing');
  });

  it('all disconnected players means immediate transition', () => {
    const state = createBriefingState([
      { id: 'p1', nickname: 'P1' },
      { id: 'p2', nickname: 'P2' }
    ]);

    // No players connected
    const connectedPlayerIds: string[] = [];
    const result = engine.checkBriefingComplete(state, connectedPlayerIds);

    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('playing');
  });

  it('one connected player must still mark ready', () => {
    const state = createBriefingState([
      { id: 'p1', nickname: 'P1' },
      { id: 'p2', nickname: 'P2' },
      { id: 'p3', nickname: 'P3' }
    ]);

    // Only p1 is connected, p2 and p3 disconnected
    const connectedPlayerIds = ['p1'];
    const result = engine.checkBriefingComplete(state, connectedPlayerIds);

    // Should not transition yet because p1 hasn't marked ready
    expect(result.state.phase).toBe('briefing');

    // Now p1 marks ready
    const readyResult = engine.markBriefingReady(result.state, 'p1');
    const finalResult = engine.checkBriefingComplete(readyResult.state, connectedPlayerIds);
    expect(finalResult.state.phase).toBe('playing');
  });
});

describe('Briefing: Force start (host only)', () => {
  it('host can force start briefing', () => {
    const state = createBriefingState([
      { id: 'p1', nickname: 'P1' },
      { id: 'p2', nickname: 'P2' },
      { id: 'p3', nickname: 'P3' }
    ]);

    // Only p1 (host) is ready
    const readyState = engine.markBriefingReady(state, 'p1').state;

    // Host forces start
    const result = engine.forceStartBriefing(readyState, 'p1');

    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('playing');
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'briefing_forced' })
    );
  });

  it('non-host cannot force start briefing', () => {
    const state = createBriefingState([
      { id: 'p1', nickname: 'P1' },
      { id: 'p2', nickname: 'P2' }
    ]);

    const result = engine.forceStartBriefing(state, 'p2');

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/host/i);
    expect(result.state.phase).toBe('briefing');
  });

  it('force start rejected when not in briefing phase', () => {
    const state = createBriefingState([
      { id: 'p1', nickname: 'P1' }
    ]);
    state.phase = 'playing';

    const result = engine.forceStartBriefing(state, 'p1');

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/briefing/i);
  });

  it('force start works even when no players are ready', () => {
    const state = createBriefingState([
      { id: 'p1', nickname: 'P1' },
      { id: 'p2', nickname: 'P2' },
      { id: 'p3', nickname: 'P3' }
    ]);

    const result = engine.forceStartBriefing(state, 'p1');

    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('playing');
  });
});
