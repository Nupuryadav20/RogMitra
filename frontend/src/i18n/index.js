/**
 * i18n/index.js
 * i18next configuration for RogMitra
 * Supports: English (en), Hindi (hi)
 * Language detection: localStorage -> navigator.language -> fallback 'en'
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import hi from './hi.json';

const LANG_STORAGE_KEY = 'rogmitra_language';

/**
 * Detect saved language from localStorage, then browser, then fallback to 'en'.
 * Only 'en' and 'hi' are supported.
 */
function detectLanguage() {
  const supported = ['en', 'hi'];
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && supported.includes(saved)) return saved;
    const browser = navigator.language?.split('-')[0];
    if (browser && supported.includes(browser)) return browser;
  } catch (_) {
    // localStorage unavailable (e.g., SSR or private mode)
  }
  return 'en';
}

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    // No backend: translations are bundled
    ns: ['translation'],
    defaultNS: 'translation',
    react: {
      useSuspense: false,
    },
  });

/**
 * Persist language selection to localStorage.
 * Call this when user switches language.
 * @param {'en'|'hi'} lang
 */
export function setLanguage(lang) {
  const supported = ['en', 'hi'];
  if (!supported.includes(lang)) return;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (_) {}
  i18n.changeLanguage(lang);
}

export default i18n;
