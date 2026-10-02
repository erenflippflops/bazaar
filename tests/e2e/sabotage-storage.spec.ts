import { test, expect, chromium, Browser, BrowserContext } from '@playwright/test';
import { createServer } from '../../server/index.js';
import type { ServerInstance } from '../../server/index.js';

let server: ServerInstance | null = null;
let browser: Browser | null = null;

test.afterEach(async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
  if (server) {
    await server.close();
    server = null;
  }
});

test.describe('Sabotage: sessionStorage reverted to localStorage', () => {
  test('SABOTAGE: localStorage causes two tabs to share identity', async () => {
    // This test will PASS when sessionStorage is used (tabs have separate identities)
    // and FAIL when localStorage is used (tabs share identity, last joined player wins)

    const fakeJudge = async () => '{"ranking":[{"player":"P1","rank":1,"reason":"Test"},{"player":"P2","rank":2,"reason":"Test"}],"commentary":"Test"}';

    server = await createServer({
      port: 0,
      judge: fakeJudge,
      timeScale: 1,
      autoPlay: false
    });

    const baseURL = `http://localhost:${server.port}`;
    browser = await chromium.launch();

    // Single browser context (same localStorage)
    const context = await browser.newContext();

    const tab1 = await context.newPage();
    const tab2 = await context.newPage();

    // Tab1: Create room as P1
    await tab1.goto(baseURL, { waitUntil: 'networkidle' });
    await tab1.waitForTimeout(2000);
    await tab1.locator('input[placeholder="İsmin"]').first().fill('P1');
    await tab1.click('button:has-text("Oda Kur")');
    await expect(tab1.locator('text="ODA KODU"')).toBeVisible({ timeout: 5000 });

    const roomCodeElement = tab1.locator('h2').filter({ hasText: /^[A-Z0-9]{4,6}$/ });
    await expect(roomCodeElement).toBeVisible({ timeout: 5000 });
    const roomCode = (await roomCodeElement.textContent())?.trim() || '';

    // Tab2: Join same room as P2
    await tab2.goto(baseURL, { waitUntil: 'networkidle' });
    await tab2.waitForTimeout(2000);
    await tab2.fill('input[placeholder="Oda Kodu"]', roomCode);
    await tab2.locator('input[placeholder="İsmin"]').nth(1).fill('P2');
    await tab2.click('button:has-text("Katıl")');
    await expect(tab2.locator('text="ODA KODU"')).toBeVisible({ timeout: 5000 });

    // Wait for both to sync
    await tab1.waitForTimeout(1000);
    await tab2.waitForTimeout(1000);

    // P1 starts game
    await tab1.click('button:has-text("Oyunu Başlat")');
    await expect(tab1.locator('canvas')).toBeVisible({ timeout: 5000 });
    await expect(tab2.locator('canvas')).toBeVisible({ timeout: 5000 });

    // With sessionStorage: Tab1 sees spin controls (P1's turn), Tab2 sees waiting
    // With localStorage: Both tabs think they are P2 (last joined), both see waiting or both see spin

    const tab1HasSpin = await tab1.locator('text=/ÇARKI ÇEVİR|ÇEVİR/i').isVisible();
    const tab2HasSpin = await tab2.locator('text=/ÇARKI ÇEVİR|ÇEVİR/i').isVisible();

    // With sessionStorage: tab1 has spin, tab2 doesn't
    // With localStorage: both tabs have same view (both think they're P2)
    expect(tab1HasSpin).toBe(true);
    expect(tab2HasSpin).toBe(false);

    // Try to spin from tab1 (P1)
    const canvas1 = tab1.locator('canvas');
    await canvas1.click();
    await tab1.waitForTimeout(1000);

    // Tab1 should be able to place opening bid
    const tab1CanBid = await tab1.locator('button:has-text("+1")').isVisible();
    expect(tab1CanBid).toBe(true);

    // Tab2 should NOT be able to place opening bid (not the opener)
    const tab2CanBid = await tab2.locator('text=/Açılış teklifi/i').isVisible();
    expect(tab2CanBid).toBe(false);

    await tab1.close();
    await tab2.close();
  });
});
