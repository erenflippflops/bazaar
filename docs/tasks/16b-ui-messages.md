# Task 16b - UI Out Messages

## Goal
Show appropriate messages when players cannot participate in auctions.

## Files you may change
- client/src/components/AuctionPanel.tsx
- client/src/components/PlayerList.tsx

## Builder
1. AuctionPanel: Show outReason message when current player is out:
   - If currentPlayer.outReason exists, show it prominently instead of bid controls
   - Style: warning color, centered, readable
   - Still show current bid and timer above the message

2. PlayerList: Show "PAS" badge for players with passedBadge:
   - Add a small badge/indicator next to player name
   - Style: subtle, doesn't dominate the card
   - Position: near gold/slots display

3. Test manually with halisaha theme in two browser tabs

## Audit
Visual check: out messages appear correctly, PAS badges show.

## Commit messages
- "Task 16b: Show out-reason messages in AuctionPanel"
- "Task 16b: Add PAS badge to PlayerList"

## Report
Describe UI changes, confirm visual appearance.
