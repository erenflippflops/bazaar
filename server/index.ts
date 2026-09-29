import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import * as engine from './engine/game.js';
import type { GameState, Item } from './engine/types.js';
import { AnthropicJudge, type JudgeService } from './judge.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const PORT = parseInt(process.env.PORT || '3001');
const GAME_TIME_SCALE = parseFloat(process.env.GAME_TIME_SCALE || '1') || 1;
const OPENING_TIMEOUT = 20000 * GAME_TIME_SCALE;
const BIDDING_TIMEOUT = 10000 * GAME_TIME_SCALE;
const BID_EXTENSION_THRESHOLD = 5000 * GAME_TIME_SCALE;
const JUDGE_TIMEOUT = 30000;

// Load superpowers
const superpowers: Item[] = JSON.parse(
  readFileSync(join(__dirname, 'superpowers.json'), 'utf-8')
);

// Judge service
const judgeService: JudgeService = process.env.ANTHROPIC_API_KEY
  ? new AnthropicJudge(process.env.ANTHROPIC_API_KEY)
  : { judge: async () => { throw new Error('ANTHROPIC_API_KEY not set'); } };

// Rooms
interface Room {
  code: string;
  state: GameState;
  timer: NodeJS.Timeout | null;
  judgeAbort: AbortController | null;
}

const rooms = new Map<string, Room>();
const socketToPlayer = new Map<string, { roomCode: string; playerId: string }>();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
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
      timer: null,
      judgeAbort: null
    };

    rooms.set(code, room);
    socketToPlayer.set(socket.id, { roomCode: code, playerId });
    socket.join(code);

    const token = result.events[0]?.token as string;
    ack?.({ success: true, roomCode: code, playerId, token });
  }));

  socket.on('join_room', wrap<{ roomCode: string; nickname: string; playerToken?: string }>((data, ack) => {
    if (!data || typeof data.roomCode !== 'string' || typeof data.nickname !== 'string') {
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
        ack?.({ success: true, reconnected: true, playerId: reconnected.playerId, token: data.playerToken, state: sanitizeState(room.state, reconnected.playerId) });
        return;
      }
    }

    // New join
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
    io.to(data.roomCode).emit('state_update', sanitizeStateForAll(room.state));
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
    io.to(player.roomCode).emit('state_update', sanitizeStateForAll(room.state));
    ack?.({ success: true });
  }));

  socket.on('spin_wheel', wrap<{}>((data, ack) => {
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

    const result = engine.spinWheel(room.state, player.playerId, seededRNG(), Date.now());
    if (result.error) {
      ack?.({ success: false, error: result.error });
      return;
    }

    room.state = result.state;
    io.to(player.roomCode).emit('state_update', sanitizeStateForAll(room.state));
    ack?.({ success: true });
  }));

  socket.on('place_bid', wrap<{ amount: number }>((data, ack) => {
    if (!data || typeof data.amount !== 'number') {
      ack?.({ success: false, error: 'Geçersiz miktar' });
      return;
    }

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

    const now = Date.now();
    const result = engine.placeBid(room.state, player.playerId, data.amount, now);
    if (result.error) {
      ack?.({ success: false, error: result.error });
      return;
    }

    room.state = result.state;

    // Handle timer extension
    if (room.state.phase === 'bidding' && room.state.turnStartTime) {
      const elapsed = now - room.state.turnStartTime;
      const remaining = BIDDING_TIMEOUT - elapsed;

      if (remaining < BID_EXTENSION_THRESHOLD) {
        // Cancel old timer and start new one
        if (room.timer) {
          clearTimeout(room.timer);
        }
        scheduleBiddingTimer(room, BID_EXTENSION_THRESHOLD);
      }
    } else if (room.state.phase === 'bidding') {
      // First bid, start bidding timer
      if (room.timer) {
        clearTimeout(room.timer);
      }
      scheduleBiddingTimer(room, BIDDING_TIMEOUT);
    }

    io.to(player.roomCode).emit('state_update', sanitizeStateForAll(room.state));
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
    io.to(player.roomCode).emit('state_update', sanitizeStateForAll(room.state));
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
    io.to(player.roomCode).emit('state_update', sanitizeStateForAll(room.state));
    ack?.({ success: true });
  }));

  socket.on('disconnect', () => {
    socketToPlayer.delete(socket.id);
  });
});

function scheduleOpeningTimer(room: Room) {
  if (room.timer) {
    clearTimeout(room.timer);
  }

  room.timer = setTimeout(() => {
    try {
      if (room.state.phase !== 'playing') return;

      const result = engine.timeoutBid(room.state, seededRNG(), Date.now());
      if (result.error) {
        console.error('Opening timeout error:', result.error);
        return;
      }

      room.state = result.state;

      if (room.state.phase === 'bidding') {
        scheduleBiddingTimer(room, BIDDING_TIMEOUT);
      }

      io.to(room.code).emit('state_update', sanitizeStateForAll(room.state));
    } catch (error) {
      console.error('Timer error:', error);
    }
  }, OPENING_TIMEOUT);
}

function scheduleBiddingTimer(room: Room, delay: number) {
  if (room.timer) {
    clearTimeout(room.timer);
  }

  room.timer = setTimeout(() => {
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

      io.to(room.code).emit('state_update', sanitizeStateForAll(room.state));
    } catch (error) {
      console.error('Timer error:', error);
    }
  }, delay);
}

function startJudging(room: Room) {
  if (room.judgeAbort) {
    room.judgeAbort.abort();
  }

  const abort = new AbortController();
  room.judgeAbort = abort;

  const timeoutId = setTimeout(() => {
    if (!abort.signal.aborted) {
      abort.abort();
    }
  }, JUDGE_TIMEOUT);

  judgeService.judge(room.state.players)
    .then(result => {
      clearTimeout(timeoutId);
      if (abort.signal.aborted) return;

      const engineResult = engine.setJudgeResult(room.state, result.ranking, result.commentary);
      if (engineResult.error) {
        console.error('Judge result error:', engineResult.error);
        const failResult = engine.setJudgeFailed(room.state);
        room.state = failResult.state;
      } else {
        room.state = engineResult.state;
      }

      io.to(room.code).emit('state_update', sanitizeStateForAll(room.state));
    })
    .catch(error => {
      clearTimeout(timeoutId);
      if (abort.signal.aborted) return;

      console.error('Judge error:', error);
      const failResult = engine.setJudgeFailed(room.state);
      room.state = failResult.state;
      io.to(room.code).emit('state_update', sanitizeStateForAll(room.state));
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

function sanitizeState(state: GameState, playerId: string): unknown {
  const player = state.players.find(p => p.id === playerId);
  return {
    ...state,
    wheel: state.wheel.length, // Only send count, not items
    players: state.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      gold: p.gold,
      slots: p.slots,
      isMe: p.id === playerId
    })),
    myToken: player?.token
  };
}

function sanitizeStateForAll(state: GameState): unknown {
  return {
    ...state,
    wheel: state.wheel.length, // Only send count, not items
    players: state.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      gold: p.gold,
      slots: p.slots
    }))
  };
}

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
