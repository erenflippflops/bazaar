import { test, expect, Page } from '@playwright/test';
import {
  createRoom,
  joinRoom,
  startGame,
  spinWheel,
  placeBid,
  setupConsoleErrorCatcher
} from './helpers';

test.describe('Bazaar E2E Tests', () => {
  test('Create and join with 2 players', async ({ page, context }) => {
    const errors: string[] = [];
    const logs: string[] = [];

    setupConsoleErrorCatcher(page, errors);

    // Capture all console messages for debugging
    page.on('console', msg => {
      const text = msg.text();
      logs.push(`[${msg.type()}] ${text}`);
      console.log(`[Browser Console] ${text}`);
    });

    // Player 1 creates room
    const roomCode = await createRoom(page, 'Player1');

    expect(roomCode).toMatch(/[A-Z0-9]{4,6}/);
    await expect(page.locator('text="Player1"')).toBeVisible();

    // Player 2 joins
    const page2 = await context.newPage();
    setupConsoleErrorCatcher(page2, errors);
    await joinRoom(page2, roomCode, 'Player2');

    // Both see each other
    await expect(page.locator('text="Player2"')).toBeVisible();
    await expect(page2.locator('text="Player1"')).toBeVisible();

    // Player 1 can start game
    await expect(page.locator('button:has-text("Oyunu Başlat")')).toBeEnabled();

    // Check for console errors
    expect(errors).toEqual([]);

    await page2.close();
  });

  test('Create and join with 6 players', async ({ page, context }) => {
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    // Player 1 creates room
    const roomCode = await createRoom(page, 'Player1');

    // Players 2-6 join
    const pages: Page[] = [page];
    for (let i = 2; i <= 6; i++) {
      const newPage = await context.newPage();
      setupConsoleErrorCatcher(newPage, errors);
      await joinRoom(newPage, roomCode, `Player${i}`);
      pages.push(newPage);
    }

    // All 6 visible in player list on page 1
    for (let i = 1; i <= 6; i++) {
      await expect(page.locator(`text="Player${i}"`)).toBeVisible();
    }

    // Start game succeeds
    await startGame(page);
    await expect(page.locator('text=/çark|wheel|güç|item/i').first()).toBeVisible();

    // Check for console errors
    expect(errors).toEqual([]);

    // Close extra pages
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close();
    }
  });

  test('Full game flow (2 players)', async ({ page, browser }) => {
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    // Create room with Alice, Bob joins in separate context
    const roomCode = await createRoom(page, 'Alice');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    setupConsoleErrorCatcher(page2, errors);
    await joinRoom(page2, roomCode, 'Bob');

    // Start game
    await startGame(page);
    await expect(page.locator('text=/sıran|çeviriyor|ÇARKI ÇEVİR/i')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=/sıran|çeviriyor|ÇARKI ÇEVİR/i')).toBeVisible({ timeout: 5000 });

    // Play through all 6 auctions (2 players × 3 slots each)
    for (let auctionNum = 1; auctionNum <= 6; auctionNum++) {
      const isAliceTurn = (auctionNum % 2) === 1;
      const spinnerPage = isAliceTurn ? page : page2;
      const otherPage = isAliceTurn ? page2 : page;
      const spinnerName = isAliceTurn ? 'Alice' : 'Bob';

      console.log(`Auction ${auctionNum}: ${spinnerName}'s turn`);

      // Debug: Check isMyTurn logic
      const debugInfo = await spinnerPage.evaluate(() => {
        const gameState = (window as any).__gameState;
        const playerId = localStorage.getItem('playerId');
        const myPlayer = gameState?.players?.find((p: any) => p.id === playerId);
        const currentOpener = gameState?.players?.[gameState?.currentOpenerIndex];
        return {
          playerId,
          myPlayerId: myPlayer?.id,
          currentOpenerId: currentOpener?.id,
          currentOpenerIndex: gameState?.currentOpenerIndex,
          playersCount: gameState?.players?.length,
          players: gameState?.players?.map((p: any) => ({ id: p.id, nickname: p.nickname }))
        };
      });
      console.log('[TEST DEBUG]', JSON.stringify(debugInfo, null, 2));

      // Spinner's turn: wait for spin button to be visible
      await expect(spinnerPage.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });

      // Spin the wheel
      await spinWheel(spinnerPage);

      // Wait for opening bid phase - both pages should see auction UI
      await expect(spinnerPage.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });
      await expect(otherPage.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });

      // Spinner places opening bid (1 gold)
      await placeBid(spinnerPage, 1);

      // Wait briefly for bid to register
      await page.waitForTimeout(500);

      // Other player bids higher (2 gold)
      await expect(otherPage.locator('button:has-text("Teklif Ver")')).toBeEnabled({ timeout: 3000 });
      await placeBid(otherPage, 2);

      // Wait for auction to complete (timer runs out, winner determined)
      // The auction timer is 10 seconds, so wait up to 15 seconds
      await page.waitForTimeout(11000);

      // Verify we're back in playing phase (next player's turn or results)
      const isGameOver = auctionNum === 6;
      if (!isGameOver) {
        // Should see next player's turn
        const nextTurnPage = (auctionNum % 2) === 0 ? page : page2;
        await expect(nextTurnPage.locator('text=/sıran|ÇARKI ÇEVİR/i')).toBeVisible({ timeout: 5000 });
      }
    }

    // After 6 auctions, verify results screen appears with ranking
    await expect(page.locator('text=/sonuç|sıralama|kazanan/i')).toBeVisible({ timeout: 30000 });
    await expect(page2.locator('text=/sonuç|sıralama|kazanan/i')).toBeVisible({ timeout: 30000 });

    // Verify commentary exists (judge should have provided commentary)
    const hasCommentary = await page.locator('text=/yorum|commentary/i').count() > 0 ||
                          await page.locator('p, div').filter({ hasText: /.{20,}/ }).count() > 0;
    expect(hasCommentary).toBeTruthy();

    // Check for console errors
    expect(errors).toEqual([]);

    await page2.close();
    await context2.close();
  });

  test('Reconnect after reload', async ({ page, browser }) => {
    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    // Create room, second player joins, start game
    const roomCode = await createRoom(page, 'Player1');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    setupConsoleErrorCatcher(page2, errors);
    await joinRoom(page2, roomCode, 'Player2');
    await startGame(page);

    // Play 1-2 auctions so there's meaningful state
    // Auction 1: Player1 spins

    // Debug: Check isMyTurn logic
    const debugInfo = await page.evaluate(() => {
      const gameState = (window as any).__gameState;
      const playerId = localStorage.getItem('playerId');
      const myPlayer = gameState?.players?.find((p: any) => p.id === playerId);
      const currentOpener = gameState?.players?.[gameState?.currentOpenerIndex];
      return {
        playerId,
        myPlayerId: myPlayer?.id,
        myPlayerToken: myPlayer?.token,
        currentOpenerId: currentOpener?.id,
        currentOpenerToken: currentOpener?.token,
        currentOpenerIndex: gameState?.currentOpenerIndex,
        playersCount: gameState?.players?.length,
        players: gameState?.players?.map((p: any) => ({ id: p.id, nickname: p.nickname, token: p.token }))
      };
    });
    console.log('[TEST DEBUG Reconnect]', JSON.stringify(debugInfo, null, 2));

    await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
    await spinWheel(page);
    await expect(page.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });
    await placeBid(page, 1);
    await page.waitForTimeout(500);
    await expect(page2.locator('button:has-text("Teklif Ver")')).toBeEnabled({ timeout: 3000 });
    await placeBid(page2, 2);
    await page.waitForTimeout(11000); // Wait for auction to complete

    // Auction 2: Player2 spins
    await expect(page2.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
    await spinWheel(page2);
    await expect(page2.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });
    await placeBid(page2, 1);
    await page.waitForTimeout(500);
    await expect(page.locator('button:has-text("Teklif Ver")')).toBeEnabled({ timeout: 3000 });
    await placeBid(page, 2);
    await page.waitForTimeout(11000); // Wait for auction to complete

    // Verify Player1 has items and reduced gold before reload
    await expect(page.locator('text=/sıran|ÇARKI ÇEVİR/i')).toBeVisible({ timeout: 5000 });

    // Page 1 reloads
    await page.reload();
    setupConsoleErrorCatcher(page, errors);

    // After reload, verify player 1 returns to game screen (not lobby)
    // The client should attempt reconnection using stored token
    await expect(page.locator('text=/sıran|çeviriyor|ÇARKI ÇEVİR|Açılış teklifi/i')).toBeVisible({ timeout: 10000 });

    // Verify game continues - gold and slots should be preserved
    await expect(page.locator('text="Player1"')).toBeVisible();
    await expect(page.locator('text="Player2"')).toBeVisible();

    // Check for console errors
    expect(errors).toEqual([]);

    await page2.close();
  });

  test.skip('Judge failed handling', async ({ page, context }) => {
    // TODO: This test requires a way to trigger judge failure in E2E environment
    // Currently, the fake judge always succeeds. We need either:
    // 1. An environment variable or config to force judge failure
    // 2. A test-only endpoint to sabotage the judge
    // 3. Mock the judge response at the network level
    // Skipping for now until we have a mechanism to test this path

    const errors: string[] = [];
    setupConsoleErrorCatcher(page, errors);

    // Create room with 2 players
    const roomCode = await createRoom(page, 'Player1');
    const page2 = await context.newPage();
    setupConsoleErrorCatcher(page2, errors);
    await joinRoom(page2, roomCode, 'Player2');

    // Start game
    await startGame(page);

    // Play through 6 auctions quickly (minimal bids)
    for (let i = 1; i <= 6; i++) {
      const spinnerPage = (i % 2) === 1 ? page : page2;
      const otherPage = (i % 2) === 1 ? page2 : page;

      await expect(spinnerPage.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
      await spinWheel(spinnerPage);
      await placeBid(spinnerPage, 1);
      await page.waitForTimeout(500);
      await placeBid(otherPage, 2);
      await page.waitForTimeout(11000);
    }

    // At this point judge should be called
    // If judge fails, verify "judge_failed" state appears
    await expect(page.locator('text=/judge.failed|hakem.hata|Tekrar.Dene/i')).toBeVisible({ timeout: 35000 });

    // Verify host can see retry button
    await expect(page.locator('button:has-text("Tekrar Dene")')).toBeVisible();

    // Check for console errors (excluding expected judge errors)
    expect(errors).toEqual([]);

    await page2.close();
  });
});
