import tr from './tr';
import en from './en';
import de from './de';

let currentLang: 'tr' | 'en' | 'de' = 'tr';
const languages = { tr, en, de };

export function setLanguage(lang: 'tr' | 'en' | 'de') {
  currentLang = lang;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let text = languages[currentLang][key] || key;

  // Replace variables like {count}, {name}, etc.
  if (vars) {
    Object.keys(vars).forEach(varKey => {
      text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(vars[varKey]));
    });
  }

  return text;
}
