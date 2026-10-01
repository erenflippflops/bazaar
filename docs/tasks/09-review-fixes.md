# Task 09 – Fixes from the outside review of docs/screenshots (do without asking Eren)

The outside manager reviewed GitHub (3eefa39) and the screenshots. V1 is not done yet.
Run in parallel (disjoint files), merge one by one, push after every merge.

## Design bugs (builders; compare with docs/design/DESIGN.md and both HTML mockups)
1. The wheel is an empty white circle. Build the real wheel: colored slices, one per
   remaining item (thin slices), spins to the server-chosen item; show "Çarkta N güç kaldı".
2. Desktop bidding screen shows the revealed item card twice. Show it once.
3. Phone (390x844): during opening and bidding, the timer, current bid and bid buttons must be
   visible WITHOUT scrolling. Follow Auction-Phone.html (wheel smaller / collapsed when an
   auction runs).
4. The gold limit must always be visible to the player: "En fazla X altın verebilirsin".
5. Top-left room code and auction counter are covered by the lanterns. Fix the overlap.
6. Player cards must show the items each player has won (not only "0/3 slot").

## Evidence gaps
7. Screenshots also for: sale banner, judge waiting, judge failed (phone + desktop), and
   retake all screens after the fixes. Commit to docs/screenshots/.
8. The 3 consecutive runs must include ALL tests: `npx vitest run` AND `npx playwright test`
   (no file filter, 9 e2e tests). Paste both summary lines for each run into STATUS.md.
9. Real judge: play one full game with the real key (.env, never print it). Paste the judge's
   JSON result into STATUS.md.
10. After everything above: the auditor's NEW final audit of the whole repo, with VERDICT.
    The old APPROVE does not count.

Finish: update docs/STATUS.md with evidence per item, push, and give Eren
git log --oneline -15 and a short Turkish summary.
