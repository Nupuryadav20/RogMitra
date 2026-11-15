// DemoBadge.jsx — Persistent "DEMO / SYNTHETIC DATA" banner
// Shown on every screen per Rule 6 (PROJECT_RULES.md)
import React from 'react';
import { FlaskConical } from 'lucide-react';

export default function DemoBadge({ className = '' }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold select-none ${className}`}
      role="status"
      aria-label="Demo mode: synthetic data only"
    >
      <FlaskConical className="w-3.5 h-3.5" />
      DEMO / SYNTHETIC DATA
    </div>
  );
}
