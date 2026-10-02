import type { GameState, Player, Item, RNG, EngineResult, GameEvent } from './types.js';

export function createGame(hostId: string, hostNickname: string, items: Item[], rng: RNG): EngineResult {
  const token = generateToken(rng);
  const host: Player = {
    id: hostId,
    nickname: hostNickname,
    gold: 20,
    slots: [null, null, null],
    token,
    maxBid: 18 // 20 - (3 - 1)
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
    commentary: null,
    auctionNumber: 0,
    passedPlayerIds: [],
    briefingReadyPlayers: []
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
    token,
    maxBid: 18 // 20 - (3 - 1)
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
    phase: 'briefing',
    wheel,
    currentOpenerIndex: 0,
    auctionNumber: 1,
    briefingReadyPlayers: []
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
    phase: 'opening',
    currentHighestBid: 0,
    currentHighestBidderId: null,
    turnStartTime: now,
    passedPlayerIds: []
  };

  return { state: newState, events: [{ type: 'wheel_spun', item: revealed, wheelSize: newWheel.length }] };
}

export function placeBid(state: GameState, playerId: string, amount: number, now: number): EngineResult {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { state, events: [], error: 'Oyuncu bulunamadı' };
  }

  if (!Number.isInteger(amount)) {
    return { state, events: [], error: 'Teklif tam sayı olmalı' };
  }

  const emptySlots = player.slots.filter(s => s === null).length;
  if (emptySlots === 0) {
    return { state, events: [], error: 'Slotların dolu' };
  }

  // Check if player has passed
  if (state.passedPlayerIds.includes(playerId)) {
    return { state, events: [], error: 'Pas dedin, teklif veremezsin' };
  }

  // Opening bid - only opener can bid after spin
  if (state.phase === 'opening') {
    const opener = state.players[state.currentOpenerIndex];
    if (opener.id !== playerId) {
      return { state, events: [], error: 'Sadece açan oyuncu ilk teklifi verebilir' };
    }

    const maxBid = player.gold - (emptySlots - 1);
    if (amount < 1) {
      return { state, events: [], error: 'En az 1 altın teklif etmelisin' };
    }
    if (amount > maxBid) {
      return { state, events: [], error: `Maksimum ${maxBid} altın teklif edebilirsin` };
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

    // Spin first
    const spinResult = spinWheel(state, opener.id, rng, now);
    if (spinResult.error) {
      return spinResult;
    }

    // Place minimum bid
    const bidResult = placeBid(spinResult.state, opener.id, 1, now);
    if (bidResult.error) {
      return bidResult;
    }

    return {
      state: bidResult.state,
      events: [...spinResult.events, ...bidResult.events, { type: 'auto_bid', playerId: opener.id, nickname: opener.nickname }]
    };
  }

  // Opening timeout - opener spun but didn't bid
  if (state.phase === 'opening') {
    const opener = state.players[state.currentOpenerIndex];

    // Place minimum bid
    const bidResult = placeBid(state, opener.id, 1, now);
    if (bidResult.error) {
      return bidResult;
    }

    return {
      state: bidResult.state,
      events: [...bidResult.events, { type: 'auto_bid', playerId: opener.id, nickname: opener.nickname }]
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

  const newGold = winner.gold - state.currentHighestBid;
  const newEmptySlots = newSlots.filter(s => s === null).length;
  const newMaxBid = newGold - (newEmptySlots - 1);

  const newPlayers = state.players.map(p =>
    p.id === winner.id
      ? { ...p, gold: newGold, slots: newSlots, maxBid: newMaxBid }
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
      turnStartTime: null,
      passedPlayerIds: []
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
    turnStartTime: null,
    auctionNumber: state.auctionNumber + 1,
    passedPlayerIds: []
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
    phase: 'briefing',
    players: newPlayers,
    wheel,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    turnStartTime: null,
    ranking: null,
    commentary: null,
    auctionNumber: 1,
    briefingReadyPlayers: []
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

export function passBid(state: GameState, playerId: string): EngineResult {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { state, events: [], error: 'Oyuncu bulunamadı' };
  }

  if (state.phase !== 'bidding') {
    return { state, events: [], error: 'Açılış aşamasında pas diyemezsin' };
  }

  if (state.currentHighestBidderId === playerId) {
    return { state, events: [], error: 'En yüksek teklif sahibi pas diyemez' };
  }

  if (state.passedPlayerIds.includes(playerId)) {
    return { state, events: [], error: 'Zaten pas dedin' };
  }

  const emptySlots = player.slots.filter(s => s === null).length;
  if (emptySlots === 0) {
    return { state, events: [], error: 'Slotların dolu, pas diyemezsin' };
  }

  const newState: GameState = {
    ...state,
    passedPlayerIds: [...state.passedPlayerIds, playerId]
  };

  return { state: newState, events: [{ type: 'bid_passed', playerId, nickname: player.nickname }] };
}

export function isOutOfAuction(state: GameState, player: Player): boolean {
  // Player explicitly passed
  if (state.passedPlayerIds.includes(player.id)) {
    return true;
  }

  // Player has no empty slots
  const emptySlots = player.slots.filter(s => s === null).length;
  if (emptySlots === 0) {
    return true;
  }

  // Player cannot afford to bid (maxBid < currentHighestBid + 1)
  if (player.maxBid < state.currentHighestBid + 1) {
    return true;
  }

  return false;
}

export function isAuctionSettled(state: GameState): boolean {
  // Opening phase - not settled
  if (state.phase === 'opening' || state.currentHighestBidderId === null) {
    return false;
  }

  // Check if all players except the highest bidder are out of auction
  for (const player of state.players) {
    if (player.id === state.currentHighestBidderId) {
      continue; // Skip the highest bidder
    }
    if (!isOutOfAuction(state, player)) {
      return false; // At least one player can still bid
    }
  }

  return true;
}

export function markBriefingReady(state: GameState, playerId: string): EngineResult {
  if (state.phase !== 'briefing') {
    return { state, events: [], error: 'Briefing aşaması değil' };
  }

  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { state, events: [], error: 'Oyuncu bulunamadı' };
  }

  if (state.briefingReadyPlayers.includes(playerId)) {
    return { state, events: [], error: 'Zaten hazırsın' };
  }

  const newState: GameState = {
    ...state,
    briefingReadyPlayers: [...state.briefingReadyPlayers, playerId]
  };

  return { state: newState, events: [{ type: 'briefing_ready', playerId, nickname: player.nickname }] };
}

export function allBriefingReady(state: GameState): boolean {
  return state.briefingReadyPlayers.length === state.players.length;
}

export function startPlaying(state: GameState): EngineResult {
  if (state.phase !== 'briefing') {
    return { state, events: [], error: 'Briefing aşaması değil' };
  }

  const newState: GameState = {
    ...state,
    phase: 'playing'
  };

  return { state: newState, events: [{ type: 'playing_started' }] };
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
