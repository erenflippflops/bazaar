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

  test('Full game flow (6 players)', async ({ page, browser }) => {
    test.setTimeout(300000); // 5 minutes for 6-player game (18 auctions × ~12s + judging)
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    const roomCode = await createRoom(page, 'Player1');

    // Create 5 additional players
    const contexts: BrowserContext[] = [];
    const pages: Page[] = [page];

    for (let i = 2; i <= 6; i++) {
      const newContext = await browser.newContext();
      contexts.push(newContext);
      const newPage = await newContext.newPage();
      setupConsoleErrorCatcher(newPage, errors);
      await joinRoom(newPage, roomCode, `Player${i}`);
      pages.push(newPage);
    }

    await startGame(page);
    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });

    // Track filled slots for each player to determine when they can't bid
    const playerSlots: Record<string, number> = {
      Player1: 0, Player2: 0, Player3: 0, Player4: 0, Player5: 0, Player6: 0
    };

    // 6 players × 3 slots = EXACTLY 18 auctions
    for (let auctionNum = 1; auctionNum <= 18; auctionNum++) {
      await page.waitForTimeout(1000);

      // Find who the current opener is by checking game state on ANY page (use page 0)
      const openerInfo = await page.evaluate(() => {
        const gameState = (window as any).__gameState;
        const openerIndex = gameState?.currentOpenerIndex ?? 0;
        const opener = gameState?.players?.[openerIndex];
        return {
          index: openerIndex,
          nickname: opener?.nickname || `Player${openerIndex + 1}`
        };
      });

      const openerPage = pages[openerInfo.index];
      const openerNick = openerInfo.nickname;

      console.log(`\nAuction ${auctionNum}/18: ${openerNick} (index ${openerInfo.index}) opens`);

      // Verify opener sees spin button
      await expect(openerPage.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
      await spinWheel(openerPage);
      await expect(openerPage.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });

      // Opener places opening bid (1 gold)
      await placeBid(openerPage, 1);
      await openerPage.waitForTimeout(500);

      // Try to have another player outbid (skip opener and players with full slots)
      let someoneBid = false;
      for (let i = 0; i < pages.length; i++) {
        if (i === openerInfo.index) continue; // Skip opener

        const nickname = `Player${i + 1}`;
        if (playerSlots[nickname] >= 3) continue; // Skip players with full slots

        // Check if this player can see the bid button
        const canBid = await pages[i].locator('button:has-text("TEKLİF VER")').isVisible({ timeout: 2000 }).catch(() => false);
        if (canBid) {
          await placeBid(pages[i], 2);
          await pages[i].waitForTimeout(300);
          someoneBid = true;
          console.log(`  ${nickname} outbid with 2 gold`);
          break; // Only one player outbids per auction
        }
      }

      if (!someoneBid) {
        console.log(`  No outbid - ${openerNick} will win with opening bid`);
      }

      // Wait for auction to complete (10s bidding timer + buffer)
      await page.waitForTimeout(11000);

      // Wait for game state to update - poll until total slots increases
      const expectedTotalSlots = auctionNum;
      let auctionResult: { phase: string; slots: Record<string, number> } = { phase: '', slots: {} };
      let attempts = 0;
      const maxAttempts = 20;

      while (attempts < maxAttempts) {
        auctionResult = await page.evaluate(() => {
          const gameState = (window as any).__gameState;
          const players = gameState?.players || [];
          const slots: Record<string, number> = {};

          players.forEach((p: any, idx: number) => {
            const nick = p.nickname || `Player${idx + 1}`;
            // Count filled slots (non-null items in slots array)
            const filledSlots = (p.slots || []).filter((s: any) => s !== null).length;
            slots[nick] = filledSlots;
          });

          return {
            phase: gameState?.phase,
            slots
          };
        });

        const totalSlots = Object.values(auctionResult.slots).reduce((sum, n) => sum + n, 0);

        if (totalSlots >= expectedTotalSlots) {
          break;
        }

        attempts++;
        await page.waitForTimeout(500);
      }

      // Update our tracking with actual game state
      Object.assign(playerSlots, auctionResult.slots);

      const totalSlots = Object.values(playerSlots).reduce((sum, n) => sum + n, 0);
      console.log(`After auction ${auctionNum}: ${Object.entries(playerSlots).map(([n, s]) => `${n}=${s}`).join(', ')} (total: ${totalSlots}/18)`);

      // Verify we're making progress
      expect(totalSlots).toBe(auctionNum);

      // If this was the 18th auction, game should be transitioning to judging
      if (auctionNum === 18) {
        console.log(`\nAll 18 auctions complete! Phase: ${auctionResult.phase}`);

        // Verify each player has exactly 3 slots
        for (const [nick, count] of Object.entries(playerSlots)) {
          expect(count).toBe(3);
        }
      }
    }

    // After EXACTLY 18 auctions, game must be in judging or finished phase
    const finalPhase = await page.evaluate(() => (window as any).__gameState?.phase);
    console.log(`Final phase check: ${finalPhase}`);
    expect(['judging', 'finished']).toContain(finalPhase);

    // Wait for results screen
    await expect(page.locator('h1:has-text("BAZAAR KAPANDI")')).toBeVisible({ timeout: 30000 });

    const hasCommentary = await page.locator('text=/yorum|commentary/i').count() > 0 ||
                          await page.locator('p').filter({ hasText: /.{20,}/ }).count() > 0;

    expect(hasCommentary).toBe(true);
    expect(errors).toEqual([]);

    // Cleanup
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close();
    }
    for (const ctx of contexts) {
      await ctx.close();
    }
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
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(3000); // Buffer for socket reconnection + state update

    // Debug: Check what's actually on the page after reload
    const afterReloadDebug = await page.evaluate(() => {
      const gameState = (window as any).__gameState;
      const playerId = localStorage.getItem('playerId');
      const roomCode = localStorage.getItem('roomCode');
      const playerToken = localStorage.getItem('playerToken');
      return {
        hasGameState: !!gameState,
        phase: gameState?.phase,
        playerCount: gameState?.players?.length,
        players: gameState?.players?.map((p: any) => ({ id: p.id, nickname: p.nickname })),
        playerId,
        roomCode,
        hasToken: !!playerToken,
        pageContent: document.body.innerText.substring(0, 200)
      };
    });
    console.log('[TEST DEBUG After Reload]', JSON.stringify(afterReloadDebug, null, 2));

    // Now verify player names are visible (they're rendered in PlayerList)
    await expect(page.locator('text="Player1"')).toBeVisible({ timeout: 10000 });
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
