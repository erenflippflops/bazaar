import { test } from '@playwright/test';
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';

interface SocketEvent {
  type: 'emit' | 'receive';
  event: string;
  data: any;
  timestamp: string;
  browser: string;
}

interface GameStateChange {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  browser: string;
}

test('Debug wheel spin with two browsers', async () => {
  test.setTimeout(120000); // 2 minutes
  let browser1: Browser;
  let browser2: Browser;
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  const consoleLog1: any[] = [];
  const consoleLog2: any[] = [];
  const socketEvents1: SocketEvent[] = [];
  const socketEvents2: SocketEvent[] = [];
  const gameStateChanges1: GameStateChange[] = [];
  const gameStateChanges2: GameStateChange[] = [];

  try {
    // Launch two separate browsers
    browser1 = await chromium.launch({ headless: false });
    browser2 = await chromium.launch({ headless: false });

    context1 = await browser1.newContext();
    context2 = await browser2.newContext();

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // Setup monitoring for Browser 1
    page1.on('console', msg => {
      const text = msg.text();
      const logEntry = {
        type: msg.type(),
        text,
        timestamp: new Date().toISOString()
      };
      consoleLog1.push(logEntry);
      console.log(`[BROWSER1 ${msg.type().toUpperCase()}]`, text);
    });

    // Setup monitoring for Browser 2
    page2.on('console', msg => {
      const text = msg.text();
      const logEntry = {
        type: msg.type(),
        text,
        timestamp: new Date().toISOString()
      };
      consoleLog2.push(logEntry);
      console.log(`[BROWSER2 ${msg.type().toUpperCase()}]`, text);
    });

    // Inject socket and gameState monitoring into Browser 1
    await page1.addInitScript(() => {
      (window as any).__socketEvents = [];
      (window as any).__gameStateHistory = [];
      (window as any).__lastGameState = null;
      (window as any).__spinKeyHistory = [];

      // Monitor gameState changes
      const originalDefineProperty = Object.defineProperty;
      let watchingState = false;

      setInterval(() => {
        if (!watchingState && (window as any).__gameState) {
          watchingState = true;
          const state = (window as any).__gameState;
          const lastState = (window as any).__lastGameState;

          if (JSON.stringify(state) !== JSON.stringify(lastState)) {
            const change = {
              timestamp: new Date().toISOString(),
              phase: state.phase,
              revealedItem: state.revealedItem,
              wheel: state.wheel,
              currentOpenerIndex: state.currentOpenerIndex
            };
            (window as any).__gameStateHistory.push(change);
            console.log('GAMESTATE CHANGE:', change);
            (window as any).__lastGameState = JSON.parse(JSON.stringify(state));
          }
        }
      }, 100);
    });

    // Inject socket and gameState monitoring into Browser 2
    await page2.addInitScript(() => {
      (window as any).__socketEvents = [];
      (window as any).__gameStateHistory = [];
      (window as any).__lastGameState = null;
      (window as any).__spinKeyHistory = [];

      // Monitor gameState changes
      const originalDefineProperty = Object.defineProperty;
      let watchingState = false;

      setInterval(() => {
        if (!watchingState && (window as any).__gameState) {
          watchingState = true;
          const state = (window as any).__gameState;
          const lastState = (window as any).__lastGameState;

          if (JSON.stringify(state) !== JSON.stringify(lastState)) {
            const change = {
              timestamp: new Date().toISOString(),
              phase: state.phase,
              revealedItem: state.revealedItem,
              wheel: state.wheel,
              currentOpenerIndex: state.currentOpenerIndex
            };
            (window as any).__gameStateHistory.push(change);
            console.log('GAMESTATE CHANGE:', change);
            (window as any).__lastGameState = JSON.parse(JSON.stringify(state));
          }
        }
      }, 100);
    });

    console.log('\n=== BROWSER 1: Creating room ===');
    await page1.goto('http://localhost:5200', { waitUntil: 'networkidle' });
    await page1.waitForTimeout(2000);
    await page1.locator('input[placeholder="İsmin"]').first().fill('Player1');
    await page1.click('button:has-text("Oda Kur")');
    await page1.waitForSelector('text="ODA KODU"', { timeout: 5000 });

    const roomCodeElement = page1.locator('h2').filter({ hasText: /^[A-Z0-9]{4,6}$/ });
    await roomCodeElement.waitFor({ timeout: 5000 });
    const roomCode = (await roomCodeElement.textContent())?.trim();
    console.log('Room code:', roomCode);

    console.log('\n=== BROWSER 2: Joining room ===');
    await page2.goto('http://localhost:5200', { waitUntil: 'networkidle' });
    await page2.waitForTimeout(2000);
    await page2.fill('input[placeholder="Oda Kodu"]', roomCode!);
    await page2.locator('input[placeholder="İsmin"]').nth(1).fill('Player2');
    await page2.click('button:has-text("Katıl")');
    await page2.waitForSelector('text="ODA KODU"', { timeout: 5000 });

    console.log('\n=== BROWSER 1: Starting game ===');
    await page1.waitForTimeout(1000);
    await page1.click('button:has-text("Oyunu Başlat")');

    console.log('\n=== Waiting for game to start on both browsers ===');
    await page1.waitForTimeout(3000);
    await page2.waitForTimeout(3000);

    // Check initial state on both browsers
    console.log('\n=== CHECKING INITIAL GAME STATE ===');

    const state1 = await page1.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const spinButton = buttons.find(b => b.innerText.includes('ÇARKI ÇEVİR'));
      return {
        bodyText: document.body.innerText,
        hasSpinButton: !!spinButton,
        hasWheel: !!document.querySelector('canvas'),
        spinButtonVisible: !!spinButton && !spinButton.hidden,
        allButtons: buttons.map(b => b.innerText),
        hasSpinningText: document.body.innerText.includes('Çark çevriliyor'),
        socketEvents: (window as any).__socketEvents || []
      };
    });

    const state2 = await page2.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const spinButton = buttons.find(b => b.innerText.includes('ÇARKI ÇEVİR'));
      return {
        bodyText: document.body.innerText,
        hasSpinButton: !!spinButton,
        hasWheel: !!document.querySelector('canvas'),
        spinButtonVisible: !!spinButton && !spinButton.hidden,
        allButtons: buttons.map(b => b.innerText),
        hasSpinningText: document.body.innerText.includes('Çark çevriliyor'),
        socketEvents: (window as any).__socketEvents || []
      };
    });

    console.log('\nBROWSER 1 STATE:');
    console.log('  Buttons:', state1.allButtons);
    console.log('  Has "Çark çevriliyor":', state1.hasSpinningText);
    console.log('  Has spin button:', state1.hasSpinButton);
    console.log('  Has wheel:', state1.hasWheel);

    console.log('\nBROWSER 2 STATE:');
    console.log('  Buttons:', state2.allButtons);
    console.log('  Has "Çark çevriliyor":', state2.hasSpinningText);
    console.log('  Has spin button:', state2.hasSpinButton);
    console.log('  Has wheel:', state2.hasWheel);

    // Take screenshots
    await page1.screenshot({ path: 'test-results/browser1-initial.png', fullPage: true });
    await page2.screenshot({ path: 'test-results/browser2-initial.png', fullPage: true });
    console.log('\nScreenshots saved: test-results/browser1-initial.png, test-results/browser2-initial.png');

    // Check if "Çark çevriliyor" appears without button
    if (state1.hasSpinningText && !state1.spinButtonVisible) {
      console.log('\n🔴 ISSUE FOUND ON BROWSER 1: "Çark çevriliyor" showing but no spin button!');
      await page1.screenshot({ path: 'test-results/browser1-spinning-no-button.png', fullPage: true });
    }

    if (state2.hasSpinningText && !state2.spinButtonVisible) {
      console.log('\n🔴 ISSUE FOUND ON BROWSER 2: "Çark çevriliyor" showing but no spin button!');
      await page2.screenshot({ path: 'test-results/browser2-spinning-no-button.png', fullPage: true });
    }

    // Try to read canSpin prop and wheel state from React components
    const reactState1 = await page1.evaluate(() => {
      const allProps: any[] = [];
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const keys = Object.keys(el);
        const reactKey = keys.find(k => k.startsWith('__react'));
        if (reactKey) {
          const fiber = (el as any)[reactKey];
          if (fiber?.memoizedProps?.canSpin !== undefined) {
            allProps.push({
              tag: el.tagName,
              canSpin: fiber.memoizedProps.canSpin,
              isSpinning: fiber.memoizedProps.isSpinning
            });
          }
        }
      });
      return allProps;
    });

    const reactState2 = await page2.evaluate(() => {
      const allProps: any[] = [];
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const keys = Object.keys(el);
        const reactKey = keys.find(k => k.startsWith('__react'));
        if (reactKey) {
          const fiber = (el as any)[reactKey];
          if (fiber?.memoizedProps?.canSpin !== undefined) {
            allProps.push({
              tag: el.tagName,
              canSpin: fiber.memoizedProps.canSpin,
              isSpinning: fiber.memoizedProps.isSpinning
            });
          }
        }
      });
      return allProps;
    });

    console.log('\nBROWSER 1 REACT STATE (canSpin props):');
    console.log(JSON.stringify(reactState1, null, 2));

    console.log('\nBROWSER 2 REACT STATE (canSpin props):');
    console.log(JSON.stringify(reactState2, null, 2));

    // Wait a bit to see if wheel auto-spins
    console.log('\n=== Waiting 5 seconds to check for auto-spin ===');
    await page1.waitForTimeout(5000);

    const afterWait1 = await page1.evaluate(() => ({
      hasAuctionText: document.body.innerText.includes('Açılış teklifi') || document.body.innerText.includes('Teklif Ver'),
      bodySnippet: document.body.innerText.substring(0, 300)
    }));

    const afterWait2 = await page2.evaluate(() => ({
      hasAuctionText: document.body.innerText.includes('Açılış teklifi') || document.body.innerText.includes('Teklif Ver'),
      bodySnippet: document.body.innerText.substring(0, 300)
    }));

    console.log('\nAfter 5 seconds wait:');
    console.log('BROWSER 1 - Has auction text:', afterWait1.hasAuctionText);
    console.log('BROWSER 2 - Has auction text:', afterWait2.hasAuctionText);

    if (afterWait1.hasAuctionText || afterWait2.hasAuctionText) {
      console.log('\n🔴 WHEEL AUTO-SPUN WITHOUT USER CLICK!');
    }

    await page1.screenshot({ path: 'test-results/browser1-after-wait.png', fullPage: true });
    await page2.screenshot({ path: 'test-results/browser2-after-wait.png', fullPage: true });

    // Collect all socket events
    const finalSocketEvents1 = await page1.evaluate(() => (window as any).__socketEvents || []);
    const finalSocketEvents2 = await page2.evaluate(() => (window as any).__socketEvents || []);
    const gameStateHistory1 = await page1.evaluate(() => (window as any).__gameStateHistory || []);
    const gameStateHistory2 = await page2.evaluate(() => (window as any).__gameStateHistory || []);

    console.log('\n=== BROWSER 1 GAMESTATE HISTORY ===');
    gameStateHistory1.forEach((change: any) => {
      console.log(`[${change.timestamp}] Phase: ${change.phase}, RevealedItem: ${change.revealedItem?.name || 'null'}, Wheel: ${change.wheel}, OpenerIndex: ${change.currentOpenerIndex}`);
    });

    console.log('\n=== BROWSER 2 GAMESTATE HISTORY ===');
    gameStateHistory2.forEach((change: any) => {
      console.log(`[${change.timestamp}] Phase: ${change.phase}, RevealedItem: ${change.revealedItem?.name || 'null'}, Wheel: ${change.wheel}, OpenerIndex: ${change.currentOpenerIndex}`);
    });

    console.log('\n=== BROWSER 1 SOCKET EVENTS ===');
    finalSocketEvents1.forEach((evt: any) => {
      console.log(`[${evt.timestamp}] ${evt.type.toUpperCase()}: ${evt.event}`,
                  JSON.stringify(evt.data).substring(0, 200));
    });

    console.log('\n=== BROWSER 2 SOCKET EVENTS ===');
    finalSocketEvents2.forEach((evt: any) => {
      console.log(`[${evt.timestamp}] ${evt.type.toUpperCase()}: ${evt.event}`,
                  JSON.stringify(evt.data).substring(0, 200));
    });

    // Final report
    console.log('\n=== FINAL REPORT ===');
    console.log('1. "Çark çevriliyor" appeared on Browser 1:', state1.hasSpinningText);
    console.log('2. "Çark çevriliyor" appeared on Browser 2:', state2.hasSpinningText);
    console.log('3. Spin button visible on Browser 1:', state1.spinButtonVisible);
    console.log('4. Spin button visible on Browser 2:', state2.spinButtonVisible);
    console.log('5. Wheel auto-spun:', afterWait1.hasAuctionText || afterWait2.hasAuctionText);
    console.log('6. Total socket events Browser 1:', finalSocketEvents1.length);
    console.log('7. Total socket events Browser 2:', finalSocketEvents2.length);
    console.log('8. Console logs Browser 1:', consoleLog1.length);
    console.log('9. Console logs Browser 2:', consoleLog2.length);

  } finally {
    // Keep browsers open for manual inspection
    console.log('\n=== Browsers will remain open for 30 seconds for inspection ===');
    await new Promise(resolve => setTimeout(resolve, 30000));

    if (browser1) await browser1.close();
    if (browser2) await browser2.close();
  }
});
