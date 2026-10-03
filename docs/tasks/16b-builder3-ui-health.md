# Task 16b Builder 3: UI (Out Messages, Health Endpoint, Footer)

## Goal
Add "you are out" messages in AuctionPanel, PAS badges in PlayerList, commit SHA in health endpoint and footer.

## Files you may change
- client/src/components/AuctionPanel.tsx
- client/src/components/PlayerList.tsx
- client/src/App.tsx (footer)
- server/main.ts (health endpoint)
- server/index.ts (if outReason needs to be added to state_update)

## Builder Instructions

Read docs/tasks/16b-playtest-fixes.md sections 1 (Deployment check) and 2 (Out messages).

### Part 1: Out Messages

In server/index.ts or engine:
- Add outReason?: string to Player or calculate it when sending state_update
- Reasons:
  - "Slotların dolu – bu mezatta pas sayılıyorsun"
  - "Paran yetmiyor (en fazla X altın) – pas sayılıyorsun"  
  - "Bu oyuncu için boş slotun yok (kaleci slotun dolu)" or "(oyuncu slotların dolu)" for halisaha
  - "Pas dedin"

In client/src/components/AuctionPanel.tsx:
- When player is out (cannot bid): show outReason prominently
- Hide bid input/buttons when out

In client/src/components/PlayerList.tsx:
- Show "PAS" badge for players with outReason or in passedPlayerIds

### Part 2: Commit SHA Display

In server/main.ts:
- GET /health should return `{ commit: process.env.RENDER_GIT_COMMIT || 'dev' }`

In client/src/App.tsx:
- Add footer at bottom: "Server: {commitFromHealthEndpoint} | Client: {import.meta.env.VITE_GIT_COMMIT || 'dev'}"
- Fetch /health on mount, display commit SHA

### Part 3: Briefing Force Start Button

In client briefing screen (GameScreen when phase=briefing):
- After 20s, if user is host and briefing_force_available event received
- Show button: "Hazır olmayanları bekleme, başlat"
- On click: emit force_start_briefing

Make integration tests pass for out-message and instant auction end.

## Audit
Auditor will verify:
- Out messages display correctly
- PAS badges show
- Health returns commit, footer shows it
- No changes to files outside your list

## Commit messages
- "Task 16b builder 3: Add out-message display in AuctionPanel and PAS badges"
- "Task 16b builder 3: Add commit SHA to health endpoint and footer"
- "Task 16b builder 3: Add briefing force start button for host"

## Report
Show screenshots or describe UI changes. Paste test results for integration tests.
