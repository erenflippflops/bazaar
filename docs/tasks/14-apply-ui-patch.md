# Task 14 – Apply the manager's UI patch (do without asking Eren)

The outside manager wrote and playtested this UI fix himself (base commit 1465345).
File: docs/tasks/14-ui-wheel-oneclick.patch. It replaces Task 13 and Task 11/12 items 1-4, 6, 7.

What it does (verified in a real 2-player game at 1536x730 and 390x844, no console errors,
78/78 vitest green):
- New canvas wheel (WheelDisplay.tsx): colored hidden slices, one per remaining item,
  "Çarkta N güç kaldı", clickable wheel + hub "ÇEVİR!" + big button under the wheel,
  ~3.2 s spin animation, lands on a slice showing the revealed item name; the item card
  appears after the animation; reconnect during an auction shows the item at once.
- Client types `wheel: number` (server sends the count, rule 3).
- MEZAT counter computed from filled slots: current/total (players × 3).
- Phone: the item card is shown above the auction panel during an auction.
- One-click bidding: +1/+2/+5 bid immediately (opening: 1/2/5), main button bids the minimum;
  pending state; "Teklifin alındı" / server error feedback; "Limit: X altın" when over limit.
- Disabled buttons clearly grey.

## Steps (manager, one builder, no long audit)
1. Stop any running Task 11/12/13 builders. Commit or stash nothing of theirs that touches
   the same files; prefer the patch.
2. `git apply --3way docs/tasks/14-ui-wheel-oneclick.patch`. If it conflicts because main moved,
   resolve keeping the patch's behavior.
3. Update e2e tests for the new UI (auditor): spin by clicking the wheel or "ÇARKI ÇEVİR"
   under it; +n buttons now bid immediately (do not click +n and then "TEKLİF VER").
   Add asserts: wheel canvas has data-slices = 40 at start; one click on "+1" raises the
   top bid on both screens; "MEZAT: 2/6" after the first auction.
4. Run vitest + playwright once, push. Short Turkish summary.
