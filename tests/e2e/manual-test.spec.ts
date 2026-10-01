import { test, expect, Page } from '@playwright/test';

test.describe('Manual Testing - Current Build', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    consoleWarnings = [];

    // Capture console errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[ERROR] ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(`[WARNING] ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      consoleErrors.push(`[PAGE ERROR] ${error.message}\n${error.stack}`);
    });
  });

  test('Full game flow: create room, 2 players, start game, wheel, bidding', async ({ page, browser }) => {
    // Create second context for player 2
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // Capture errors from page2 as well
    page2.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[P2 ERROR] ${msg.text()}`);
      }
    });
    page2.on('pageerror', error => {
      consoleErrors.push(`[P2 PAGE ERROR] ${error.message}`);
    });

    console.log('\n=== STEP 1: Player 1 creates room ===');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/01-home.png', fullPage: true });

    // Create room - fill the first "İsmin" input (in "Oda Kur" section)
    await page.locator('input[placeholder="İsmin"]').first().fill('Player1');
    await page.click('button:has-text("Oda Kur")');
    await page.waitForTimeout(2000);

    // Wait for room code to appear - it's in a large h2 with letter-spacing
    await page.waitForSelector('text=/ODA KODU/i');

    // Get room code from localStorage or from the page
    const roomCode = await page.evaluate(() => localStorage.getItem('roomCode'));
    console.log('Room Code:', roomCode);
    await page.screenshot({ path: 'test-results/02-room-created.png', fullPage: true });

    console.log('\n=== STEP 2: Player 2 joins room ===');
    await page2.goto('/');
    await page2.waitForLoadState('networkidle');

    // Fill room code and nickname in join section
    await page2.fill('input[placeholder="Oda Kodu"]', roomCode || '');
    await page2.locator('input[placeholder="İsmin"]').nth(1).fill('Player2'); // Second "İsmin" input
    await page2.click('button:has-text("Katıl")');
    await page2.waitForTimeout(2000);
    await page2.screenshot({ path: 'test-results/03-player2-joined.png', fullPage: true });

    // Wait for player 2 to show up in player 1's view
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/04-lobby-2-players.png', fullPage: true });

    console.log('\n=== STEP 3: Start game ===');
    await page.click('button:has-text("Oyunu Başlat")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/05-game-started-p1.png', fullPage: true });
    await page2.screenshot({ path: 'test-results/06-game-started-p2.png', fullPage: true });

    console.log('\n=== STEP 4: Check game state and wheel ===');
    // Get game state from window
    const gameState = await page.evaluate(() => (window as any).__gameState);
    console.log('Game phase:', gameState?.phase);
    console.log('Current opener:', gameState?.players?.[gameState?.currentOpenerIndex]?.nickname);
    console.log('Wheel items count:', gameState?.wheel?.length);

    // Check if wheel SVG is visible
    const wheelSvg = await page.locator('svg').count();
    console.log('SVG elements found:', wheelSvg);

    // Check for spin button
    const spinButton = await page.locator('button:has-text("ÇARKI ÇEVİR")').isVisible().catch(() => false);
    console.log('Spin button visible:', spinButton);

    if (spinButton) {
      console.log('\n=== STEP 5: Test wheel spin ===');
      await page.screenshot({ path: 'test-results/07-before-spin.png', fullPage: true });
      await page.click('button:has-text("ÇARKI ÇEVİR")');
      await page.waitForTimeout(4000); // Wait for animation and phase change

      // Check phase after spin
      const gameStateAfterSpin = await page.evaluate(() => (window as any).__gameState);
      console.log('Phase after spin:', gameStateAfterSpin?.phase);
      console.log('Revealed item:', gameStateAfterSpin?.revealedItem?.name);

      await page.screenshot({ path: 'test-results/08-after-spin-p1.png', fullPage: true });
      await page2.screenshot({ path: 'test-results/09-after-spin-p2.png', fullPage: true });
    } else {
      console.log('WARNING: Spin button not visible');
      console.log('This might be because it\'s not player 1\'s turn');
      await page.screenshot({ path: 'test-results/07-no-spin-button.png', fullPage: true });
    }

    console.log('\n=== STEP 6: Check one-click bidding ===');
    await page.waitForTimeout(2000);

    // Check phase again
    const currentPhase = await page.evaluate(() => (window as any).__gameState?.phase);
    console.log('Current phase before bidding check:', currentPhase);

    // Look for the one-click bid buttons (+1, +2, +5)
    const quickBidButtons = await page.locator('button').filter({ hasText: /^\+\d+$/ }).count();
    console.log('Quick bid buttons (+1, +2, +5) found:', quickBidButtons);

    // Also check for the main opening bid button
    const openingButton = await page.locator('button:has-text("AÇILIŞ")').count();
    console.log('Opening bid button found:', openingButton);

    if (quickBidButtons > 0 || openingButton > 0) {
      console.log('✓ One-click bidding interface is present');
      await page.screenshot({ path: 'test-results/10-bidding-interface.png', fullPage: true });

      // Try clicking the +1 button
      const plus1Button = await page.locator('button:has-text("+1")').first();
      const isDisabled = await plus1Button.isDisabled();
      console.log('+1 button disabled:', isDisabled);

      if (!isDisabled) {
        console.log('Testing +1 bid button...');
        await plus1Button.click();
        await page.waitForTimeout(1500);

        const gameStateAfterBid = await page.evaluate(() => (window as any).__gameState);
        console.log('Current highest bid:', gameStateAfterBid?.currentHighestBid);
        console.log('Current highest bidder:', gameStateAfterBid?.players?.find((p: any) => p.id === gameStateAfterBid?.currentHighestBidderId)?.nickname);

        await page.screenshot({ path: 'test-results/11-after-bid-p1.png', fullPage: true });
        await page2.screenshot({ path: 'test-results/12-after-bid-p2.png', fullPage: true });
      } else {
        console.log('WARNING: +1 button is disabled (might not have enough gold)');
      }
    } else {
      console.log('WARNING: No bid buttons found');
      await page.screenshot({ path: 'test-results/10-no-bid-buttons.png', fullPage: true });
    }

    console.log('\n=== STEP 7: Print all console errors ===');
    if (consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS FOUND:');
      consoleErrors.forEach(err => console.log(err));
    } else {
      console.log('\n✅ No console errors');
    }

    if (consoleWarnings.length > 0) {
      console.log('\n⚠️  CONSOLE WARNINGS:');
      consoleWarnings.forEach(warn => console.log(warn));
    }

    // Final screenshots
    await page.screenshot({ path: 'test-results/12-final-p1.png', fullPage: true });
    await page2.screenshot({ path: 'test-results/13-final-p2.png', fullPage: true });

    await context2.close();

    // Fail test if there were errors
    expect(consoleErrors.length, `Found ${consoleErrors.length} console errors`).toBe(0);
  });
});
