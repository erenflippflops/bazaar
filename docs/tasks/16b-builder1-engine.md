# Task 16b Builder 1: Engine Logic for Halisaha Positioning

## Goal
Implement halisaha slot fitting logic, auto-out detection, item discard, and opener handoff in the game engine.

## Files you may change
- server/engine/game.ts
- server/engine/types.ts (if needed for slotTypes)

## Builder Instructions

Read docs/tasks/16b-playtest-fixes.md section 3 (Halısaha) carefully.

Implement in server/engine/game.ts:

1. **Slot fitting logic**: 
   - Add slotTypes?: string[] to GameState
   - When resolveBid places an item, check if item.position and state.slotTypes exist
   - If yes: find first empty slot where item fits (GK fits GK, non-GK fits FIELD)
   - If no slotTypes: use existing behavior (first empty slot)

2. **Auto-out detection**:
   - Add function isOutOfAuction(player, revealedItem, slotTypes): check if player has no empty fitting slot
   - Update existing auto-out checks to use this function

3. **Item discard**:
   - In spinWheel: after revealing item, check if ANY player has a fitting empty slot
   - If nobody fits: add event { type: 'item_discarded', item }, skip auction, advance turn to next opener
   - Do NOT call resolveBid

4. **Opener handoff**:
   - In spinWheel or opening phase: if opener has no fitting slot but others do
   - Find next player in turn order with fitting slot
   - Add event { type: 'opener_changed', from, to }
   - That player becomes opener (still uses original opener's turn)

5. **Gold reserve unchanged**: maxBid = gold − (emptySlots − 1) works with 4 slots

6. **Game end unchanged**: game ends when all slots full (works for 3 or 4 slots)

Make all tests in tests/engine/halisaha.test.ts pass.

## Audit
Auditor will verify:
- All 23 halisaha engine tests pass
- Game always ends (200-game proof passes)
- No changes to files outside your list

## Commit messages
- "Task 16b builder 1: Implement slot fitting logic for halisaha"
- "Task 16b builder 1: Add auto-out detection for no fitting slot"
- "Task 16b builder 1: Implement item discard and opener handoff"

## Report
List which functions you changed, paste test results showing all halisaha engine tests green.
