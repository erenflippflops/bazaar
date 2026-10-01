import { test, Page } from '@playwright/test';
import { createRoom, joinRoom, startGame, spinWheel, placeBid } from './helpers';

async function takeScreenshot(page: Page, name: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.screenshot({
    path: `docs/screenshots/${name}-${viewport.width}x${viewport.height}.png`,
    fullPage: false
  });
}

test('Results screenshot minimal', async ({ page, browser }) => {
  test.setTimeout(600000);

  const phone = { width: 390, height: 844 };
  const desktop = { width: 1440, height: 900 };

  const roomCode = await createRoom(page, 'P1');
  const page2 = await browser.newPage();
  await joinRoom(page2, roomCode, 'P2');
  await startGame(page);

  // 6 auctions for 2 players
  for (let i = 0; i < 6; i++) {
    console.log(`Auction ${i+1}/6`);
    await spinWheel(page);
    await placeBid(page, 1);
    await page.waitForTimeout(12000);
  }

  console.log('Waiting for results...');
  await page.waitForSelector('h1:has-text("BAZAAR KAPANDI")', { timeout: 120000 });

  console.log('Taking screenshots...');
  await takeScreenshot(page, '06-results', phone);
  await takeScreenshot(page, '06-results', desktop);
  console.log('Done!');

  await page2.close();
});
