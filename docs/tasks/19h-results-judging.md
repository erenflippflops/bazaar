# Task 19h – Port ResultsScreen and judging screens

## Goal
Rebuild ResultsScreen and judging screens (judge thinking, judge error) using mockups 16-18.

## Files you may change
- `client/src/screens/ResultsScreen.tsx` (update with new layout)
- `client/src/components/Podium.tsx` (create new)
- `client/src/components/RankingCard.tsx` (update with mockup styles)

## Builder

1. **ResultsScreen.tsx** (mockup 18):
   - Desktop layout: centered podium + ranking cards grid
   - Phone layout: stacked (scrollable)
   - Podium component showing top 3
   - Ranking cards for all players (position, name, items, commentary)
   - Host: "YENİDEN OYNA" button
   - Others: "Ev sahibi yeni oyun başlatabilir" text
   - Copy exact layout, spacing, fonts from mockup

2. **Podium.tsx**:
   - Props: `players: Array<{nickname, position, items}>`
   - 3 podiums: 2nd (left), 1st (center, taller), 3rd (right)
   - Gold/silver/bronze colors
   - Player names on podiums
   - Copy exact podium heights, colors, borders from mockup

3. **RankingCard.tsx** (update):
   - Props: `player: {position, nickname, items, commentary}`
   - Show position number, name, items collected, judge commentary
   - Copy card styling from mockup (border, padding, typography)

4. Handle judging screens within GameScreen or as separate states:
   - Judge thinking (mockup 16): spinner, "Hakem düşünüyor..." message
   - Judge error (mockup 17): error message, host "TEKRAR DENE" button, others wait text
   - These are game phases, not separate screens

5. Ensure all text uses i18n keys (client/src/i18n/tr.ts) for Task 17.

## Audit
Visual check with pixel tests:
1. Use pixel comparison harness from Task 19j
2. Test screens: 'results', 'judge-thinking', 'judge-error'
3. Test both desktop and phone layouts
4. Run pixel comparison: must be < 1.5% diff for all screens
5. Verify podium shows top 3 correctly
6. Verify ranking cards display all player data
7. Verify host vs guest buttons work

Do not approve until pixel diff < 1.5%.

## Commit messages
```
Port ResultsScreen and judging screens

- ResultsScreen: podium + ranking cards
- Podium: top 3 display with gold/silver/bronze
- RankingCard: position, items, commentary
- Judge thinking and error states
- All text uses i18n keys

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

## Report
1. Pixel test results for results/judging screens (diff % for each)
2. Screenshots showing matches to mockups
