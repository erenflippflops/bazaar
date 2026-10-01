import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import { join } from 'path';

const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 }
};

const BASE_URL = 'http://localhost:5200';

// Helper functions from e2e tests
async function createRoom(page: Page, nickname: string): Promise<string> {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.locator('input[placeholder="İsmin"]').first().fill(nickname);
  await page.click('button:has-text("Oda Kur")');

  await page.waitForSelector('text="ODA KODU"', { timeout: 5000 });
  await page.waitForSelector(`text="${nickname}"`, { timeout: 10000 });

  const roomCodeElement = page.locator('h2').filter({ hasText: /^[A-Z0-9]{4,6}$/ });
  await roomCodeElement.waitFor({ state: 'visible', timeout: 5000 });
  const roomCode = await roomCodeElement.textContent();

  if (!roomCode || roomCode.length < 4) throw new Error('Room code not found');
  return roomCode.trim();
}

async function joinRoom(page: Page, roomCode: string, nickname: string): Promise<void> {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.fill('input[placeholder="Oda Kodu"]', roomCode);
  await page.locator('input[placeholder="İsmin"]').nth(1).fill(nickname);
  await page.click('button:has-text("Katıl")');

  await page.waitForSelector('text="ODA KODU"', { timeout: 5000 });
  await page.waitForSelector(`text="${nickname}"`, { timeout: 10000 });
}

async function startGame(page: Page): Promise<void> {
  await page.click('button:has-text("Oyunu Başlat")');
  await page.waitForSelector('button:has-text("ÇARKI ÇEVİR")', { timeout: 5000 });
}

async function spinWheel(page: Page): Promise<void> {
  await page.click('button:has-text("ÇARKI ÇEVİR")');
  await page.waitForSelector('text=/Açılış teklifi|Teklif Ver/i', { timeout: 5000 });
}

async function placeBid(page: Page, amount: number): Promise<void> {
  const incrementButton = page.locator(`button:has-text("+${amount}")`);
  await incrementButton.click();

  const bidButton = page.locator('button:has-text("TEKLİF VER")');
  await bidButton.waitFor({ state: 'visible', timeout: 5000 });
  await bidButton.click();
}

async function captureScreenshotsForDevice(device: string, viewport: { width: number, height: number }) {
  console.log(`\nCapturing ${device} screenshots (${viewport.width}x${viewport.height})...`);

  const browser: Browser = await chromium.launch({ headless: false });
  const context: BrowserContext = await browser.newContext({
    viewport,
    baseURL: BASE_URL
  });
  const page: Page = await context.newPage();
  const page2: Page = await context.newPage();

  try {
    // 1. Home screen
    console.log('  - Home screen');
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(process.cwd(), 'screenshots', `${device}-home.png`),
      fullPage: false
    });

    // 2. Lobby screen with 2 players
    console.log('  - Lobby with 2 players');
    const roomCode = await createRoom(page, 'Ahmet');
    await page.waitForTimeout(500);

    await joinRoom(page2, roomCode, 'Ayşe');
    await page2.waitForTimeout(500);

    await page.bringToFront();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: join(process.cwd(), 'screenshots', `${device}-lobby.png`),
      fullPage: false
    });

    // 3. Game screen - turn to open with wheel
    console.log('  - Turn to open phase');
    await startGame(page);
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: join(process.cwd(), 'screenshots', `${device}-turn-to-open.png`),
      fullPage: false
    });

    // 4. Game screen - opening phase with auction panel
    console.log('  - Opening phase');
    await spinWheel(page);
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: join(process.cwd(), 'screenshots', `${device}-opening.png`),
      fullPage: false
    });

    // 5. Game screen - bidding phase
    console.log('  - Bidding phase');
    await placeBid(page, 1);
    await page.waitForTimeout(1000);

    // Check if player 2 can bid (bring to front and place bid)
    await page2.bringToFront();
    const canBid = await page2.locator('button:has-text("TEKLİF VER")').isVisible().catch(() => false);
    if (canBid) {
      await placeBid(page2, 2);
      await page2.waitForTimeout(1000);
    }

    await page2.screenshot({
      path: join(process.cwd(), 'screenshots', `${device}-bidding.png`),
      fullPage: false
    });

    // 6. Results screen - play through all 6 auctions
    console.log('  - Playing through game to results...');

    // Complete first auction (wait for bidding timer)
    await page.waitForTimeout(11000);

    // Play remaining 5 auctions quickly
    for (let i = 2; i <= 6; i++) {
      await page.waitForTimeout(1000);

      const player1IsOpener = await page.evaluate(() => {
        const gameState = (window as any).__gameState;
        const playerId = localStorage.getItem('playerId');
        const currentOpener = gameState?.players?.[gameState?.currentOpenerIndex];
        return currentOpener?.id === playerId;
      });

      const openerPage = player1IsOpener ? page : page2;
      const otherPage = player1IsOpener ? page2 : page;

      await openerPage.bringToFront();
      await openerPage.waitForSelector('button:has-text("ÇARKI ÇEVİR")', { timeout: 10000 });
      await spinWheel(openerPage);
      await placeBid(openerPage, 1);
      await openerPage.waitForTimeout(500);

      const otherCanBid = await otherPage.locator('button:has-text("TEKLİF VER")').isVisible().catch(() => false);
      if (otherCanBid) {
        await placeBid(otherPage, 2);
      }

      await page.waitForTimeout(11000);
    }

    // Wait for results screen
    console.log('  - Results screen');
    await page.waitForSelector('h1:has-text("BAZAAR KAPANDI")', { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(process.cwd(), 'screenshots', `${device}-results.png`),
      fullPage: false
    });

    console.log(`  ✓ ${device} screenshots complete`);

  } catch (error) {
    console.error(`Error capturing ${device} screenshots:`, error);
    throw error;
  } finally {
    await page2.close();
    await page.close();
    await context.close();
    await browser.close();
  }
}

async function main() {
  console.log('Starting screenshot capture...');
  console.log('Make sure the dev server is running on http://localhost:5200\n');

  // Create screenshots directory if it doesn't exist
  const fs = await import('fs');
  const screenshotsDir = join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Capture phone screenshots
  await captureScreenshotsForDevice('phone', VIEWPORTS.phone);

  // Capture desktop screenshots
  await captureScreenshotsForDevice('desktop', VIEWPORTS.desktop);

  console.log('\n✓ All screenshots captured successfully!');
  console.log(`Screenshots saved to: ${screenshotsDir}`);
}

main().catch(console.error);
