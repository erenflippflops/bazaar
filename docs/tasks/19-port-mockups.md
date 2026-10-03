# Task 19 – Port the approved mockups into the game, exactly (start after Task 16b is green)

Eren approved the mockups in docs/design/mockups/ (21 screens × Desktop 1440×900 and Phone 390 wide,
open index.html). They are the ONLY visual source of truth. The goal is a pixel-faithful copy.
Do without asking Eren. The outside manager checks the result by pixel comparison and by playing.

## Rule 1 – Copy, do not redesign
- The mockups are plain HTML with inline styles. Port them into React components by COPYING the
  styles verbatim (same colors, sizes, paddings, radii, shadows, fonts, SVG paths). Do not
  "improve", round, or restyle anything. If something cannot be copied 1:1, write why in STATUS.md.
- Delete the old UI components/CSS that the new screens replace (no mixing of old and new looks).
  Remove the old `#root { zoom }` big-screen rules.

## Rule 2 – Fixed stage, scaled to the screen (this replaces all "responsive" layout)
- Two stages: DESKTOP 1440×900 and PHONE 390×844 (phone may grow taller and scroll on lobby,
  login and results, exactly like the mockups).
- Use DESKTOP when window width/height ≥ 0.9, else PHONE.
- DESKTOP: render the stage at 1440×900 and scale it with `transform: scale(s)`,
  s = min(innerWidth/1440, innerHeight/900), centered. The space outside the stage shows the same
  background (base color + rays + star pattern), so no empty bars are visible.
- PHONE: s = innerWidth/390 (no horizontal scroll).
- Result: the same picture on Eren's 2576×1002, 1536×730 and 1366×657 screens, only bigger/smaller.

## Components (one file each; names suggested)
Background (rays + star pattern), Lanterns, Header (logo, "ODA … · THEME", "MEZAT n/total" or "LOBİ"),
PlayerCard (desktop: name, label SEN / SIRA SENDE / SIRA ONDA / PAS / BAĞLANTI KOPTU, gold, "n/total slot",
slot chips with item names, empty "boş", halisaha first slot "kaleci", newly won chip highlighted),
PlayerCardMini (phone, dots), Wheel, ArchCard, StatusBox (label, big text, sub, countdown circle,
urgent style + "+3 SN" badge), BidHistory, Controls (info row, +1/+2/+5, PAS, main button),
MessageBox (turquoise / pink / navy), SoldBanner, ThemeCard, LanguageRow, RoomCodePanel, RulesGrid,
ReadyChips, Podium, RankingCard, ConnectingScreen, DisconnectedOverlay.

## Wheel (Eren chose style "A")
- n slices = items left on the wheel (server count); during the spin animation n = count + 1.
- Two-tone turquoise (#2EC4B6 / #1FA89B), separators rgba(255,255,255,0.55) 1px, the slice under the
  pointer is white with a pink ★, white rim, rim lights, yellow hub, yellow pointer – exactly as mockups.
- States: your turn = glow + hub text "ÇEVİR!" + clickable (wheel, hub and the big button under it all
  spin); not your turn = dim (opacity 0.55, saturate 0.5); spinning = ~3.2 s ease-out rotation of the
  slices only (pointer fixed), landing on the white slice; then the ArchCard appears.
- Same animation for all players (triggered by a spinKey that changes once per server spin).

## Screen mapping (phase / role -> mockup)
| State | Mockup |
|---|---|
| server waking up / connecting | 01-Connecting |
| entry | 02-Login (name, language, 4 theme cards, create; join with code; error line) |
| lobby host / guest | 03-Lobby-Host / 03b-Lobby-Guest |
| briefing | 04-HowToPlay (ready chips; host-only "bekleme, başlat" after 20 s) |
| playing, I am opener / someone else / spinning | 05-YourTurn / 06-NotYourTurn / 07-Spinning |
| opening, I am opener / someone else | 08-Opening-You / 09-Opening-Other |
| bidding, I can bid | 10-Bidding (≤ 5 s left: 11-LastSeconds, "+3 SN" badge for ~1.5 s after time was added) |
| bidding, I am top bidder / I passed / I am out | 12-TopBidder / 13-Passed / 14-Out (out reasons: slots full, not enough gold, halisaha "Kaleci slotun dolu"/"Oyuncu slotların dolu") |
| auction resolved (~2.5 s) | 15-Sold ("HERKES PAS DEDİ – SATILDI!" variant when it settled by passes) |
| judging / judge_failed | 16-JudgeThinking / 17-JudgeError (host button, others' text) |
| finished | 18-Results (host "YENİDEN OYNA", others' text) |
| connection lost | 19-Disconnected overlay; other players' cards show BAĞLANTI KOPTU |
| halisaha theme | 20-Halisaha (4 slots, "kaleci" slot) |

## Data needed from the server
- Add to the public state: `bidHistory: { playerId, amount, at }[]` for the current auction
  (opening first), reset when an auction starts. Show it as in the mockups ("şimdi", "3 sn önce",
  "açılış"). Unit + integration tests by the auditor.
- Everything else already exists (players, gold, slots, opener, wheel count, revealedItem, top bid,
  auctionEndsAt/openingEndsAt for countdowns, passedPlayerIds, out reasons, theme, results).
- Countdown circles use the server end times (not local counters).
- All visible Turkish text goes through `t(key)` with client/src/i18n/tr.ts, so Task 17 only adds en/de.

## Pixel check (auditor)
- A design harness: `/?mock=<screen-id>&stage=desktop|phone` renders each screen with the SAME mock data
  as the mockup (Eren, Selin, Mert, Deniz; values from the mockup files).
- Playwright screenshots the harness screen and the mockup HTML at the stage size and compares them
  with pixelmatch. Pass: < 1.5 % differing pixels per screen (fonts loaded, animations paused).
  Commit the diff images of failures to docs/screenshots/diff/.
- Plus: the e2e human runs from Task 15 still pass (same-browser tabs, autoPlay off, 1536×730,
  2576×1002, 390×844).

## Finish
Push after every merge. Report to Eren in short Turkish with the live commit SHA and the pixel diff
percentages per screen. Do not say "done": the outside manager verifies.
