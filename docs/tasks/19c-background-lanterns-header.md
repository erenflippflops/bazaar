# Task 19c – Port Background, Lanterns, and Header components

## Goal
Copy the Background (rays + stars), Lanterns, and Header components exactly from the mockups.
These are shared across all screens.

## Files you may change
- `client/src/components/Background.tsx` (create new)
- `client/src/components/Lanterns.tsx` (create new)
- `client/src/components/Header.tsx` (create new)
- Delete: `client/src/components/BackgroundDecorations.tsx` (old design)
- Delete: `client/src/components/LanternString.tsx` (old design)

## Builder
1. **Background.tsx**: Copy from mockup line 19 (repeating-conic-gradient rays) and lines 20-23 (SVG star pattern).
   - Props: none (always the same)
   - Render both layers: rays div + SVG with star pattern
   - Use exact colors and opacities from mockups

2. **Lanterns.tsx**: Copy from mockup lines 24-178 (the full SVG with lantern string).
   - Desktop: 22 lanterns as in the mockup
   - Phone: 8 lanterns (check phone mockup for exact positions)
   - Props: `stage: 'desktop' | 'phone'`
   - SVG paths for lantern shape, glow, wire - copy exactly
   - No flicker animation needed yet (static for now)

3. **Header.tsx**: Copy from mockup lines 179-182.
   - Props: `roomCode: string | null, theme: string, auctionNumber: number | null, totalAuctions: number | null, mode: 'lobby' | 'game'`
   - Desktop layout: BAZAAR logo left, room info right
   - Phone layout: stacked (check phone mockup)
   - Logo: Bungee font, #FFC93C with #F0386B shadow
   - Room code + theme in small caps
   - Auction counter "MEZAT n/total" in Bungee turquoise (only show in game mode)

4. Delete the old BackgroundDecorations.tsx and LanternString.tsx files.

5. All styles inline (matching mockup exactly), no external CSS for these components.

## Audit
Visual check with pixel tests:
1. Use the pixel comparison harness from Task 19j
2. Test Background + Lanterns + Header on any mockup screen
3. Run: `npm run harness` and compare screenshots
4. Verify < 1.5% pixel difference for these components
5. If > 1.5%: adjust styling until it matches

Do not approve until pixel diff < 1.5%.

## Commit messages
```
Port Background, Lanterns, Header from mockups

- Background: rays + star pattern (verbatim copy)
- Lanterns: 22 desktop, 8 phone SVG
- Header: logo, room info, auction counter
- Delete old BackgroundDecorations and LanternString

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

## Report
1. Confirmation that old components deleted
2. Pixel test results for screens using these components (diff %)
3. Screenshot comparison showing match
