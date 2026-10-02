import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface LocalizedString {
  tr: string;
  en: string;
  de: string;
}

export interface ThemeItem {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
}

export interface Theme {
  id: string;
  slots: number;
  emoji: string;
  name: LocalizedString;
  judgeCriterion: LocalizedString;
  items: ThemeItem[];
}

const THEME_IDS = ['superpowers', 'legendary-fighters', 'halisaha', 'mythical-creatures'] as const;
export type ThemeId = typeof THEME_IDS[number];

const themes = new Map<ThemeId, Theme>();

// Load all themes at startup
for (const themeId of THEME_IDS) {
  const path = join(__dirname, 'themes', `${themeId}.json`);
  const data = JSON.parse(readFileSync(path, 'utf-8')) as Theme;
  themes.set(themeId, data);
}

export function getTheme(themeId: string): Theme | null {
  return themes.get(themeId as ThemeId) || null;
}

export function isValidThemeId(themeId: string): themeId is ThemeId {
  return THEME_IDS.includes(themeId as ThemeId);
}

export function getAllThemes(): Theme[] {
  return Array.from(themes.values());
}
