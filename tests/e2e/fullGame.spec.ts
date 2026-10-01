import { test, expect, Page, BrowserContext } from '@playwright/test';
import { createRoom, joinRoom, startGame, spinWheel, placeBid, setupConsoleErrorCatcher } from './helpers';

test.describe('Bazaar E2E Tests', () => {
  test('Create and join with 2 players', async ({ page, browser }) => {
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    const roomCode = await createRoom(page, 'Player1');

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    setupConsoleErrorCatcher(page2, errors);
    await joinRoom(page2, roomCode, 'Player2');

    await expect(page.locator('text="Player1"')).toBeVisible();
    await expect(page.locator('text="Player2"')).toBeVisible();

    expect(errors).toEqual([]);
    await page2.close();
    await context2.close();
  });

  test('Create and join with 6 players', async ({ page, browser }) => {
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    const roomCode = await createRoom(page, 'Player1');

    const pages: Page[] = [page];
    const contexts: BrowserContext[] = [];
    for (let i = 2; i <= 6; i++) {
      const newContext = await browser.newContext();
      contexts.push(newContext);
      const newPage = await newContext.newPage();
      setupConsoleErrorCatcher(newPage, errors);
      await joinRoom(newPage, roomCode, `Player${i}`);
      pages.push(newPage);
    }

    for (let i = 1; i <= 6; i++) {
      await expect(page.locator(`text="Player${i}"`)).toBeVisible();
    }

    await startGame(page);
    await expect(page.locator('text=/çark|wheel|güç|item/i').first()).toBeVisible();

    expect(errors).toEqual([]);

    for (let i = 1; i < pages.length; i++) {
      await pages[i].close();
    }
    for (const ctx of contexts) {
      await ctx.close();
    }
  });

  test('Full game flow (2 players)', async ({ page, browser }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    const roomCode = await createRoom(page, 'Alice');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    setupConsoleErrorCatcher(page2, errors);
    await joinRoom(page2, roomCode, 'Bob');

    await startGame(page);
    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=/çeviriyor|izliyorsun/i')).toBeVisible({ timeout: 5000 });

    // Track filled slots for each player to determine when they can't bid
    const playerSlots = { Alice: 0, Bob: 0 };

    // 2 players × 3 slots = EXACTLY 6 auctions
    for (let auctionNum = 1; auctionNum <= 6; auctionNum++) {
      await page.waitForTimeout(1000);

      const aliceIsOpener = await page.evaluate(() => {
        const gameState = (window as any).__gameState;
        const playerId = localStorage.getItem('playerId');
        const currentOpener = gameState?.players?.[gameState?.currentOpenerIndex];
        return currentOpener?.id === playerId;
      });

      const spinnerPage = aliceIsOpener ? page : page2;
      const otherPage = aliceIsOpener ? page2 : page;
      const spinnerName = aliceIsOpener ? 'Alice' : 'Bob';
      const otherName = aliceIsOpener ? 'Bob' : 'Alice';

      console.log(`Auction ${auctionNum}/6: ${spinnerName}'s turn to open`);

      await expect(spinnerPage.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
      await spinWheel(spinnerPage);
      await expect(spinnerPage.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });

      // Opener places opening bid
      await placeBid(spinnerPage, 1);
      await spinnerPage.waitForTimeout(500);

      // Other player bids if they have slots available
      if (playerSlots[otherName] < 3) {
        await expect(otherPage.locator('button:has-text("TEKLİF VER")')).toBeVisible({ timeout: 5000 });
        await placeBid(otherPage, 2);
      }

      // Wait for auction to complete (10s bidding timer + buffer)
      await page.waitForTimeout(11000);

      // Winner gets the item - in this test flow, Bob always outbids with 2
      if (playerSlots[otherName] < 3) {
        playerSlots[otherName]++;
      } else {
        playerSlots[spinnerName]++;
      }

      console.log(`After auction ${auctionNum}: Alice=${playerSlots.Alice} items, Bob=${playerSlots.Bob} items`);
    }

    // After EXACTLY 6 auctions, game must be in judging or finished phase
    const phase = await page.evaluate(() => (window as any).__gameState?.phase);
    expect(['judging', 'finished']).toContain(phase);

    await expect(page.locator('h1:has-text("BAZAAR KAPANDI")')).toBeVisible({ timeout: 30000 });
    await expect(page2.locator('h1:has-text("BAZAAR KAPANDI")')).toBeVisible({ timeout: 30000 });

    const hasCommentary = await page.locator('text=/yorum|commentary/i').count() > 0 ||
                          await page.locator('p').filter({ hasText: /.{20,}/ }).count() > 0;

    expect(hasCommentary).toBe(true);
    expect(errors).toEqual([]);

    await page2.close();
    await context2.close();
  });

  test('Reconnect after reload', async ({ page, browser }) => {
    test.setTimeout(90000); // 1.5 minutes for reconnect test
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    const roomCode = await createRoom(page, 'Player1');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    setupConsoleErrorCatcher(page2, errors);
    await joinRoom(page2, roomCode, 'Player2');
    await startGame(page);

    const debugInfo = await page.evaluate(() => {
      const gameState = (window as any).__gameState;
      const playerId = localStorage.getItem('playerId');
      const myPlayer = gameState?.players?.find((p: any) => p.id === playerId);
      const currentOpener = gameState?.players?.[gameState?.currentOpenerIndex];
      return {
        playerId,
        myPlayerId: myPlayer?.id,
        myPlayerMaxBid: myPlayer?.maxBid,
        myPlayerGold: myPlayer?.gold,
        currentOpenerId: currentOpener?.id,
        currentOpenerIndex: gameState?.currentOpenerIndex,
        playersCount: gameState?.players?.length,
        players: gameState?.players?.map((p: any) => ({ id: p.id, nickname: p.nickname, maxBid: p.maxBid, gold: p.gold }))
      };
    });
    console.log('[TEST DEBUG Reconnect]', JSON.stringify(debugInfo, null, 2));

    // Debug console logs
    page.on('console', msg => console.log('[Browser Console]', msg.text()));
    page2.on('console', msg => console.log('[Browser Console]', msg.text()));

    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
    await spinWheel(page);
    await expect(page.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });
    await placeBid(page, 1);
    await page.waitForTimeout(500);
    await placeBid(page2, 2);
    await page.waitForTimeout(11000);

    await expect(page2.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
    await spinWheel(page2);
    await expect(page2.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });
    await placeBid(page2, 1);
    await page.waitForTimeout(500);
    await placeBid(page, 2);
    await page.waitForTimeout(11000);

    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });

    await page.reload();
    setupConsoleErrorCatcher(page, errors);

    // Wait for socket reconnection and game state restoration
    // After reload, game could be in any phase, so wait for any game UI element
    await expect(page.locator('[class*="game"], button, h1, h2').first()).toBeVisible({ timeout: 10000 });

    // Now verify player names are visible
    await expect(page.locator('text="Player1"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text="Player2"')).toBeVisible({ timeout: 5000 });

    expect(errors).toEqual([]);

    await page2.close();
    await context2.close();
  });

  test('Judge failed handling', async ({ page, browser }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    // Create room with special player name that triggers judge failure
    const roomCode = await createRoom(page, 'FailJudge');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    setupConsoleErrorCatcher(page2, errors);
    await joinRoom(page2, roomCode, 'Bob');

    await startGame(page);
    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });

    // Play through 6 auctions to trigger judging
    for (let auctionNum = 1; auctionNum <= 6; auctionNum++) {
      await page.waitForTimeout(1000);

      const aliceIsOpener = await page.evaluate(() => {
        const gameState = (window as any).__gameState;
        const playerId = localStorage.getItem('playerId');
        const currentOpener = gameState?.players?.[gameState?.currentOpenerIndex];
        return currentOpener?.id === playerId;
      });

      const spinnerPage = aliceIsOpener ? page : page2;
      const otherPage = aliceIsOpener ? page2 : page;

      await expect(spinnerPage.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
      await spinWheel(spinnerPage);
      await expect(spinnerPage.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });

      await placeBid(spinnerPage, 1);
      await spinnerPage.waitForTimeout(500);

      const otherCanBid = await otherPage.locator('button:has-text("TEKLİF VER")').isVisible().catch(() => false);
      if (otherCanBid) {
        await placeBid(otherPage, 2);
      }

      await page.waitForTimeout(11000);
    }

    // Wait for judge to fail
    await expect(page.locator('text="Hakem Kafayı Yedi!"')).toBeVisible({ timeout: 30000 });
    await expect(page2.locator('text="Hakem Kafayı Yedi!"')).toBeVisible({ timeout: 30000 });

    // Verify error message is shown
    await expect(page.locator('text=/Sıralamada bir sorun oluştu/i')).toBeVisible();

    // Verify retry button is visible for host (page) but not for non-host (page2)
    await expect(page.locator('button:has-text("Tekrar Dene")')).toBeVisible();
    await expect(page2.locator('button:has-text("Tekrar Dene")')).not.toBeVisible();

    // Host clicks retry (fake judge will succeed on second attempt)
    await page.click('button:has-text("Tekrar Dene")');

    // Judge should succeed this time and show results
    await expect(page.locator('h1:has-text("BAZAAR KAPANDI")')).toBeVisible({ timeout: 30000 });
    await expect(page2.locator('h1:has-text("BAZAAR KAPANDI")')).toBeVisible({ timeout: 30000 });

    // Verify commentary is shown
    const hasCommentary = await page.locator('text=/yorum|commentary/i').count() > 0 ||
                          await page.locator('p').filter({ hasText: /.{20,}/ }).count() > 0;
    expect(hasCommentary).toBe(true);

    expect(errors).toEqual([]);

    await page2.close();
    await context2.close();
  });
});
