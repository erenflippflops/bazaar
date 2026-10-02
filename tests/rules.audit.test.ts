import { describe, it, expect } from 'vitest';
import * as engine from '../server/engine/game.js';
import type { Item, RNG } from '../server/engine/types.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const superpowers: Item[] = JSON.parse(
  readFileSync(join(__dirname, '../server/superpowers.json'), 'utf-8')
);

function seededRNG(seed: number): RNG {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('Rule 1: Room', () => {
  it('first player is host', () => {
    const rng = seededRNG(1);
    const result = engine.createGame('host-id', 'Host', superpowers, rng);
    expect(result.state.hostId).toBe('host-id');
    expect(result.state.players[0].id).toBe('host-id');
    expect(result.state.players[0].nickname).toBe('Host');
  });

  it('6 players can join; a 7th is rejected', () => {
    const rng = seededRNG(2);
    let result = engine.createGame('p1', 'P1', superpowers, rng);
    let state = result.state;

    for (let i = 2; i <= 6; i++) {
      result = engine.joinGame(state, `p${i}`, `P${i}`, rng);
      expect(result.error).toBeUndefined();
      state = result.state;
    }

    expect(state.players.length).toBe(6);

    result = engine.joinGame(state, 'p7', 'P7', rng);
    expect(result.error).toBe('Oda dolu (maksimum 6 oyuncu)');
  });

  it('nickname "" and 17 chars rejected; 1 and 16 chars accepted', () => {
    const rng = seededRNG(3);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    // Empty nickname
    result = engine.joinGame(state, 'p1', '', rng);
    expect(result.error).toBe('İsim 1-16 karakter olmalı');

    // 17 chars
    result = engine.joinGame(state, 'p2', '12345678901234567', rng);
    expect(result.error).toBe('İsim 1-16 karakter olmalı');

    // 1 char
    result = engine.joinGame(state, 'p3', 'A', rng);
    expect(result.error).toBeUndefined();
    state = result.state;

    // 16 chars
    result = engine.joinGame(state, 'p4', '1234567890123456', rng);
    expect(result.error).toBeUndefined();
  });

  it('duplicate nickname in same room rejected', () => {
    const rng = seededRNG(4);
    let result = engine.createGame('host', 'Alice', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'Bob', rng);
    state = result.state;

    result = engine.joinGame(state, 'p3', 'Alice', rng);
    expect(result.error).toBe('Bu isim zaten kullanılıyor');
  });

  it('join after start rejected', () => {
    const rng = seededRNG(5);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    result = engine.joinGame(state, 'p3', 'P3', rng);
    expect(result.error).toBe('Oyun zaten başladı, katılamazsın');
  });

  it('non-host cannot start; host cannot start with 1 player; host starts with 2', () => {
    const rng = seededRNG(6);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    // Host with 1 player
    result = engine.startGame(state, 'host', superpowers, rng);
    expect(result.error).toBe('En az 2 oyuncu gerekli');

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    // Non-host tries to start
    result = engine.startGame(state, 'p2', superpowers, rng);
    expect(result.error).toBe('Sadece host oyunu başlatabilir');

    // Host starts with 2
    result = engine.startGame(state, 'host', superpowers, rng);
    expect(result.error).toBeUndefined();
    expect(result.state.phase).toBe('briefing');
  });
});

describe('Rule 2: Start', () => {
  it('after start every player has 20 gold and 3 empty slots', () => {
    const rng = seededRNG(7);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    for (let i = 2; i <= 4; i++) {
      result = engine.joinGame(state, `p${i}`, `P${i}`, rng);
      state = result.state;
    }

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    state.players.forEach(p => {
      expect(p.gold).toBe(20);
      expect(p.slots).toEqual([null, null, null]);
    });
  });
});

describe('Rule 4: Opening Order', () => {
  it('opening bid 0 rejected; 1 accepted', () => {
    const rng = seededRNG(8);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    result = engine.startPlaying(state);
    state = result.state;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    // Bid 0
    result = engine.placeBid(state, 'host', 0, 1000);
    expect(result.error).toBe('En az 1 altın teklif etmelisin');

    // Bid 1
    result = engine.placeBid(state, 'host', 1, 1000);
    expect(result.error).toBeUndefined();
  });

  it('3 players, P3 has 3 full slots: after P2 turn the next opener is P1', () => {
    const rng = seededRNG(9);
    let result = engine.createGame('p1', 'P1', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;
    result = engine.joinGame(state, 'p3', 'P3', rng);
    state = result.state;

    result = engine.startGame(state, 'p1', superpowers, rng);
    state = result.state;

    result = engine.startPlaying(state);
    state = result.state;

    // Fill P3's slots manually
    const p3 = state.players.find(p => p.id === 'p3')!;
    p3.slots = [superpowers[0], superpowers[1], superpowers[2]];

    // P1 turn
    result = engine.spinWheel(state, 'p1', rng, 1000);
    state = result.state;
    result = engine.placeBid(state, 'p1', 1, 1000);
    state = result.state;
    result = engine.resolveBid(state);
    state = result.state;

    // P2 turn
    expect(state.players[state.currentOpenerIndex].id).toBe('p2');
    result = engine.spinWheel(state, 'p2', rng, 2000);
    state = result.state;
    result = engine.placeBid(state, 'p2', 1, 2000);
    state = result.state;
    result = engine.resolveBid(state);
    state = result.state;

    // Next should be P1 (skipping P3)
    expect(state.players[state.currentOpenerIndex].id).toBe('p1');
  });

  it('next opener follows the previous OPENER, not the auction winner', () => {
    const rng = seededRNG(10);
    let result = engine.createGame('p1', 'P1', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;
    result = engine.joinGame(state, 'p3', 'P3', rng);
    state = result.state;

    result = engine.startGame(state, 'p1', superpowers, rng);
    state = result.state;

    result = engine.startPlaying(state);
    state = result.state;

    // P1 opens
    result = engine.spinWheel(state, 'p1', rng, 1000);
    state = result.state;
    result = engine.placeBid(state, 'p1', 1, 1000);
    state = result.state;

    // P3 outbids
    result = engine.placeBid(state, 'p3', 2, 1100);
    state = result.state;
    result = engine.resolveBid(state);
    state = result.state;

    // Next opener should be P2 (after P1), not P3 (winner)
    expect(state.players[state.currentOpenerIndex].id).toBe('p2');
  });
});

describe('Rule 5: Bidding', () => {
  it('a player with 3 full slots cannot bid', () => {
    const rng = seededRNG(11);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    result = engine.startPlaying(state);
    state = result.state;

    // Fill P2's slots
    const p2 = state.players.find(p => p.id === 'p2')!;
    p2.slots = [superpowers[0], superpowers[1], superpowers[2]];

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    result = engine.placeBid(state, 'p2', 5, 1000);
    expect(result.error).toBe('Slotların dolu');
  });

  it('nobody raises: the opener gets the item and pays exactly the opening bid', () => {
    const rng = seededRNG(12);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    result = engine.startPlaying(state);
    state = result.state;

    const initialGold = state.players[0].gold;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    const revealedItem = state.revealedItem!;

    result = engine.placeBid(state, 'host', 3, 1000);
    state = result.state;

    result = engine.resolveBid(state);
    state = result.state;

    const host = state.players.find(p => p.id === 'host')!;
    expect(host.gold).toBe(initialGold - 3);
    expect(host.slots.filter(s => s !== null).length).toBe(1);
    expect(host.slots.find(s => s?.name === revealedItem.name)).toBeDefined();
  });

  it("winner's gold drops by exactly the winning bid; others' gold unchanged", () => {
    const rng = seededRNG(13);
    let result = engine.createGame('p1', 'P1', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;
    result = engine.joinGame(state, 'p3', 'P3', rng);
    state = result.state;

    result = engine.startGame(state, 'p1', superpowers, rng);
    state = result.state;

    result = engine.startPlaying(state);
    state = result.state;

    const p1Gold = state.players[0].gold;
    const p2Gold = state.players[1].gold;
    const p3Gold = state.players[2].gold;

    result = engine.spinWheel(state, 'p1', rng, 1000);
    state = result.state;
    result = engine.placeBid(state, 'p1', 2, 1000);
    state = result.state;
    result = engine.placeBid(state, 'p2', 5, 1100);
    state = result.state;
    result = engine.resolveBid(state);
    state = result.state;

    const p1 = state.players.find(p => p.id === 'p1')!;
    const p2 = state.players.find(p => p.id === 'p2')!;
    const p3 = state.players.find(p => p.id === 'p3')!;

    expect(p2.gold).toBe(p2Gold - 5);
    expect(p1.gold).toBe(p1Gold);
    expect(p3.gold).toBe(p3Gold);
  });
});

describe('Rule 6: Gold Reserve', () => {
  it('opening bid: 20 gold, 3 empty slots -> 18 accepted, 19 rejected', () => {
    const rng = seededRNG(14);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    result = engine.startPlaying(state);
    state = result.state;

    result = engine.spinWheel(state, 'host', rng, 1000);
    state = result.state;

    // 19 rejected
    result = engine.placeBid(state, 'host', 19, 1000);
    expect(result.error).toBe('Maksimum 18 altın teklif edebilirsin');

    // 18 accepted
    result = engine.placeBid(state, 'host', 18, 1000);
    expect(result.error).toBeUndefined();
  });
});

describe('Rule 9: Rematch', () => {
  it('non-host cannot rematch', () => {
    const rng = seededRNG(15);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    // Simulate finished game
    state.phase = 'finished';

    result = engine.rematch(state, 'p2', superpowers, rng);
    expect(result.error).toBe('Sadece host revanche başlatabilir');
  });

  it('after rematch: same players in same order, 20 gold each, 3 empty slots, wheel has all 40 items, phase is playing', () => {
    const rng = seededRNG(16);
    let result = engine.createGame('host', 'Host', superpowers, rng);
    let state = result.state;

    result = engine.joinGame(state, 'p2', 'P2', rng);
    state = result.state;
    result = engine.joinGame(state, 'p3', 'P3', rng);
    state = result.state;

    result = engine.startGame(state, 'host', superpowers, rng);
    state = result.state;

    const playerOrder = state.players.map(p => p.id);

    // Modify state to simulate game in progress
    state.players[0].gold = 5;
    state.players[0].slots[0] = superpowers[0];
    state.phase = 'finished';

    result = engine.rematch(state, 'host', superpowers, rng);
    state = result.state;

    expect(state.phase).toBe('briefing');
    expect(state.players.map(p => p.id)).toEqual(playerOrder);
    expect(state.wheel.length).toBe(40);

    state.players.forEach(p => {
      expect(p.gold).toBe(20);
      expect(p.slots).toEqual([null, null, null]);
    });
  });
});
