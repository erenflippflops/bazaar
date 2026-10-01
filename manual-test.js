// Manual testing script for BAZAAR game
import { chromium } from '@playwright/test';

async function runManualTest() {
  console.log('Starting manual test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context1 = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page1 = await context1.newPage();

  // Capture console messages for page1
  const consoleMessages = [];
  const consoleErrors = [];

  page1.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(text);
      console.log('Player1 ERROR:', text);
    }
  });

  page1.on('pageerror', error => {
    const errorText = `PAGE ERROR: ${error.message}`;
    consoleErrors.push(errorText);
    console.log('Player1 ERROR:', errorText);
  });

  try {
    // Step 1: Navigate to the game (Player 1)
    console.log('\n=== PLAYER 1: Creating Room ===');
    await page1.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 10000 });
    await page1.screenshot({ path: 'manual-test-01-home.png' });
    console.log('✓ Page loaded');

    // Step 2: Create a room
    console.log('\n2. Creating room with nickname "TestPlayer1"...');
    await page1.fill('input[type="text"]', 'TestPlayer1');
    await page1.screenshot({ path: 'manual-test-02-filled-nickname.png' });

    await page1.click('button:has-text("Oda Kur")');
    console.log('✓ Clicked "Oda Kur" button');

    // Step 3: Wait for room code to appear
    console.log('\n3. Waiting for room code...');
    try {
      await page1.waitForSelector('h2:has-text("----")', { state: 'hidden', timeout: 5000 });
      const roomCodeElement = await page1.locator('h2[style*="font-size: 64px"]').first();
      const roomCode = await roomCodeElement.textContent();
      console.log('✓ Room created! Room code:', roomCode);
      await page1.screenshot({ path: 'manual-test-03-room-created.png' });

      // Step 4: Open second browser for Player 2
      console.log('\n=== PLAYER 2: Joining Room ===');
      const context2 = await browser.newContext({
        viewport: { width: 1440, height: 900 }
      });
      const page2 = await context2.newPage();

      page2.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          console.log('Player2 ERROR:', msg.text());
        }
      });

      await page2.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      console.log('✓ Player 2 page loaded');

      // Fill in room code and nickname
      const inputs = await page2.locator('input[type="text"]').all();
      await inputs[1].fill(roomCode.trim()); // Room code input (second card)
      await inputs[2].fill('TestPlayer2'); // Nickname input (second card)

      await page2.screenshot({ path: 'manual-test-04-player2-joining.png' });
      await page2.click('button:has-text("Katıl")');
      console.log('✓ Player 2 clicked join button');

      await page2.waitForTimeout(2000);
      await page2.screenshot({ path: 'manual-test-05-player2-joined.png' });

      // Check player count on page1
      const playerCountText = await page1.locator('h3:has-text("Oyuncular")').textContent();
      console.log('✓ Player count:', playerCountText);

      // Step 5: Start the game
      console.log('\n=== STARTING GAME ===');
      await page1.screenshot({ path: 'manual-test-06-before-start.png' });

      const startButton = await page1.locator('button:has-text("Oyunu Başlat")');
      const isStartEnabled = await startButton.isEnabled();
      console.log('Start button enabled:', isStartEnabled);

      if (isStartEnabled) {
        await startButton.click();
        console.log('✓ Clicked "Oyunu Başlat"');

        await page1.waitForTimeout(2000);

        // Check if we navigated to game screen
        const currentUrl = page1.url();
        console.log('Current URL:', currentUrl);

        await page1.screenshot({ path: 'manual-test-07-game-started.png' });
        await page2.screenshot({ path: 'manual-test-07-player2-game.png' });

        // Step 6: Check game state and try to spin the wheel
        console.log('\n=== TESTING WHEEL SPIN ===');

        // Check game state via window object
        const gameState = await page1.evaluate(() => (window as any).__gameState);
        console.log('Game state phase:', gameState?.phase);
        console.log('Current opener index:', gameState?.currentOpenerIndex);
        console.log('My player ID:', await page1.evaluate(() => localStorage.getItem('playerId')));
        console.log('Current opener ID:', gameState?.players?.[gameState?.currentOpenerIndex]?.id);

        // Look for the spin wheel button (all caps)
        const spinButton = await page1.locator('button:has-text("ÇARKI ÇEVİR")').first();
        const spinButtonCount = await spinButton.count();

        if (spinButtonCount > 0) {
          console.log('✓ Found "Çarkı Çevir" button');

          const isEnabled = await spinButton.isEnabled();
          const isVisible = await spinButton.isVisible();

          console.log('  - Enabled:', isEnabled);
          console.log('  - Visible:', isVisible);

          if (isEnabled && isVisible) {
            console.log('\nClicking spin button...');
            await page1.screenshot({ path: 'manual-test-08-before-spin.png' });

            await spinButton.click();
            console.log('✓ Clicked spin button');

            await page1.waitForTimeout(4000); // Wait for animation
            await page1.screenshot({ path: 'manual-test-09-after-spin.png' });
            await page2.screenshot({ path: 'manual-test-09-player2-after-spin.png' });

            // Check for bidding UI
            console.log('\nChecking for bidding UI...');
            const bidButtons = await page1.locator('button:has-text("₺")').count();
            console.log('Bid buttons found:', bidButtons);

            if (bidButtons > 0) {
              console.log('✓ Bidding UI is present');

              // Try clicking a bid button
              const firstBidButton = await page1.locator('button:has-text("₺")').first();
              if (await firstBidButton.isEnabled()) {
                await firstBidButton.click();
                console.log('✓ Clicked a bid button');
                await page1.waitForTimeout(1000);
                await page1.screenshot({ path: 'manual-test-10-after-bid.png' });
              }
            }
          } else {
            console.log('❌ Spin button is not clickable');
            await page1.screenshot({ path: 'manual-test-08-button-not-clickable.png' });
          }
        } else {
          console.log('❌ "Çarkı Çevir" button not found');
        }

        await page1.screenshot({ path: 'manual-test-11-final.png' });
        await page2.screenshot({ path: 'manual-test-11-player2-final.png' });
      } else {
        console.log('❌ Start button is disabled');
      }

      await context2.close();
    } catch (error) {
      console.log('❌ Failed to get room code:', error.message);
      console.log('Room might not have been created properly');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('\nConsole Errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('  None');
    }

    console.log('\n⏸ Browser will stay open for 30 seconds for manual inspection...');
    await page1.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await page1.screenshot({ path: 'manual-test-error.png' });
  } finally {
    await browser.close();
    console.log('\n✓ Browser closed');
  }
}

runManualTest().catch(console.error);
