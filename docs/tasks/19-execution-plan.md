# Task 19 – Execution Plan

Task 19 has been split into 10 subtasks (19a-19j). This document tracks execution order and status.

## Execution Order

### Phase 1: Server Foundation (Sequential)
1. **19a: bidHistory server** - WAITING FOR AUDITOR
   - Auditor: Write integration tests
   - Builder: Implement bidHistory in game engine
   - Required before any UI work that displays bid history

### Phase 2: Client Foundation (Sequential)
2. **19b: Scaling system** - READY TO START
   - Builder: Implement fixed-stage scaling (desktop 1440×900, phone 390×844)
   - Foundation for all UI components

3. **19c: Background, Lanterns, Header** - READY TO START
   - Builder: Port shared visual elements
   - Dependencies: 19b (scaling system)

4. **19i: i18n setup** - READY TO START
   - Builder: Create i18n infrastructure, extract Turkish strings
   - Can run in parallel with 19c

### Phase 3: Components (Parallel possible)
5. **19d: Wheel and PlayerCard** - READY TO START
   - Builder: Port core game components
   - Dependencies: 19b, 19c

6. **19e: StatusBox, BidHistory, Controls** - READY TO START
   - Builder: Port auction UI components
   - Dependencies: 19a (bidHistory data), 19b, 19c, 19i

### Phase 4: Screens (Sequential recommended)
7. **19f: Login, Lobby, Briefing** - READY TO START
   - Builder: Port pre-game screens
   - Dependencies: 19b, 19c, 19i

8. **19g: GameScreen** - READY TO START
   - Builder: Complete game screen with all states
   - Dependencies: 19d, 19e, 19f

9. **19h: Results and Judging** - READY TO START
   - Builder: Port results screen
   - Dependencies: 19g

### Phase 5: Verification (Final)
10. **19j: Pixel tests** - READY TO START
    - Auditor: Create design harness and pixel comparison tests
    - Dependencies: All UI tasks complete (19b-19h)

## Current Status

- ✅ All task files created and committed (19a-19j)
- ✅ Task files pushed to main
- ⏳ Task 19a auditor writing integration tests
- ⏸️  Waiting for auditor completion to proceed

## Next Steps

1. Wait for auditor (Task 19a) to complete
2. Read and verify auditor's tests
3. Merge auditor's test branch
4. Spawn builder for Task 19a implementation
5. After 19a completes, spawn builders for Phase 2 (19b, 19c, 19i can run in parallel)
6. Continue through phases sequentially

## Notes

- Total: 10 subtasks
- Parallel opportunities: Phase 2 (3 builders), Phase 3 (2 builders)
- Critical path: 19a → 19b → 19c → 19d → 19e → 19g → 19h → 19j
- Estimated completion: Large task, will take multiple sessions
