// RedFlagBanner.jsx — Emergency alert banner for patient-facing red flags
// Rule 3 (PROJECT_RULES.md): Red flags are deterministic rule-based, never LLM.
import React from 'react';
import { AlertTriangle, X, Phone } from 'lucide-react';

export default function RedFlagBanner({ flags = [], onDismiss }) {
  if (!flags || flags.length === 0) return null;

  return (
    <div
      className="rounded-2xl border-2 border-flagRed-border bg-flagRed-bg p-4 shadow-md"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-flagRed-text" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-flagRed-text text-sm">
              🔴 Emergency Alert / आपातकालीन चेतावनी
            </span>
          </div>

          <ul className="space-y-1">
            {flags.map((flag, i) => (
              <li key={i} className="text-sm text-red-800">
                <span className="font-semibold">{flag.keyword}</span>
                {' — '}
                <span>{flag.message_en}</span>
                <span className="text-xs text-red-600 block ml-2">
                  {flag.message_hi}
                </span>
              </li>
            ))}
          </ul>

          {/* Emergency call prompt */}
          <div className="mt-3 flex items-center gap-2 text-xs text-red-700 font-semibold bg-red-100 rounded-xl px-3 py-2">
            <Phone className="w-3.5 h-3.5" />
            Please go to the nearest emergency room immediately.
            तुरंत नजदीकी आपातकालीन विभाग में जाएं। Call 108
          </div>
        </div>

        {/* Dismiss */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-red-100 text-flagRed-text transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
