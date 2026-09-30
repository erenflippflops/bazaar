# Task 04 - Judge Error Handling

## Goal
Fix judge validation errors not transitioning to judge_failed state. Currently parseAndValidateJudgeResponse throws exceptions that don't reach the error handler.

## Files you may change
- `server/index.ts` (judge error handling)
- `server/judgeResult.ts` (validation function)

## Builder
**Problem:** 6 tests fail because validation errors don't trigger judge_failed transition:
- invalid JSON text
- player missing from ranking
- player appears twice
- ranks not 1..n (e.g., 1, 3 missing 2)
- empty reason text
- empty commentary

**Root cause:** server/index.ts:401 calls parseAndValidateJudgeResponse in a .then() block. When it throws, the catch block at lines 413-422 doesn't catch it properly.

**Solution options:**
1. Wrap parseAndValidateJudgeResponse call in try-catch
2. Make parseAndValidateJudgeResponse return {success: true, result} | {success: false, error} instead of throwing
3. Move validation into the Promise chain properly

Choose the cleanest approach. All 6 validation error tests must pass after the fix.

**Do NOT:**
- Change test files (tests/ is read-only for builders)
- Change GAME_RULES.md or CLAUDE.md
- Add integer validation (that's separate, already done in Task 03)
- Change reconnect logic (no bug there)

## Audit
N/A (builder-only task)

## Commit messages
- "Fix judge validation error handling to transition to judge_failed"

## Report
1. Approach chosen (which solution)
2. Files modified with line numbers
3. Test output: `npx vitest run tests/integration/judge.test.ts`
4. All 11 judge tests should pass (currently 5 pass, 6 fail)
