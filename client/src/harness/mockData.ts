// Mock data for design harness - matches mockup values

export interface MockPlayer {
  id: string;
  nickname: string;
  gold: number;
  slots: (MockItem | null)[];
  token: string;
  maxBid?: number;
}

export interface MockItem {
  name: string;
  description: string;
}

export interface MockGameState {
  phase: string;
  hostId: string;
  players: MockPlayer[];
  wheel: number;
  revealedItem: MockItem | null;
  currentOpenerIndex: number;
  currentHighestBid: number;
  currentHighestBidderId: string | null;
  auctionEndsAt?: number;
  openingEndsAt?: number;
  roomCode: string;
  auctionNumber?: number;
  passedPlayerIds?: string[];
  isAuctionSettled?: boolean;
  theme?: {
    id: string;
    name: { tr: string; en: string; de: string };
    emoji: string;
  };
}

// Mock players matching mockup values
const mockPlayers: MockPlayer[] = [
  {
    id: 'player1',
    nickname: 'Eren',
    gold: 14,
    slots: [null, null, null],
    token: 'token1',
  },
  {
    id: 'player2',
    nickname: 'Selin',
    gold: 16,
    slots: [null, null, null],
    token: 'token2',
  },
  {
    id: 'player3',
    nickname: 'Mert',
    gold: 20,
    slots: [null, null, null],
    token: 'token3',
  },
  {
    id: 'player4',
    nickname: 'Deniz',
    gold: 11,
    slots: [null, null, null],
    token: 'token4',
  },
];

// Mock items from "Süper Güçler" theme
const mockItems = {
  isinlanma: { name: 'Işınlanma', description: 'Bir anda başka bir yere ışınlan' },
  gorunmezlik: { name: 'Görünmezlik', description: 'Tamamen görünmez ol' },
  ucma: { name: 'Uçma', description: 'Gökyüzünde süzül' },
  zihinOkuma: { name: 'Zihin Okuma', description: 'İnsanların düşüncelerini oku' },
  superHiz: { name: 'Süper Hız', description: 'Işık hızında koş' },
};

export const mockData: Record<string, MockGameState> = {
  connecting: {
    phase: 'connecting',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 40,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
  },

  login: {
    phase: 'login',
    hostId: 'player1',
    players: [],
    wheel: 40,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: '',
  },

  'lobby-host': {
    phase: 'lobby',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 40,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  'lobby-guest': {
    phase: 'lobby',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 40,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  briefing: {
    phase: 'briefing',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 40,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  'your-turn': {
    phase: 'playing',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 35,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  'not-your-turn': {
    phase: 'playing',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 35,
    revealedItem: null,
    currentOpenerIndex: 1,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  spinning: {
    phase: 'spinning',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 35,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  'opening-you': {
    phase: 'opening',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 34,
    revealedItem: mockItems.isinlanma,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    openingEndsAt: Date.now() + 8000,
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  'opening-other': {
    phase: 'opening',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 34,
    revealedItem: mockItems.gorunmezlik,
    currentOpenerIndex: 1,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    openingEndsAt: Date.now() + 6000,
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  bidding: {
    phase: 'auction',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 34,
    revealedItem: mockItems.ucma,
    currentOpenerIndex: 2,
    currentHighestBid: 7,
    currentHighestBidderId: 'player2',
    roomCode: 'K7M2',
    auctionEndsAt: Date.now() + 15000,
    auctionNumber: 3,
    passedPlayerIds: [],
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  'last-seconds': {
    phase: 'auction',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 34,
    revealedItem: mockItems.zihinOkuma,
    currentOpenerIndex: 3,
    currentHighestBid: 9,
    currentHighestBidderId: 'player1',
    roomCode: 'K7M2',
    auctionEndsAt: Date.now() + 4000,
    auctionNumber: 4,
    passedPlayerIds: ['player3'],
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  'top-bidder': {
    phase: 'auction',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 34,
    revealedItem: mockItems.superHiz,
    currentOpenerIndex: 0,
    currentHighestBid: 5,
    currentHighestBidderId: 'player1',
    roomCode: 'K7M2',
    auctionEndsAt: Date.now() + 12000,
    auctionNumber: 5,
    passedPlayerIds: [],
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  passed: {
    phase: 'auction',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 34,
    revealedItem: mockItems.isinlanma,
    currentOpenerIndex: 1,
    currentHighestBid: 8,
    currentHighestBidderId: 'player2',
    roomCode: 'K7M2',
    auctionEndsAt: Date.now() + 10000,
    auctionNumber: 6,
    passedPlayerIds: ['player1', 'player3'],
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  out: {
    phase: 'auction',
    hostId: 'player1',
    players: mockPlayers.map((p, i) => i === 0 ? { ...p, gold: 0 } : p),
    wheel: 34,
    revealedItem: mockItems.gorunmezlik,
    currentOpenerIndex: 2,
    currentHighestBid: 6,
    currentHighestBidderId: 'player3',
    roomCode: 'K7M2',
    auctionEndsAt: Date.now() + 11000,
    auctionNumber: 7,
    passedPlayerIds: ['player1'],
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  sold: {
    phase: 'auction',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 33,
    revealedItem: mockItems.ucma,
    currentOpenerIndex: 3,
    currentHighestBid: 10,
    currentHighestBidderId: 'player4',
    roomCode: 'K7M2',
    auctionNumber: 8,
    isAuctionSettled: true,
    passedPlayerIds: ['player1', 'player2', 'player3'],
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  'judge-thinking': {
    phase: 'judging',
    hostId: 'player1',
    players: mockPlayers.map((p, i) => ({
      ...p,
      slots: i === 0
        ? [mockItems.isinlanma, mockItems.gorunmezlik, mockItems.ucma]
        : i === 1
        ? [mockItems.zihinOkuma, mockItems.superHiz, null]
        : i === 2
        ? [mockItems.isinlanma, null, null]
        : [mockItems.gorunmezlik, null, null],
    })),
    wheel: 28,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  'judge-error': {
    phase: 'judging',
    hostId: 'player1',
    players: mockPlayers.map((p, i) => ({
      ...p,
      slots: i === 0
        ? [mockItems.isinlanma, mockItems.gorunmezlik, mockItems.ucma]
        : i === 1
        ? [mockItems.zihinOkuma, mockItems.superHiz, null]
        : i === 2
        ? [mockItems.isinlanma, null, null]
        : [mockItems.gorunmezlik, null, null],
    })),
    wheel: 28,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  results: {
    phase: 'results',
    hostId: 'player1',
    players: mockPlayers.map((p, i) => ({
      ...p,
      slots: i === 0
        ? [mockItems.isinlanma, mockItems.gorunmezlik, mockItems.ucma]
        : i === 1
        ? [mockItems.zihinOkuma, mockItems.superHiz, null]
        : i === 2
        ? [mockItems.isinlanma, null, null]
        : [mockItems.gorunmezlik, null, null],
    })),
    wheel: 28,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  disconnected: {
    phase: 'disconnected',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 30,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    theme: {
      id: 'superpowers',
      name: { tr: 'Süper Güçler', en: 'Super Powers', de: 'Superkräfte' },
      emoji: '⚡',
    },
  },

  halisaha: {
    phase: 'lobby',
    hostId: 'player1',
    players: mockPlayers,
    wheel: 40,
    revealedItem: null,
    currentOpenerIndex: 0,
    currentHighestBid: 0,
    currentHighestBidderId: null,
    roomCode: 'K7M2',
    theme: {
      id: 'halisaha',
      name: { tr: 'Halısaha', en: 'Soccer', de: 'Fußball' },
      emoji: '⚽',
    },
  },
};
