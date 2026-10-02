import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as engine from './engine/game.js';
import type { GameState, Item } from './engine/types.js';
import { parseAndValidateJudgeResponse } from './judgeResult.js';
import * as roomTimers from './roomTimers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface JudgeFunction {
  (players: { nickname: string; items: { name: string; description: string }[] }[]): Promise<string>;
}

export interface ServerOptions {
  port: number;
  judge: JudgeFunction;
  timeScale?: number;
  autoPlay?: boolean;
}

export interface ServerInstance {
  port: number;
  close: () => Promise<void>;
}

export async function createServer(options: ServerOptions): Promise<ServerInstance> {
  const { port, judge, timeScale = 1, autoPlay = true } = options;

  const OPENING_TIMEOUT = 20000 * timeScale;
  const BIDDING_TIMEOUT = 10000 * timeScale;
  const BID_EXTENSION_THRESHOLD = 5000 * timeScale;
  const JUDGE_TIMEOUT = 30000 * timeScale;

  // Load superpowers
  const superpowers: Item[] = JSON.parse(
    readFileSync(join(__dirname, 'superpowers.json'), 'utf-8')
  );

  // Rooms
  interface Room {
    code: string;
    state: GameState;
    timers: roomTimers.TimerState;
    judgeAbort: AbortController | null;
  }

  const rooms = new Map<string, Room>();
  const socketToPlayer = new Map<string, { roomCode: string; playerId: string }>();

  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);

    const wrap = <T>(handler: (data: T, ack?: (response: unknown) => void) => void | Promise<void>) => {
      return async (data: T, ack?: unknown) => {
        try {
          if (typeof ack !== 'function') {
            ack = undefined;
          }
          await handler(data, ack as (response: unknown) => void);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('Socket handler error:', errorMsg);
          if (typeof ack === 'function') {
            ack({ success: false, error: errorMsg });
          }
        }
      };
    };

    socket.on('create_room', wrap<{ nickname: string }>((data, ack) => {
      if (!data || typeof data.nickname !== 'string') {
        ack?.({ success: false, error: 'Geçersiz isim' });
        return;
      }

      const code = generateRoomCode();
      const playerId = socket.id;

      const result = engine.createGame(playerId, data.nickname, superpowers, seededRNG());
      if (result.error) {
        ack?.({ success: false, error: result.error });
        return;
      }

      const room: Room = {
        code,
        state: result.state,
        timers: roomTimers.createTimerState(),
        judgeAbort: null
      };

      rooms.set(code, room);
      socketToPlayer.set(socket.id, { roomCode: code, playerId });
      socket.join(code);

      const token = result.events[0]?.token as string;
      io.to(code).emit('state_update', sanitizeStateForAll(room.state, room));
      ack?.({ success: true, roomCode: code, playerId, token });

      // Broadcast initial state to the room
      io.to(code).emit('state_update', sanitizeStateForAll(room.state, room));
    }));

    socket.on('join_room', wrap<{ roomCode: string; nickname?: string; playerToken?: string }>((data, ack) => {
      if (!data || typeof data.roomCode !== 'string') {
        ack?.({ success: false, error: 'Geçersiz veri' });
        return;
      }

      const room = rooms.get(data.roomCode);
      if (!room) {
        ack?.({ success: false, error: 'Oda bulunamadı' });
        return;
      }

      // Reconnect
      if (data.playerToken) {
        const reconnected = engine.reconnect(room.state, data.playerToken);
        if (reconnected.playerId) {
          socketToPlayer.set(socket.id, { roomCode: data.roomCode, playerId: reconnected.playerId });
          socket.join(data.roomCode);
          ack?.({ success: true, reconnected: true, playerId: reconnected.playerId, token: data.playerToken, state: sanitizeState(room.state, reconnected.playerId, room) });
          // Send state_update to the reconnected socket so client's useSocket receives it
          socket.emit('state_update', sanitizeState(room.state, reconnected.playerId, room));
          return;
        }
      }

      // New join - nickname is required
      if (typeof data.nickname !== 'string') {
        ack?.({ success: false, error: 'Takma ad gerekli' });
        return;
      }

      const playerId = socket.id;
      const result = engine.joinGame(room.state, playerId, data.nickname, seededRNG());
      if (result.error) {
        ack?.({ success: false, error: result.error });
        return;
      }

      room.state = result.state;
      socketToPlayer.set(socket.id, { roomCode: data.roomCode, playerId });
      socket.join(data.roomCode);

      const token = result.events[0]?.token as string;
      io.to(data.roomCode).emit('state_update', sanitizeStateForAll(room.state, room));
      ack?.({ success: true, playerId, token });
    }));

    socket.on('start_game', wrap<{}>((data, ack) => {
      const player = socketToPlayer.get(socket.id);
      if (!player) {
        ack?.({ success: false, error: 'Odada değilsin' });
        return;
      }

      const room = rooms.get(player.roomCode);
      if (!room) {
        ack?.({ success: false, error: 'Oda bulunamadı' });
        return;
      }

      const result = engine.startGame(room.state, player.playerId, superpowers, seededRNG());
      if (result.error) {
        ack?.({ success: false, error: result.error });
        return;
      }

      room.state = result.state;
      scheduleOpeningTimer(room);
      io.to(player.roomCode).emit('state_update', sanitizeStateForAll(room.state, room));
      ack?.({ success: true });
    }));

    socket.on('spin_wheel', wrap<{}>((data, ack) => {
      console.log('[spin_wheel] Received from socket:', socket.id);
      const player = socketToPlayer.get(socket.id);
      if (!player) {
        console.log('[spin_wheel] Player not found in room');
        ack?.({ success: false, error: 'Odada değilsin' });
        return;
      }

      const room = rooms.get(player.roomCode);
      if (!room) {
        console.log('[spin_wheel] Room not found:', player.roomCode);
        ack?.({ success: false, error: 'Oda bulunamadı' });
        return;
      }

      console.log('[spin_wheel] Processing spin for player:', player.playerId, 'in room:', player.roomCode);
      const result = engine.spinWheel(room.state, player.playerId, seededRNG(), Date.now());
      if (result.error) {
        console.log('[spin_wheel] Error:', result.error);
        ack?.({ success: false, error: result.error });
        return;
      }

      room.state = result.state;
      io.to(player.roomCode).emit('state_update', sanitizeStateForAll(room.state, room));
      console.log('[spin_wheel] Success, revealed item:', result.state.revealedItem?.name);
      ack?.({ success: true });
    }));

    socket.on('place_bid', wrap<{ amount: number }>((data, ack) => {
      console.log('[place_bid] Received from socket:', socket.id, 'amount:', data?.amount);
      if (!data || typeof data.amount !== 'number') {
        console.log('[place_bid] Invalid amount');
        ack?.({ success: false, error: 'Geçersiz miktar' });
        return;
      }

      const player = socketToPlayer.get(socket.id);
      if (!player) {
        console.log('[place_bid] Player not found in room');
        ack?.({ success: false, error: 'Odada değilsin' });
        return;
      }

      const room = rooms.get(player.roomCode);
      if (!room) {
        console.log('[place_bid] Room not found:', player.roomCode);
        ack?.({ success: false, error: 'Oda bulunamadı' });
        return;
      }

      const now = Date.now();
      const isOpeningBid = room.state.phase === 'opening';
      const result = engine.placeBid(room.state, player.playerId, data.amount, now);
      if (result.error) {
        ack?.({ success: false, error: result.error });
        return;
      }

      room.state = result.state;

      // Handle auction timer
      if (room.state.phase === 'bidding') {
        if (isOpeningBid) {
          // Opening bid placed - clear opening timer, schedule auction end
          roomTimers.clearOpeningTimer(room.timers);
          const roomCode = room.code;
          roomTimers.scheduleAuctionEnd(room.timers, BIDDING_TIMEOUT, () => {
            const r = rooms.get(roomCode);
            if (r) handleAuctionEnd(r);
          });
        } else {
          // Regular bid - extend if needed
          const roomCode = room.code;
          roomTimers.extendAuctionIfNeeded(room.timers, BID_EXTENSION_THRESHOLD, BID_EXTENSION_THRESHOLD, () => {
            const r = rooms.get(roomCode);
            if (r) handleAuctionEnd(r);
          });
        }
      }

      io.to(player.roomCode).emit('state_update', sanitizeStateForAll(room.state, room));
      ack?.({ success: true });
    }));

    socket.on('retry_judge', wrap<{}>((data, ack) => {
      const player = socketToPlayer.get(socket.id);
      if (!player) {
        ack?.({ success: false, error: 'Odada değilsin' });
        return;
      }

      const room = rooms.get(player.roomCode);
      if (!room) {
        ack?.({ success: false, error: 'Oda bulunamadı' });
        return;
      }

      const result = engine.retryJudge(room.state, player.playerId);
      if (result.error) {
        ack?.({ success: false, error: result.error });
        return;
      }

      room.state = result.state;
      startJudging(room);
      io.to(player.roomCode).emit('state_update', sanitizeStateForAll(room.state, room));
      ack?.({ success: true });
    }));

    socket.on('rematch', wrap<{}>((data, ack) => {
      const player = socketToPlayer.get(socket.id);
      if (!player) {
        ack?.({ success: false, error: 'Odada değilsin' });
        return;
      }

      const room = rooms.get(player.roomCode);
      if (!room) {
        ack?.({ success: false, error: 'Oda bulunamadı' });
        return;
      }

      const result = engine.rematch(room.state, player.playerId, superpowers, seededRNG());
      if (result.error) {
        ack?.({ success: false, error: result.error });
        return;
      }

      room.state = result.state;
      scheduleOpeningTimer(room);
      io.to(player.roomCode).emit('state_update', sanitizeStateForAll(room.state, room));
      ack?.({ success: true });
    }));

    socket.on('disconnect', () => {
      socketToPlayer.delete(socket.id);
    });
  });

  function scheduleOpeningTimer(room: Room) {
    roomTimers.clearOpeningTimer(room.timers);

    if (!autoPlay) return;

    const roomCode = room.code;
    room.timers.openingTimer = setTimeout(() => {
      try {
        const r = rooms.get(roomCode);
        if (!r) return;
        if (r.state.phase !== 'playing' && r.state.phase !== 'opening') return;

        const result = engine.timeoutBid(r.state, seededRNG(), Date.now());
        if (result.error) {
          console.error('Opening timeout error:', result.error);
          return;
        }

        r.state = result.state;

        if (r.state.phase === 'bidding') {
          roomTimers.scheduleAuctionEnd(r.timers, BIDDING_TIMEOUT, () => {
            const r2 = rooms.get(roomCode);
            if (r2) handleAuctionEnd(r2);
          });
        }

        io.to(r.code).emit('state_update', sanitizeStateForAll(r.state, r));
      } catch (error) {
        console.error('Timer error:', error);
      }
    }, OPENING_TIMEOUT);
  }

  function handleAuctionEnd(room: Room) {
    try {
      if (room.state.phase !== 'bidding') return;

      const result = engine.resolveBid(room.state);
      if (result.error) {
        console.error('Bidding resolve error:', result.error);
        return;
      }

      room.state = result.state;

      if (room.state.phase === 'playing') {
        scheduleOpeningTimer(room);
      } else if (room.state.phase === 'judging') {
        startJudging(room);
      }

      io.to(room.code).emit('state_update', sanitizeStateForAll(room.state, room));
    } catch (error) {
      console.error('Auction end error:', error);
    }
  }

  function startJudging(room: Room) {
    if (room.judgeAbort) {
      room.judgeAbort.abort();
    }

    const abort = new AbortController();
    room.judgeAbort = abort;

    let judgeSettled = false;

    const timeoutId = setTimeout(() => {
      if (!judgeSettled && !abort.signal.aborted) {
        judgeSettled = true;
        abort.abort();
        console.error('Judge timeout');
        const failResult = engine.setJudgeFailed(room.state);
        room.state = failResult.state;
        io.to(room.code).emit('state_update', sanitizeStateForAll(room.state, room));
      }
    }, JUDGE_TIMEOUT);

    const playersData = room.state.players.map(p => ({
      nickname: p.nickname,
      items: p.slots.filter(s => s !== null).map(s => ({ name: s!.name, description: s!.description }))
    }));

    judge(playersData)
      .then(rawText => {
        clearTimeout(timeoutId);
        if (judgeSettled || abort.signal.aborted) return;
        judgeSettled = true;

        try {
          const result = parseAndValidateJudgeResponse(rawText, room.state.players.length);
          const engineResult = engine.setJudgeResult(room.state, result.ranking, result.commentary);
          if (engineResult.error) {
            console.error('Judge result error:', engineResult.error);
            const failResult = engine.setJudgeFailed(room.state);
            room.state = failResult.state;
          } else {
            room.state = engineResult.state;
          }

          io.to(room.code).emit('state_update', sanitizeStateForAll(room.state, room));
        } catch (error) {
          console.error('Judge validation error:', error);
          const failResult = engine.setJudgeFailed(room.state);
          room.state = failResult.state;
          io.to(room.code).emit('state_update', sanitizeStateForAll(room.state, room));
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        if (judgeSettled || abort.signal.aborted) return;
        judgeSettled = true;

        console.error('Judge error:', error);
        const failResult = engine.setJudgeFailed(room.state);
        room.state = failResult.state;
        io.to(room.code).emit('state_update', sanitizeStateForAll(room.state, room));
      });
  }

  function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  function seededRNG() {
    return Math.random;
  }

  function sanitizeState(state: GameState, playerId: string, room: Room): unknown {
    const player = state.players.find(p => p.id === playerId);
    return {
      ...state,
      wheel: state.wheel.length,
      players: state.players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        gold: p.gold,
        slots: p.slots,
        maxBid: p.maxBid,
        isMe: p.id === playerId
      })),
      myToken: player?.token,
      auctionEndsAt: room.timers.auctionEndTime,
      openingEndsAt: room.timers.openingTimer ? Date.now() + OPENING_TIMEOUT : null
    };
  }

  function sanitizeStateForAll(state: GameState, room: Room): unknown {
    return {
      ...state,
      roomCode: room.code,
      wheel: state.wheel.length,
      players: state.players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        gold: p.gold,
        slots: p.slots,
        maxBid: p.maxBid
      })),
      auctionEndsAt: room.timers.auctionEndTime,
      openingEndsAt: room.timers.openingTimer ? Date.now() + OPENING_TIMEOUT : null
    };
  }

  return new Promise((resolve, reject) => {
    const server = httpServer.listen(port, () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;

      resolve({
        port: actualPort,
        close: async () => {
          // Clear all room timers and abort controllers
          for (const room of rooms.values()) {
            roomTimers.clearAllTimers(room.timers);
            if (room.judgeAbort) {
              room.judgeAbort.abort();
              room.judgeAbort = null;
            }
          }
          rooms.clear();
          socketToPlayer.clear();

          // Disconnect all sockets
          const sockets = await io.fetchSockets();
          for (const socket of sockets) {
            socket.disconnect(true);
          }

          // Close io and http server
          io.close();
          await new Promise<void>((res, rej) => {
            server.close((err) => {
              if (err) rej(err);
              else res();
            });
          });
        }
      });
    });

    server.on('error', reject);
  });
}

