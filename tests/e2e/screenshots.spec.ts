import { test, expect, Page } from '@playwright/test';
import { createRoom, joinRoom, startGame, spinWheel, placeBid } from './helpers';

async function takeScreenshot(page: Page, name: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.screenshot({
    path: `docs/screenshots/${name}-${viewport.width}x${viewport.height}.png`,
    fullPage: false
  });
}

test.describe('Screenshots for V1', () => {
  const phone = { width: 390, height: 844 };
  const desktop = { width: 1440, height: 900 };

  test('Home screen', async ({ page }) => {
    await page.goto('http://localhost:5200');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, '01-home', phone);
    await takeScreenshot(page, '01-home', desktop);
  });

  test('Lobby screen', async ({ page }) => {
    await page.goto('http://localhost:5200');
    await page.waitForTimeout(2000);

    // Create room
    await page.locator('input[placeholder="İsmin"]').first().fill('TestPlayer');
    await page.click('button:has-text("Oda Kur")');
    await page.waitForSelector('text="ODA KODU"');

    await takeScreenshot(page, '02-lobby', phone);
    await takeScreenshot(page, '02-lobby', desktop);
  });

  test('Game screens', async ({ page, browser }) => {
    test.setTimeout(120000); // 2 minutes for game flow

    const roomCode = await createRoom(page, 'Player1');

    // Join with player 2
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await joinRoom(page2, roomCode, 'Player2');

    // Start game
    await startGame(page);

    // 03 - Turn to open (wheel visible)
    await takeScreenshot(page, '03-turn-to-open', phone);
    await takeScreenshot(page, '03-turn-to-open', desktop);

    // Spin wheel
    await spinWheel(page);

    // 04 - Opening bid phase
    await page.waitForSelector('text=/Açılış teklifi/i');
    await takeScreenshot(page, '04-opening-bid', phone);
    await takeScreenshot(page, '04-opening-bid', desktop);

    // Place opening bid
    await placeBid(page, 1);

    // 05 - Bidding phase
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '05-bidding', phone);
    await takeScreenshot(page, '05-bidding', desktop);

    // Let auction complete
    await page.waitForTimeout(12000);

    // Play through to results (5 more auctions, alternating players)
    for (let i = 0; i < 5; i++) {
      const currentPage = i % 2 === 1 ? page : page2; // Player2's turn (i=0), then alternates
      await currentPage.waitForSelector('button:has-text("ÇARKI ÇEVİR")', { timeout: 10000 });
      await spinWheel(currentPage);
      await placeBid(currentPage, 1);
      await page.waitForTimeout(12000);
    }

    // 06 - Results screen
    await page.waitForSelector('h1:has-text("BAZAAR KAPANDI")', { timeout: 60000 });
    await takeScreenshot(page, '06-results', phone);
    await takeScreenshot(page, '06-results', desktop);

    await page2.close();
    await context2.close();
  });
});
