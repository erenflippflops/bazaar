# Task 19e – Port StatusBox, BidHistory, Controls, and small components

## Goal
Copy StatusBox, BidHistory, Controls, MessageBox, SoldBanner, and other small components from mockups.

## Files you may change
- `client/src/components/StatusBox.tsx` (create new)
- `client/src/components/BidHistory.tsx` (create new)
- `client/src/components/Controls.tsx` (create new)
- `client/src/components/MessageBox.tsx` (create new)
- `client/src/components/SoldBanner.tsx` (create new)
- `client/src/components/ArchCard.tsx` (update with mockup styles)
- Delete: `client/src/components/AuctionPanel.tsx` (replaced by Controls)
- Delete: `client/src/components/Timer.tsx` (replaced by StatusBox)

## Builder

1. **StatusBox.tsx**: The big status display on the right (mockup line 212-215).
   - Props: `label: string, text: string, subtext: string, timeLeft?: number, totalTime?: number, urgent?: boolean, showPlusThree?: boolean`
   - Countdown circle using timeLeft/totalTime (SVG circle with stroke-dasharray animation)
   - Urgent style: red/pink colors, pulse animation
   - "+3 SN" badge when showPlusThree=true (shows for ~1.5s after time added)
   - Copy exact layout, fonts, sizes from mockup

2. **BidHistory.tsx**: The bid history panel showing recent bids.
   - Props: `bids: Array<{playerId: string, amount: number, at: number}>, players: Map<string, {nickname: string}>, currentTime: number`
   - Show bids with "şimdi", "3 sn önce", "açılış" labels
   - Turquoise background panel with rounded corners
   - Latest bid at top
   - Format times relative to currentTime

3. **Controls.tsx**: The bidding controls (info row, +1/+2/+5, PAS, main button).
   - Props: `mode: 'spin' | 'opening' | 'bidding' | 'passed' | 'out', currentBid?: number, myGold: number, onBid: (amount) => void, onPass: () => void, onSpin: () => void, outReason?: string`
   - Info row: shows max bid, current situation
   - Bid buttons: +1, +2, +5 (disabled when exceeds maxBid)
   - PAS button (only in bidding mode)
   - Main button: "ÇARKI ÇEVİR" | "TEKLİF VER" | "BEKLE" depending on mode
   - Copy exact button styles, colors, shadows from mockup

4. **MessageBox.tsx**: Info/warning/error message boxes.
   - Props: `type: 'turquoise' | 'pink' | 'navy', children: ReactNode`
   - Different background colors based on type
   - Rounded corners, padding from mockup

5. **SoldBanner.tsx**: The "SATILDI!" banner (mockup screen 15).
   - Props: `winner: string, amount: number, allPassed?: boolean`
   - Large banner with "SATILDI!" or "HERKES PAS DEDİ – SATILDI!"
   - Winner name and amount
   - Animate in from top, stay ~2.5s

6. **ArchCard.tsx**: Update existing ArchCard with mockup styles.
   - Copy the arch card styling from mockup (the revealed item card)
   - Ensure it matches mockup colors, borders, typography

7. Delete old AuctionPanel.tsx and Timer.tsx.

## Audit
Visual check:
1. StatusBox countdown circle animates correctly
2. BidHistory shows bids with correct time labels
3. Controls buttons work and show correct states
4. MessageBox types render with correct colors
5. SoldBanner animates in correctly
6. ArchCard matches mockup styling

## Commit messages
```
Port StatusBox, BidHistory, Controls, and small components

- StatusBox: countdown circle, urgent state, +3 SN badge
- BidHistory: recent bids with time labels
- Controls: bid buttons, PAS, main action button
- MessageBox, SoldBanner, updated ArchCard
- Delete old AuctionPanel and Timer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

## Report
1. Confirmation old components deleted
2. Screenshots of each new component
