# Task 05: E2E Testing with Playwright

**Date:** 30 September 2026  
**Manager:** ENI  
**Builder:** Fable 5.1  
**Auditor:** Opus 5.5

---

## Goal
Set up end-to-end browser testing so Eren doesn't need to manually test every change. Tests run real browsers, catch console errors, and take screenshots for visual verification.

---

## Builder

### Setup

Install Playwright with Chromium only:
```bash
npm install -D playwright @playwright/test
npx playwright install chromium
```

### Files you may change

**New files:**
- `tests/e2e/fullGame.spec.ts` - main E2E test suite
- `tests/e2e/helpers.ts` - shared test utilities
- `playwright.config.ts` - Playwright configuration

**Modified:**
- `package.json` - add `test:e2e` script

### Test Infrastructure

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev:e2e',
    port: 5200,
    reuseExistingServer: false,
    timeout: 30000,
  },
});
```

**package.json scripts (add these):**
```json
{
  "dev:e2e": "concurrently \"PORT=3100 npm run dev:server\" \"cd client && vite --port 5200 --strictPort\"",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

Ports for E2E: server 3100, client 5200 (different from dev ports 3000/5176 to avoid conflicts).

### Test Helpers (tests/e2e/helpers.ts)

```typescript
import { Page, expect } from '@playwright/test';

export async function createRoom(page: Page, nickname: string) {
  await page.goto('/');
  await page.fill('input[placeholder*="isim" i]', nickname);
  await page.click('button:has-text("Oda Kur")');
  
  // Wait for room code to appear
  await expect(page.locator('text=/[A-Z]{4}/')).toBeVisible({ timeout: 5000 });
  const roomCodeText = await page.locator('text=/[A-Z]{4}/').textContent();
  const roomCode = roomCodeText?.match(/[A-Z]{4}/)?.[0];
  
  if (!roomCode) throw new Error('Room code not found');
  return roomCode;
}

export async function joinRoom(page: Page, roomCode: string, nickname: string) {
  await page.goto('/');
  await page.click('button:has-text("Oda Katıl")');
  await page.fill('input[placeholder*="kod" i]', roomCode);
  await page.fill('input[placeholder*="isim" i]', nickname);
  await page.click('button:has-text("Katıl")');
  
  // Wait for player list
  await expect(page.locator(`text="${nickname}"`)).toBeVisible({ timeout: 5000 });
}

export async function startGame(page: Page) {
  await page.click('button:has-text("Oyunu Başlat")');
  await expect(page.locator('text=/çark|wheel|güç|item/i')).toBeVisible({ timeout: 5000 });
}

export async function spinWheel(page: Page) {
  await page.click('button:has-text("Çark Çevir")');
  await expect(page.locator('text=/teklif|bid|açılış/i')).toBeVisible({ timeout: 5000 });
}

export async function placeBid(page: Page, amount: number) {
  await page.fill('input[type="number"]', amount.toString());
  await page.click('button:has-text("Teklif")');
}

export async function waitForPhase(page: Page, phase: string, timeout = 10000) {
  await page.waitForFunction(
    (expectedPhase) => {
      const state = (window as any).__gameState;
      return state?.phase === expectedPhase;
    },
    phase,
    { timeout }
  );
}

// Expose gameState to window for test assertions
export async function exposeGameState(page: Page) {
  await page.addInitScript(() => {
    (window as any).__gameState = null;
    const original = console.log;
    // Intercept state updates - adjust based on how your client stores state
  });
}

export function setupConsoleErrorCatcher(page: Page, errors: string[]) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });
}
```

### Main E2E Tests (tests/e2e/fullGame.spec.ts)

Write tests for:

1. **Create and join with 2 players**
   - Player 1 creates room
   - Player 2 joins with room code
   - Both see each other in player list
   - Player 1 can start game
   - NO console errors

2. **Create and join with 6 players**
   - Player 1 creates room
   - Players 2-6 join
   - All 6 visible in player list
   - Start game succeeds
   - NO console errors

3. **Full game flow (2 players)**
   - Create room, join, start
   - Player 1 spins, places opening bid
   - Player 2 bids higher
   - Wait for timer, Player 2 wins
   - Verify gold deducted, slot filled
   - Complete 6 auctions (3 each)
   - Results screen appears with ranking
   - NO console errors

4. **Reconnect after reload**
   - Player 1 creates room, starts game
   - Player 1 reloads page (page.reload())
   - Player 1 returns to game with same state (gold, slots preserved)
   - NO console errors

5. **Judge failed handling**
   - Mock server to return invalid judge response
   - Verify "judge_failed" screen appears
   - Host can retry
   - NO console errors

**Each test must:**
- Set up console error catcher at start
- Assert `errors.length === 0` at end
- Take screenshot on failure for debugging

**Fake judge for tests:**
Update client to use `VITE_SERVER_URL=http://localhost:3100`. Server should detect test env and use a fake judge that returns valid ranking immediately.

### Test Judge Setup

In `server/main.ts`, detect if PORT=3100 (E2E test port) and use a fake judge:

```typescript
const fakeJudge: JudgeFunction = async (players) => {
  return JSON.stringify({
    ranking: players.map((p, i) => ({
      player: p.nickname,
      rank: i + 1,
      reason: `Test reason for ${p.nickname}`
    })),
    commentary: 'Test commentary'
  });
};

const judge = port === 3100 ? fakeJudge : realJudge;
```

### Client Update for E2E

Update `client/src/hooks/useSocket.ts`:
```typescript
const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
```

So E2E can set `VITE_SERVER_URL=http://localhost:3100` in the dev:e2e script.

### Deliverables

1. Playwright installed, config file created
2. E2E helper functions in tests/e2e/helpers.ts
3. 5 E2E tests in tests/e2e/fullGame.spec.ts
4. All tests pass: `npm run test:e2e`
5. Fake judge for E2E environment
6. Client connects to test server (3100) during E2E

### Constraints

- Do NOT touch existing tests/ (unit and integration tests)
- Do NOT modify GAME_RULES.md or CLAUDE.md
- Use only Chromium browser (not webkit/firefox)
- Tests must catch and fail on console errors
- Raw output, no "✓ done" claims

---

## Audit

### Context
Builder added Playwright E2E tests. Verify they work and catch real issues.

### Tasks

#### 1. Review Setup
```bash
git log --oneline -3
git diff HEAD~3..HEAD --stat
```

Check:
- `playwright.config.ts` exists and uses ports 3100/5200
- `package.json` has `test:e2e` script
- Chromium is the only browser
- `webServer` auto-starts dev:e2e

#### 2. Run Tests
```bash
npm run test:e2e
```

Expected: 5 tests pass (create/join 2 players, 6 players, full game, reconnect, judge failed).

If any fail, paste the EXACT error and screenshot path.

#### 3. Verify Console Error Detection

**Sabotage: inject a console error**

In `client/src/screens/LobbyScreen.tsx`, add at top of `handleCreateRoom`:
```typescript
console.error('TEST ERROR - should fail E2E');
```

Run tests:
```bash
npm run test:e2e
```

Expected: "Create and join with 2 players" test FAILS with error count > 0.

Restore:
```bash
git checkout client/src/screens/LobbyScreen.tsx
```

#### 4. Visual Check

Run tests with UI mode:
```bash
npm run test:e2e:ui
```

Watch the "full game flow" test. Verify:
- Lobby screen shows room code and player list
- Game screen shows wheel, item, auction panel
- Results screen shows ranking

Take screenshots:
- Lobby (after create room)
- Game (during bidding)
- Results (final ranking)

Compare with `docs/design/DESIGN.md` and the HTML mockups. Note any visual deviations.

#### 5. Report

```markdown
# Task 05 Audit Report

## Setup Review
[git log output]
[git diff --stat output]

Config: OK / ISSUE: ...
Scripts: OK / ISSUE: ...

## Test Run
```
[npm run test:e2e output]
```

Result: 5/5 PASS / X FAIL: ...

## Console Error Detection
Sabotage: injected console.error
Result: TEST FAILED (as expected) / BUG: test did not catch error

## Visual Check
[Screenshot: Lobby]
[Screenshot: Game]
[Screenshot: Results]

Compared to DESIGN.md:
- Colors: MATCH / OFF: ...
- Layout: CLEAN / CLUTTERED: ...
- Fonts: CORRECT / WRONG: ...

## Summary
E2E setup: WORKING / BROKEN: ...
Console errors: CAUGHT / NOT CAUGHT
Visual: MATCHES DESIGN / DEVIATIONS: ...

APPROVED / REJECT: [reason]
```

---

## Commit messages
- "Add Playwright E2E testing setup with 5 test scenarios"
