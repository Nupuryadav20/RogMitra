// LanguageToggle.jsx — EN/HI language switcher using i18next
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageToggle({ className = '' }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  const toggle = () => {
    const next = current === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('rogmitra_lang', next);
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-surface-border bg-white shadow-sm hover:bg-mint-50 transition-colors text-sm font-semibold text-gray-700 ${className}`}
      aria-label={`Switch to ${current === 'en' ? 'Hindi' : 'English'}`}
    >
      <Languages className="w-3.5 h-3.5 text-brand" />
      <span className={current === 'en' ? 'text-brand' : 'text-gray-400'}>EN</span>
      <span className="text-gray-300">/</span>
      <span className={current === 'hi' ? 'text-brand' : 'text-gray-400'}>हि</span>
    </button>
  );
}
