# Task 19i – Add i18n infrastructure and Turkish strings

## Goal
Set up i18n infrastructure so all visible text goes through `t(key)` function.
Populate client/src/i18n/tr.ts with all Turkish strings from the mockups.
This prepares for Task 17 (add EN/DE translations).

## Files you may change
- `client/src/i18n/index.ts` (create new)
- `client/src/i18n/tr.ts` (create new)
- `client/src/i18n/en.ts` (create empty stub)
- `client/src/i18n/de.ts` (create empty stub)
- All component files (wrap text in t() calls)

## Builder

1. **i18n/index.ts**: Simple i18n system.
   ```typescript
   import tr from './tr';
   import en from './en';
   import de from './de';
   
   let currentLang = 'tr';
   const languages = { tr, en, de };
   
   export function setLanguage(lang: 'tr' | 'en' | 'de') {
     currentLang = lang;
   }
   
   export function t(key: string): string {
     return languages[currentLang][key] || key;
   }
   ```

2. **i18n/tr.ts**: Export an object with all Turkish strings.
   - Extract every visible text string from the mockups
   - Use hierarchical keys: `lobby.startButton`, `bidding.passButton`, etc.
   - Include all button labels, messages, screen titles, tooltips
   - Example:
     ```typescript
     export default {
       'wheel.spin': 'ÇEVİR!',
       'wheel.remaining': 'Çarkta {count} güç kaldı',
       'controls.spinButton': 'ÇARKI ÇEVİR',
       'controls.passButton': 'PAS',
       // ... all strings
     };
     ```

3. **i18n/en.ts** and **i18n/de.ts**: Empty stubs for now.
   ```typescript
   export default {};
   ```

4. Update all components to use `t(key)` instead of hardcoded strings.
   - Import: `import { t } from '../i18n'`
   - Replace: `"ÇARKI ÇEVİR"` → `t('controls.spinButton')`
   - For strings with variables: support simple {var} replacement in t() function

5. No changes to game logic, only UI text.

## Audit
Check:
1. All visible text in components uses t() calls
2. tr.ts contains all strings from mockups
3. Game still works in Turkish
4. No hardcoded Turkish strings remain in components
5. en.ts and de.ts stubs exist (empty for now)

## Commit messages
```
Add i18n infrastructure and Turkish strings

- Simple i18n system with t() function
- tr.ts with all mockup strings (hierarchical keys)
- en.ts and de.ts empty stubs for Task 17
- All components use t() calls
- No hardcoded Turkish text in components

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

## Report
1. Count of strings in tr.ts
2. Confirmation all components use t()
3. Game still works in Turkish
