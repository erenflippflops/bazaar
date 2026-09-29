# Bazaar - Game Rules

This file is the source of truth for all game logic.

## Overview
A party game for 2-6 friends: players take turns opening auctions for hidden items revealed by a wheel, fill 3 slots with 20 gold, and at the end an AI judge ranks everyone's collection and explains why. First theme: superpowers.

## Rules

### 1. Room
- 2-6 players, no bots
- The creator is the host
- Only the host can start the game, requires >= 2 players
- Players can join only before start
- Nicknames: 1-16 characters, unique in the room

### 2. Start
- Every player has 20 gold and 3 empty slots

### 3. Deck
- The theme's item list (about 40 superpowers, Turkish names + one short Turkish description each, in a data file) is shuffled per game
- The wheel always holds the next 6 items of the deck, all HIDDEN
- Spinning picks one of the 6 at random and reveals it
- That item leaves the deck, the other 5 stay
- **The wheel shrinks and does not refill** (6→5→4...)

### 4. Opening Order
- Players in join order (P1..Pn), cycling
- A player with 3 filled slots is skipped
- The player whose turn it is spins the wheel and MUST place an opening bid of at least 1 gold
- If they do not act within 20 seconds, the server spins (if needed) and places 1 gold for them

### 5. Bidding
- After the opening bid, every player with an empty slot may bid
- A bid must be at least current highest + 1
- The current highest bidder cannot raise their own bid
- Timer: 10 seconds
- A bid made with less than 5 seconds left sets the remaining time to 5 seconds
- When the timer ends, the highest bidder pays and gets the item into an empty slot
- If nobody outbids, the opener gets it

### 6. Gold Reserve
- A player can never bid more than `gold - (emptySlots - 1)`
- This ensures every remaining empty slot can still be filled for at least 1 gold
- The opening bid follows the same limit

### 7. End of Auction
- When every player has 3 filled slots, the game goes to the judge phase

### 8. Judge
- The server calls the Anthropic Messages API:
  - Model: `claude-haiku-4-5-20251001`
  - API key: ONLY from the server env var `ANTHROPIC_API_KEY`, never sent to the client
- It sends every player's nickname and items (name + description)
- It asks for STRICT JSON:
  ```json
  {
    "ranking": [
      { "player": "<nickname>", "rank": 1, "reason": "<2-3 Turkish sentences>" }
    ],
    "commentary": "<short, funny Turkish closing line>"
  }
  ```
- Validate the JSON (every player exactly once, ranks 1..n)
- On timeout (30 seconds), API error or invalid JSON: phase "judge_failed"
- The host can press retry
- The server must never crash

### 9. Result
- Ranking, reasons and commentary are shown to everyone
- The host can start a rematch: same players, fresh gold, slots and deck

### 10. Reconnect
- On join, the server gives each player a secret `playerToken`
- A client that reconnects with room code + playerToken gets its seat back (same slots, gold, turn)
- A player without a valid token can never act for another player

### 11. GAME_TIME_SCALE
- Environment variable, default 1
- Must be a number > 0, otherwise defaults to 1
- Multiplies every timer
- Tests use 0.1
