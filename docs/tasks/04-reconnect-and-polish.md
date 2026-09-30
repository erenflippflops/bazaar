# Task 04: Reconnect Fix and Server Polish

**Date:** 30 September 2026  
**Manager:** ENI  
**Builder:** Fable 5.1, effort high  
**Auditor:** Opus 5.5, effort high

---

## Builder

### Context
Task 03 fixed the auction timer, integer bids, and judge timeout. Integration tests revealed a reconnect bug and need to verify timer broadcasts.

### Files You Will Touch
- `server/index.ts` (reconnect logic)
- `docs/GAME_RULES.md` (rule 5 update)

### Files You May Read
- `tests/integration/reconnect.test.ts`
- `server/engine/game.ts`

### Tasks

#### 1. Fix Reconnect: Token-Only Reconnection
**Problem:** `join_room` currently requires `nickname` even when `playerToken` is provided for reconnect. Rule 10 says "room code + token is enough" (nickname not required).

**Fix:** In `server/index.ts`, modify the `join_room` handler:
- When `playerToken` is provided and valid, do NOT require `nickname`
- Room code + valid token should be sufficient to reconnect
- The player's existing nickname is already in the room state

**Test:** `tests/integration/reconnect.test.ts` line 51 sends `{ roomCode, playerToken: token }` without nickname. This should succeed after your fix.

#### 2. Verify Timer Broadcasts
**Check:** Confirm that `auctionEndsAt` and `openingEndsAt` timestamps are included in `state_update` broadcasts during `opening` and `bidding` phases.

**Why:** Task 03 notes mentioned clients need these for countdown timers. Read `server/index.ts` `sanitizeStateForAll` and confirm these fields are present.

**If missing:** Add them to the sanitized state object.

#### 3. Update GAME_RULES.md
Add this sentence to Rule 5 (bidding rules), after the line about opening bid:

```
Teklifler tam sayıdır (küsuratlı teklifler kabul edilmez).
```

**Permission:** You have temporary permission to edit `docs/GAME_RULES.md` for this task only (normally docs/ is restricted).

### Constraints
- No changes to tests
- No changes to `server/engine/game.ts` (motor)
- Each fix is a separate, focused commit
- Provide raw output (no "✓ done" summaries)

### Expected Output
3 commits:
1. `Fix reconnect: allow token-only join without nickname`
2. `Verify/add timer broadcasts: auctionEndsAt, openingEndsAt` (or "Verify timer broadcasts already present" if no changes needed)
3. `Update GAME_RULES.md: add integer bid rule to rule 5`

---

## Audit

### Context
Builder fixed reconnect bug and verified timer broadcasts. Your job: verify the fixes work and no new bugs introduced.

### Setup
```bash
cd C:\Users\lolse\Projects\BAZAAR-audit
git pull
```

### Tasks

#### 1. Read Builder Commits
```bash
git log --oneline -5
git diff HEAD~3..HEAD
```

Verify 3 commits as expected.

#### 2. Run All Tests
```bash
npx vitest run
```

**Check:**
- `tests/integration/reconnect.test.ts` (3 tests) should now pass
- All 78 tests should pass (previously 21 failed | 57 passed)
- Report: `X passed | Y failed (78 total)`

#### 3. Code Review

**Reconnect fix:**
- Read the `join_room` handler in `server/index.ts`
- When `playerToken` is provided and found, does the code skip nickname validation?
- Does reconnect still return `{ success: true, reconnected: true, token, state }` as before?

**Timer broadcasts:**
- Read `sanitizeStateForAll` in `server/index.ts`
- During `opening` phase: is `openingEndsAt` included?
- During `bidding` phase: is `auctionEndsAt` included?
- If builder said "already present", verify the claim is true

**GAME_RULES.md:**
- Confirm the integer bid sentence was added to rule 5
- Check Turkish grammar is correct

#### 4. Reconnect Manual Test
Write a small manual test (NOT committed):

```typescript
// manual-reconnect-test.ts
import { startServer, connectClient, waitForConnect } from './tests/integration/helpers.js';

const server = await startServer(async () => '{"ranking":[],"commentary":"test"}');
const c1 = connectClient(server.port);
await waitForConnect(c1);
const room = await c1.emitWithAck('create_room', { nickname: 'Alice' });

const c2 = connectClient(server.port);
await waitForConnect(c2);
const join = await c2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'Bob' });
const token = join.token;

console.log('Bob disconnecting...');
c2.close();

console.log('Bob reconnecting with token only (no nickname)...');
const c2new = connectClient(server.port);
await waitForConnect(c2new);
const reconnect = await c2new.emitWithAck('join_room', { roomCode: room.roomCode, playerToken: token });

console.log('Reconnect result:', reconnect);
console.log('Bob still has nickname?', reconnect.state.players.find(p => p.nickname === 'Bob'));

await server.close();
```

Run: `npx tsx manual-reconnect-test.ts`

**Expected:** Bob reconnects successfully without sending nickname again.

### Report Format

```markdown
# Task 04 Audit Report

## 1. Commits
[paste git log --oneline -5]
[paste git diff --stat HEAD~3..HEAD]

## 2. Test Results
[paste vitest output summary line]

Pass/Fail: [all 78 passed? or X failed]

## 3. Code Review

### Reconnect Fix
[2-3 sentences: does it correctly allow token-only reconnect?]
[paste the relevant 5-10 lines of code]

### Timer Broadcasts
[2-3 sentences: are auctionEndsAt/openingEndsAt present?]
[paste the relevant sanitizeStateForAll section]

### GAME_RULES.md
[paste the new line added to rule 5]
[OK / Turkish grammar issue: ...]

## 4. Manual Reconnect Test
[paste output of manual test]

Result: [Bob reconnected successfully / failed with error: ...]

## 5. Summary
- Reconnect bug: FIXED / NOT FIXED / NEW BUG: ...
- Timer broadcasts: VERIFIED PRESENT / ADDED / MISSING: ...
- GAME_RULES.md: UPDATED / GRAMMAR ERROR: ...
- All tests: PASS / X FAILED: ...

APPROVED FOR MERGE / REJECT: [reason]
```

### Constraints
- Do NOT edit any files (read-only audit)
- Do NOT count anything manually
- Do NOT commit
- Report only verified facts from commands and file reads
