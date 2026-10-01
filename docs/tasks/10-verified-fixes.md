# Task 10 – Fixes that Task 09 claimed but the screenshots do not show (do without asking Eren)

Outside review of GitHub f2a001d. The Task 09 summary claimed these were fixed; the committed
screenshots (docs/screenshots/05-bidding-*.png) show they are NOT:
1. The wheel is still an empty white circle: no colored slices, no "Çarkta N güç kaldı".
   Find out why (e.g. slice fills not rendering, slices only drawn while spinning, CSS
   variables undefined) and fix it so the wheel ALWAYS shows colored slices for the remaining
   items, like docs/design/ mockups.
2. Phone 390x844 during opening and bidding: timer, current bid and bid buttons are still
   below the fold. They must be visible without scrolling (see Auction-Phone.html).
3. Desktop: a lantern still covers the room code top-left ("ODA: 6…119").
4. The gold limit ("En fazla X altın verebilirsin") is not visible in any bidding screenshot.
5. docs/STATUS.md says "E2E tests: 6 passed, 6 failed". Red tests are never "unrelated":
   find the cause of each failure and fix it (the auditor reviews any test change).
6. Real judge game with the real key (.env, never print it): do it now, paste the JSON.

## Goal
Fix all 6 items with verification.

## Files you may change

### Builder 1 (visual fixes 1-4):
- client/src/components/WheelDisplay.tsx
- client/src/components/AuctionPanel.tsx
- client/src/screens/GameScreen.tsx
- client/src/components/LanternString.tsx
- client/src/App.css

### Builder 2 (E2E test fixes):
- tests/e2e/*.spec.ts (any test file that's failing)
- playwright.config.ts (if timeout/config issues)

## Verification rule for this task
- After each visual fix, take the screenshot again, OPEN the PNG yourself and describe in one
  line what you see. A visual item is done only when the new screenshot shows it.
- Before claiming tests are green, paste the raw summary lines of `npx vitest run` AND
  `npx playwright test` (no filter), 3 consecutive runs.
- The auditor re-audits at the end with VERDICT.

## Builder
Run fixes, capture screenshots, run tests.

## Audit
Verify screenshots show the fixes, tests are green, game rules still enforced.

## Commit messages
- "Fix wheel display: colored slices and counter always visible"
- "Fix phone layout: auction UI above fold"
- "Fix lantern z-index: room code visible"
- "Show gold limit in bidding panel"
- "Fix E2E test failures: [list what was fixed]"
- "Add real judge test evidence"

## Report
For each item 1-6: what was wrong, what you fixed, evidence (screenshot description or test output).

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
