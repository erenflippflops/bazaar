# Task 17 – Languages: Turkish, English, German (start after Task 16 is approved)

Eren's decision: EACH PLAYER chooses their own language. Players in one room may use
different languages at the same time.

## Build
1. Client i18n: all UI text from dictionaries client/src/i18n/{tr,en,de}.ts (no hard-coded
   strings in components). A language picker (TR / EN / DE) on the entry screen and in the
   game header; the choice is stored per tab (sessionStorage) and defaults to the browser
   language (tr/de/en, else en).
2. Server errors become codes: every ack error is `{ success:false, code:'BID_TOO_LOW',
   params:{min:5} }` (keep a Turkish `error` text for logs only). The client translates codes.
   List all codes in one file shared by tests.
3. Theme content: fill `en` and `de` for every theme name, judgeCriterion, item name and
   description (Task 16 format). Names of real people stay as they are; translate descriptions.
   Item lookups on the client use the player's language.
4. Judge in several languages: the server asks the judge ONCE per game for the languages used
   by the players in that room. JSON shape:
   `{ "ranking":[{ "player":"Ali", "rank":1, "reason":{ "tr":"...", "en":"..." } }],
      "commentary":{ "tr":"...", "en":"..." } }`
   Validation: every requested language present and non-empty for every reason and the
   commentary; otherwise judge_failed (as today). Each client shows its own language.
   Keep the model name.
5. Dates/numbers: nothing special needed; "altın" -> "gold" / "Gold".
6. GAME_RULES.md: add a short "Languages" section.

## Audit
- Unit/integration: error codes for each rule; judge validation with 1, 2 and 3 languages;
  missing language -> judge_failed.
- Script: every dictionary has exactly the same keys; every theme item has tr/en/de non-empty.
- E2E human run with 3 tabs in the same browser using TR, EN and DE at the same time: each tab
  shows its own language everywhere (lobby, wheel, item card, bids, errors, results).

## Finish
Push; short Turkish report with the live commit SHA; the outside manager plays in all
three languages on the live site.
