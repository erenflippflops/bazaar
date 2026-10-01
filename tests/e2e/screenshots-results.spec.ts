import { test, Page } from '@playwright/test';
import { createRoom, joinRoom, startGame, spinWheel, placeBid } from './helpers';

async function takeScreenshot(page: Page, name: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.screenshot({
    path: `docs/screenshots/${name}-${viewport.width}x${viewport.height}.png`,
    fullPage: false
  });
}

test.describe('Results Screen Screenshot', () => {
  const phone = { width: 390, height: 844 };
  const desktop = { width: 1440, height: 900 };

  test('Capture results screen', async ({ page, browser }) => {
    test.setTimeout(600000); // 10 minutes

    const roomCode = await createRoom(page, 'Player1');

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await joinRoom(page2, roomCode, 'Player2');

    await startGame(page);

    // Play through 6 auctions (2 players × 3 slots)
    for (let i = 0; i < 6; i++) {
      await spinWheel(page);
      await placeBid(page, 1);
      // Wait for auction to complete (10s bid timer + buffer)
      await page.waitForTimeout(12000);
    }

    // Wait for judging phase with longer timeout
    await page.waitForSelector('text=/Hakem/i', { timeout: 60000 });

    // Wait for results screen (judge completes)
    await page.waitForSelector('h1:has-text("BAZAAR KAPANDI")', { timeout: 60000 });

    await takeScreenshot(page, '06-results', phone);
    await takeScreenshot(page, '06-results', desktop);

    await page2.close();
    await context2.close();
  });
});
