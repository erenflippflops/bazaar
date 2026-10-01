# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fullGame.spec.ts >> Bazaar E2E Tests >> Judge failed handling
- Location: tests\e2e\fullGame.spec.ts:387:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5200/
Call log:
  - navigating to "http://localhost:5200/", waiting until "networkidle"

```

# Test source

```ts
  1   | import { Page, expect } from '@playwright/test';
  2   | 
  3   | export async function createRoom(page: Page, nickname: string) {
> 4   |   await page.goto('/', { waitUntil: 'networkidle' });
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5200/
  5   | 
  6   |   // Wait a moment for socket to connect
  7   |   await page.waitForTimeout(2000);
  8   | 
  9   |   // Fill the first nickname input (in the "Oda Kur" section)
  10  |   await page.locator('input[placeholder="İsmin"]').first().fill(nickname);
  11  |   await page.click('button:has-text("Oda Kur")');
  12  | 
  13  |   // Wait for the lobby screen with room code (this means mode switched to 'create')
  14  |   await expect(page.locator('text="ODA KODU"')).toBeVisible({ timeout: 5000 });
  15  | 
  16  |   // Wait for player name to appear (this means state_update arrived with player data)
  17  |   await expect(page.locator(`text="${nickname}"`)).toBeVisible({ timeout: 10000 });
  18  | 
  19  |   // Get the room code from the large h2 element (room codes are 4-6 uppercase letters/numbers)
  20  |   const roomCodeElement = page.locator('h2').filter({ hasText: /^[A-Z0-9]{4,6}$/ });
  21  |   await expect(roomCodeElement).toBeVisible({ timeout: 5000 });
  22  |   const roomCode = await roomCodeElement.textContent();
  23  | 
  24  |   if (!roomCode || roomCode.length < 4) throw new Error('Room code not found');
  25  |   return roomCode.trim();
  26  | }
  27  | 
  28  | export async function joinRoom(page: Page, roomCode: string, nickname: string) {
  29  |   await page.goto('/', { waitUntil: 'networkidle' });
  30  | 
  31  |   // Wait a moment for socket to connect
  32  |   await page.waitForTimeout(2000);
  33  | 
  34  |   // Fill room code input
  35  |   await page.fill('input[placeholder="Oda Kodu"]', roomCode);
  36  |   // Fill the second nickname input (in the "Odaya Katıl" section)
  37  |   await page.locator('input[placeholder="İsmin"]').nth(1).fill(nickname);
  38  |   // Click the "Katıl" button
  39  |   await page.click('button:has-text("Katıl")');
  40  | 
  41  |   // Wait for lobby screen with player list
  42  |   await expect(page.locator('text="ODA KODU"')).toBeVisible({ timeout: 5000 });
  43  |   await expect(page.locator(`text="${nickname}"`)).toBeVisible({ timeout: 10000 });
  44  | }
  45  | 
  46  | export async function startGame(page: Page) {
  47  |   await page.click('button:has-text("Oyunu Başlat")');
  48  |   // Wait for game screen - look for the spin button specifically
  49  |   await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });
  50  | }
  51  | 
  52  | export async function spinWheel(page: Page) {
  53  |   await page.click('button:has-text("ÇARKI ÇEVİR")');
  54  |   // Wait for auction phase - look for auction-related text
  55  |   await expect(page.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });
  56  | }
  57  | 
  58  | export async function placeBid(page: Page, amount: number) {
  59  |   // Click the +amount button to select increment
  60  |   const incrementButton = page.locator(`button:has-text("+${amount}")`);
  61  |   await incrementButton.click();
  62  | 
  63  |   // Wait for button to be enabled (state update + re-render)
  64  |   const bidButton = page.locator('button:has-text("TEKLİF VER")');
  65  |   await bidButton.waitFor({ state: 'visible', timeout: 5000 });
  66  |   await expect(bidButton).toBeEnabled({ timeout: 5000 });
  67  | 
  68  |   // Click "TEKLİF VER" to place the bid
  69  |   await bidButton.click();
  70  | }
  71  | 
  72  | export async function waitForPhase(page: Page, phase: string, timeout = 10000) {
  73  |   await page.waitForFunction(
  74  |     (expectedPhase) => {
  75  |       const state = (window as any).__gameState;
  76  |       return state?.phase === expectedPhase;
  77  |     },
  78  |     phase,
  79  |     { timeout }
  80  |   );
  81  | }
  82  | 
  83  | // Expose gameState to window for test assertions
  84  | export async function exposeGameState(page: Page) {
  85  |   await page.addInitScript(() => {
  86  |     (window as any).__gameState = null;
  87  |     const original = console.log;
  88  |     // Intercept state updates - adjust based on how your client stores state
  89  |   });
  90  | }
  91  | 
  92  | export function setupConsoleErrorCatcher(page: Page, errors: string[]) {
  93  |   page.on('console', msg => {
  94  |     if (msg.type() === 'error') {
  95  |       errors.push(msg.text());
  96  |     }
  97  |   });
  98  |   page.on('pageerror', err => {
  99  |     errors.push(err.message);
  100 |   });
  101 | }
  102 | 
  103 | export async function waitForAuctionToComplete(page: Page) {
  104 |   // Wait for auction to end and winner to be determined
```