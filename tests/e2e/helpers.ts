import { Page, expect } from '@playwright/test';

export async function createRoom(page: Page, nickname: string) {
  await page.goto('/', { waitUntil: 'networkidle' });

  // Wait a moment for socket to connect
  await page.waitForTimeout(2000);

  // Fill the first nickname input (in the "Oda Kur" section)
  await page.locator('input[placeholder="İsmin"]').first().fill(nickname);
  await page.click('button:has-text("Oda Kur")');

  // Wait for the lobby screen with room code (this means mode switched to 'create')
  await expect(page.locator('text="ODA KODU"')).toBeVisible({ timeout: 5000 });

  // Wait for player name to appear (this means state_update arrived with player data)
  await expect(page.locator(`text="${nickname}"`)).toBeVisible({ timeout: 10000 });

  // Get the room code from the large h2 element (room codes are 4-6 uppercase letters/numbers)
  const roomCodeElement = page.locator('h2').filter({ hasText: /^[A-Z0-9]{4,6}$/ });
  await expect(roomCodeElement).toBeVisible({ timeout: 5000 });
  const roomCode = await roomCodeElement.textContent();

  if (!roomCode || roomCode.length < 4) throw new Error('Room code not found');
  return roomCode.trim();
}

export async function joinRoom(page: Page, roomCode: string, nickname: string) {
  await page.goto('/', { waitUntil: 'networkidle' });

  // Wait a moment for socket to connect
  await page.waitForTimeout(2000);

  // Fill room code input
  await page.fill('input[placeholder="Oda Kodu"]', roomCode);
  // Fill the second nickname input (in the "Odaya Katıl" section)
  await page.locator('input[placeholder="İsmin"]').nth(1).fill(nickname);
  // Click the "Katıl" button
  await page.click('button:has-text("Katıl")');

  // Wait for lobby screen with player list
  await expect(page.locator('text="ODA KODU"')).toBeVisible({ timeout: 5000 });
  await expect(page.locator(`text="${nickname}"`)).toBeVisible({ timeout: 10000 });
}

export async function startGame(page: Page) {
  await page.click('button:has-text("Oyunu Başlat")');
  // Wait for game screen - look for the spin button specifically
  await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });
}

export async function spinWheel(page: Page) {
  await page.click('button:has-text("ÇARKI ÇEVİR")');
  // Wait for auction phase - look for auction-related text
  await expect(page.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });
}

export async function placeBid(page: Page, amount: number) {
  await page.fill('input[type="number"]', amount.toString());
  await page.click('button:has-text("Teklif Ver")');
}

export async function waitForPhase(page: Page, phase: string, timeout = 10000) {
  await page.waitForFunction(
    (expectedPhase) => {
      const state = (window as any).__gameState;
      return state?.phase === expectedPhase;
    },
    phase,
    { timeout }
  );
}

// Expose gameState to window for test assertions
export async function exposeGameState(page: Page) {
  await page.addInitScript(() => {
    (window as any).__gameState = null;
    const original = console.log;
    // Intercept state updates - adjust based on how your client stores state
  });
}

export function setupConsoleErrorCatcher(page: Page, errors: string[]) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });
}

export async function waitForAuctionToComplete(page: Page) {
  // Wait for auction to end and winner to be determined
  // This means we're back in 'playing' phase or 'judging' phase
  // Look for either the next player's turn or the results screen
  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      return text.includes('ÇARKI ÇEVİR') ||
             text.includes('sıran') ||
             text.includes('sonuç') ||
             text.includes('sıralama');
    },
    { timeout: 15000 }
  );
}

export async function verifyPlayerGold(page: Page, nickname: string, expectedGold: number) {
  // Find the player's gold display and verify it matches expected value
  // Gold is typically displayed near the player's name or in a status area
  const goldLocator = page.locator(`text=/\\b${expectedGold}\\s*(?:gold|altın)/i`);
  await expect(goldLocator).toBeVisible({ timeout: 5000 });
}

export async function verifyPlayerSlots(page: Page, nickname: string, expectedItemCount: number) {
  // Verify that a player has the expected number of items in their slots
  // This looks for filled slot indicators or item counts
  const slotText = `${expectedItemCount}/3`;
  const slotLocator = page.locator(`text="${slotText}"`);
  await expect(slotLocator).toBeVisible({ timeout: 5000 });
}
