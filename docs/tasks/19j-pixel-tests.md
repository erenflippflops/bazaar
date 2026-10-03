# Task 19j – Pixel comparison tests with Playwright

## Goal
Create a design harness and Playwright pixel tests to verify the UI matches mockups within 1.5% pixel difference.

## Files you may change
- `client/src/harness/DesignHarness.tsx` (create new)
- `client/src/harness/mockData.ts` (create new)
- `tests/e2e/pixel-comparison.spec.ts` (create new)
- `tests/e2e/helpers.ts` (update with screenshot utilities)
- `docs/screenshots/diff/` (create directory for diff images)

## Builder

1. **DesignHarness.tsx**: Render any screen with mock data via URL params.
   - Route: `/?mock=<screen-id>&stage=desktop|phone`
   - Screen IDs: `connecting`, `login`, `lobby-host`, `lobby-guest`, `briefing`, `your-turn`, `not-your-turn`, `spinning`, `opening-you`, `opening-other`, `bidding`, `last-seconds`, `top-bidder`, `passed`, `out`, `sold`, `judge-thinking`, `judge-error`, `results`, `disconnected`, `halisaha`
   - Load mock data from mockData.ts (Eren, Selin, Mert, Deniz with same values as mockups)
   - Render the appropriate screen/state with Background, Lanterns, Header, etc.
   - Pause animations for screenshot stability

2. **mockData.ts**: Mock game state data matching mockup values.
   - Player names: Eren, Selin, Mert, Deniz
   - Gold amounts: from mockups (e.g., Eren: 14, Selin: 16, Mert: 20, Deniz: 11)
   - Items: "Işınlanma", "Görünmezlik", "Uçma", "Zihin Okuma", "Süper Hız" (from mockups)
   - Room code: K7M2
   - Theme: "Süper Güçler"
   - Each screen-id has its own mock state object

3. **pixel-comparison.spec.ts**: Playwright tests for each screen.
   - For each of the 21 screen IDs:
     - Desktop: navigate to `/?mock={id}&stage=desktop`, screenshot at 1440×900
     - Phone: navigate to `/?mock={id}&stage=phone`, screenshot at 390×844
   - Also screenshot the actual mockup HTML files at same sizes
   - Use pixelmatch library to compare: `pixelmatch(img1, img2, diff, 1440, 900, {threshold: 0.1})`
   - Pass if < 1.5% pixels differ
   - On failure: save diff image to `docs/screenshots/diff/{id}-{stage}.png`
   - Run with fonts loaded (wait for document.fonts.ready)

4. **helpers.ts**: Add screenshot comparison utility.
   ```typescript
   export async function compareScreenshots(
     page: Page,
     mockupPath: string,
     width: number,
     height: number,
     threshold: number = 0.015
   ) {
     // Load pixelmatch, capture both images, compare, return pass/fail + diff %
   }
   ```

5. Install pixelmatch: `npm install --save-dev pixelmatch @types/pixelmatch`

6. Fonts: ensure Bungee and Rubik fonts load before screenshots (use document.fonts.ready promise).

## Audit
Run the pixel tests:
1. `npx playwright test tests/e2e/pixel-comparison.spec.ts`
2. Report results: how many screens pass (< 1.5% diff)
3. For failures: commit diff images and note which screens/elements differ
4. Acceptable differences: font rendering variations, animation timing artifacts

Pass criteria: at least 18/21 screens < 1.5% diff. Font/antialiasing differences OK if layout matches.

## Commit messages
```
Add pixel comparison tests with Playwright

- DesignHarness: render any screen with mock data
- mockData: match mockup values (Eren, Selin, Mert, Deniz)
- pixel-comparison.spec.ts: 21 screens × 2 stages = 42 tests
- Compare with pixelmatch, save diff images on failure
- Pass threshold: < 1.5% pixel difference

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

## Report
1. Pixel test results: X/42 tests passed
2. Diff percentages for each screen
3. Diff images committed for failures
4. Notes on acceptable differences (fonts, etc.)
