# Task 16b - Critical Halisaha Fixes

## Goal
Fix halisaha position tracking so players get 1 GK + 3 field players.

## Files you may change
- server/themes.ts
- server/index.ts

## Builder

### Issue 1: themeItemsToEngineItems drops position field
Current code only maps name and description. Must include position for halisaha items.

Fix in server/themes.ts:
```typescript
export function themeItemsToEngineItems(themeItems: ThemeItem[], lang: 'tr' | 'en' | 'de' = 'tr'): { name: string; description: string; position?: string }[] {
  return themeItems.map(item => ({
    name: item.name[lang],
    description: item.description[lang],
    position: item.position  // Include position if present
  }));
}
```

### Issue 2: slotTypes never passed to engine
The engine needs theme.slotTypes to enforce fitting rules, but server never passes it.

Fix in server/index.ts at three locations:

1. **createGame** (line ~111):
```typescript
const result = engine.createGame(playerId, data.nickname, engineItems, seededRNG(), theme.slots, theme.slotTypes);
```

2. **startGame** (line ~198):
```typescript
const result = engine.startGame(room.state, player.playerId, engineItems, seededRNG(), room.theme.slots, room.theme.slotTypes);
```

3. **rematch** (line ~393):
```typescript
const result = engine.rematch(room.state, player.playerId, engineItems, seededRNG(), room.theme.slots, room.theme.slotTypes);
```

### Update engine signatures
Update server/engine/game.ts function signatures to accept slotTypes:
```typescript
export function createGame(hostId: string, hostNickname: string, items: Item[], rng: RNG, slots: number, slotTypes?: string[]): EngineResult
export function startGame(state: GameState, playerId: string, items: Item[], rng: RNG, slots: number, slotTypes?: string[]): EngineResult
export function rematch(state: GameState, playerId: string, items: Item[], rng: RNG, slots: number, slotTypes?: string[]): EngineResult
```

And add `slotTypes` to the created/updated state in each function.

## Audit
Run integration tests. The halisaha test must pass - each player must have exactly 1 GK and 3 field players.

## Commit messages
- "Task 16b: Include position field in themeItemsToEngineItems"
- "Task 16b: Pass slotTypes to engine on create/start/rematch"
- "Task 16b: Update engine signatures to accept slotTypes"

## Report
Paste halisaha integration test output showing all 3 tests passing.
