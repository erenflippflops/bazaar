import { test, expect } from '@playwright/test';
import { createRoom, joinRoom, startGame, spinWheel, placeBid, setupConsoleErrorCatcher } from './helpers';

test.describe('Joining and Bidding Flow Test', () => {
  test('Join room and test bidding with 2 players', async ({ page, browser }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    console.log('=== STEP 1: Player 1 creates room ===');
    const roomCode = await createRoom(page, 'Player1');
    console.log(`Room code: ${roomCode}`);

    console.log('=== STEP 2: Player 2 joins room ===');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    setupConsoleErrorCatcher(page2, errors);
    await joinRoom(page2, roomCode, 'Player2');

    // Verify both players are visible in lobby
    await expect(page.locator('text="Player1"')).toBeVisible();
    await expect(page.locator('text="Player2"')).toBeVisible();
    console.log('Both players visible in lobby');

    console.log('=== STEP 3: Start game ===');
    await startGame(page);

    // Wait for both pages to show game screen
    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=/çeviriyor|izliyorsun/i')).toBeVisible({ timeout: 5000 });
    console.log('Game started');

    // Take screenshot of initial game state
    await page.screenshot({ path: 'test-screenshots/player1-game-start.png', fullPage: true });
    await page2.screenshot({ path: 'test-screenshots/player2-game-start.png', fullPage: true });

    console.log('=== STEP 4: Check wheel visibility ===');
    // Check if wheel is visible
    const wheelVisible = await page.locator('.wheel, [class*="wheel"]').count();
    console.log(`Wheel elements found: ${wheelVisible}`);

    // Check for wheel colors
    const wheelItems = await page.locator('.wheel-item, [class*="wheel-item"], [class*="segment"]').count();
    console.log(`Wheel items/segments found: ${wheelItems}`);

    console.log('=== STEP 5: First auction - Player 1 opens ===');
    await page.waitForTimeout(1000);

    const player1IsOpener = await page.evaluate(() => {
      const gameState = (window as any).__gameState;
      const playerId = localStorage.getItem('playerId');
      const currentOpener = gameState?.players?.[gameState?.currentOpenerIndex];
      return currentOpener?.id === playerId;
    });

    const spinnerPage = player1IsOpener ? page : page2;
    const bidderPage = player1IsOpener ? page2 : page;
    const spinnerName = player1IsOpener ? 'Player1' : 'Player2';
    const bidderName = player1IsOpener ? 'Player2' : 'Player1';

    console.log(`${spinnerName} is the opener`);

    // Spin wheel
    await expect(spinnerPage.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
    await spinWheel(spinnerPage);
    console.log(`${spinnerName} spun the wheel`);

    // Wait for auction phase
    await expect(spinnerPage.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });
    console.log('Auction phase started');

    // Take screenshots of auction UI
    await spinnerPage.screenshot({ path: `test-screenshots/${spinnerName}-auction-opener.png`, fullPage: true });
    await bidderPage.screenshot({ path: `test-screenshots/${bidderName}-auction-bidder.png`, fullPage: true });

    console.log('=== STEP 6: Check gold display ===');
    // Check gold display on both pages
    const spinnerGoldText = await spinnerPage.locator('text=/\\d+\\s*(?:gold|altın)/i').first().textContent();
    const bidderGoldText = await bidderPage.locator('text=/\\d+\\s*(?:gold|altın)/i').first().textContent();
    console.log(`${spinnerName} gold display: ${spinnerGoldText}`);
    console.log(`${bidderName} gold display: ${bidderGoldText}`);

    console.log('=== STEP 7: Check bid buttons ===');
    // Check for bid increment buttons
    const spinnerBidButtons = await spinnerPage.locator('button:has-text("+")').count();
    const bidderBidButtons = await bidderPage.locator('button:has-text("+")').count();
    console.log(`${spinnerName} bid increment buttons: ${spinnerBidButtons}`);
    console.log(`${bidderName} bid increment buttons: ${bidderBidButtons}`);

    // Check if TEKLİF VER button exists and its state
    const spinnerBidButton = spinnerPage.locator('button:has-text("TEKLİF VER")');
    const bidderBidButton = bidderPage.locator('button:has-text("TEKLİF VER")');

    const spinnerBidButtonVisible = await spinnerBidButton.isVisible();
    const bidderBidButtonVisible = await bidderBidButton.isVisible();
    console.log(`${spinnerName} TEKLİF VER button visible: ${spinnerBidButtonVisible}`);
    console.log(`${bidderName} TEKLİF VER button visible: ${bidderBidButtonVisible}`);

    console.log('=== STEP 8: Place opening bid ===');
    // Opener places opening bid
    await placeBid(spinnerPage, 1);
    console.log(`${spinnerName} placed opening bid of 1`);
    await spinnerPage.waitForTimeout(1000);

    // Take screenshot after opening bid
    await spinnerPage.screenshot({ path: `test-screenshots/${spinnerName}-after-opening-bid.png`, fullPage: true });
    await bidderPage.screenshot({ path: `test-screenshots/${bidderName}-after-opening-bid.png`, fullPage: true });

    console.log('=== STEP 9: Other player bids ===');
    // Other player should now be able to bid
    const bidderCanBid = await bidderBidButton.isVisible();
    console.log(`${bidderName} can bid: ${bidderCanBid}`);

    if (bidderCanBid) {
      await placeBid(bidderPage, 1);
      console.log(`${bidderName} placed bid of 1`);
      await bidderPage.waitForTimeout(1000);

      // Take screenshot after counter bid
      await spinnerPage.screenshot({ path: `test-screenshots/${spinnerName}-after-counter-bid.png`, fullPage: true });
      await bidderPage.screenshot({ path: `test-screenshots/${bidderName}-after-counter-bid.png`, fullPage: true });
    }

    console.log('=== STEP 10: Check console errors ===');
    if (errors.length > 0) {
      console.log('Console errors detected:');
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    } else {
      console.log('No console errors detected');
    }

    console.log('=== STEP 11: Get auction panel details ===');
    // Get details about the auction panel
    const spinnerAuctionPanel = await spinnerPage.locator('[class*="auction"], [class*="bid"]').first().innerHTML();
    console.log(`${spinnerName} auction panel HTML (truncated): ${spinnerAuctionPanel.substring(0, 200)}`);

    // Wait a bit to observe final state
    await page.waitForTimeout(3000);

    console.log('=== TEST COMPLETE ===');
    console.log(`Total console errors: ${errors.length}`);

    await page2.close();
    await context2.close();
  });
});
