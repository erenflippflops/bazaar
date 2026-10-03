# Task 16b - Server Fixes

## Goal
Fix server socket handlers and state sanitization for Task 16b features.

## Files you may change
- server/index.ts (socket handlers, sanitization)

## Builder
1. Fix `ready_briefing` handler: replace `engine.allBriefingReady(room.state)` with proper check
   - Use `engine.checkBriefingComplete(room.state, connectedPlayerIds)` 
   - connectedPlayerIds: Array.from(socketToPlayer.values()).filter(p => p.roomCode === player.roomCode).map(p => p.playerId)
   - Check result.events for 'briefing_complete', if found call startPlaying

2. Implement `force_start_briefing` socket handler (host-only):
   - Validate player is in room
   - Call engine.forceStartBriefing(room.state, player.playerId)
   - On success: update state, clear briefing timer, schedule opening timer, emit state_update
   - Events: briefing_forced

3. Add `outReason` field to sanitized player state:
   - In sanitizeStateForAll(), calculate outReason for each player
   - Use engine.isOutOfAuction(state, player) during opening/bidding phases
   - Messages per Task 16b section 2:
     - All slots full: "Slotların dolu – bu mezatta pas sayılıyorsun"
     - Insufficient gold: "Paran yetmiyor (en fazla X altın) – pas sayılıyorsun"
     - No fitting slot (halisaha): "Bu oyuncu için boş slotun yok (kaleci slotun dolu)" or "(oyuncu slotların dolu)"
     - Passed: "Pas dedin"
   - Add `passedBadge: boolean` field (true if player is out or passed)

4. Update /health endpoint to return RENDER_GIT_COMMIT if available:
   - Read process.env.RENDER_GIT_COMMIT
   - Return { status: 'ok', commit: process.env.RENDER_GIT_COMMIT || 'unknown' }

## Audit
Run integration tests, verify:
- ready_briefing works without "allBriefingReady is not a function" error
- force_start_briefing works (host only)
- outReason appears in state_update for out players
- /health returns commit

## Commit messages
- "Task 16b: Fix ready_briefing handler to use checkBriefingComplete"
- "Task 16b: Implement force_start_briefing socket handler"
- "Task 16b: Add outReason and passedBadge to player state"
- "Task 16b: Add commit SHA to /health endpoint"

## Report
List all changes, paste test output showing halisaha tests passing.
