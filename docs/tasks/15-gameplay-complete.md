# Task 15 – Complete the gameplay (do without asking Eren; Eren approved every rule below)

Order of work: Tasks 15 -> 16 (themes) -> 17 (languages) -> 18 (UI polish). Do not start 16
before 15 passes its human-play check.

## Why this task exists (read first)
Eren played the live game in two tabs of the SAME browser: the opener had no spin button,
the server auto-spun after 20 s, the item went to P1 without an auction, and later both
tabs showed "Senin sıran" / "En yüksek teklif senin". All e2e tests were green. Two causes:
1. The client stores `playerId` / `playerToken` / `roomCode` in localStorage, which is SHARED
   by all tabs of a browser, so both tabs think they are the last player who joined.
   Tests never saw it because every test player had an isolated browser context.
2. The server auto-spins and auto-opens on timeouts, so a game "reaches the results screen"
   even if no human can press anything. "The game finished" proves nothing.

## Definition of done for every UI/gameplay task from now on: HUMAN PLAY
A task is done only when an e2e "human run" passes with ALL of these conditions:
- Two (and in a second run four) players in **tabs of the same browser context**, plus one
  run with separate contexts. Viewports: 1536x730 and 2576x1002 (Eren's screens), 390x844.
- The server runs with a new test-only option `autoPlay: false` (createServer option; never
  set in main.ts) that disables auto-spin and auto-open. If the UI does not let a human act,
  the game stalls and the test fails.
- Every action is a real click on what a human sees (wheel, buttons), checked with
  `elementFromPoint` at the element's center (not covered) and inside the viewport.
- Every step asserts what EACH tab shows: only the opener sees the spin controls; others see
  "<name> çarkı çeviriyor"; all tabs show the same top bid, timer and item.
- Zero browser console errors.
Plus: the outside manager plays the LIVE site after deploy and approves. Agents never call a
task done on their own.

## Build (Fable builders; disjoint files; one commit per item)
1. Apply docs/tasks/14-ui-wheel-oneclick.patch first (canvas wheel with spin animation,
   clickable wheel/hub/button, one-click +1/+2/+5 bids, MEZAT counter, phone item card,
   big-screen scaling, grey disabled buttons). `git apply --3way`; keep its behavior.
2. Per-tab identity: store playerId, playerToken, roomCode in **sessionStorage** (per tab;
   survives reload of that tab). Remove all localStorage use for identity. A reload must
   still reconnect to the same player.
3. Pass rule (engine, server/engine/game.ts; GAME_RULES.md rule 5 updated with Eren's text):
   - During `bidding`, any player except the current highest bidder may PASS. A pass is final
     for that auction (a passed player cannot bid again until the next auction).
   - A player is automatically out if they have no empty slot or their max bid is below
     current + 1.
   - When every player except the highest bidder is out (passed or automatic), the auction
     ends IMMEDIATELY (no countdown) and the highest bidder wins.
   - The opening bid stays mandatory: no pass in `opening`.
   - State: `passedPlayerIds: string[]`, reset when an auction starts and ends. New engine
     functions `passBid(state, playerId)`, `isOutOfAuction`, `isAuctionSettled`.
   - Server: new socket event `pass_bid` (ack like place_bid). After every accepted bid,
     pass, or auto-open: if `isAuctionSettled`, clear the auction timer and resolve now.
   - Scenarios that must be unit + integration tested (4 players):
     S1: P1 opens 1; P2, P3, P4 pass -> auction ends at once, P1 pays 1.
     S2: P1 opens 1; P3 bids 15; P1, P2, P4 pass -> ends at once, P3 pays 15.
     Also: a passed player's bid is rejected; the highest bidder cannot pass; a player with
     full slots counts as passed; pass in `opening` is rejected.
4. Timer rule change: a bid in the last 5 s ADDS 3 s to the remaining time (2 s left -> 5 s).
   Replace "reset to 5 s" in server/roomTimers.ts. Update GAME_RULES.md rule 5.
5. Opening countdown bug: `openingEndsAt` is sent as `Date.now() + OPENING_TIMEOUT` on every
   broadcast, so the countdown restarts. Store the real opening end time in TimerState
   (`openingEndTime`) and send that.
6. Briefing screen: after the host starts, a new phase `briefing` shows "Nasıl oynanır"
   (5-6 short lines: spin, opening bid, +1/+2/+5, pas, gold limit, judge) to everyone with a
   "Hazırım" button. It ends when all players pressed Hazırım or after 15 s (× timeScale);
   then the first turn starts. Also a "?" button in the game header reopens the rules.
7. UI for pass: a big "PAS" button next to the bid buttons during `bidding` for players who
   are not the highest bidder and not out. After passing, show "Pas dedin"; show a PAS badge
   on passed players in the player list; show "Herkes pas dedi – SATILDI!" when it settles.
8. Version stamp: show the short commit SHA in a small footer (Vercel env
   VITE_COMMIT_SHA from VERCEL_GIT_COMMIT_SHA) and return the server's commit
   (RENDER_GIT_COMMIT) in GET /health. The outside manager uses this to know what is live.

## Audit (auditor writes all tests; builders never edit tests/)
- Unit + integration tests for 3, 4, 5, 6 (incl. S1, S2 and the edge cases).
- E2E human runs as defined above, with the `autoPlay: false` server.
- Update existing e2e tests to the new UI (wheel click, one-click bids, briefing phase).
- One sabotage each for: settle check removed, sessionStorage reverted to localStorage
  (the same-browser two-tab run must fail), +3 s reverted.

## Finish
Push after every merge. Report to Eren in short Turkish: what changed, the live commit SHA,
and "hazır, dışarıdan oynanarak kontrol edilmeyi bekliyor". Do not say "done".
