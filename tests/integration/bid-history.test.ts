import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { startServer, TestServer } from './helpers';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

describe('Bid History', () => {
  let server: TestServer;
  let socket1: Socket;
  let socket2: Socket;
  let socket3: Socket;

  beforeEach(async () => {
    server = await startServer(async (players) => {
      return JSON.stringify({
        ranking: players.map((p, i) => ({ playerId: p.id, rank: i + 1 })),
        playerReasons: players.reduce((acc, p) => ({ ...acc, [p.id]: 'Test reason' }), {}),
        closingWords: 'Test closing'
      });
    });
  });

  afterEach(async () => {
    socket1?.disconnect();
    socket2?.disconnect();
    socket3?.disconnect();
    await server.close();
  });

  it('bidHistory starts empty during opening phase', async () => {
    socket1 = io(`http://localhost:${server.port}`);
    socket2 = io(`http://localhost:${server.port}`);

    await new Promise<void>((resolve) => {
      socket1.emit('create_room', { nickname: 'Player1' });
      socket1.on('state_update', (state) => {
        if (state.roomCode) {
          socket2.emit('join_room', { roomCode: state.roomCode, nickname: 'Player2' });
          socket1.emit('start_game');
        }
        if (state.phase === 'opening') {
          expect(state.bidHistory).toEqual([]);
          resolve();
        }
      });
    });
  });

  it('opening bid appears in bidHistory', async () => {
    socket1 = io(`http://localhost:${server.port}`);
    socket2 = io(`http://localhost:${server.port}`);

    await new Promise<void>((resolve) => {
      let roomCode: string;
      let player1Id: string;

      socket1.emit('create_room', { nickname: 'Player1' });
      socket1.on('state_update', (state) => {
        if (state.roomCode && !roomCode) {
          roomCode = state.roomCode;
          player1Id = state.players[0].id;
          socket2.emit('join_room', { roomCode, nickname: 'Player2' });
        }
        if (state.phase === 'waiting' && state.players.length === 2) {
          socket1.emit('start_game');
        }
        if (state.phase === 'playing' && state.currentPlayer === player1Id) {
          socket1.emit('spin_wheel');
        }
        if (state.phase === 'opening') {
          socket1.emit('place_bid', { amount: 3 });
        }
        if (state.phase === 'bidding' && state.bidHistory && state.bidHistory.length === 1) {
          expect(state.bidHistory).toHaveLength(1);
          expect(state.bidHistory[0].playerId).toBe(player1Id);
          expect(state.bidHistory[0].amount).toBe(3);
          expect(typeof state.bidHistory[0].at).toBe('number');
          resolve();
        }
      });
    });
  });

  it('subsequent bids append to bidHistory in order', async () => {
    socket1 = io(`http://localhost:${server.port}`);
    socket2 = io(`http://localhost:${server.port}`);
    socket3 = io(`http://localhost:${server.port}`);

    await new Promise<void>((resolve) => {
      let roomCode: string;
      let player1Id: string;
      let player2Id: string;
      let player3Id: string;

      socket1.emit('create_room', { nickname: 'Player1' });
      socket1.on('state_update', (state) => {
        if (state.roomCode && !roomCode) {
          roomCode = state.roomCode;
          player1Id = state.players[0].id;
          socket2.emit('join_room', { roomCode, nickname: 'Player2' });
        }
        if (state.players.length === 2 && !player2Id) {
          player2Id = state.players[1].id;
          socket3.emit('join_room', { roomCode, nickname: 'Player3' });
        }
        if (state.phase === 'waiting' && state.players.length === 3) {
          player3Id = state.players[2].id;
          socket1.emit('start_game');
        }
        if (state.phase === 'playing' && state.currentPlayer === player1Id) {
          socket1.emit('spin_wheel');
        }
        if (state.phase === 'opening') {
          socket1.emit('place_bid', { amount: 3 });
        }
        if (state.phase === 'bidding') {
          const history = state.bidHistory || [];
          if (history.length === 1) {
            socket2.emit('place_bid', { amount: 5 });
          } else if (history.length === 2) {
            socket3.emit('place_bid', { amount: 7 });
          } else if (history.length === 3) {
            expect(history).toHaveLength(3);
            expect(history[0].playerId).toBe(player1Id);
            expect(history[0].amount).toBe(3);
            expect(history[1].playerId).toBe(player2Id);
            expect(history[1].amount).toBe(5);
            expect(history[2].playerId).toBe(player3Id);
            expect(history[2].amount).toBe(7);
            resolve();
          }
        }
      });
    });
  });

  it('bidHistory resets for next auction', async () => {
    socket1 = io(`http://localhost:${server.port}`);
    socket2 = io(`http://localhost:${server.port}`);

    await new Promise<void>((resolve) => {
      let roomCode: string;
      let player1Id: string;
      let player2Id: string;
      let firstAuctionCompleted = false;

      socket1.emit('create_room', { nickname: 'Player1' });
      socket1.on('state_update', (state) => {
        if (state.roomCode && !roomCode) {
          roomCode = state.roomCode;
          player1Id = state.players[0].id;
          socket2.emit('join_room', { roomCode, nickname: 'Player2' });
        }
        if (state.phase === 'waiting' && state.players.length === 2) {
          player2Id = state.players[1].id;
          socket1.emit('start_game');
        }
        if (state.phase === 'playing' && state.currentPlayer === player1Id && !firstAuctionCompleted) {
          socket1.emit('spin_wheel');
        }
        if (state.phase === 'opening' && !firstAuctionCompleted) {
          socket1.emit('place_bid', { amount: 3 });
        }
        if (state.phase === 'bidding' && !firstAuctionCompleted) {
          const history = state.bidHistory || [];
          if (history.length === 1) {
            socket2.emit('place_bid', { amount: 5 });
          } else if (history.length === 2) {
            // Wait for auction to resolve
            firstAuctionCompleted = true;
          }
        }
        if (state.phase === 'playing' && firstAuctionCompleted && state.currentPlayer === player2Id) {
          socket2.emit('spin_wheel');
        }
        if (state.phase === 'opening' && firstAuctionCompleted) {
          const history = state.bidHistory || [];
          expect(history).toHaveLength(0);
          socket2.emit('place_bid', { amount: 2 });
        }
        if (state.phase === 'bidding' && firstAuctionCompleted) {
          const history = state.bidHistory || [];
          if (history.length === 1) {
            expect(history[0].playerId).toBe(player2Id);
            expect(history[0].amount).toBe(2);
            resolve();
          }
        }
      });
    });
  });

  it('timestamps are monotonically increasing', async () => {
    socket1 = io(`http://localhost:${server.port}`);
    socket2 = io(`http://localhost:${server.port}`);
    socket3 = io(`http://localhost:${server.port}`);

    await new Promise<void>((resolve) => {
      let roomCode: string;
      let player1Id: string;

      socket1.emit('create_room', { nickname: 'Player1' });
      socket1.on('state_update', (state) => {
        if (state.roomCode && !roomCode) {
          roomCode = state.roomCode;
          player1Id = state.players[0].id;
          socket2.emit('join_room', { roomCode, nickname: 'Player2' });
        }
        if (state.players.length === 2) {
          socket3.emit('join_room', { roomCode, nickname: 'Player3' });
        }
        if (state.phase === 'waiting' && state.players.length === 3) {
          socket1.emit('start_game');
        }
        if (state.phase === 'playing' && state.currentPlayer === player1Id) {
          socket1.emit('spin_wheel');
        }
        if (state.phase === 'opening') {
          socket1.emit('place_bid', { amount: 3 });
        }
        if (state.phase === 'bidding') {
          const history = state.bidHistory || [];
          if (history.length === 1) {
            socket2.emit('place_bid', { amount: 5 });
          } else if (history.length === 2) {
            socket3.emit('place_bid', { amount: 7 });
          } else if (history.length === 3) {
            // Verify timestamps are monotonically increasing
            expect(history[0].at).toBeLessThanOrEqual(history[1].at);
            expect(history[1].at).toBeLessThanOrEqual(history[2].at);
            resolve();
          }
        }
      });
    });
  });
});
