# Task 18 – UI polish (start after Task 17 is approved)

Goal: the game must feel like a game show in a night bazaar (docs/design/DESIGN.md and the two
HTML mockups). Port their look; do not invent a new style.

## Build (parallel builders, disjoint files)
1. Layout: one consistent grid for game, lobby and results at 360x640, 390x844, 768x1024,
   1366x657, 1536x730, 1920x945, 2576x1002. Nothing important below the fold; no horizontal
   scroll; lanterns never cover text; top bar (room, MEZAT n/total, my gold, ? rules,
   language) always visible.
2. Wheel stage: wheel centered and as large as the screen allows; theme emoji/colors per
   theme; pointer "flick" on each slice tick; optional tick sound with a mute button
   (off by default on first visit until the user clicks).
3. Auction moment: big timer ring, top bid with the leader's name, +1/+2/+5 and PAS buttons
   in the thumb zone on phone; bid animation (number pops); last 5 s: timer turns red and
   pulses; "+3 sn" floating label when time is added.
4. Sale moment: short "SATILDI!" banner (not a blocking modal) and the item card flies to the
   winner's seat in the player list.
5. Player list: each player shows name, gold, slots with item names (theme slot count),
   PAS badge during an auction, "sıra" highlight for the opener.
6. Results: podium-style ranking, each player's items, the judge's reason and closing line in
   the player's language, "Yeniden Oyna" for host, "Ev sahibi yeni oyun başlatabilir" for others.
7. Fonts Bungee + Rubik with fallbacks; colors from DESIGN.md; respect prefers-reduced-motion.

## Verify
- Screenshots of every screen at all 7 sizes in docs/screenshots/<size>/. Open each and write
  one line per screenshot in STATUS.md describing what is visible (the outside manager will
  compare your lines with the images).
- E2E human run (Task 15 definition) still passes.
- Push; short Turkish report with the live commit SHA. The outside manager plays on the live
  site and approves or sends a list.
