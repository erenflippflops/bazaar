# Task 06: Character System (Avatar Customization)

**Date:** 30 September 2026  
**Manager:** ENI  
**Builder:** Fable 5.1, effort high  
**Priority:** HIGH (parallel with Tasks 05, 07)

---

## Builder

### Context
Players need visual identity in the game. Create a character/avatar system inspired by Kahoot/Gartic: big-headed cartoon humans with customizable accessories. The server stores only choice numbers (efficient), the client renders the visuals.

### Design Requirements (from DEVIR.md)

**Base Characters:** 8 human bases, diverse (age, skin tone, hair), big-headed cartoon style (not caricature)

**Customization Categories:**
1. **Hat:** 6-8 options (game show + market themed: crown, turban, fez, top hat, chef hat, flower wreath, none)
2. **Face:** 6-8 options (glasses, sunglasses, mustache, beard, eye patch, monocle, none)
3. **Item:** 6-8 options (microphone, gavel, lantern, spice jar, carpet roll, treasure chest, none)
4. **Background color:** 6-8 options (market + show colors from design system)

**Expressions:** 5 states (normal, excited, stressed, happy, sad)
- Used during gameplay: bid → excited, last 5s highest → stressed + red + shake, win → happy

**Random button:** Picks random valid combination

**Emotes:** Ready-made emote buttons (thumbs up, clap, laugh, cry) - player can click to show briefly above their avatar

### Technical Architecture

**Data Model:**
```typescript
interface CharacterSelection {
  base: number;           // 0-7 (which of 8 base characters)
  hat: number;            // 0-7 (includes "none" option)
  face: number;           // 0-7 (includes "none" option)
  item: number;           // 0-7 (includes "none" option)
  bgColor: number;        // 0-7 (background color index)
}

interface PlayerState {
  nickname: string;
  gold: number;
  slots: (Item | null)[];
  character?: CharacterSelection;  // NEW field
  expression?: 'normal' | 'excited' | 'stressed' | 'happy' | 'sad';  // NEW
}
```

**Server Changes Needed:**
1. Add `character` field to Player type in `server/types.ts`
2. Add `update_character` socket event in `server/index.ts`:
   ```typescript
   socket.on('update_character', (data: CharacterSelection) => {
     // Find player by socket ID
     // Validate numbers are in range
     // Update player.character
     // Broadcast state_update
   });
   ```
3. Server validates ranges, stores numbers, broadcasts to all

**Client Changes:**
1. Add character selection screen (before/after lobby, or in lobby as modal)
2. Add `<Avatar>` component that renders a character from selection numbers
3. Update PlayerList to show avatars instead of just names
4. Add expression logic (bid → excited, etc.)
5. Add emote buttons in GameScreen

### Files You Will Create/Modify

```
server/
├── types.ts                      (MODIFY - add character field)
└── index.ts                      (MODIFY - add update_character event)

client/src/
├── screens/
│   └── CharacterSelectScreen.tsx (NEW)
├── components/
│   ├── Avatar.tsx                (NEW - renders character from numbers)
│   ├── CharacterCustomizer.tsx   (NEW - UI for picking options)
│   └── EmoteButtons.tsx          (NEW - emote UI)
└── assets/
    └── character-parts/          (NEW folder - SVG or PNG assets)
        ├── bases/                (8 base characters)
        ├── hats/                 (8 hat options)
        ├── faces/                (8 face accessories)
        ├── items/                (8 held items)
        └── README.md             (asset credits/sources)
```

### Asset Creation

**Option A: Use Free SVG Libraries**
- Search for "avatar builder SVG" or "character creator assets"
- Recommended: [DiceBear Avatars](https://www.dicebear.com/) (MIT license, can customize)
- Or [Avataaars](https://avataaars.com/) style (Sketch library, can export SVG)

**Option B: Simple Geometric Shapes**
Create basic SVG shapes in code:
- Base: circle (head) + smaller circle (body)
- Skin tones: 8 fill colors
- Hair: simple shapes on top (short, long, curly, bald, etc.)
- Accessories: layer SVG elements

**Requirement:** Must be MIT/CC0 licensed or created by you. Document sources in `assets/character-parts/README.md`.

### CharacterSelectScreen.tsx

**Layout:**
- Preview of current character (large, center)
- 4 category selectors (hat, face, item, bg color) - horizontal scrollable thumbnails
- "Random" button
- "Confirm" button → saves to server, goes to lobby

**Socket event:**
`socket.emit('update_character', characterSelection)`

### Avatar.tsx Component

**Props:**
```typescript
interface AvatarProps {
  character: CharacterSelection;
  expression?: 'normal' | 'excited' | 'stressed' | 'happy' | 'sad';
  size?: 'small' | 'medium' | 'large';
  emote?: string;  // emoji to show above avatar briefly
}
```

**Rendering:**
Layer SVG/images in order:
1. Background color circle
2. Base character
3. Hat (if not "none")
4. Face accessory (if not "none")
5. Item (if not "none")
6. Expression overlay (change mouth/eyes based on expression)
7. Emote bubble (if emote present)

**Expression logic:**
- Normal: default
- Excited: bigger eyes, smile
- Stressed: wide eyes, gritted teeth, add red tint + shake animation
- Happy: big smile, closed eyes
- Sad: frown, droopy eyes

### EmoteButtons.tsx

4 buttons: 👍 👏 😂 😢

Click → emit socket event:
```typescript
socket.emit('send_emote', { emote: '👍' });
```

Server broadcasts emote to all players with timestamp. Client shows it above that player's avatar for 2 seconds.

### Server Implementation

**types.ts changes:**
```typescript
interface Player {
  id: string;
  nickname: string;
  gold: number;
  slots: (Item | null)[];
  token: string;
  character?: {
    base: number;
    hat: number;
    face: number;
    item: number;
    bgColor: number;
  };
}
```

**index.ts changes:**
Add socket event handler:
```typescript
socket.on('update_character', (data: any) => {
  const { roomCode } = socketToRoom.get(socket.id) || {};
  if (!roomCode) return socket.emit('error', { message: 'Not in a room' });
  
  const room = rooms.get(roomCode);
  if (!room) return;
  
  const player = room.state.players.find(p => p.id === socket.id);
  if (!player) return;
  
  // Validate ranges
  if (
    typeof data.base !== 'number' || data.base < 0 || data.base > 7 ||
    typeof data.hat !== 'number' || data.hat < 0 || data.hat > 7 ||
    typeof data.face !== 'number' || data.face < 0 || data.face > 7 ||
    typeof data.item !== 'number' || data.item < 0 || data.item > 7 ||
    typeof data.bgColor !== 'number' || data.bgColor < 0 || data.bgColor > 7
  ) {
    return socket.emit('error', { message: 'Invalid character data' });
  }
  
  player.character = data;
  
  // Broadcast updated state
  io.to(roomCode).emit('state_update', sanitizeStateForAll(room.state));
});

socket.on('send_emote', (data: any) => {
  const { roomCode } = socketToRoom.get(socket.id) || {};
  if (!roomCode) return;
  
  const player = room.state.players.find(p => p.id === socket.id);
  if (!player) return;
  
  // Broadcast emote to room
  io.to(roomCode).emit('player_emote', {
    nickname: player.nickname,
    emote: data.emote,
    timestamp: Date.now()
  });
});
```

### Integration with GameScreen

**Expression triggers:**
- Player places bid → set their expression to 'excited' for 1s
- Last 5s of auction + you're highest bidder → 'stressed' + red tint + shake
- You win auction → 'happy' for 2s
- You wanted to bid but out of gold → 'sad' for 1s

Client-side only (no server state for expressions, too transient).

### Constraints

- Keep assets simple (this is a prototype, not pixel art masterpiece)
- All assets must be free/open source (document in README.md)
- Server only stores 5 numbers per player (efficient)
- Character selection is optional (if no character, show placeholder/initials)
- Each major component is a separate commit
- Provide raw output (no "✓ done" summaries)

### Testing

After each commit:
1. Start server + client
2. Create room, open CharacterSelectScreen
3. Customize character, click Confirm
4. Verify avatar shows in PlayerList
5. Play game, trigger expressions (bid, win, lose)
6. Send emotes, verify they appear

### Expected Output

4 commits:
1. `Add character types and server events (update_character, send_emote)`
2. `Add Avatar component and character assets`
3. `Add CharacterSelectScreen with customization UI`
4. `Add expression logic and emote buttons to GameScreen`

---

## Audit

### Context
Builder added character/avatar system with customization. Your job: verify it works, assets are licensed, expressions trigger correctly.

### Setup
```bash
cd C:\Users\lolse\Projects\BAZAAR-audit
git pull
```

### Tasks

#### 1. Read Commits
```bash
git log --oneline -4
git diff HEAD~4..HEAD --stat
```

Verify 4 commits for character system.

#### 2. Code Review

**Server changes:**
- Read `server/types.ts` - is `character` field added to Player?
- Read `server/index.ts` - are `update_character` and `send_emote` events present?
- Are ranges validated (0-7)?

**Avatar component:**
- Read `client/src/components/Avatar.tsx`
- Does it render all 5 layers (bg, base, hat, face, item)?
- Does it handle expressions?
- Does it show emotes?

**CharacterSelectScreen:**
- Read `client/src/screens/CharacterSelectScreen.tsx`
- Does it have 4 category selectors?
- Does "Random" button work?
- Does it emit `update_character` on Confirm?

**Assets:**
- Read `client/src/assets/character-parts/README.md`
- Are asset sources documented?
- Are licenses MIT/CC0/free?
- Are there 8+ options per category?

#### 3. Manual Test

Start server + client, open 2 tabs.

**Test character selection:**
1. Tab 1: Create room, open character select (if separate screen/modal)
2. Try each category selector (hat, face, item, bg)
3. Verify preview updates immediately
4. Click "Random" - verify random combination
5. Click "Confirm"
6. Verify avatar appears in lobby PlayerList

**Test expressions:**
1. Tab 2: Join room with different character
2. Start game
3. Tab 1: Spin, place opening bid
   - Verify Tab 1's avatar shows "excited" expression briefly
4. Tab 2: Place higher bid
   - Verify Tab 2's avatar excited
5. Wait until last 3 seconds of auction
   - Verify Tab 2's avatar (highest bidder) shows "stressed" + red + shake
6. Auction ends, Tab 2 wins
   - Verify Tab 2's avatar shows "happy" briefly

**Test emotes:**
1. During game, click emote button (👍)
2. Verify emote appears above your avatar in other player's view
3. Verify it disappears after ~2s

**Screenshot each test.**

#### 4. Edge Cases

- No character selected: does game still work? (placeholder shown?)
- Invalid character data sent: does server reject?
- Emote spam: does it handle multiple emotes quickly?

#### 5. Asset Quality

- Do avatars look reasonable (not broken/ugly)?
- Are they distinguishable from each other?
- Do accessories layer correctly (no clipping)?

### Report Format

```markdown
# Task 06 Audit Report

## 1. Commits
[paste git log]
[paste git diff --stat]

## 2. Code Review

### Server Changes
Character field: ADDED / MISSING
update_character event: PRESENT / BUG: ...
send_emote event: PRESENT / BUG: ...
Validation: CORRECT / BUG: ...

### Avatar Component
Layers: CORRECT / BUG: ...
Expressions: WORKING / BUG: ...
Emotes: WORKING / BUG: ...

### CharacterSelectScreen
Selectors: WORKING / BUG: ...
Random: WORKING / BUG: ...
Emit event: CORRECT / BUG: ...

### Assets
README present: YES / NO
Licenses: DOCUMENTED / NOT DOCUMENTED
Quality: GOOD / ISSUES: ...

## 3. Manual Test

[Screenshot: character select screen]
[Screenshot: avatars in player list]
[Screenshot: excited expression]
[Screenshot: stressed expression during auction]
[Screenshot: emote above avatar]

Character selection: PASSED / FAILED: ...
Expressions: PASSED / FAILED: ...
Emotes: PASSED / FAILED: ...

## 4. Edge Cases

No character selected: HANDLED / BUG: ...
Invalid data: REJECTED / BUG: ...
Emote spam: HANDLED / BUG: ...

## 5. Asset Quality

Visual quality: GOOD / ACCEPTABLE / POOR: ...
Distinguishable: YES / NO
Layering: CORRECT / CLIPPING: ...

## 6. Summary

Character system: WORKING / X BUGS: ...
Assets: LICENSED / LICENSE ISSUE: ...
Polish needed: [list]

APPROVED FOR MERGE / REJECT: [reason]
```

### Constraints
- Do NOT edit any files
- Verify asset licenses (check README.md)
- Take real screenshots
- Report only verified facts
