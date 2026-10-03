# Task 19f – Port Login, Lobby, and Briefing screens

## Goal
Rebuild Login (02), Lobby (03/03b), and Briefing (04) screens using the new components and mockup layouts.

## Files you may change
- `client/src/screens/LoginScreen.tsx` (create new)
- `client/src/screens/LobbyScreen.tsx` (update with new layout)
- `client/src/screens/BriefingScreen.tsx` (update with new layout)
- `client/src/components/ThemeCard.tsx` (create new)
- `client/src/components/LanguageRow.tsx` (create new)
- `client/src/components/RoomCodePanel.tsx` (create new)
- `client/src/components/RulesGrid.tsx` (create new)
- `client/src/components/ReadyChips.tsx` (create new)
- Delete: `client/src/screens/HomeScreen.tsx` (replaced by LoginScreen)

## Builder

1. **LoginScreen.tsx** (mockup 02):
   - Desktop 1440×900 layout: centered form
   - Phone 390×844 layout: scrollable
   - Name input (1-16 chars)
   - Language selector (TR/EN/DE flag buttons)
   - 4 theme cards (grid) with name + description
   - "ODA OLUŞTUR" button
   - "Odaya Katıl" section with code input
   - Error line at bottom (red text)
   - Copy exact spacing, fonts, colors from mockup

2. **LobbyScreen.tsx** (mockup 03/03b):
   - Host version (03): shows "BAŞLAT" button (enabled after 2+ players)
   - Guest version (03b): shows "Başlamak için hazırlan..." text
   - Room code panel (large, copyable)
   - Player list with ready indicators
   - Theme name displayed
   - Desktop/phone layouts from mockup

3. **BriefingScreen.tsx** (mockup 04):
   - Rules display (RulesGrid component)
   - Ready chips showing who's ready
   - Host: "OYUNU BAŞLAT" button (enabled after 20s or all ready)
   - Others: "HAZIRIM" button
   - Copy exact layout from mockup

4. **ThemeCard.tsx**: Theme selection card with icon, name, description.
   - Props: `theme: {id, name, description}, selected: boolean, onClick`
   - Selected state: border highlight
   - Copy card styling from mockup

5. **LanguageRow.tsx**: Flag buttons for TR/EN/DE.
   - Props: `selected: string, onChange: (lang) => void`
   - Copy button styles from mockup

6. **RoomCodePanel.tsx**: Large room code display with copy button.
   - Props: `code: string`
   - Copy styling from mockup

7. **RulesGrid.tsx**: Game rules display (3 columns on desktop, stacked on phone).
   - Static content in Turkish (i18n keys)
   - Copy layout from mockup

8. **ReadyChips.tsx**: Player ready indicators.
   - Props: `players: Array<{nickname, ready}>`
   - Copy chip styling from mockup

9. Delete HomeScreen.tsx.

## Audit
Visual check:
1. LoginScreen matches mockup 02 (desktop + phone)
2. LobbyScreen matches mockup 03/03b (host vs guest)
3. BriefingScreen matches mockup 04
4. All interactive elements functional
5. Scrolling works on phone layouts

## Commit messages
```
Port Login, Lobby, Briefing screens

- LoginScreen: name, language, themes, join code
- LobbyScreen: room code, player list, ready state
- BriefingScreen: rules, ready chips, start button
- New components: ThemeCard, LanguageRow, RoomCodePanel, RulesGrid, ReadyChips
- Delete old HomeScreen

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

## Report
1. Screenshots of Login, Lobby, Briefing (desktop + phone)
2. Confirmation HomeScreen deleted
