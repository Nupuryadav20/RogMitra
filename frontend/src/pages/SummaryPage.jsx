// SummaryPage.jsx — Full Structured Clinical Summary View
// Rule 1: No diagnosis conclusions | Rule 2: 3-tier source attribution (Patient, Document, AI) | Rule 7/8: FHIR & Ayurveda prototypes
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList, ArrowLeft, CheckCircle2, Download, ShieldCheck,
  FileText, Leaf, AlertOctagon, User, Clock, Share2, Printer
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import SourceTag from '../components/SourceTag';
import RedFlagBanner from '../components/RedFlagBanner';
import useAppStore from '../store/appStore';

export default function SummaryPage() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();

  const { user, interview, documents, ayurveda, doctorReview } = useAppStore();
  const [showFhirModal, setShowFhirModal] = useState(false);

  // Generate FHIR R4 mock bundle JSON
  const fhirBundle = {
    resourceType: "Bundle",
    type: "collection",
    meta: {
      lastUpdated: new Date().toISOString(),
      profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/ClinicalArtifact"]
    },
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: user?.id || "pat-demo-1",
          name: [{ text: user?.name || "Ananya Verma" }],
          gender: (user?.gender || "female").toLowerCase(),
          birthDate: "1998-05-14",
          identifier: [{ system: "https://healthid.ndhm.gov.in", value: user?.abhaId || "91-8765-4321-0987" }]
        }
      },
      {
        resource: {
          resourceType: "Condition",
          id: "cond-1",
          clinicalStatus: { coding: [{ code: "active" }] },
          code: { text: interview.answers.chief_complaint || "Headache with fever" },
          subject: { reference: `Patient/${user?.id || 'pat-demo-1'}` }
        }
      },
      {
        resource: {
          resourceType: "Observation",
          id: "obs-esr",
          status: "final",
          code: { text: "Erythrocyte sedimentation rate (ESR)" },
          valueQuantity: { value: 28, unit: "mm/hr" },
          interpretation: [{ text: "High" }]
        }
      }
    ]
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {isHi ? 'नैदानिक इतिहास सारांश' : 'Clinical History Summary'}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-mint-100 text-brand font-bold border border-mint-200">
                  AI DRAFT
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {isHi ? 'परामर्श पूर्व संकलित स्वास्थ्य विवरण' : 'Pre-consultation gathered clinical record for physician review'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => setShowFhirModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-mint-300 bg-mint-50 hover:bg-mint-100 text-brand text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>FHIR R4 JSON</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
              title="Print Summary"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Patient Demographics Banner */}
        <div className="bg-white rounded-3xl p-6 border border-[#E2EFE7] shadow-card flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-mint-100 text-brand flex items-center justify-center font-bold text-lg">
              <User className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{user?.name || 'Ananya Verma'}</h2>
              <p className="text-xs text-gray-500">
                Age: {user?.age || 28} Y • Gender: {user?.gender || 'Female'} • Phone: {user?.phone || '9876543210'}
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-right">
            <span className="block font-mono text-gray-400">ABHA: {user?.abhaId || '91-8765-4321-0987'}</span>
            <span className="text-[11px] text-gray-400">Date: {new Date().toLocaleDateString('en-GB')}</span>
          </div>
        </div>

        {/* Red Flag Warning if present */}
        {interview.detectedRedFlags.length > 0 && (
          <div className="bg-red-50 rounded-3xl p-5 border border-red-200 space-y-2">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-xs text-red-900 uppercase tracking-wider">
                Active Red Flag Alerts
              </h3>
            </div>
            <ul className="text-xs text-red-800 space-y-1 pl-4 list-disc">
              {interview.detectedRedFlags.map((rf, i) => (
                <li key={i}>{isHi ? rf.messageHi : rf.messageEn}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Note Card with Source Attribution */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EFE7] shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm text-gray-900">Comprehensive Pre-Consultation Summary</h3>
            <div className="flex items-center gap-2">
              <SourceTag source="patient" />
              <SourceTag source="document" />
              <SourceTag source="ai" />
            </div>
          </div>

          {/* Presenting Complaint */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">1. Presenting Complaint</h4>
              <SourceTag source="patient" />
            </div>
            <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
              • {interview.answers.chief_complaint || 'Headache for 3 days, moderate intensity with mild fever'}
            </p>
          </div>

          {/* History of Present Illness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">2. History of Present Illness (HPI)</h4>
              <SourceTag source="patient" />
            </div>
            <div className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
              <p>• <strong>Onset:</strong> {interview.answers.onset_duration || '3 days, gradual onset'}</p>
              <p>• <strong>Character:</strong> {interview.answers.character || 'Throbbing frontal headache'}</p>
              <p>• <strong>Severity:</strong> {interview.answers.severity || 'Moderate (5/10)'}</p>
              <p>• <strong>Associated:</strong> {interview.answers.associated_symptoms || 'Mild fever and body pain, no vomiting'}</p>
            </div>
          </div>

          {/* Past History & Medications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">3. Past Medical History</h4>
                <SourceTag source="patient" />
              </div>
              <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                • {interview.answers.past_medical || 'No known chronic medical illness'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">4. Medications & Allergies</h4>
                <SourceTag source="patient" />
              </div>
              <div className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-0.5">
                <p>• Meds: {interview.answers.medications || 'Paracetamol 650mg SOS'}</p>
                <p>• Allergies: {interview.answers.allergies || 'No known drug allergies (NKDA)'}</p>
              </div>
            </div>
          </div>

          {/* Extracted Lab Findings */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">5. Uploaded Document Findings</h4>
              <SourceTag source="document" />
            </div>
            <div className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
              <p className="font-semibold text-gray-700">Lab Report (12 Oct 2026):</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200">
                  Hemoglobin: 11.2 g/dL (Low)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-[11px] font-semibold border border-red-200">
                  ESR: 28 mm/hr (High)
                </span>
              </div>
            </div>
          </div>

          {/* Ayurvedic Assessment */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">6. Ayurvedic Assessment (Prakriti / Agni)</h4>
              <SourceTag source="patient" />
            </div>
            <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
              • Constitutional Type: <strong>{ayurveda.prakriti || 'Pitta-Vata'}</strong> | Agni: Tikshnagni | Koshta: Madhyama
              <span className="block text-[10px] text-gray-400 mt-1 italic">
                *Prototype questionnaire; pending validation by an Ayurvedic practitioner.
              </span>
            </p>
          </div>

          {/* Rule 1 Compliant Observation Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand" />
                AI Draft Observations (for physician review)
              </h4>
              <SourceTag source="ai" />
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Reported acute febrile illness symptoms of 3 days duration with elevated inflammatory marker (ESR 28 mm/hr) and mild anemia (Hb 11.2 g/dL). Kindly correlate clinically.
            </p>
            <span className="block text-[10px] text-gray-400">
              *Rule 1 compliant: strictly non-diagnostic; presents factual correlations only for physician interpretation.
            </span>
          </div>
        </div>

        {/* Doctor Action Redirection Banner */}
        <div className="bg-mint-100 rounded-3xl p-6 border border-mint-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-sm text-gray-900">Are you a Doctor reviewing this case?</h4>
            <p className="text-xs text-gray-600">Access the doctor review queue to edit, approve, or reject this draft note.</p>
          </div>
          <button
            onClick={() => navigate('/doctor')}
            className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-xs shadow-button-green whitespace-nowrap transition-all"
          >
            Open Doctor Dashboard
          </button>
        </div>

        {/* Modal: FHIR R4 JSON Export Preview */}
        {showFhirModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-gray-200 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-gray-900">FHIR R4 Bundle Export (Prototype)</h3>
                  <span className="text-[11px] text-amber-700">Prototype mapping; not connected to ABDM live gateway</span>
                </div>
                <button
                  onClick={() => setShowFhirModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-900 text-emerald-400 p-4 rounded-2xl font-mono text-xs leading-relaxed">
                <pre>{JSON.stringify(fhirBundle, null, 2)}</pre>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `RogMitra_FHIR_${user?.id || 'demo'}.json`;
                    a.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold shadow-button-green flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>

                <button
                  onClick={() => setShowFhirModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
