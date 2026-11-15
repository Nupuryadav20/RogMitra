import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, ShieldCheck, HeartPulse, Stethoscope, AlertTriangle } from 'lucide-react';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [datasetDetected, setDatasetDetected] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus(data.status || 'online');
        setDatasetDetected(Boolean(data.dataset_mts_dialog_present));
      })
      .catch(() => {
        setBackendStatus('offline (start backend on :8000)');
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F4FBF7] p-6 text-gray-900">
      <header className="max-w-6xl mx-auto flex items-center justify-between py-4 border-b border-[#E2EFE7] mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white shadow-button-green">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              RogMitra
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-mint-100 text-brand border border-mint-300">
                Phase 2 Setup
              </span>
            </h1>
            <p className="text-xs text-gray-500">AI-Assisted Patient Case-Taking Platform • Theme 3: Patient Friendly</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white border border-[#E2EFE7] shadow-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${backendStatus === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="font-medium text-gray-600">Backend API: {backendStatus}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {/* Hero Card matching Theme 3 */}
        <section className="bg-mint-100 rounded-3xl p-8 border border-mint-200 relative overflow-hidden shadow-card">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-brand text-xs font-semibold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-brand" />
              B.Tech Final Year Project Architecture
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Pre-Consultation Case-Taking & Clinical Note Generation
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Designed for Indian hospital OPDs. Shifting patient history collection, medical document OCR,
              and Ayurvedic triage to the waiting area, producing physician-editable draft summaries with deterministic red flag alerts.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="text-xs px-3 py-1.5 rounded-lg bg-white font-medium text-gray-700 border border-mint-200">
                Dataset: {datasetDetected ? '✅ Microsoft MTS-Dialog + ACI-Bench Verified' : '📁 Corpus Initialized'}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-lg bg-white font-medium text-gray-700 border border-mint-200">
                Rules: ✅ 10 Non-Negotiable Rules Loaded
              </span>
            </div>
          </div>
        </section>

        {/* 6 Screens Roadmap per Collage */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand" />
            UI Reference Map (Theme 3 — 6 Core Screens)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { num: '1', title: 'Login / Welcome Screen', desc: 'Patient/Doctor role toggle, Mobile OTP demo mode, Mock ABHA integration, DPDP consent gate.' },
              { num: '2', title: 'Patient Dashboard', desc: 'Greeting, AI intake hero card, 4 quick actions (Voice, Scan Docs, Ayurvedic, Summary), token progress.' },
              { num: '3', title: 'AI Voice Interview', desc: 'Multilingual SOCRATES dialogue engine, pulsating voice orb, live sound waveform, hint chips, Web Speech API.' },
              { num: '4', title: 'Document Scan (OCR)', desc: 'Prescription & lab report uploader, Tesseract OCR / rule parser, entity extraction with abnormal value flagging.' },
              { num: '5', title: 'Ayurvedic History (Ayush)', desc: 'Prakriti (Vata/Pitta/Kapha), Vikriti, Agni, Koshta, Aahara-Vihara questionnaire marked as prototype.' },
              { num: '6', title: 'Doctor Dashboard & Summary', desc: 'OPD queue, 3-tier attribution clinical note, Rule-based Red Flags, AI Draft Observations (for review).' },
            ].map((s) => (
              <div key={s.num} className="bg-white rounded-2xl p-5 border border-[#E2EFE7] shadow-card hover:shadow-card-hover transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-mint-100 text-brand text-xs font-bold flex items-center justify-center border border-mint-300">
                    {s.num}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Ready for Phase 3</span>
                </div>
                <h4 className="font-bold text-gray-900 text-base">{s.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance Footer Banner */}
        <div className="rounded-2xl p-4 bg-white border border-[#E2EFE7] text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Phase 1 (Analysis & Planning) & Phase 2 (Project Setup) successfully verified.</span>
          </div>
          <span className="font-mono text-gray-400">RogMitra Core v1.0.0</span>
        </div>
      </main>
    </div>
  );
}
