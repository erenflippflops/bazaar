# Task 16 – Themes ("konseptler") (start only after Task 15 passed the human-play check)

Eren's decisions: 4 themes; the HOST chooses the theme when creating the room.

## Themes
| id | Turkish name | slots per player | items | judge criterion (idea) |
|---|---|---|---|---|
| superpowers | Süper Güçler | 3 | existing 40 | strongest and most creative team of powers (current) |
| legendary-fighters | Efsanevi Savaşçılar | 3 | 40 | who wins a 3-vs-3 team fight; synergy, era, skills |
| halisaha | 4'lü Halı Saha | 4 | 40 | best 4-a-side team: balance (goalkeeper, defense, attack), stars, chemistry |
| mythical-creatures | Mitolojik Yaratıklar | 3 | 40 | most powerful and creative creature team; synergy |

Content rules:
- legendary-fighters: historical or mythological warriors in the public domain (e.g. Achilles,
  Miyamoto Musashi, Spartacus, Leonidas, Joan of Arc, Hercules, Lu Bu, Saladin, Boudica,
  Sun Tzu). NO copyrighted fictional characters (no anime, comics, games, films).
- halisaha: real football players, current and legends, mixed positions; at least 6
  goalkeepers, 10 defenders, 12 midfielders, 12 forwards. Description = position + one short
  neutral fact. No insults, no private-life topics.
- mythical-creatures: creatures from world mythologies (dragon, kraken, phoenix, griffin,
  basilisk, Anka, Şahmeran, Fenrir, Kitsune, Wendigo…), varied cultures.
- Every item: unique id, name and description (description max ~60 characters), all
  balanced so no theme has 10 obviously best picks. Translations come in Task 17; write
  Turkish now but use the file format below so Task 17 only fills `en` and `de`.

## Data format (one file per theme, server/themes/<id>.json)
```
{ "id": "halisaha", "slots": 4, "emoji": "⚽",
  "name": { "tr": "4'lü Halı Saha", "en": "", "de": "" },
  "judgeCriterion": { "tr": "...", "en": "", "de": "" },
  "items": [ { "id": "messi", "name": { "tr": "Lionel Messi", "en": "", "de": "" },
               "description": { "tr": "Forvet – 8 Ballon d'Or", "en": "", "de": "" } } ] }
```
Convert server/superpowers.json into server/themes/superpowers.json (same 40 items).

## Build
1. Engine: slots per player come from the theme (createGame/startGame/rematch get the
   theme). The gold reserve rule uses the real empty-slot count, so it works with 4 slots.
   Total auctions = players × slots. Turn order, pass rule, end of game unchanged.
2. create_room gets `themeId` (validated against the theme list; default superpowers).
   The lobby shows the theme name and emoji to everyone; rematch keeps the theme.
3. Entry screen: theme picker for the room creator (4 cards with emoji + name + one line),
   joiners just see the theme in the lobby.
4. Judge: the prompt uses the theme's judgeCriterion and slot count. Keep the model name.
   The JSON validation stays strict.
5. MEZAT counter, "Çarkta N kaldı", slots UI and results all use the theme's slot count.
6. Update docs/GAME_RULES.md: themes, slots per theme, judge criterion per theme.

## Audit
- Unit: 4-slot game (2 and 6 players) ends after players × 4 auctions; gold reserve with 4 slots.
- Integration: create_room with each theme; invalid themeId rejected; judge prompt contains the
  theme criterion (fake judge receives it).
- Data check script: each theme has exactly 40 unique ids and names, descriptions ≤ 70 chars,
  halisaha position counts as above.
- E2E human run (same definition of done as Task 15) for halisaha (4 slots) and one 3-slot theme.

## Finish
Push after every merge; short Turkish report with the live commit SHA; the outside manager
plays each theme on the live site.
