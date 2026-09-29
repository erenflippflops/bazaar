export interface Item {
  name: string;
  description: string;
}

export interface Player {
  id: string;
  nickname: string;
  gold: number;
  slots: (Item | null)[]; // length 3
  token: string;
}

export interface GameState {
  phase: 'waiting' | 'playing' | 'bidding' | 'judging' | 'judge_failed' | 'finished';
  hostId: string;
  players: Player[];
  deck: Item[];
  wheel: Item[]; // starts at 6, shrinks
  revealedItem: Item | null;
  currentOpenerIndex: number;
  currentHighestBid: number;
  currentHighestBidderId: string | null;
  turnStartTime: number | null; // injected timestamp
  ranking: { player: string; rank: number; reason: string }[] | null;
  commentary: string | null;
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
