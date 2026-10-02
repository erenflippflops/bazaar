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
