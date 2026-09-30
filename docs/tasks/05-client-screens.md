# Task 05: Client Screens (React + Design System)

**Date:** 30 September 2026  
**Manager:** ENI  
**Builder:** Fable 5.1, effort high  
**Priority:** HIGH (parallel with Tasks 06, 07)

---

## Builder

### Context
The game engine and server are complete. Now we build the React client UI following the design package in `docs/design/`. This task creates the three main screens: lobby, game, and results.

### Design Reference
Read `docs/design/DESIGN.md` completely before starting. Key elements:
- **Theme:** Game show + night market (royal blue, light beams, big wheel; lanterns, tile stars, onion dome cards)
- **Colors:** Saffron/Iznik turquoise/pomegranate red accents on deep blue base
- **Fonts:** Bungee (headings), Rubik (body)
- **Responsive:** Mobile-first, works on desktop too

### Architecture
- **Client location:** `client/` (currently a Vite + React placeholder)
- **Socket.IO client:** already in package.json, use `socket.io-client`
- **State management:** React hooks + socket event listeners (no Redux needed for now)
- **Routing:** React Router for 3 screens

### Files You Will Create/Modify
```
client/
├── src/
│   ├── screens/
│   │   ├── LobbyScreen.tsx       (NEW)
│   │   ├── GameScreen.tsx        (NEW)
│   │   └── ResultsScreen.tsx     (NEW)
│   ├── components/
│   │   ├── WheelDisplay.tsx      (NEW - visual only, no spin logic yet)
│   │   ├── PlayerList.tsx        (NEW)
│   │   ├── AuctionPanel.tsx      (NEW)
│   │   └── ItemCard.tsx          (NEW)
│   ├── hooks/
│   │   └── useSocket.ts          (NEW - socket connection + state sync)
│   ├── App.tsx                   (MODIFY - add routing)
│   ├── App.css                   (MODIFY - design system colors/fonts)
│   └── main.tsx                  (check, may not need changes)
```

### Screen 1: LobbyScreen.tsx

**Two modes: Create Room or Join Room**

**Create Room:**
- Input: nickname (1-16 chars)
- Button: "Create Room"
- On success: show room code (big, copyable), player list (just you), "Start Game" button (enabled when ≥2 players)

**Join Room:**
- Input: room code (4 chars, uppercase)
- Input: nickname (1-16 chars)
- Button: "Join Room"
- On success: show room, player list, wait for host to start

**Socket events to emit:**
- `create_room { nickname }`
- `join_room { roomCode, nickname }`
- `start_game {}`

**Socket events to listen:**
- `state_update` → if phase is 'playing', navigate to GameScreen

**Design notes:**
- Big logo/title at top
- Card-based layout (night market stall aesthetic)
- Room code in large Bungee font
- Player list shows nicknames only (no avatars yet - Task 06 will add them)

### Screen 2: GameScreen.tsx

**Layout (mobile-first, stacked vertical):**
1. **Top bar:** Room code, your gold (big number), your slots (3 cards)
2. **Wheel area:** WheelDisplay component (static circle for now, shows "X items left")
3. **Current item panel:** revealed item name + description (if phase is opening/bidding)
4. **Auction panel:** 
   - Opening phase: "Your turn to open" or "Alice is opening..." + countdown
   - Bidding phase: current highest bid, highest bidder name, your bid input + "Bid" button, countdown
   - Playing phase: "Alice is spinning..." or "Your turn" + "Spin Wheel" button
5. **Bottom:** PlayerList component (all players: nickname, gold, slot count)

**Socket events to emit:**
- `spin_wheel {}`
- `place_bid { amount }`

**Socket events to listen:**
- `state_update` → update all UI
- If phase is 'finished' or 'judge_failed', navigate to ResultsScreen

**Timers:**
Use `auctionEndsAt` and `openingEndsAt` timestamps from state to show countdown (calculate remaining seconds, update every 100ms).

**Validation:**
- Bid input: integer only, ≥ currentHighestBid + 1, ≤ your max allowed bid (state.players[you].maxBid)
- Disable bid button if you're the current highest bidder
- Disable spin button if it's not your turn

**Design notes:**
- Use design system colors (royal blue background, accent colors for bids/items)
- Item cards have onion dome top silhouette
- Countdown in large bold font, red when < 3s
- Gold displayed with coin icon (use emoji 🪙 for now)

### Screen 3: ResultsScreen.tsx

**Two modes: Finished or Judge Failed**

**Finished (phase = 'finished'):**
- Title: "The Bazaar is Closed!"
- Show ranking (state.ranking array):
  ```
  1st: Alice
     Reason: "She collected the best combo..."
  2nd: Bob
     Reason: "Solid picks but lacked synergy..."
  ```
- Show judge commentary (state.commentary) at bottom (large, centered, in a decorative box)
- If you're the host: "Play Again" button (emits `rematch`)

**Judge Failed (phase = 'judge_failed'):**
- Title: "The Judge is Confused!"
- Message: "Something went wrong with the ranking. The host can retry."
- If you're the host: "Retry Judge" button (emits `retry_judge`)

**Socket events to emit:**
- `rematch {}`
- `retry_judge {}`

**Socket events to listen:**
- `state_update` → if phase goes back to 'waiting', navigate to LobbyScreen

**Design notes:**
- Festive, celebratory colors for finished
- Ranking list in large cards, 1st place gets crown emoji 👑
- Commentary in a decorative tile-star border box

### useSocket.ts Hook

Create a custom hook that:
- Connects to server (localhost:3000 for dev, env var for prod)
- Listens to `state_update` and stores latest state in React state
- Provides `socket` object and `gameState` to components
- Handles reconnection: if you have a token in localStorage, emit `join_room` with `playerToken` on connect

**Example API:**
```typescript
const { socket, gameState, connected } = useSocket();

// Components use socket.emit() and read gameState
```

### Styling

**App.css - Design System:**
```css
:root {
  --color-bg: #0A1628; /* deep royal blue */
  --color-primary: #4169E1; /* royal blue */
  --color-accent-saffron: #F4C430;
  --color-accent-turquoise: #40E0D0;
  --color-accent-pomegranate: #C0392B;
  --font-heading: 'Bungee', cursive;
  --font-body: 'Rubik', sans-serif;
}

body {
  background: var(--color-bg);
  color: white;
  font-family: var(--font-body);
}

h1, h2 {
  font-family: var(--font-heading);
  color: var(--color-accent-saffron);
}

/* Add more as needed */
```

Import fonts in `index.html` from Google Fonts.

**Component styling:** Use CSS modules or styled-components (your choice), keep it simple for now. Inline styles are OK for rapid prototyping.

### Constraints

- **No character avatars yet** (Task 06 adds them later)
- **Wheel is static visual** (no spinning animation yet - just show "X items left")
- **No jokers** (future feature)
- **Works on localhost:5173 (Vite dev server), connects to localhost:3000 (game server)**
- Each screen is a separate commit
- Provide raw output (no "✓ done" summaries)

### Testing

After each screen:
1. Run `npm run dev` in client/
2. Manually test with 2 browser tabs:
   - Tab 1: Create room, start game
   - Tab 2: Join room
3. Play through one full game (6 auctions)
4. Verify phase transitions, timers, bid validation

### Expected Output

3 commits:
1. `Add LobbyScreen: create/join room UI`
2. `Add GameScreen: wheel, auction, player list`
3. `Add ResultsScreen: ranking and judge commentary`

Each commit includes the screen + any new components/hooks it needs.

---

## Audit

### Context
Builder created 3 React screens following the design system. Your job: verify they work, follow design, handle edge cases.

### Setup
```bash
cd C:\Users\lolse\Projects\BAZAAR-audit
git pull
```

### Tasks

#### 1. Read Commits
```bash
git log --oneline -3
git diff HEAD~3..HEAD --stat
```

Verify 3 commits for 3 screens.

#### 2. Code Review

**Design System:**
- Read `client/src/App.css`
- Are colors from DESIGN.md present? (royal blue, saffron, turquoise, pomegranate)
- Are fonts Bungee + Rubik?

**LobbyScreen:**
- Read `client/src/screens/LobbyScreen.tsx`
- Does it handle both create and join?
- Does it emit correct socket events?
- Does it navigate to GameScreen when phase is 'playing'?

**GameScreen:**
- Read `client/src/screens/GameScreen.tsx`
- Does it show wheel, item, auction panel, player list?
- Does it use `auctionEndsAt`/`openingEndsAt` for countdowns?
- Does it validate bids (integer, range, not highest bidder)?
- Does it navigate to ResultsScreen when phase is 'finished'?

**ResultsScreen:**
- Read `client/src/screens/ResultsScreen.tsx`
- Does it show ranking with reasons?
- Does it show commentary?
- Does it handle judge_failed case?

**useSocket hook:**
- Read `client/src/hooks/useSocket.ts`
- Does it connect to server?
- Does it listen to `state_update`?
- Does it handle reconnection with token?

#### 3. Manual Test

Start both server and client:

**Terminal 1 (server):**
```bash
cd C:\Users\lolse\Projects\BAZAAR-audit
npm run dev
```

**Terminal 2 (client):**
```bash
cd C:\Users\lolse\Projects\BAZAAR-audit\client
npm run dev
```

Open `http://localhost:5173` in 2 browser tabs.

**Test flow:**
1. Tab 1: Create room as "Alice"
   - Verify room code shown
   - Verify player list shows Alice
   - Verify Start button disabled

2. Tab 2: Join room as "Bob"
   - Verify both players in list
   - Verify Tab 1's Start button now enabled

3. Tab 1: Start game
   - Verify both tabs navigate to GameScreen
   - Verify wheel shows "40 items left"
   - Verify Alice sees "Your turn" / "Spin Wheel" button

4. Tab 1: Spin wheel
   - Verify revealed item appears
   - Verify opening countdown starts
   - Verify Alice can place opening bid

5. Tab 1: Bid 5
   - Verify bidding phase starts
   - Verify Bob can now bid
   - Verify Alice cannot bid (highest bidder)

6. Tab 2: Bid 6
   - Verify countdown extends to 5s
   - Verify Alice can bid again
   - Wait for countdown to expire

7. Verify Bob wins, pays 6 gold, gets item in slot
   - Verify gold updated on both tabs
   - Verify wheel shows "39 items left"

8. Complete 5 more auctions (alternate opener)
   - Verify timers work
   - Verify bid validation works
   - Verify slots fill up

9. Verify ResultsScreen appears
   - Verify ranking shown
   - Verify commentary shown
   - Verify "Play Again" button for Alice (host)

**Screenshot each screen and paste in report.**

#### 4. Edge Cases

- Try invalid bid (0, negative, decimal, too high)
  - Should be rejected or button disabled
- Try bidding when you're highest bidder
  - Button should be disabled
- Close and reopen tab during game
  - Should reconnect if token in localStorage

#### 5. Design Review

Compare visual output to `docs/design/DESIGN.md`:
- Colors match?
- Fonts match?
- Layout clean on mobile?
- Readable text?

### Report Format

```markdown
# Task 05 Audit Report

## 1. Commits
[paste git log]
[paste git diff --stat]

## 2. Code Review

### Design System (App.css)
Colors: OK / MISSING: ...
Fonts: OK / MISSING: ...

### LobbyScreen
Socket events: CORRECT / BUG: ...
Navigation: OK / BUG: ...

### GameScreen
Timers: WORKING / BUG: ...
Bid validation: WORKING / BUG: ...
Navigation: OK / BUG: ...

### ResultsScreen
Ranking: OK / BUG: ...
Commentary: OK / BUG: ...

### useSocket Hook
Connection: OK / BUG: ...
State sync: OK / BUG: ...
Reconnection: OK / NOT TESTED / BUG: ...

## 3. Manual Test

[Paste screenshot: LobbyScreen create room]
[Paste screenshot: GameScreen wheel + auction]
[Paste screenshot: ResultsScreen ranking]

Test flow: PASSED / FAILED AT STEP: ...

Issues found:
1. [description + screenshot]
2. ...

## 4. Edge Cases

Invalid bids: REJECTED / NOT VALIDATED / BUG: ...
Highest bidder cannot bid: DISABLED / BUG: ...
Reconnection: WORKING / NOT TESTED / BUG: ...

## 5. Design Review

Compared to DESIGN.md:
- Colors: MATCH / PARTIAL: ... / OFF: ...
- Fonts: MATCH / MISSING: ...
- Layout: CLEAN / CLUTTERED: ...
- Mobile: WORKS / ISSUES: ...

## 6. Summary

Screens: ALL WORKING / X BUGS: ...
Design: FOLLOWED / DEVIATIONS: ...
Polish needed: [list]

APPROVED FOR MERGE / REJECT: [reason]
```

### Constraints
- Do NOT edit any files
- Run manual test in audit repo (after git pull)
- Take real screenshots
- Report only verified facts
