import { test, Page } from '@playwright/test';

async function takeScreenshot(page: Page, name: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.screenshot({
    path: `docs/screenshots/${name}-${viewport.width}x${viewport.height}.png`,
    fullPage: false
  });
}

test('Capture results screen - simple', async ({ page, browser }) => {
  test.setTimeout(600000);

  const phone = { width: 390, height: 844 };
  const desktop = { width: 1440, height: 900 };

  await page.goto('http://localhost:5200');
  await page.waitForTimeout(2000);

  // Create room
  await page.locator('input[placeholder="İsmin"]').first().fill('Player1');
  await page.click('button:has-text("Oda Kur")');
  await page.waitForSelector('text="ODA KODU"');

  // Get room code
  const codeText = await page.locator('text="ODA KODU"').locator('..').textContent();
  const roomCode = codeText?.split('ODA KODU')[1]?.trim().split(/\s/)[0] || '';
  console.log('Room code:', roomCode);

  // Join with player 2
  const page2 = await browser.newPage();
  await page2.goto('http://localhost:5200');
  await page2.waitForTimeout(2000);
  await page2.locator('input[placeholder="Oda kodu"]').fill(roomCode);
  await page2.locator('input[placeholder="İsmin"]').last().fill('Player2');
  await page2.click('button:has-text("Odaya Katıl")');
  await page2.waitForTimeout(1000);

  // Start game
  await page.click('button:has-text("Oyunu Başlat")');
  await page.waitForSelector('button:has-text("ÇARKI ÇEVİR")', { timeout: 10000 });

  // Play 6 auctions
  for (let auction = 1; auction <= 6; auction++) {
    console.log(`Auction ${auction}/6`);

    // Spin
    await page.click('button:has-text("ÇARKI ÇEVİR")');
    await page.waitForTimeout(3500);

    // Opening bid
    await page.click('button:has-text("+1")');
    await page.click('button:has-text("AÇILIŞ TEKLİFİ VER")');

    // Wait for auction to complete
    await page.waitForTimeout(12000);
  }

  // Wait for judging
  console.log('Waiting for judging...');
  await page.waitForSelector('text=/Hakem/i', { timeout: 60000 });

  // Wait for results
  console.log('Waiting for results...');
  await page.waitForSelector('h1:has-text("BAZAAR KAPANDI")', { timeout: 120000 });

  // Take screenshots
  await takeScreenshot(page, '06-results', phone);
  await takeScreenshot(page, '06-results', desktop);

  console.log('Results screenshots captured!');
  await page2.close();
});
