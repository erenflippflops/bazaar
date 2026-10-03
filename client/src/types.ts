export interface LocalizedString {
  tr: string;
  en: string;
  de: string;
}

export interface ThemeItem {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  position?: string; // For halisaha: "GK" | "DEF" | "MID" | "FWD"
}

export interface Theme {
  id: string;
  slots: number;
  slotTypes?: string[]; // For halisaha: ["GK", "FIELD", "FIELD", "FIELD"]
  emoji: string;
  name: LocalizedString;
  judgeCriterion: LocalizedString;
  items: ThemeItem[];
}
