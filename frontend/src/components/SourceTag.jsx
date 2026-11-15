// SourceTag.jsx — 🟢🔵🟡 source attribution tag component
// Rule 2 (PROJECT_RULES.md): Every data item tagged by source
import React from 'react';

const SOURCE_CONFIG = {
  patient: {
    emoji: '🟢',
    label: 'Patient-Reported',
    labelHi: 'रोगी-रिपोर्टेड',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  doc: {
    emoji: '🔵',
    label: 'Doc-Extracted',
    labelHi: 'दस्तावेज़-निकाला',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  ai: {
    emoji: '🟡',
    label: 'AI-Draft',
    labelHi: 'AI-ड्राफ्ट',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

/**
 * @param {'patient'|'doc'|'ai'} type
 * @param {boolean} showLabel - show text label (default true)
 * @param {'en'|'hi'} lang
 */
export default function SourceTag({ type = 'patient', showLabel = true, lang = 'en', className = '' }) {
  const config = SOURCE_CONFIG[type] || SOURCE_CONFIG.patient;
  const labelText = lang === 'hi' ? config.labelHi : config.label;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium select-none ${config.className} ${className}`}
    >
      <span aria-label={config.label}>{config.emoji}</span>
      {showLabel && <span>{labelText}</span>}
    </span>
  );
}
