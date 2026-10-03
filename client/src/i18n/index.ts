import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ta from './locales/ta.json';

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ta', label: 'தமிழ்', short: 'த' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const LANGUAGE_KEY = 'uyirangadi_lang';

function getInitialLanguage(): LanguageCode {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored === 'en' || stored === 'ta') return stored;
  // Fall back to the browser language, defaulting to English.
  return navigator.language?.toLowerCase().startsWith('ta') ? 'ta' : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ta: { translation: ta },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Persist the chosen language and keep <html lang> in sync for SEO/a11y. */
export function changeLanguage(lang: LanguageCode) {
  localStorage.setItem(LANGUAGE_KEY, lang);
  document.documentElement.lang = lang;
  return i18n.changeLanguage(lang);
}

document.documentElement.lang = i18n.language;

export default i18n;
