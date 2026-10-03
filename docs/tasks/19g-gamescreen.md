# Task 19g – Port GameScreen with all auction states

## Goal
Rebuild GameScreen using new components to match all game mockups (05-20).
Handle all auction phases and states with the correct layouts and components.

## Files you may change
- `client/src/screens/GameScreen.tsx` (complete rewrite)
- `client/src/components/DisconnectedOverlay.tsx` (create new)
- `client/src/components/ConnectingScreen.tsx` (create new)

## Builder

1. **GameScreen.tsx**: Main game screen with state-based rendering.
   - Desktop layout (mockup structure lines 183-216):
     - 3-column grid: `320px | minmax(0, 1fr) | 360px`
     - Left: player cards (PlayerCard components)
     - Center: wheel + counter + main button
     - Right: StatusBox or empty
   - Phone layout:
     - Stacked: player cards mini (2 rows × 3), wheel, controls
   
   - State mapping (from Task 19 table):
     - `playing` phase, my turn to spin → mockup 05 (your turn)
     - `playing` phase, not my turn → mockup 06 (not your turn)
     - `playing` phase, spinning → mockup 07 (spinning - use spinKey to trigger animation)
     - `opening` phase, I'm opener → mockup 08 (opening - you)
     - `opening` phase, someone else → mockup 09 (opening - other)
     - `bidding` phase, I can bid → mockup 10 (bidding)
     - `bidding` phase, ≤5s left → mockup 11 (last seconds urgent state)
     - `bidding` phase, I'm top bidder → mockup 12 (top bidder)
     - `bidding` phase, I passed → mockup 13 (passed)
     - `bidding` phase, I'm out → mockup 14 (out - show outReason)
     - Auction resolved → mockup 15 (sold banner ~2.5s)
   
   - Use new components:
     - `<Background />` always
     - `<Lanterns stage={stage} />` always
     - `<Header />` always
     - `<Wheel />` with correct state
     - `<PlayerCard />` or `<PlayerCardMini />` for each player
     - `<StatusBox />` on right side (desktop)
     - `<BidHistory />` when in bidding
     - `<Controls />` at bottom (desktop) or below wheel (phone)
     - `<SoldBanner />` when auction resolves
     - `<ArchCard />` when item is revealed

2. **DisconnectedOverlay.tsx** (mockup 19):
   - Full-screen overlay when connection lost
   - "Bağlantı koptu" message
   - "Yeniden bağlan" button
   - Semi-transparent dark background
   - Copy exact styling from mockup

3. **ConnectingScreen.tsx** (mockup 01):
   - Full-screen "Bağlanıyor..." spinner
   - Shown when socket connecting
   - Copy exact styling from mockup

4. Handle halisaha theme (mockup 20):
   - PlayerCard shows "kaleci" slot label when themeId includes "halisaha"
   - 4 total slots for halisaha (not 3)

5. Delete old GameScreen.tsx content, start fresh with mockup structure.

## Audit
Play through a full game and verify with pixel tests:
1. Use pixel comparison harness from Task 19j
2. Test all game state screens (05-20): your-turn, not-your-turn, spinning, opening-you, opening-other, bidding, last-seconds, top-bidder, passed, out, sold, judge-thinking, judge-error, disconnected, halisaha
3. Test both desktop and phone layouts
4. Run pixel comparison: must be < 1.5% diff for all screens
5. Verify wheel spins correctly, bid history updates, StatusBox countdown works
6. Verify all player states show correctly

Do not approve until pixel diff < 1.5% for all tested screens.

## Commit messages
```
Port GameScreen with all auction states

- Complete rewrite matching mockups 05-20
- Desktop 3-column, phone stacked layouts
- All auction phases: spin, opening, bidding, sold
- Player states: turn, passed, out, disconnected
- Halisaha theme support (kaleci slot)
- ConnectingScreen and DisconnectedOverlay

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

## Report
1. Pixel test results for all game state screens (diff % for each)
2. Confirmation all phases work correctly
3. Screenshots showing key states match mockups
