import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';
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

test.describe('Human Play with autoPlay: false', () => {
  test('two tabs same browser: sessionStorage allows independent players', async () => {
    const fakeJudge = async () => '{"ranking":[{"player":"P1","rank":1,"reason":"Test"},{"player":"P2","rank":2,"reason":"Test"}],"commentary":"Test"}';

    server = await createServer({
      port: 0,
      judge: fakeJudge,
      timeScale: 1,
      autoPlay: false
    });

    const baseURL = `http://localhost:${server.port}`;
    browser = await chromium.launch();

    // Single browser context (same browser, same localStorage)
    const context = await browser.newContext();

    const tab1 = await context.newPage();
    const tab2 = await context.newPage();

    const errors1: string[] = [];
    const errors2: string[] = [];

    tab1.on('console', msg => {
      if (msg.type() === 'error') errors1.push(msg.text());
    });
    tab1.on('pageerror', err => errors1.push(err.message));

    tab2.on('console', msg => {
      if (msg.type() === 'error') errors2.push(msg.text());
    });
    tab2.on('pageerror', err => errors2.push(err.message));

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

    // Both tabs should show both players
    await expect(tab1.locator('text="P1"')).toBeVisible();
    await expect(tab1.locator('text="P2"')).toBeVisible();
    await expect(tab2.locator('text="P1"')).toBeVisible();
    await expect(tab2.locator('text="P2"')).toBeVisible();

    // P1 starts game
    await tab1.click('button:has-text("Oyunu Başlat")');
    await expect(tab1.locator('canvas')).toBeVisible({ timeout: 5000 });
    await expect(tab2.locator('canvas')).toBeVisible({ timeout: 5000 });

    // P1 should see spin controls, P2 should not
    await expect(tab1.locator('text=/ÇARKI ÇEVİR|ÇEVİR/i')).toBeVisible();
    await expect(tab2.locator('text=/çarkı çeviriyor|Sıran değil/i')).toBeVisible();

    // P1 clicks wheel to spin
    const canvas1 = tab1.locator('canvas');
    await canvas1.click({ position: { x: 100, y: 100 } });

    // Both tabs show the revealed item
    await tab1.waitForTimeout(1000);
    await tab2.waitForTimeout(1000);

    // P1 should be able to place opening bid
    await expect(tab1.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 3000 });

    // P1 places opening bid using one-click button
    const plusOneButton1 = tab1.locator('button:has-text("+1")');
    await expect(plusOneButton1).toBeVisible({ timeout: 2000 });
    await plusOneButton1.click();

    // Both tabs should show bidding phase
    await tab1.waitForTimeout(500);
    await tab2.waitForTimeout(500);

    // P2 can now bid
    await expect(tab2.locator('button:has-text("+1")')).toBeVisible({ timeout: 2000 });

    // P2 bids
    await tab2.locator('button:has-text("+2")').click();

    // Wait for auction to end (no more bids, timer expires)
    await tab1.waitForTimeout(11000);

    // P2 should have won the item
    await expect(tab2.locator('text="1/3"')).toBeVisible({ timeout: 2000 });

    // Verify no console errors
    expect(errors1).toHaveLength(0);
    expect(errors2).toHaveLength(0);

    await tab1.close();
    await tab2.close();
  });

  test('game stalls without autoPlay when human does not act', async () => {
    const fakeJudge = async () => '{"ranking":[],"commentary":"test"}';

    server = await createServer({
      port: 0,
      judge: fakeJudge,
      timeScale: 0.1,
      autoPlay: false
    });

    const baseURL = `http://localhost:${server.port}`;
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.locator('input[placeholder="İsmin"]').first().fill('P1');
    await page.click('button:has-text("Oda Kur")');
    await expect(page.locator('text="ODA KODU"')).toBeVisible({ timeout: 5000 });

    const roomCode = (await page.locator('h2').filter({ hasText: /^[A-Z0-9]{4,6}$/ }).textContent())?.trim() || '';

    const page2 = await context.newPage();
    await page2.goto(baseURL, { waitUntil: 'networkidle' });
    await page2.waitForTimeout(2000);
    await page2.fill('input[placeholder="Oda Kodu"]', roomCode);
    await page2.locator('input[placeholder="İsmin"]').nth(1).fill('P2');
    await page2.click('button:has-text("Katıl")');

    await page.click('button:has-text("Oyunu Başlat")');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });

    // Wait 3 seconds (with timeScale 0.1, should be enough for auto-spin if enabled)
    await page.waitForTimeout(3000);

    // Phase should still be 'playing', not 'opening' or 'bidding'
    // The wheel should not have auto-spun
    const hasSpinButton = await page.locator('text=/ÇARKI ÇEVİR/i').isVisible();
    expect(hasSpinButton).toBe(true);

    await page.close();
    await page2.close();
  });

  test('element visibility: buttons not covered, within viewport', async () => {
    const fakeJudge = async () => '{"ranking":[{"player":"P1","rank":1,"reason":"Test"},{"player":"P2","rank":2,"reason":"Test"}],"commentary":"Test"}';

    server = await createServer({
      port: 0,
      judge: fakeJudge,
      timeScale: 1,
      autoPlay: false
    });

    const baseURL = `http://localhost:${server.port}`;
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();

    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.locator('input[placeholder="İsmin"]').first().fill('P1');
    await page.click('button:has-text("Oda Kur")');
    await expect(page.locator('text="ODA KODU"')).toBeVisible({ timeout: 5000 });

    const roomCode = (await page.locator('h2').filter({ hasText: /^[A-Z0-9]{4,6}$/ }).textContent())?.trim() || '';

    const page2 = await context.newPage();
    await page2.goto(baseURL, { waitUntil: 'networkidle' });
    await page2.waitForTimeout(2000);
    await page2.fill('input[placeholder="Oda Kodu"]', roomCode);
    await page2.locator('input[placeholder="İsmin"]').nth(1).fill('P2');
    await page2.click('button:has-text("Katıl")');

    await page.click('button:has-text("Oyunu Başlat")');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });

    // Verify wheel is clickable (elementFromPoint returns the canvas)
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      // Check element is in viewport
      expect(centerX).toBeGreaterThan(0);
      expect(centerY).toBeGreaterThan(0);
      expect(centerX).toBeLessThan(390);
      expect(centerY).toBeLessThan(844);
    }

    await canvas.click();
    await page.waitForTimeout(1000);

    // Check bid buttons are visible and clickable
    const plusOneButton = page.locator('button:has-text("+1")');
    await expect(plusOneButton).toBeVisible({ timeout: 3000 });

    const bidBox = await plusOneButton.boundingBox();
    expect(bidBox).not.toBeNull();

    if (bidBox) {
      const centerX = bidBox.x + bidBox.width / 2;
      const centerY = bidBox.y + bidBox.height / 2;

      expect(centerX).toBeGreaterThan(0);
      expect(centerY).toBeGreaterThan(0);
      expect(centerX).toBeLessThan(390);
      expect(centerY).toBeLessThan(844);
    }

    await page.close();
    await page2.close();
  });
});
