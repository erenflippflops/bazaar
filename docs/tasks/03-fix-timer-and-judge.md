# Task 03 – Fix auction timer, whole-number bids, judge timeout, judge validation

Context: the integration tests in tests/integration/ (committed by the auditor) are the spec.
They are RED because of these server bugs. Make them green by fixing the SERVER.

## Builder
0. `git pull`. Do not edit anything under tests/ or docs/ (except committing this task file).

1. Auction timer (server/index.ts; you may move timer logic into its own file, e.g.
   server/roomTimers.ts). Today the place_bid handler computes `elapsed` after
   engine.placeBid set turnStartTime = now, so no auction timer is ever scheduled after a
   MANUAL opening bid, and the late-bid extension never triggers. Required behavior
   (rule 5 of docs/GAME_RULES.md):
   - When the opening bid is placed (by the opener or by the auto-open), clear the opening
     timer and schedule the auction end at now + 10 s (× timeScale).
   - On each later accepted bid: if less than 5 s (× timeScale) remain until the auction end,
     move the end to now + 5 s. Otherwise keep the current end.
   - Use one stored deadline per room. A timer that belongs to an old auction must never
     affect a newer one.
   - Add the deadline to the public state as `auctionEndsAt` (epoch ms, null when no auction
     runs) and the opener deadline as `openingEndsAt`, for the screens later.
   Commit: "Fix auction timer: schedule on opening bid, extend late bids"

2. Whole-number bids: engine placeBid rejects any amount that is not an integer
   (Number.isInteger), for opening and regular bids. Commit: "Reject non-integer bids"

3. Judge timeout: when the judge does not answer within 30 s (× timeScale), the phase becomes
   judge_failed and the state is broadcast. An answer that arrives after the timeout is
   ignored. A judge promise that never settles must not block this.
   Commit: "Judge timeout leads to judge_failed"

4. Judge validation (server/judgeResult.ts): reject (-> judge_failed) unless every player
   appears exactly once, ranks are exactly 1..n each once, every reason is a non-empty
   string and commentary is a non-empty string. Commit: "Validate judge result strictly"

5. Also commit this task file in the first commit. Push after all four commits.
   Do not change the model name or the judge prompt.

Report, RAW output only:
   git log --oneline -6
   git diff --stat HEAD~4
   npx vitest run --reporter=verbose
If some integration tests are still RED, paste them and stop. Do not touch tests.

## Audit
1. `git pull`. Paste `git log --oneline -6` and `git diff --stat HEAD~4`.
   Flag any change under tests/, docs/GAME_RULES.md, the model name or the judge prompt.
2. Full diff of server/ for the four commits. Check each fix against the Builder section.
3. `npx vitest run --reporter=verbose` twice; paste both summary lines and every failure.
4. Every RED test that remains: SERVER BUG (which) or TEST BUG. Test bugs you may fix now
   (tests/ only), then rerun; list each test change with the reason.
   The judge tests could not run before this fix, so check them carefully.
5. Sabotage, one at a time, restore after each, paste the failing test names:
   a) do not schedule the auction end after the opening bid
   b) remove the integer check
   c) accept a judge result with one player missing
   d) remove the judge timeout handling
   Then `git status --short` (clean, or only your test fixes).
6. Do NOT commit test changes; the manager reviews them first.
Max ~120 lines.
