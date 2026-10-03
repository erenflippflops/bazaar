# Task 19a – Add bidHistory to server state

## Goal
Add `bidHistory: { playerId, amount, at }[]` to the public game state for the current auction.
This is needed by the new UI to display the bid history panel as shown in the mockups.

## Files you may change
- `server/engine/game.ts`
- `server/engine/types.ts`
- `server/index.ts` (only the state broadcast logic)

## Builder
1. Add `bidHistory` array to `PublicGameState` type in `server/engine/types.ts`:
   ```typescript
   bidHistory: Array<{ playerId: string; amount: number; at: number }>
   ```

2. In `game.ts`:
   - Add `bidHistory: []` to initial state
   - In `startAuction()`: reset `bidHistory` to `[]`
   - In `placeBid()`: append `{ playerId, amount, at: now }` to `bidHistory` when a bid is accepted
   - In `placeOpeningBid()`: append the opening bid to `bidHistory`

3. The `at` timestamp should be the same `now` value used by the game engine (passed in as parameter).

4. Test: run `npx vitest run` - all existing tests must pass. The bidHistory will be validated by integration tests written by the auditor.

## Audit
Write integration tests in `tests/integration/bid-history.test.ts`:

1. **Test: bidHistory starts empty**
   - Create room, start game, spin wheel
   - Verify `bidHistory: []` during opening phase

2. **Test: opening bid appears in bidHistory**
   - Opening player places opening bid of 3
   - Verify `bidHistory` contains one entry: `{ playerId, amount: 3, at: <timestamp> }`

3. **Test: subsequent bids append to bidHistory**
   - Opening bid 3, then player2 bids 5, player3 bids 7
   - Verify `bidHistory` has 3 entries in order, with correct playerIds and amounts

4. **Test: bidHistory resets for next auction**
   - First auction completes with 3 bids
   - Next wheel spin, next opening bid
   - Verify `bidHistory` contains only the new opening bid (old bids cleared)

5. **Test: timestamps are monotonically increasing**
   - Place 3 bids in sequence
   - Verify each `at` value is >= the previous one

All tests must check the actual `bidHistory` field in `state_update` events.

## Commit messages
```
Add bidHistory to game state

- PublicGameState includes bidHistory array
- Reset on auction start, append on each bid
- Timestamps from game engine clock

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

## Report
Paste:
1. `git diff --stat main` output
2. `npx vitest run` full output (must be all green)
3. Confirmation that bidHistory is populated correctly
