import type { GameState, Player, Item, RNG, EngineResult, GameEvent } from './types.js';

export function createGame(hostId: string, hostNickname: string, items: Item[], rng: RNG): EngineResult {
  const token = generateToken(rng);
  const host: Player = {
    id: hostId,
    nickname: hostNickname,
    gold: 20,
    slots: [null, null, null],
    token
  };

  const state: GameState = {
    phase: 'waiting',
    hostId,
    players: [host],
    wheel: [],
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    turnStartTime: null,
    ranking: null,
    commentary: null
  };

  return { state, events: [{ type: 'game_created', hostId, nickname: hostNickname, token }] };
}

export function joinGame(state: GameState, playerId: string, nickname: string, rng: RNG): EngineResult {
  if (state.phase !== 'waiting') {
    return { state, events: [], error: 'Oyun zaten başladı, katılamazsın' };
  }

  if (state.players.length >= 6) {
    return { state, events: [], error: 'Oda dolu (maksimum 6 oyuncu)' };
  }

  if (nickname.length < 1 || nickname.length > 16) {
    return { state, events: [], error: 'İsim 1-16 karakter olmalı' };
  }

  if (state.players.some(p => p.nickname === nickname)) {
    return { state, events: [], error: 'Bu isim zaten kullanılıyor' };
  }

  if (state.players.some(p => p.id === playerId)) {
    return { state, events: [], error: 'Zaten odadasın' };
  }

  const token = generateToken(rng);
  const player: Player = {
    id: playerId,
    nickname,
    gold: 20,
    slots: [null, null, null],
    token
  };

  const newState = { ...state, players: [...state.players, player] };
  return { state: newState, events: [{ type: 'player_joined', playerId, nickname, token }] };
}

export function startGame(state: GameState, playerId: string, items: Item[], rng: RNG): EngineResult {
  if (playerId !== state.hostId) {
    return { state, events: [], error: 'Sadece host oyunu başlatabilir' };
  }

  if (state.phase !== 'waiting') {
    return { state, events: [], error: 'Oyun zaten başladı' };
  }

  if (state.players.length < 2) {
    return { state, events: [], error: 'En az 2 oyuncu gerekli' };
  }

  // Shuffle all items into wheel
  const wheel = shuffle([...items], rng);

  const newState: GameState = {
    ...state,
    phase: 'playing',
    wheel,
    currentOpenerIndex: 0
  };

  return { state: newState, events: [{ type: 'game_started', wheelSize: wheel.length }] };
}

export function spinWheel(state: GameState, playerId: string, rng: RNG, now: number): EngineResult {
  if (state.phase !== 'playing') {
    return { state, events: [], error: 'Şu anda çark çevrilemez' };
  }

  const opener = state.players[state.currentOpenerIndex];
  if (opener.id !== playerId) {
    return { state, events: [], error: 'Sıra sende değil' };
  }

  if (state.wheel.length === 0) {
    return { state, events: [], error: 'Çarkta item kalmadı' };
  }

  // Pick random item from wheel
  const index = Math.floor(rng() * state.wheel.length);
  const revealed = state.wheel[index];
  const newWheel = state.wheel.filter((_, i) => i !== index);

  const newState: GameState = {
    ...state,
    revealedItem: revealed,
    wheel: newWheel,
    phase: 'bidding',
    currentHighestBid: 0,
    currentHighestBidderId: null,
    turnStartTime: now
  };

  return { state: newState, events: [{ type: 'wheel_spun', item: revealed, wheelSize: newWheel.length }] };
}

export function placeBid(state: GameState, playerId: string, amount: number, now: number): EngineResult {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { state, events: [], error: 'Oyuncu bulunamadı' };
  }

  // Opening bid
  if (state.phase === 'playing') {
    const opener = state.players[state.currentOpenerIndex];
    if (opener.id !== playerId) {
      return { state, events: [], error: 'Sıra sende değil' };
    }

    const emptySlots = player.slots.filter(s => s === null).length;
    if (emptySlots === 0) {
      return { state, events: [], error: 'Slotların dolu' };
    }

    const maxBid = player.gold - (emptySlots - 1);
    if (amount < 1) {
      return { state, events: [], error: 'En az 1 altın teklif etmelisin' };
    }
    if (amount > maxBid) {
      return { state, events: [], error: `Maksimum ${maxBid} altın teklif edebilirsin` };
    }

    // Must spin first
    if (!state.revealedItem) {
      return { state, events: [], error: 'Önce çarkı çevir' };
    }

    const newState: GameState = {
      ...state,
      phase: 'bidding',
      currentHighestBid: amount,
      currentHighestBidderId: playerId,
      turnStartTime: now
    };

    return { state: newState, events: [{ type: 'bid_placed', playerId, nickname: player.nickname, amount, isOpening: true }] };
  }

  // Regular bid
  if (state.phase !== 'bidding') {
    return { state, events: [], error: 'Şu anda teklif verilemez' };
  }

  const emptySlots = player.slots.filter(s => s === null).length;
  if (emptySlots === 0) {
    return { state, events: [], error: 'Slotların dolu' };
  }

  if (state.currentHighestBidderId === playerId) {
    return { state, events: [], error: 'Kendi teklifini arttıramazsın' };
  }

  const maxBid = player.gold - (emptySlots - 1);
  if (amount <= state.currentHighestBid) {
    return { state, events: [], error: `En az ${state.currentHighestBid + 1} altın teklif etmelisin` };
  }
  if (amount > maxBid) {
    return { state, events: [], error: `Maksimum ${maxBid} altın teklif edebilirsin` };
  }

  const newState: GameState = {
    ...state,
    currentHighestBid: amount,
    currentHighestBidderId: playerId,
    turnStartTime: now
  };

  return { state: newState, events: [{ type: 'bid_placed', playerId, nickname: player.nickname, amount, isOpening: false }] };
}

export function timeoutBid(state: GameState, rng: RNG, now: number): EngineResult {
  // Auto-spin and place 1 gold if opener didn't act
  if (state.phase === 'playing') {
    const opener = state.players[state.currentOpenerIndex];

    // Spin first if not spun
    let currentState = state;
    let events: GameEvent[] = [];

    if (!state.revealedItem) {
      const spinResult = spinWheel(state, opener.id, rng, now);
      if (spinResult.error) {
        return spinResult;
      }
      currentState = spinResult.state;
      events = spinResult.events;
    }

    // Place minimum bid
    const bidResult = placeBid(currentState, opener.id, 1, now);
    if (bidResult.error) {
      return bidResult;
    }

    return {
      state: bidResult.state,
      events: [...events, ...bidResult.events, { type: 'auto_bid', playerId: opener.id, nickname: opener.nickname }]
    };
  }

  // Bidding timeout - award to highest bidder
  if (state.phase === 'bidding') {
    return resolveBid(state);
  }

  return { state, events: [] };
}

export function resolveBid(state: GameState): EngineResult {
  if (state.phase !== 'bidding') {
    return { state, events: [], error: 'Teklif aşaması değil' };
  }

  if (!state.currentHighestBidderId || !state.revealedItem) {
    return { state, events: [], error: 'Teklif verilmedi' };
  }

  const winner = state.players.find(p => p.id === state.currentHighestBidderId);
  if (!winner) {
    return { state, events: [], error: 'Kazanan bulunamadı' };
  }

  // Award item
  const emptySlotIndex = winner.slots.findIndex(s => s === null);
  if (emptySlotIndex === -1) {
    return { state, events: [], error: 'Kazananın boş slotu yok' };
  }

  const newSlots = [...winner.slots];
  newSlots[emptySlotIndex] = state.revealedItem;

  const newPlayers = state.players.map(p =>
    p.id === winner.id
      ? { ...p, gold: p.gold - state.currentHighestBid, slots: newSlots }
      : p
  );

  // Check if game should end
  const allFilled = newPlayers.every(p => p.slots.every(s => s !== null));
  if (allFilled) {
    const newState: GameState = {
      ...state,
      players: newPlayers,
      phase: 'judging',
      revealedItem: null,
      currentHighestBid: 0,
      currentHighestBidderId: null,
      turnStartTime: null
    };
    return { state: newState, events: [{ type: 'bid_resolved', winnerId: winner.id, nickname: winner.nickname, amount: state.currentHighestBid, item: state.revealedItem }, { type: 'judging_started' }] };
  }

  // Find next opener
  let nextOpenerIndex = (state.currentOpenerIndex + 1) % state.players.length;
  while (newPlayers[nextOpenerIndex].slots.every(s => s !== null)) {
    nextOpenerIndex = (nextOpenerIndex + 1) % newPlayers.length;
  }

  const newState: GameState = {
    ...state,
    players: newPlayers,
    phase: 'playing',
    revealedItem: null,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    currentOpenerIndex: nextOpenerIndex,
    turnStartTime: null
  };

  return { state: newState, events: [{ type: 'bid_resolved', winnerId: winner.id, nickname: winner.nickname, amount: state.currentHighestBid, item: state.revealedItem }, { type: 'next_turn', openerIndex: nextOpenerIndex, openerId: newPlayers[nextOpenerIndex].id }] };
}

export function setJudgeResult(state: GameState, ranking: { player: string; rank: number; reason: string }[], commentary: string): EngineResult {
  if (state.phase !== 'judging') {
    return { state, events: [], error: 'Hakem aşaması değil' };
  }

  // Validate ranking
  const playerNicknames = state.players.map(p => p.nickname).sort();
  const rankingNicknames = ranking.map(r => r.player).sort();

  if (JSON.stringify(playerNicknames) !== JSON.stringify(rankingNicknames)) {
    return { state, events: [], error: 'Hakem sonucu geçersiz: tüm oyuncular olmalı' };
  }

  const ranks = ranking.map(r => r.rank).sort((a, b) => a - b);
  const expectedRanks = Array.from({ length: state.players.length }, (_, i) => i + 1);
  if (JSON.stringify(ranks) !== JSON.stringify(expectedRanks)) {
    return { state, events: [], error: 'Hakem sonucu geçersiz: sıralamalar 1..n olmalı' };
  }

  const newState: GameState = {
    ...state,
    phase: 'finished',
    ranking,
    commentary
  };

  return { state: newState, events: [{ type: 'judge_result', ranking, commentary }] };
}

export function setJudgeFailed(state: GameState): EngineResult {
  if (state.phase !== 'judging') {
    return { state, events: [], error: 'Hakem aşaması değil' };
  }

  const newState: GameState = {
    ...state,
    phase: 'judge_failed'
  };

  return { state: newState, events: [{ type: 'judge_failed' }] };
}

export function retryJudge(state: GameState, playerId: string): EngineResult {
  if (playerId !== state.hostId) {
    return { state, events: [], error: 'Sadece host tekrar deneyebilir' };
  }

  if (state.phase !== 'judge_failed') {
    return { state, events: [], error: 'Hakem başarısız değil' };
  }

  const newState: GameState = {
    ...state,
    phase: 'judging'
  };

  return { state: newState, events: [{ type: 'judge_retry' }] };
}

export function rematch(state: GameState, playerId: string, items: Item[], rng: RNG): EngineResult {
  if (playerId !== state.hostId) {
    return { state, events: [], error: 'Sadece host revanche başlatabilir' };
  }

  if (state.phase !== 'finished') {
    return { state, events: [], error: 'Oyun bitmedi' };
  }

  // Reset all players
  const newPlayers = state.players.map(p => ({
    ...p,
    gold: 20,
    slots: [null, null, null]
  }));

  // Shuffle all items into wheel
  const wheel = shuffle([...items], rng);

  const newState: GameState = {
    ...state,
    phase: 'playing',
    players: newPlayers,
    wheel,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    turnStartTime: null,
    ranking: null,
    commentary: null
  };

  return { state: newState, events: [{ type: 'rematch_started', wheelSize: wheel.length }] };
}

export function reconnect(state: GameState, playerToken: string): { playerId: string | null; nickname: string | null } {
  const player = state.players.find(p => p.token === playerToken);
  if (!player) {
    return { playerId: null, nickname: null };
  }
  return { playerId: player.id, nickname: player.nickname };
}

// Helper functions
function generateToken(rng: RNG): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(rng() * chars.length)];
  }
  return token;
}

function shuffle<T>(array: T[], rng: RNG): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
