export interface Item {
  name: string;
  description: string;
}

export interface Player {
  id: string;
  nickname: string;
  gold: number;
  slots: (Item | null)[]; // length 3 or 4, depends on theme
  token: string;
  maxBid: number; // maximum gold this player can bid (gold - (emptySlots - 1))
}

export interface GameState {
  phase: 'waiting' | 'briefing' | 'playing' | 'opening' | 'bidding' | 'judging' | 'judge_failed' | 'finished';
  hostId: string;
  players: Player[];
  wheel: Item[]; // starts with all items of the theme, shrinks by one per spin
  revealedItem: Item | null;
  currentOpenerIndex: number;
  currentHighestBid: number;
  currentHighestBidderId: string | null;
  turnStartTime: number | null; // injected timestamp
  ranking: { player: string; rank: number; reason: string }[] | null;
  commentary: string | null;
  auctionNumber: number; // current auction (1 to 3N where N = player count)
  passedPlayerIds: string[];
  briefingReadyPlayers: string[]; // player IDs who marked themselves ready during briefing
}

export interface GameEvent {
  type: string;
  [key: string]: unknown;
}

export interface RNG {
  (): number; // returns 0-1
}

export interface EngineResult {
  state: GameState;
  events: GameEvent[];
  error?: string;
}
