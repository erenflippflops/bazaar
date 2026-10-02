import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Item {
  name: string;
  description: string;
}

interface Player {
  id: string;
  nickname: string;
  gold: number;
  slots: (Item | null)[];
  token: string;
  maxBid?: number;
}

interface GameState {
  phase: 'waiting' | 'playing' | 'opening' | 'bidding' | 'judging' | 'judge_failed' | 'finished';
  hostId: string;
  players: Player[];
  wheel: number; // server sends the COUNT only (rule 3)
  revealedItem: Item | null;
  currentOpenerIndex: number;
  currentHighestBid: number;
  currentHighestBidderId: string | null;
  auctionEndsAt?: number;
  openingEndsAt?: number;
  ranking: { player: string; rank: number; reason: string }[] | null;
  commentary: string | null;
  roomCode?: string;
  themeName?: string;
  auctionNumber?: number;
  passedPlayerIds: string[];
  isAuctionSettled?: boolean;
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    console.log('[useSocket] Connecting to:', serverUrl);
    const newSocket = io(serverUrl, {
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('[useSocket] Connected to server');
      setConnected(true);

      // Reconnection: if we have a player token, rejoin
      const savedToken = sessionStorage.getItem('playerToken');
      const savedRoomCode = sessionStorage.getItem('roomCode');
      if (savedToken && savedRoomCode) {
        newSocket.emit('join_room', {
          roomCode: savedRoomCode,
          playerToken: savedToken,
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[useSocket] Disconnected from server');
      setConnected(false);
    });

    newSocket.on('state_update', (state: GameState) => {
      setGameState(state);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, gameState, connected };
}
