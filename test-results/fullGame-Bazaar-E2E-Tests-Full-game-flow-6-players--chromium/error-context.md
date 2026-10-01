# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fullGame.spec.ts >> Bazaar E2E Tests >> Full game flow (6 players)
- Location: tests\e2e\fullGame.spec.ts:138:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has-text("ÇARKI ÇEVİR")')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('button:has-text("ÇARKI ÇEVİR")') with timeout 10000ms
  - waiting for locator('button:has-text("ÇARKI ÇEVİR")')

```

```yaml
- heading "Bağlanıyor..." [level=2]
- paragraph: Sunucuya bağlantı kuruluyor
```

# Test source

```ts
  87  |       const spinnerPage = aliceIsOpener ? page : page2;
  88  |       const otherPage = aliceIsOpener ? page2 : page;
  89  |       const spinnerName = aliceIsOpener ? 'Alice' : 'Bob';
  90  |       const otherName = aliceIsOpener ? 'Bob' : 'Alice';
  91  | 
  92  |       console.log(`Auction ${auctionNum}/6: ${spinnerName}'s turn to open`);
  93  | 
  94  |       await expect(spinnerPage.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
  95  |       await spinWheel(spinnerPage);
  96  |       await expect(spinnerPage.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });
  97  | 
  98  |       // Opener places opening bid
  99  |       await placeBid(spinnerPage, 1);
  100 |       await spinnerPage.waitForTimeout(500);
  101 | 
  102 |       // Other player bids if they have slots available
  103 |       if (playerSlots[otherName] < 3) {
  104 |         await expect(otherPage.locator('button:has-text("TEKLİF VER")')).toBeVisible({ timeout: 5000 });
  105 |         await placeBid(otherPage, 2);
  106 |       }
  107 | 
  108 |       // Wait for auction to complete (10s bidding timer + buffer)
  109 |       await page.waitForTimeout(11000);
  110 | 
  111 |       // Winner gets the item - in this test flow, Bob always outbids with 2
  112 |       if (playerSlots[otherName] < 3) {
  113 |         playerSlots[otherName]++;
  114 |       } else {
  115 |         playerSlots[spinnerName]++;
  116 |       }
  117 | 
  118 |       console.log(`After auction ${auctionNum}: Alice=${playerSlots.Alice} items, Bob=${playerSlots.Bob} items`);
  119 |     }
  120 | 
  121 |     // After EXACTLY 6 auctions, game must be in judging or finished phase
  122 |     const phase = await page.evaluate(() => (window as any).__gameState?.phase);
  123 |     expect(['judging', 'finished']).toContain(phase);
  124 | 
  125 |     await expect(page.locator('h1:has-text("BAZAAR KAPANDI")')).toBeVisible({ timeout: 30000 });
  126 |     await expect(page2.locator('h1:has-text("BAZAAR KAPANDI")')).toBeVisible({ timeout: 30000 });
  127 | 
  128 |     const hasCommentary = await page.locator('text=/yorum|commentary/i').count() > 0 ||
  129 |                           await page.locator('p').filter({ hasText: /.{20,}/ }).count() > 0;
  130 | 
  131 |     expect(hasCommentary).toBe(true);
  132 |     expect(errors).toEqual([]);
  133 | 
  134 |     await page2.close();
  135 |     await context2.close();
  136 |   });
  137 | 
  138 |   test('Full game flow (6 players)', async ({ page, browser }) => {
  139 |     test.setTimeout(300000); // 5 minutes for 6-player game (18 auctions × ~12s + judging)
  140 |     const errors: string[] = [];
  141 |     setupConsoleErrorCatcher(page, errors);
  142 | 
  143 |     const roomCode = await createRoom(page, 'Player1');
  144 | 
  145 |     // Create 5 additional players
  146 |     const contexts: BrowserContext[] = [];
  147 |     const pages: Page[] = [page];
  148 | 
  149 |     for (let i = 2; i <= 6; i++) {
  150 |       const newContext = await browser.newContext();
  151 |       contexts.push(newContext);
  152 |       const newPage = await newContext.newPage();
  153 |       setupConsoleErrorCatcher(newPage, errors);
  154 |       await joinRoom(newPage, roomCode, `Player${i}`);
  155 |       pages.push(newPage);
  156 |     }
  157 | 
  158 |     await startGame(page);
  159 |     await expect(page.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 5000 });
  160 | 
  161 |     // Track filled slots for each player to determine when they can't bid
  162 |     const playerSlots: Record<string, number> = {
  163 |       Player1: 0, Player2: 0, Player3: 0, Player4: 0, Player5: 0, Player6: 0
  164 |     };
  165 | 
  166 |     // 6 players × 3 slots = EXACTLY 18 auctions
  167 |     for (let auctionNum = 1; auctionNum <= 18; auctionNum++) {
  168 |       await page.waitForTimeout(1000);
  169 | 
  170 |       // Find who the current opener is by checking game state on ANY page (use page 0)
  171 |       const openerInfo = await page.evaluate(() => {
  172 |         const gameState = (window as any).__gameState;
  173 |         const openerIndex = gameState?.currentOpenerIndex ?? 0;
  174 |         const opener = gameState?.players?.[openerIndex];
  175 |         return {
  176 |           index: openerIndex,
  177 |           nickname: opener?.nickname || `Player${openerIndex + 1}`
  178 |         };
  179 |       });
  180 | 
  181 |       const openerPage = pages[openerInfo.index];
  182 |       const openerNick = openerInfo.nickname;
  183 | 
  184 |       console.log(`\nAuction ${auctionNum}/18: ${openerNick} (index ${openerInfo.index}) opens`);
  185 | 
  186 |       // Verify opener sees spin button
> 187 |       await expect(openerPage.locator('button:has-text("ÇARKI ÇEVİR")')).toBeVisible({ timeout: 10000 });
      |                                                                          ^ Error: expect(locator).toBeVisible() failed
  188 |       await spinWheel(openerPage);
  189 |       await expect(openerPage.locator('text=/Açılış teklifi|Teklif Ver/i')).toBeVisible({ timeout: 5000 });
  190 | 
  191 |       // Opener places opening bid (1 gold)
  192 |       await placeBid(openerPage, 1);
  193 |       await openerPage.waitForTimeout(500);
  194 | 
  195 |       // Try to have another player outbid (skip opener and players with full slots)
  196 |       let someoneBid = false;
  197 |       for (let i = 0; i < pages.length; i++) {
  198 |         if (i === openerInfo.index) continue; // Skip opener
  199 | 
  200 |         const nickname = `Player${i + 1}`;
  201 |         if (playerSlots[nickname] >= 3) continue; // Skip players with full slots
  202 | 
  203 |         // Check if this player can see the bid button
  204 |         const canBid = await pages[i].locator('button:has-text("TEKLİF VER")').isVisible({ timeout: 2000 }).catch(() => false);
  205 |         if (canBid) {
  206 |           await placeBid(pages[i], 2);
  207 |           await pages[i].waitForTimeout(300);
  208 |           someoneBid = true;
  209 |           console.log(`  ${nickname} outbid with 2 gold`);
  210 |           break; // Only one player outbids per auction
  211 |         }
  212 |       }
  213 | 
  214 |       if (!someoneBid) {
  215 |         console.log(`  No outbid - ${openerNick} will win with opening bid`);
  216 |       }
  217 | 
  218 |       // Wait for auction to complete (10s bidding timer + buffer)
  219 |       await page.waitForTimeout(11000);
  220 | 
  221 |       // Wait for game state to update - poll until total slots increases
  222 |       const expectedTotalSlots = auctionNum;
  223 |       let auctionResult: { phase: string; slots: Record<string, number> } = { phase: '', slots: {} };
  224 |       let attempts = 0;
  225 |       const maxAttempts = 20;
  226 | 
  227 |       while (attempts < maxAttempts) {
  228 |         auctionResult = await page.evaluate(() => {
  229 |           const gameState = (window as any).__gameState;
  230 |           const players = gameState?.players || [];
  231 |           const slots: Record<string, number> = {};
  232 | 
  233 |           players.forEach((p: any, idx: number) => {
  234 |             const nick = p.nickname || `Player${idx + 1}`;
  235 |             // Count filled slots (non-null items in slots array)
  236 |             const filledSlots = (p.slots || []).filter((s: any) => s !== null).length;
  237 |             slots[nick] = filledSlots;
  238 |           });
  239 | 
  240 |           return {
  241 |             phase: gameState?.phase,
  242 |             slots
  243 |           };
  244 |         });
  245 | 
  246 |         const totalSlots = Object.values(auctionResult.slots).reduce((sum, n) => sum + n, 0);
  247 | 
  248 |         if (totalSlots >= expectedTotalSlots) {
  249 |           break;
  250 |         }
  251 | 
  252 |         attempts++;
  253 |         await page.waitForTimeout(500);
  254 |       }
  255 | 
  256 |       // Update our tracking with actual game state
  257 |       Object.assign(playerSlots, auctionResult.slots);
  258 | 
  259 |       const totalSlots = Object.values(playerSlots).reduce((sum, n) => sum + n, 0);
  260 |       console.log(`After auction ${auctionNum}: ${Object.entries(playerSlots).map(([n, s]) => `${n}=${s}`).join(', ')} (total: ${totalSlots}/18)`);
  261 | 
  262 |       // Verify we're making progress
  263 |       expect(totalSlots).toBe(auctionNum);
  264 | 
  265 |       // If this was the 18th auction, game should be transitioning to judging
  266 |       if (auctionNum === 18) {
  267 |         console.log(`\nAll 18 auctions complete! Phase: ${auctionResult.phase}`);
  268 | 
  269 |         // Verify each player has exactly 3 slots
  270 |         for (const [nick, count] of Object.entries(playerSlots)) {
  271 |           expect(count).toBe(3);
  272 |         }
  273 |       }
  274 |     }
  275 | 
  276 |     // After EXACTLY 18 auctions, game must be in judging or finished phase
  277 |     const finalPhase = await page.evaluate(() => (window as any).__gameState?.phase);
  278 |     console.log(`Final phase check: ${finalPhase}`);
  279 |     expect(['judging', 'finished']).toContain(finalPhase);
  280 | 
  281 |     // Wait for results screen
  282 |     await expect(page.locator('h1:has-text("BAZAAR KAPANDI")')).toBeVisible({ timeout: 30000 });
  283 | 
  284 |     const hasCommentary = await page.locator('text=/yorum|commentary/i').count() > 0 ||
  285 |                           await page.locator('p').filter({ hasText: /.{20,}/ }).count() > 0;
  286 | 
  287 |     expect(hasCommentary).toBe(true);
```