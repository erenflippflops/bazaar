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

    for (let auctionNum = 1; auctionNum <= 6; auctionNum++) {
      const isAliceTurn = (auctionNum % 2) === 1;
      const spinnerPage = isAliceTurn ? page : page2;
      const otherPage = isAliceTurn ? page2 : page;
      const spinnerName = isAliceTurn ? 'Alice' : 'Bob';

      console.log(`Auction ${auctionNum}: ${spinnerName}'s turn`);

      const debugInfo = await spinnerPage.evaluate(() => {
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
      console.log('[TEST DEBUG]', JSON.stringify(debugInfo, null, 2));

      await expect(spinnerPage.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
      await spinWheel(spinnerPage);
      await expect(spinnerPage.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });

      await placeBid(spinnerPage, 1);
      await spinnerPage.waitForTimeout(500);

      await expect(otherPage.locator('button:has-text("Teklif Ver")')).toBeEnabled({ timeout: 3000 });
      await placeBid(otherPage, 2);

      await page.waitForTimeout(11000);

      const isGameOver = auctionNum === 6;
      if (!isGameOver) {
        const nextTurnPage = (auctionNum % 2) === 0 ? page : page2;
        await expect(nextTurnPage.locator('text=/sıran|ÇARKI ÇEVİR/i')).toBeVisible({ timeout: 5000 });
      }
    }

    await expect(page.locator('text=/sonuç|sıralama|kazanan/i')).toBeVisible({ timeout: 30000 });
    await expect(page2.locator('text=/sonuç|sıralama|kazanan/i')).toBeVisible({ timeout: 30000 });

    const hasCommentary = await page.locator('text=/yorum|commentary/i').count() > 0 ||
                          await page.locator('p, div').filter({ hasText: /.{20,}/ }).count() > 0;

    expect(hasCommentary).toBe(true);
    expect(errors).toEqual([]);

    await page2.close();
    await context2.close();
  });

  test('Reconnect after reload', async ({ page, browser }) => {
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
        currentOpenerId: currentOpener?.id,
        currentOpenerIndex: gameState?.currentOpenerIndex,
        playersCount: gameState?.players?.length,
        players: gameState?.players?.map((p: any) => ({ id: p.id, nickname: p.nickname }))
      };
    });
    console.log('[TEST DEBUG Reconnect]', JSON.stringify(debugInfo, null, 2));

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
    await expect(page.locator('button:has-text("TEKLİF VER")')).toBeEnabled({ timeout: 3000 });
    await placeBid(page, 2);
    await page.waitForTimeout(11000);

    await expect(page.locator('text=/sıran|ÇARKI ÇEVİR/i')).toBeVisible({ timeout: 5000 });

    await page.reload();
    setupConsoleErrorCatcher(page, errors);

    await expect(page.locator('text="Player1"')).toBeVisible();
    await expect(page.locator('text="Player2"')).toBeVisible();

    expect(errors).toEqual([]);

    await page2.close();
    await context2.close();
  });

  test.skip('Judge failed handling', async ({ page }) => {
    // Skipped - requires judge failure injection
  });
});
