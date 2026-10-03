# Task 19d – Port Wheel and PlayerCard components

## Goal
Copy the Wheel (style A) and PlayerCard components exactly from the mockups.
These are core game components used across multiple screens.

## Files you may change
- `client/src/components/Wheel.tsx` (create new)
- `client/src/components/PlayerCard.tsx` (create new)
- `client/src/components/PlayerCardMini.tsx` (create new, phone version)
- Delete: `client/src/components/WheelDisplay.tsx` (old design)
- Delete: `client/src/components/game/InteractiveWheel.tsx` (old design)

## Builder
1. **Wheel.tsx**: Copy from mockup lines 205 (the SVG wheel).
   - Props: `itemsLeft: number, state: 'your-turn' | 'not-your-turn' | 'spinning', onSpin?: () => void, spinKey?: number`
   - Generate `n` slices dynamically (n = itemsLeft, or itemsLeft+1 during spin)
   - Two-tone turquoise: #2EC4B6 and #1FA89B alternating
   - White slice under pointer with pink ★
   - States:
     - `your-turn`: glow (filter: drop-shadow), hub text "ÇEVİR!", clickable
     - `not-your-turn`: dim (opacity 0.55, filter: saturate(0.5))
     - `spinning`: animate rotation ~3.2s ease-out, land on white slice
   - Pointer and rim lights: yellow (#FFC93C), white rim
   - Copy exact SVG structure from mockup (circle, paths for slices, circles for rim lights, hub, pointer)

2. **PlayerCard.tsx** (desktop): Copy from mockup lines 187-203.
   - Props: `player: { nickname, gold, slots, label?, isYou?, outReason?, passedBadge?, isDisconnected? }, themeId: string`
   - Background: #F0386B if isYou, #0B0C3F otherwise
   - Border: turquoise rgba(46,196,182,0.55)
   - Label: "SIRA SENDE" | "SIRA ONDA" | "SEN" | "PAS" | "BAĞLANTI KOPTU"
   - Gold in Bungee font (white if isYou, yellow otherwise)
   - Slots: 3 chips, filled slots show item name (highlighted if newly won with yellow background), empty show "boş"
   - Halisaha theme: first slot labeled "kaleci"
   - Copy exact padding, font sizes, border radius from mockup

3. **PlayerCardMini.tsx** (phone): Compact dots version for phone.
   - Props: same as PlayerCard
   - Show name, gold, dots for slots (filled/empty)
   - Check phone mockups for exact layout

4. Delete old WheelDisplay.tsx and InteractiveWheel.tsx.

5. Animation for spinning: use `spinKey` prop changing to trigger rotation. When `spinKey` changes, rotate the slices (not the pointer) to land on the white slice. Use CSS animation or requestAnimationFrame.

## Audit
Visual check with pixel tests:
1. Use pixel comparison harness from Task 19j
2. Test screens: 'your-turn', 'not-your-turn', 'spinning'
3. Verify wheel renders with correct number of slices
4. Verify PlayerCard shows all data correctly
5. Run pixel comparison: must be < 1.5% diff
6. Check halisaha theme shows "kaleci" label

Do not approve until pixel diff < 1.5%.

## Commit messages
```
Port Wheel and PlayerCard from mockups

- Wheel: style A, two-tone turquoise, spin animation
- PlayerCard: desktop full, phone mini dots
- States: your-turn glow, not-your-turn dim, spinning
- Halisaha kaleci slot support
- Delete old wheel components

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

## Report
1. Confirmation old components deleted
2. Pixel test results (diff % for each screen tested)
3. Screenshot comparison showing wheel states and player cards match mockups
