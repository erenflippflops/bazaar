# Task 15 – Complete the gameplay

## Goal
Fix same-browser two-tab bug (sessionStorage), add pass rule, timer +3s change, briefing screen, opening countdown fix, version stamps, and human-play E2E tests with autoPlay: false.

## File Ownership Split

### Builder 1: Engine core (pass rule)
**Files:**
- server/engine/types.ts
- server/engine/game.ts (passBid, isOutOfAuction, isAuctionSettled functions)

**Work:**
1. Add `passedPlayerIds: string[]` to GameState
2. Implement `passBid(state, playerId)` function
3. Implement `isOutOfAuction(state, player)` helper
4. Implement `isAuctionSettled(state)` helper
5. Reset passedPlayerIds when auction starts and ends

### Builder 2: Server integration (pass + settle + timer fix)
**Files:**
- server/index.ts (socket handlers, timer logic)
- server/roomTimers.ts (timer +3s change, opening countdown fix)

**Work:**
1. Add `pass_bid` socket event handler
2. After every bid/pass/auto-open: check `isAuctionSettled()` and resolve immediately if true
3. Change timer extension from "reset to 5s" to "add 3s" in extendAuctionIfNeeded
4. Fix opening countdown: store `openingEndTime` in TimerState, send that instead of recalculating

### Builder 3: Client identity fix + pass UI
**Files:**
- client/src/hooks/useSocket.ts
- client/src/screens/LobbyScreen.tsx
- client/src/screens/GameScreen.tsx
- client/src/components/AuctionPanel.tsx
- client/src/components/PlayerList.tsx

**Work:**
1. Replace all localStorage with sessionStorage for playerId, playerToken, roomCode
2. Add "PAS" button in AuctionPanel (bidding phase, not highest bidder, not out)
3. Show "Pas dedin" after passing
4. Show PAS badge on passed players in PlayerList
5. Show "Herkes pas dedi – SATILDI!" when settled

### Builder 4: Briefing screen + version stamps
**Files:**
- server/engine/types.ts (add 'briefing' phase)
- server/engine/game.ts (add briefing logic)
- server/index.ts (briefing socket handler, /health endpoint for commit SHA)
- client/src/screens/BriefingScreen.tsx (new file)
- client/src/App.tsx (route for briefing)
- client/src/components/Footer.tsx (new file, version stamp)

**Work:**
1. Add 'briefing' phase to types
2. After start_game, enter briefing phase with 15s timer
3. Socket event `ready_briefing`, ends when all ready or timeout
4. BriefingScreen: "Nasıl oynanır" with 5-6 rules, "Hazırım" button, "?" button in header
5. Footer with VITE_COMMIT_SHA from env
6. /health returns server commit SHA from RENDER_GIT_COMMIT

## Audit
Auditor writes all tests FIRST before builders start:

**Files:**
- tests/engine/pass.test.ts (unit tests for pass rule)
- tests/integration/pass.test.ts (integration tests S1, S2, edge cases)
- tests/integration/timer.test.ts (update for +3s)
- tests/e2e/human-play.spec.ts (new: same-browser two-tab, autoPlay: false)
- tests/e2e/helpers.ts (update for new UI)
- server/index.ts (add autoPlay option to createServer)

**Scenarios:**
- S1: P1 opens 1; P2, P3, P4 pass -> ends at once, P1 pays 1
- S2: P1 opens 1; P3 bids 15; P1, P2, P4 pass -> ends at once, P3 pays 15
- Edge: passed player's bid rejected, highest bidder cannot pass, full slots count as passed, pass in opening rejected
- Sabotage: settle check removed, sessionStorage reverted to localStorage (two-tab test fails), +3s reverted

## Commit messages
- Builder 1: "Task 15: Add pass rule to engine core"
- Builder 2: "Task 15: Integrate pass rule and fix timers"
- Builder 3: "Task 15: Fix sessionStorage identity and add pass UI"
- Builder 4: "Task 15: Add briefing screen and version stamps"
- Auditor: "Task 15: Add tests for pass rule and human play"

## Report
After all merged: "Task 15 tamamlandı. sessionStorage düzeltmesi, pas butonu, brifing ekranı ve insan oynatma testleri eklendi. SHA: [commit]. İnsan tarafından oynanmaya hazır."
