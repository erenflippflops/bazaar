# Bazaar design: "Game show in a night bazaar"

Approved by the owner. This file plus the two mockups next to it are the visual specification.
Mockups: Auction-Phone.html (390x844) and Auction-Desktop.html (1440x900). They are static HTML
with inline styles; open them in a browser. Ignore the `<x-dc>` wrapper and `support.js`.
Build every other screen in the same language using the rules below. The game must work well on
phones AND desktop browsers.

## 1. Tokens (CSS variables, exact values)
| Token | Value | Use |
|---|---|---|
| --bg | #16187A | page background (royal indigo) |
| --dark | #0B0C3F | panels, player cards, secondary buttons, text on light fills |
| --saffron | #FFC93C | primary buttons, logo, arch card, gold amounts, lantern metal |
| --turquoise | #2EC4B6 | borders of cards/buttons, info accents (Iznik tile blue-green) |
| --pomegranate | #F0386B | "whose turn" highlight, timer, logo shadow, arch trim |
| --violet | #7B5CFF | wheel segment |
| --orange | #FF8A3D | wheel segment |
| --white | #FFFFFF | main text, wheel rim |
| --muted | #C9CBFF | labels, secondary text |
| --glow | #FFB347 | lantern glow only |
Fonts (Google Fonts): **Bungee** for display (logo, headings, numbers, buttons, wheel marks) and
**Rubik** 400/600/700/800 for everything else. Both support Turkish characters.

## 2. Signature elements (copy geometry from the mockups)
- **Background:** --bg + very light radial rays (repeating-conic-gradient, white 6% / 0%, 10deg
  steps, centered on the wheel) + a faint 8-point-star tile pattern (saffron 13% stroke, 44px
  tile, inline SVG pattern). Decoration only: behind content, pointer-events none.
- **Lantern string:** a sagging saffron string across the top with small hanging lanterns
  (colored glass: pomegranate, turquoise, saffron, violet, orange) and a soft --glow halo.
  Phone ~8 lanterns, desktop ~22. Optional slow flicker (opacity 0.8-1, 3-5 s, random offsets).
- **Wheel:** holds EVERY remaining item of the deck (starts at 40, shrinks by one per spin), all
  HIDDEN. The mockups show only 6 segments for readability; the real wheel has one thin segment
  per remaining item, colors cycling saffron / turquoise / pomegranate / violet / orange, no "?"
  marks once segments get thin (show "?" only when 12 or fewer remain). Next to the wheel, a
  counter: "Çarkta 34 güç kaldı". The picked segment flashes white with a pomegranate star, then
  disappears as the wheel closes the gap. White rim with 16 small alternating saffron/cream
  lights, saffron hub, saffron pointer at the top. Phone radius ~104px, desktop ~200px.
- **Arch card (the revealed item):** saffron onion-dome arch shape with a dark 3px outline, a
  dashed pomegranate inner trim, hard shadow `0 6px 0 --dark`. Content: item name in Bungee
  (uppercase with "!") and the one-line description in Rubik 700. Overlaps the wheel bottom.
- **Player card:** --dark (the player whose turn it is: --pomegranate), 2px turquoise border at
  55%, radius 12-14px. Name, gold, 3 slot dots (saffron = filled). Labels "SIRA" / "SEN" in text,
  never color alone. Desktop shows the item names in the 3 slots ("boş" when empty).
- **Timer:** pomegranate circle, white 3px border, seconds in Bungee, soft pomegranate glow.
  Last 5 s: gentle pulse.
- **Buttons:** primary = saffron fill, dark text, 3px dark border, radius 16px, hard shadow
  `0 6px 0 --dark` (pressed: shadow 0, translateY(6px)), Bungee. Secondary/increment = --dark
  fill, 3px turquoise border, radius 12px, white Bungee. Min height 44px everywhere.
- **Reserve rule on screen:** always show "Altının X · En fazla Y verebilirsin · Slot n/3" above
  the bid buttons. Disable any button that would break the rule, and say why in text.

## 3. Layouts
- **Phone (360-430px):** header (logo left; room code, theme, "MEZAT a/b" right) -> player cards
  in a row (4 fit; 5-6 players: 3 per row, two rows, compact) -> wheel with the arch card ->
  current bid + timer -> bottom action area (status line, +1/+2/+5, primary button) pinned to
  the bottom within thumb reach.
- **Desktop (>= 1024px):** 3 columns: players with their collections (left, ~320px) | wheel and
  arch card (center) | auction panel: highest bid + timer, bid history, status line and buttons
  (right, ~360px). Lanterns across the full width.
- Between 430 and 1024px: phone layout, centered, max-width 520px.

## 4. Screens and states to build in this style
1. Home: logo, "Oda kur" (nickname) and "Odaya katıl" (code + nickname).
2. Lobby: big room code with copy button, player list (host marked), theme name, host-only
   "Oyunu başlat" (disabled with reason under 2 players).
3. Turn to open: for the player whose turn it is, one huge primary button "ÇARKI ÇEVİR"; others
   see "<Ad> çarkı çeviriyor". Wheel spin animation 2.5-3.5 s, ease-out, then the arch card pops
   in. Then the opener sees "Açılış teklifi ver" (min 1, forced) with the 20 s countdown.
4. Bidding: as in the mockups. A player with full slots sees "Slotların dolu, izliyorsun" and
   no bid buttons.
5. Sale moment: short banner "<Item> -> <Ad> · <N> altın" (1.5-2 s), NO blocking popup.
6. Judge waiting: "Hakem düşünüyor..." with the wheel slowly turning; "judge_failed": message +
   host-only "Tekrar dene".
7. Results: ranking cards (1st big, saffron; others dark), each with the player's 3 items and the
   judge's reason; the judge's funny closing line on an arch card; host-only "Yeniden oyna".
8. Reconnecting: small top bar "Bağlantı koptu, yeniden bağlanılıyor..."

## 5. Rules
- Turkish UI text. No emoji anywhere (icons as inline SVG). No photos or logos of real brands.
- Contrast: body text >= 4.5:1. Muted text only on --bg or --dark.
- Respect `prefers-reduced-motion`: no wheel spin (instant reveal), no flicker, no pulse.
- Keep animation cheap on phones: CSS transforms/opacity only.
