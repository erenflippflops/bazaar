# Task 16b – Fixes from Eren's playtest (after the 3 red tests of Task 16 are fixed)

Eren approved these rules. Update docs/GAME_RULES.md with them. Do without asking Eren.

## 1. Deployment check first
Eren saw the pass rule not working live, while it works on main (the outside manager reproduced
it: with P2's slots full, P1's opening bid ends the auction in 0 ms). Likely Render runs an old
commit. Make sure GET /health returns the commit (RENDER_GIT_COMMIT) and the footer shows the
client commit; tell Eren in the final report how to compare them.

## 2. "You are out" message (UI, all themes)
When a player cannot take part in the current auction, their screen must say why, instead of
showing nothing or disabled buttons:
- "Slotların dolu – bu mezatta pas sayılıyorsun"
- "Paran yetmiyor (en fazla X altın) – pas sayılıyorsun"
- "Bu oyuncu için boş slotun yok (kaleci slotun dolu)" / "(oyuncu slotların dolu)" (halisaha)
- "Pas dedin"
The player list shows a PAS badge for passed and auto-out players.

## 3. Halısaha: 1 goalkeeper slot + 3 field slots
- Data: every halisaha item gets `"position": "GK" | "DEF" | "MID" | "FWD"`. At least 6 GK
  (one per possible player), 10 DEF, 12 MID, 12 FWD (total 40).
- Theme: `"slotTypes": ["GK", "FIELD", "FIELD", "FIELD"]`; other themes have no slotTypes
  (any item fits any slot). An item fits a slot if slot is GK and item is GK, or slot is FIELD
  and item is not GK.
- Engine:
  - The winner's item goes into the first empty slot that fits.
  - A player is auto-out of an auction if they have no empty slot that fits the revealed item
    (add this to isOutOfAuction).
  - If NO player has a fitting empty slot: the item is discarded (removed from the game),
    no auction, the turn passes to the next opener. Event: `item_discarded`.
  - If the opener has no fitting slot but others do: the mandatory opening bid passes to the
    next player in turn order who has a fitting slot (that player opens; the original opener's
    turn is still used up). Event: `opener_changed`.
  - Gold reserve stays: max bid = gold − (empty slots − 1).
  - The game ends when every player's slots are all full (unchanged). Prove it always ends.
- UI: the GK slot is labeled "Kaleci" in player cards; the item card shows the position;
  messages from section 2.
- Judge prompt for halisaha mentions the GK + 3 field structure.

## 4. Briefing waits for everyone
- Phase `briefing` ends only when all CONNECTED players pressed "Hazırım". Disconnected
  players count as ready. No automatic timeout.
- After 20 s (× timeScale) the host sees "Hazır olmayanları bekleme, başlat" (new socket event
  `force_start_briefing`, host only).

## Tests (auditor; builders never edit tests/)
- Unit: fitting-slot placement; auto-out for no fitting slot; discard when nobody fits;
  opener handoff; game always ends (random 2-6 player halisaha games with fake RNG, 200 runs,
  every player ends with exactly 1 GK and 3 non-GK); briefing: waits, disconnected = ready,
  force start host-only.
- Integration (sockets): 2-player halisaha full game; out-message state for a player with full
  slots; P1 opens while P2 is out -> auction ends at once.
- E2E human run (definition in Task 15) for halisaha with 2 tabs in one browser: each tab shows
  the right out-message and the Kaleci slot.
- Sabotage: remove the fitting check -> a player ends with 2 GKs and a test goes red.

## Finish
Push after every merge; short Turkish report incl. live commit check steps. Then stop; Task 17
(languages) starts only after the outside manager plays halisaha on the live site.
