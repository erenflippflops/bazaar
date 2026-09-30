# Task 02 – Socket integration tests (spec)

Manager decision on Task 01: APPROVED (df86196, 80b57db, 0223b89).
Known issues found by reading server code (to be proven by tests below, not fixed yet):
- Judge timeout: startJudging's .catch returns early when aborted, and a judge that never
  settles never reaches .catch, so the phase stays "judging" forever instead of judge_failed.
- judgeResult.ts does not check: every player exactly once, ranks 1..n, non-empty reasons
  and commentary.

## Builder
1. Read the socket.io version in package.json. Install socket.io-client with the SAME major
   version as a devDependency (`npm install -D socket.io-client@<major>`).
2. Commit only package.json, package-lock.json and this task file:
   "Add socket.io-client dev dependency; add task 02"
3. Push. Paste RAW: git show --stat HEAD ; git status --short
Change nothing else.

## Audit
0. Your copy has uncommitted package.json/package-lock.json changes from the last smoke check.
   Run `git checkout -- package.json package-lock.json`, then `git pull`, then `npm install`.
   Paste `git status --short` (must be clean) and `git log --oneline -3`.

Write integration tests. Do NOT change any file outside tests/. Do NOT commit yet.
- Folder tests/integration/, one topic per file, plus tests/integration/helpers.ts.
- Use createServer({ port: 0, judge, timeScale: 0.1 }) from server/index.ts and
  socket.io-client. Scaled times: opening 2 s, auction 1 s, late-bid window 0.5 s, judge 3 s.
- Fake judges are async functions (players) => Promise<string> returning raw text.
- helpers.ts: start/close server, connect clients, emit-with-ack with a timeout,
  wait-for-state(predicate, timeout), and a recorder of EVERY message each client receives
  (event name, payload, timestamp). Every test closes its server and clients.
- Timing asserts use margins (e.g. "not before 0.8 s, by 1.6 s"). Set per-test timeouts.

### lobby.test.ts
- GET /health returns ok.
- 6 players join; the 7th is rejected. Join after start is rejected.
- Only the host can start; the host cannot start alone.

### fullGame.test.ts (valid fake judge)
- 2 players and 6 players play a whole game through sockets until the phase is finished:
  every player ends with 3 slots, gold never below 0, results contain every player.
- Wheel count at the end: 40 − 6 (2 players) and 40 − 18 (6 players).

### opening.test.ts
- After the opener spins, a non-opener's bid is rejected (ack error, state unchanged).
- Opener does nothing: after ~2 s the server spins and opens with 1 gold for the opener.
- Opener spins but does not bid: after ~2 s from the turn start the server opens with 1 gold,
  and the wheel shrank by exactly 1 (no second spin).
- Stale timer: opener spins and opens at once; after that auction resolves, the next opener
  does nothing. The auto-open for the next opener must come ~2 s after ITS turn started,
  not at the old timer's time.

### auctionTimer.test.ts
- No further bids: the auction resolves ~1 s after the opening bid (not before 0.8 s,
  by 1.6 s); the opener gets the item and pays the opening bid.
- Late bid at ~0.7 s: the auction does not resolve before ~1.1 s and resolves by ~1.7 s;
  the late bidder wins and pays exactly the bid.

### rules.test.ts
- Gold reserve: over-limit bid rejected via socket (ack error), state unchanged.
- Bid below current + 1 rejected; highest bidder cannot raise own bid.
- Non-integer (2.5), negative, zero after opening, string "5", null amount: all rejected,
  server keeps working.
- A player with 3 full slots cannot bid.

### robustness.test.ts
- Double actions sent at the same time: two start_game -> one start; two spin_wheel ->
  wheel shrinks by 1; the same bid twice -> one accepted.
- Malformed input on every event: no ack, null, number, string, array, missing fields,
  unknown event names. Afterwards /health is ok and a NEW room can play a full auction.
- Impersonation: a client sends place_bid with an extra playerId of another player;
  the bid must be booked to the sender (or rejected), never to the other player.

### reconnect.test.ts
- A player disconnects mid-game and rejoins with room code + token: same gold, slots,
  and turn position; the game continues.
- A wrong token does not take over any player.
- Tokens are secret: no message received by a client ever contains ANOTHER player's token.

### secrecy.test.ts
- Record all messages to all clients during a full 2-player game.
- No item name appears in any message before the message where it becomes the revealed item.
- Items never revealed during the game never appear in any message.

### judge.test.ts
- Valid JSON -> finished with ranking, reasons, commentary.
- Judge throws -> judge_failed.
- Invalid JSON text -> judge_failed.
- Judge never settles -> judge_failed within ~3 s + margin. (Expected RED today.)
- Valid JSON but: a player missing / a player twice / ranks not 1..n / empty reason /
  empty commentary -> judge_failed. (Expected RED today.)
- judge_failed: only the host can retry; retry with a valid judge answer -> finished.
- Rematch: only the host; afterwards same players, 20 gold, 3 empty slots, wheel 40.

### Report (max ~150 lines)
- `wc -l tests/integration/*` raw output.
- `npx vitest run --reporter=verbose` raw output (all files).
- For every RED test, one line: why it is red. It must be a real server behavior,
  not a test mistake. Say which reds match the known issues above and which are new.
- Run the full suite twice; paste both summary lines (flaky tests must be named).
- `git status --short` (only new files under tests/).
- ÖZET, ÖNERİ, no BUILDER DRAFT.
