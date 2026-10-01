import { test, expect } from '@playwright/test';
import { createRoom, joinRoom, startGame, setupConsoleErrorCatcher } from './helpers';

test.describe('Task 12 UX Assertions', () => {
  test('Clicking wheel button spins it and triggers auction', async ({ page, browser }) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    // Create room and start game
    const roomCode = await createRoom(page, 'Player1');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await joinRoom(page2, roomCode, 'Player2');
    await startGame(page);

    // Wait for game to start
    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });

    // Test: Click wheel button and verify it triggers spin
    const spinButton = page.locator('button:has-text("ÇARKI ÇEVİR")');
    await spinButton.click();

    // Assert that auction phase starts (wheel click worked)
    await expect(page.locator('text=/Açılış teklifi|TEKLİF VER/i')).toBeVisible({ timeout: 5000 });
    console.log('✓ Wheel button click triggered auction phase');

    await page2.close();
    await context2.close();
  });

  test('Single click on +1 places bid and increases top bid for all players', async ({ page, browser }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    // Create room with 2 players
    const roomCode = await createRoom(page, 'Player1');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    setupConsoleErrorCatcher(page2, errors);
    await joinRoom(page2, roomCode, 'Player2');
    await startGame(page);

    // Wait for game screen
    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });

    // Determine who spins
    const player1CanSpin = await page.locator('button:has-text("ÇARKI ÇEVİR")').isVisible();
    const spinnerPage = player1CanSpin ? page : page2;
    const bidderPage = player1CanSpin ? page2 : page;

    // Spin wheel
    await spinnerPage.locator('button:has-text("ÇARKI ÇEVİR")').click();
    await expect(spinnerPage.locator('text=/Açılış teklifi|TEKLİF VER/i')).toBeVisible({ timeout: 5000 });

    // Wait for opening phase to be visible on both pages
    await spinnerPage.waitForTimeout(1000);

    // Opener places opening bid with +1 button
    const plus1Button = spinnerPage.locator('button:has-text("+1")').first();
    await expect(plus1Button).toBeVisible({ timeout: 5000 });

    // Single click on +1
    await plus1Button.click();

    // Wait for bid to process
    await spinnerPage.waitForTimeout(1500);

    // Verify bidding phase started and highest bid is visible on BOTH players
    await expect(spinnerPage.locator('text=/EN YÜKSEK TEKLİF|1 ALTIN/i')).toBeVisible({ timeout: 5000 });
    await expect(bidderPage.locator('text=/EN YÜKSEK TEKLİF|1 ALTIN/i')).toBeVisible({ timeout: 5000 });

    console.log('✓ Single +1 click placed bid and updated highest bid on all players');

    await page2.close();
    await context2.close();
  });

  test('At 1366x657 viewport: timer, item, bid buttons inside viewport', async ({ page, browser }) => {
    test.setTimeout(60000);

    // Set viewport to 1366x657
    await page.setViewportSize({ width: 1366, height: 657 });

    const roomCode = await createRoom(page, 'Player1');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await joinRoom(page2, roomCode, 'Player2');
    await startGame(page);

    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });

    // Spin wheel
    await page.locator('button:has-text("ÇARKI ÇEVİR")').click();
    await expect(page.locator('text=/Açılış teklifi|TEKLİF VER/i')).toBeVisible({ timeout: 5000 });

    // Wait for UI to render
    await page.waitForTimeout(1000);

    // Check timer bounding box
    const timer = page.locator('.timer').first();
    const timerBox = await timer.boundingBox();
    expect(timerBox).not.toBeNull();
    if (timerBox) {
      expect(timerBox.y).toBeGreaterThanOrEqual(0);
      expect(timerBox.y + timerBox.height).toBeLessThanOrEqual(657);
      expect(timerBox.x).toBeGreaterThanOrEqual(0);
      expect(timerBox.x + timerBox.width).toBeLessThanOrEqual(1366);
      console.log(`✓ Timer inside viewport: y=${timerBox.y}, height=${timerBox.height}`);
    }

    // Check item display (compact item in auction panel)
    const itemDisplay = page.locator('h4').filter({ hasText: /.+/ }).first();
    const itemBox = await itemDisplay.boundingBox();
    expect(itemBox).not.toBeNull();
    if (itemBox) {
      expect(itemBox.y).toBeGreaterThanOrEqual(0);
      expect(itemBox.y + itemBox.height).toBeLessThanOrEqual(657);
      expect(itemBox.x).toBeGreaterThanOrEqual(0);
      expect(itemBox.x + itemBox.width).toBeLessThanOrEqual(1366);
      console.log(`✓ Item display inside viewport: y=${itemBox.y}, height=${itemBox.height}`);
    }

    // Check bid buttons (+1, +2, +5)
    const plus1Btn = page.locator('button:has-text("+1")').first();
    const btnBox = await plus1Btn.boundingBox();
    expect(btnBox).not.toBeNull();
    if (btnBox) {
      expect(btnBox.y).toBeGreaterThanOrEqual(0);
      expect(btnBox.y + btnBox.height).toBeLessThanOrEqual(657);
      expect(btnBox.x).toBeGreaterThanOrEqual(0);
      expect(btnBox.x + btnBox.width).toBeLessThanOrEqual(1366);
      console.log(`✓ Bid buttons inside viewport: y=${btnBox.y}, height=${btnBox.height}`);
    }

    await page2.close();
    await context2.close();
  });

  test('Wheel has N slice paths matching item count', async ({ page, browser }) => {
    test.setTimeout(60000);

    const roomCode = await createRoom(page, 'Player1');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await joinRoom(page2, roomCode, 'Player2');
    await startGame(page);

    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });

    // Get game state to know expected item count
    const itemCount = await page.evaluate(() => {
      const state = (window as any).__gameState;
      return state?.wheel?.length || 0;
    });

    console.log(`Game has ${itemCount} items in wheel`);
    expect(itemCount).toBeGreaterThan(0);

    // Count SVG path elements in the wheel (excluding rim, hub, pointer)
    // The wheel segments are path elements with fill colors
    const wheelPaths = page.locator('svg path[fill][stroke="#0B0C3F"]');
    const pathCount = await wheelPaths.count();

    // Should have exactly itemCount paths for wheel slices
    expect(pathCount).toBe(itemCount);
    console.log(`✓ Wheel has ${pathCount} slice paths matching ${itemCount} items`);

    await page2.close();
    await context2.close();
  });

  test('Network latency test: 150ms delay with bid flow', async ({ page, browser, context }) => {
    test.setTimeout(90000);

    // Add 150ms network latency using CDP
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 150, // 150ms latency
    });

    console.log('✓ Network latency set to 150ms');

    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    const roomCode = await createRoom(page, 'Player1');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await joinRoom(page2, roomCode, 'Player2');
    await startGame(page);

    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });

    // Spin wheel with latency
    const startSpin = Date.now();
    await page.locator('button:has-text("ÇARKI ÇEVİR")').click();
    await expect(page.locator('text=/Açılış teklifi|TEKLİF VER/i')).toBeVisible({ timeout: 10000 });
    const spinDuration = Date.now() - startSpin;

    console.log(`Wheel spin took ${spinDuration}ms with 150ms latency`);

    // Place bid with latency
    await page.waitForTimeout(1000);
    const plus1Button = page.locator('button:has-text("+1")').first();
    await expect(plus1Button).toBeVisible({ timeout: 5000 });

    const startBid = Date.now();
    await plus1Button.click();
    await expect(page.locator('text=/EN YÜKSEK TEKLİF|1 ALTIN/i')).toBeVisible({ timeout: 10000 });
    const bidDuration = Date.now() - startBid;

    console.log(`Bid placement took ${bidDuration}ms with 150ms latency`);
    console.log('✓ Game functions correctly with 150ms network latency');

    // Verify no critical errors occurred
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('Chrome extensions')
    );
    expect(criticalErrors.length).toBe(0);

    await page2.close();
    await context2.close();
  });
});
