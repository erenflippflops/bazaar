# Task 16b Builder 2: Briefing Wait and Force Start

## Goal
Implement briefing phase logic: wait for all connected players, disconnected count as ready, host can force-start after 20s.

## Files you may change
- server/engine/game.ts (briefing logic)
- server/index.ts (force_start_briefing socket event)

## Builder Instructions

Read docs/tasks/16b-playtest-fixes.md section 4 (Briefing waits for everyone).

Implement:

1. **In server/engine/game.ts**:
   - Add markBriefingReady(state, playerId) function
   - Adds playerId to state.briefingReadyPlayers (don't add duplicates)
   - Check if all CONNECTED players are ready (disconnected = always ready)
   - If all ready: transition to 'playing', emit briefing_complete event
   - Return updated state

2. **In server/index.ts**:
   - Add socket handler for 'mark_briefing_ready' (any player)
   - Calls markBriefingReady, broadcasts state_update
   
   - After 20s × timeScale in briefing phase:
     - Emit to host only: { type: 'briefing_force_available' }
   
   - Add socket handler for 'force_start_briefing' (host only)
   - Marks all players ready, transitions to playing
   - Broadcasts state_update

3. **Timer management**:
   - On entering briefing: start 20s timer
   - On briefing_complete or force_start: clear timer
   - Use room timers pattern from existing code

Make all tests in tests/engine/briefing.test.ts and tests/integration/ briefing tests pass.

## Audit
Auditor will verify:
- All briefing tests pass
- Force start is host-only
- No changes to files outside your list

## Commit messages
- "Task 16b builder 2: Implement briefing wait for all players"
- "Task 16b builder 2: Add force_start_briefing for host"

## Report
Paste test results showing all briefing tests green. Show socket event handlers you added.
