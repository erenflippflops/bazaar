# Task 03 - Audit (Complete)

## Goal
Complete the audit of Task 03 (timer, integer bids, judge validation). Fix integration test bugs, run full test suite twice, perform sabotage tests, classify all failures as SERVER BUG or TEST BUG.

## Files you may change
- `tests/integration/*.test.ts` (fix protocol field names, secrecy test, reconnect test)
- Delete `tests/integration/probe_auction_bug.test.ts`
- NO OTHER FILES (especially not `server/`, `GAME_RULES.md`, `CLAUDE.md`)

## Builder
N/A (audit only)

## Audit
1. **Fix integration tests:**
   - `join_room` events: change `{code}` → `{roomCode}`
   - State updates: change `currentItem` → `revealedItem`
   - Judge result field: use actual field name from `engine.setJudgeResult()` (not `results`)
   - Secrecy test: search for all 40 theme item names in every `state_update` message JSON (not just wheel array)
   - Reconnect test: remove `nickname` requirement when `playerToken` is provided (test should pass after fix)
   - Delete `tests/integration/probe_auction_bug.test.ts`

2. **Run tests twice:** `npx vitest run` after fixes, capture full output both times

3. **Sabotage tests (a-d):**
   Run each on a temporary branch, revert after capturing output:
   - a) Comment out auction timer setup after opening bid (should freeze game)
   - b) Remove integer bid validation (should allow 2.5 gold bids)
   - c) Remove player count check in judge result validation (should accept incomplete rankings)
   - d) Remove judge timeout transition to `judge_failed` (should stay in `judging` forever)

4. **Classify every red test:**
   For each failing test after fixes:
   - SERVER BUG: quote the exact file:line causing the failure
   - TEST BUG: explain what's wrong with the test

5. **Reconnect SERVER BUG:**
   Current: `join_room` requires `nickname` even with valid `playerToken`
   Expected: Rule 10 says "room code + secret token is enough (nickname not needed)"
   Quote the server code enforcing nickname with playerToken

## Commit messages
N/A (test-only task, manager commits after merge)

## Report
Provide in this order:
1. Test output #1 (after fixes): count green/red
2. Test output #2 (verify stability): count green/red, note any flakes
3. Sabotage results: for each (a-d), did it catch the bug? (yes/no + which tests failed)
4. Classification table: all red tests with SERVER BUG (file:line) or TEST BUG
5. Reconnect SERVER BUG: exact server code location requiring nickname
