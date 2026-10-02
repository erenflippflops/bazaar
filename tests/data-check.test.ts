import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface LocalizedString {
  tr: string;
  en: string;
  de: string;
}

interface ThemeItem {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
}

interface Theme {
  id: string;
  slots: number;
  emoji: string;
  name: LocalizedString;
  judgeCriterion: LocalizedString;
  items: ThemeItem[];
}

describe('Task 16: Theme Data Validation', () => {
  const themesDir = join(__dirname, '../server/themes');
  const expectedThemes = ['superpowers', 'legendary-fighters', 'halisaha', 'mythical-creatures'];

  it('all expected themes exist', () => {
    const files = readdirSync(themesDir);
    const themeFiles = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));

    for (const themeId of expectedThemes) {
      expect(themeFiles).toContain(themeId);
    }
  });

  expectedThemes.forEach(themeId => {
    describe(`Theme: ${themeId}`, () => {
      let theme: Theme;

      it('loads and parses correctly', () => {
        const themePath = join(themesDir, `${themeId}.json`);
        const content = readFileSync(themePath, 'utf-8');
        theme = JSON.parse(content);
        expect(theme).toBeDefined();
        expect(theme.id).toBe(themeId);
      });

      it('has exactly 40 items', () => {
        const themePath = join(themesDir, `${themeId}.json`);
        const content = readFileSync(themePath, 'utf-8');
        theme = JSON.parse(content);
        expect(theme.items).toHaveLength(40);
      });

      it('all item IDs are unique', () => {
        const themePath = join(themesDir, `${themeId}.json`);
        const content = readFileSync(themePath, 'utf-8');
        theme = JSON.parse(content);

        const ids = theme.items.map(item => item.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(40);
      });

      it('all item names (tr) are unique', () => {
        const themePath = join(themesDir, `${themeId}.json`);
        const content = readFileSync(themePath, 'utf-8');
        theme = JSON.parse(content);

        const names = theme.items.map(item => item.name.tr);
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(40);
      });

      it('all descriptions (tr) are ≤ 70 characters', () => {
        const themePath = join(themesDir, `${themeId}.json`);
        const content = readFileSync(themePath, 'utf-8');
        theme = JSON.parse(content);

        for (const item of theme.items) {
          expect(item.description.tr.length).toBeLessThanOrEqual(70);
        }
      });

      if (themeId === 'halisaha') {
        it('has correct position distribution', () => {
          const themePath = join(themesDir, `${themeId}.json`);
          const content = readFileSync(themePath, 'utf-8');
          theme = JSON.parse(content);

          let goalkeepers = 0;
          let defenders = 0;
          let midfielders = 0;
          let forwards = 0;

          for (const item of theme.items) {
            const desc = item.description.tr.toLowerCase();
            if (desc.includes('kaleci')) {
              goalkeepers++;
            } else if (desc.includes('defans') || desc.includes('stoper') || desc.includes('bek')) {
              defenders++;
            } else if (desc.includes('orta saha') || desc.includes('ortasaha')) {
              midfielders++;
            } else if (desc.includes('forvet') || desc.includes('santrafor')) {
              forwards++;
            }
          }

          expect(goalkeepers).toBeGreaterThanOrEqual(6);
          expect(defenders).toBeGreaterThanOrEqual(10);
          expect(midfielders).toBeGreaterThanOrEqual(12);
          expect(forwards).toBeGreaterThanOrEqual(12);
        });
      }
    });
  });
});
