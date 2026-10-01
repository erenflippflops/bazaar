import { test, expect } from '@playwright/test';

test('Monitor Socket.IO connections and events', async ({ page }) => {
  const socketEvents: any[] = [];
  const networkRequests: any[] = [];
  const wsMessages: any[] = [];

  // Monitor all network requests
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      type: request.resourceType(),
      timestamp: new Date().toISOString()
    });
  });

  // Monitor WebSocket frames
  page.on('websocket', ws => {
    console.log('WebSocket connection opened:', ws.url());

    ws.on('framesent', event => {
      console.log('→ WS Frame sent:', event.payload);
      wsMessages.push({ direction: 'sent', payload: event.payload, timestamp: new Date().toISOString() });
    });

    ws.on('framereceived', event => {
      console.log('← WS Frame received:', event.payload);
      wsMessages.push({ direction: 'received', payload: event.payload, timestamp: new Date().toISOString() });
    });
  });

  // Monitor console for Socket.IO debug logs
  page.on('console', msg => {
    if (msg.text().includes('socket') || msg.text().includes('Socket.IO')) {
      console.log('Browser console:', msg.text());
    }
  });

  console.log('\n=== NAVIGATING TO APP ===');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  console.log('\n=== INITIAL PAGE LOAD ===');
  console.log('Network requests:', networkRequests.length);
  console.log('WebSocket messages:', wsMessages.length);

  // Create a room
  // Take screenshot to see what's on screen
  await page.screenshot({ path: 'test-results/initial-screen.png', fullPage: true });
  console.log('Screenshot saved to test-results/initial-screen.png');

  // Check page content
  console.log('\n=== PAGE TITLE ===');
  console.log(await page.title());

  console.log('\n=== VISIBLE TEXT ===');
  const bodyText = await page.locator('body').textContent();
  console.log(bodyText?.substring(0, 500));

  console.log('\n=== BUTTONS ON PAGE ===');
  const buttons = await page.locator('button').all();
  for (const button of buttons) {
    const text = await button.textContent();
    console.log(`Button: "${text}"`);
  }

  console.log('\n=== CREATING ROOM ===');
  await page.fill('input[type="text"]', 'TestPlayer');
  await page.click('button:has-text("Oda Oluştur")').catch(async (e) => {
    console.log('Failed to click "Oda Oluştur", trying alternatives...');
    // Try alternative selectors
    const createButton = page.locator('button').filter({ hasText: 'Oda' }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      throw e;
    }
  });

  await page.waitForTimeout(2000);

  console.log('After room creation:');
  console.log('Total network requests:', networkRequests.length);
  console.log('Total WS messages:', wsMessages.length);

  // Check if we're in lobby
  const lobbyVisible = await page.locator('text=Oda Kodu').isVisible().catch(() => false);
  console.log('Lobby visible:', lobbyVisible);

  if (lobbyVisible) {
    const roomCode = await page.locator('text=Oda Kodu').locator('..').locator('code').textContent();
    console.log('Room code:', roomCode);

    // Try to start game
    console.log('\n=== STARTING GAME ===');
    const startButton = page.locator('button:has-text("Oyunu Başlat")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    // Check for wheel
    console.log('\n=== CHECKING FOR WHEEL ===');
    const wheelVisible = await page.locator('.wheel').isVisible().catch(() => false);
    console.log('Wheel visible:', wheelVisible);

    if (wheelVisible) {
      const spinButton = page.locator('button:has-text("Çarkı Çevir")');
      if (await spinButton.isVisible()) {
        console.log('\n=== SPINNING WHEEL ===');
        await spinButton.click();
        await page.waitForTimeout(3000);
      }

      // Check for bidding panel
      const biddingVisible = await page.locator('text=Açılış Teklifi').isVisible().catch(() => false);
      console.log('Bidding panel visible:', biddingVisible);

      if (biddingVisible) {
        console.log('\n=== PLACING BID ===');
        const bidButton = page.locator('button:has-text("Teklif Ver")').first();
        if (await bidButton.isVisible()) {
          await bidButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  }

  // Final summary
  console.log('\n=== FINAL SUMMARY ===');
  console.log('Total network requests:', networkRequests.length);
  console.log('Total WebSocket messages:', wsMessages.length);

  console.log('\n=== SOCKET.IO REQUESTS ===');
  const socketRequests = networkRequests.filter(req =>
    req.url.includes('socket.io') || req.url.includes('ws://') || req.url.includes('wss://')
  );
  socketRequests.forEach(req => {
    console.log(`${req.method} ${req.url} (${req.type})`);
  });

  console.log('\n=== WEBSOCKET MESSAGES (last 20) ===');
  wsMessages.slice(-20).forEach(msg => {
    console.log(`${msg.direction.padEnd(8)} ${msg.timestamp} ${msg.payload.substring(0, 100)}`);
  });

  // Write detailed report
  const report = {
    summary: {
      totalRequests: networkRequests.length,
      totalWsMessages: wsMessages.length,
      socketIoRequests: socketRequests.length
    },
    socketRequests,
    wsMessages,
    allRequests: networkRequests
  };

  await page.evaluate((data) => {
    console.log('REPORT:', JSON.stringify(data, null, 2));
  }, report);
});
