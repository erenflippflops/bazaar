import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('[Browser Console]', msg.text()));
  page.on('pageerror', err => console.error('[Page Error]', err));

  try {
    console.log('=== STARTING TEST ===\n');

    // Go to game
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);
    console.log('✓ Page loaded');

    // Create room
    await page.fill('input[placeholder="İsmin"]', 'TestPlayer');
    console.log('✓ Filled player name');

    await page.click('button:has-text("Oda Kur")');
    console.log('✓ Clicked create room button');

    // Wait for game screen
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'game-lobby.png' });
    console.log('✓ Lobby screenshot saved');

    // Check what's on the page
    console.log('\n=== CHECKING PAGE STATE ===');
    const buttons = await page.locator('button').count();
    console.log('Total buttons:', buttons);
    for (let i = 0; i < buttons; i++) {
      const button = page.locator('button').nth(i);
      const text = await button.textContent();
      const visible = await button.isVisible();
      const enabled = await button.isEnabled();
      console.log(`  [${i}] "${text}" (visible: ${visible}, enabled: ${enabled})`);
    }

    // Try to find spin button
    const spinButton = page.locator('button:has-text("ÇARKI ÇEVİR")');
    try {
      const spinVisible = await spinButton.isVisible({ timeout: 2000 });
      console.log('\nSpin button found!');
      const spinEnabled = await spinButton.isEnabled();
      console.log('Spin button enabled:', spinEnabled);

      if (spinVisible && spinEnabled) {
        await spinButton.click();
        console.log('✓ Clicked spin button');

        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'game-after-spin.png' });
        console.log('✓ After-spin screenshot saved');
      }
    } catch (e) {
      console.log('\n⚠ Spin button not found within 2 seconds');
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error(error);
    await page.screenshot({ path: 'game-test-error.png' });
  } finally {
    console.log('\nBrowser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();
