// AuthLayout.jsx — Two-column login layout (hero left, form right)
import React from 'react';
import DemoBadge from '../components/DemoBadge';
import Logo from '../components/Logo';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-mint-50">
      {/* Left hero column */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand p-10 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
              🏥
            </div>
            <div>
              <div className="font-extrabold text-2xl tracking-tight">RogMitra</div>
              <div className="text-white/70 text-xs">AI Case-Taking Platform</div>
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-6">
          <div className="text-5xl">🤝</div>
          <h1 className="text-3xl font-extrabold leading-tight">
            Pre-Consultation<br />
            Case-Taking<br />
            <span className="text-mint-300">Made Simple</span>
          </h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-sm">
            Collect patient history, scan documents, and generate physician-ready clinical summaries — before the patient even enters the consultation room.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Voice Interview', 'OCR Docs', 'Ayurvedic History', 'Red Flag Alerts'].map((f) => (
              <span key={f} className="px-3 py-1 rounded-full bg-white/15 text-xs font-medium border border-white/20">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/50">
          Theme 3: Patient Friendly • DPDP Act 2023 Compliant
        </div>
      </div>

      {/* Right form column */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Mobile logo */}
        <div className="lg:hidden mb-6">
          <Logo size="lg" />
        </div>

        {/* Demo badge top right */}
        <div className="absolute top-4 right-4">
          <DemoBadge />
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
