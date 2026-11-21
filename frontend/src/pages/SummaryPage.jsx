// SummaryPage.jsx — Full Structured Clinical Summary View
// Rule 1: No diagnosis or prescribing conclusions | Rule 2: 3-tier source attribution
// Rule: AI generates NO Assessment or Plan. Doctor's assessment and Doctor's plan are doctor-only.
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList, ArrowLeft, CheckCircle2, Download, ShieldCheck,
  FileText, Leaf, AlertOctagon, User, Clock, Share2, Printer, Lock, Stethoscope
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import SourceTag from '../components/SourceTag';
import RedFlagBanner from '../components/RedFlagBanner';
import useAppStore from '../store/appStore';
import { summaryApi } from '../services/api';

export default function SummaryPage() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryPatientId = searchParams.get('patientId');

  const { user, interview, documents, ayurveda, doctorReview } = useAppStore();
  const [showFhirModal, setShowFhirModal] = useState(false);
  const [apiSummary, setApiSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // If patientId is provided in URL, fetch live from backend summary API
  useEffect(() => {
    const targetPatientId = queryPatientId || user?.id;
    if (targetPatientId) {
      setLoading(true);
      summaryApi.getSummary(targetPatientId)
        .then((data) => setApiSummary(data))
        .catch(() => setApiSummary(null))
        .finally(() => setLoading(false));
    }
  }, [queryPatientId, user?.id]);

  const activeUser = {
    id: apiSummary?.patientId || user?.id || 'pat-demo-1',
    name: user?.name || (queryPatientId ? 'Registered Patient' : 'Ananya Verma'),
    age: user?.age || 28,
    gender: user?.gender || 'Female',
    phone: user?.phone || '9876543210',
    abhaId: user?.abhaId || '91-8765-4321-0987'
  };

  // Structured Patient-Reported History
  const patientReported = {
    complaint: apiSummary?.patientReportedHistory?.presentingComplaint ||
      apiSummary?.presentingComplaint ||
      interview?.answers?.chief_complaint ||
      'Headache for 3 days, moderate intensity with mild fever',
    hpi: apiSummary?.patientReportedHistory?.hpi ||
      apiSummary?.hpi ||
      interview?.answers?.onset_duration
      ? `Onset: ${interview.answers.onset_duration || '3 days, gradual'} | Character: ${interview.answers.character || 'Throbbing'} | Severity: ${interview.answers.severity || '5/10'} | Associated: ${interview.answers.associated_symptoms || 'Mild fever'}`
      : 'Patient presented for intake evaluation.',
    pastMedical: apiSummary?.patientReportedHistory?.pastHistory ||
      apiSummary?.pastHistory ||
      interview?.answers?.past_medical ||
      'No known chronic medical illness',
    medications: apiSummary?.patientReportedHistory?.medicationsAllergies ||
      apiSummary?.medicationsAllergies ||
      `Meds: ${interview?.answers?.medications || 'Paracetamol 650mg SOS'} | Allergies: ${interview?.answers?.allergies || 'No known drug allergies (NKDA)'}`
  };

  // Extracted Document Findings
  const docFindings = apiSummary?.extractedFindings || apiSummary?.documentFindings || null;

  // Ayurvedic History
  const ayurvedicHistory = apiSummary?.ayurvedicHistory ||
    apiSummary?.ayurvedicAssessment ||
    (ayurveda?.prakriti ? `Constitutional Type: ${ayurveda.prakriti} | Agni: ${ayurveda.agni || 'Tikshnagni'} | Koshta: ${ayurveda.koshta || 'Madhyama'}` : null);

  // Red Flags
  const redFlagsList = apiSummary?.redFlags || interview?.detectedRedFlags || [];

  // AI Draft Observations (Facts/abnormal values only; strictly NO diagnosis)
  const aiDraftObservations = apiSummary?.aiDraftObservations ||
    (interview?.answers?.chief_complaint
      ? `Reported symptoms of '${interview.answers.chief_complaint}'. ${documents && documents.length > 0 ? 'Document findings noted above.' : 'No physical documents scanned yet.'} Kindly correlate clinically. (No autonomous diagnosis rendered).`
      : 'Reported symptoms recorded for physician review. Kindly correlate clinically. (No autonomous diagnosis rendered).');

  // Doctor-only fields (empty unless filled by doctor)
  const doctorAssessment = apiSummary?.doctorAssessment || doctorReview?.assessment || null;
  const doctorPlan = apiSummary?.doctorPlan || doctorReview?.plan || null;
  const doctorNotes = apiSummary?.doctorNotes || doctorReview?.notes || null;

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
          id: activeUser.id,
          name: [{ text: activeUser.name }],
          gender: (activeUser.gender || "female").toLowerCase(),
          birthDate: "1998-05-14",
          identifier: [{ system: "https://healthid.ndhm.gov.in", value: activeUser.abhaId }]
        }
      },
      {
        resource: {
          resourceType: "Condition",
          id: "cond-1",
          clinicalStatus: { coding: [{ code: "active" }] },
          code: { text: patientReported.complaint },
          subject: { reference: `Patient/${activeUser.id}` }
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
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  apiSummary?.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-mint-100 text-brand border-mint-200'
                }`}>
                  {apiSummary?.status === 'approved' ? 'PHYSICIAN APPROVED' : 'AI DRAFT'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {isHi ? 'परामर्श पूर्व संकलित विवरण (चिकित्सक समीक्षा हेतु)' : 'Pre-consultation clinical record compiled for physician review'}
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
              <h2 className="text-lg font-bold text-gray-900">{activeUser.name}</h2>
              <p className="text-xs text-gray-500">
                Age: {activeUser.age} Y • Gender: {activeUser.gender} • Phone: {activeUser.phone}
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-right">
            <span className="block font-mono text-gray-400">ABHA: {activeUser.abhaId}</span>
            <span className="text-[11px] text-gray-400">Date: {new Date().toLocaleDateString('en-GB')}</span>
          </div>
        </div>

        {/* Section: Red Flags */}
        {redFlagsList.length > 0 && (
          <div className="bg-red-50 rounded-3xl p-5 border border-red-200 space-y-2">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-xs text-red-900 uppercase tracking-wider">
                Active Red Flag Alerts ({redFlagsList.length})
              </h3>
            </div>
            <ul className="text-xs text-red-800 space-y-1 pl-4 list-disc">
              {redFlagsList.map((rf, i) => (
                <li key={i}>{rf.message || rf.alert_message || (isHi ? rf.messageHi : rf.messageEn)}</li>
              ))}
            </ul>
            <span className="block text-[10px] text-red-600 italic">
              *Rule-based deterministic safety alert. Prioritize clinical evaluation.
            </span>
          </div>
        )}

        {/* Main Note Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EFE7] shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm text-gray-900">Structured Clinical Summary</h3>
            <div className="flex items-center gap-2">
              <SourceTag source="patient" />
              <SourceTag source="document" />
              <SourceTag source="ai" />
            </div>
          </div>

          {/* 1. Patient-Reported History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                1. Patient-Reported History
              </h4>
              <SourceTag source="patient" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-700">Presenting Complaint:</span>
                <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  • {patientReported.complaint}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-700">History of Present Illness (HPI):</span>
                <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  • {patientReported.hpi}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-700">Past Medical History:</span>
                  <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    • {patientReported.pastMedical}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-700">Current Medications & Allergies:</span>
                  <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    • {patientReported.medications}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Extracted Findings from Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                2. Extracted Findings from Documents
              </h4>
              <SourceTag source="document" />
            </div>
            {docFindings ? (
              <div className="text-xs text-gray-800 bg-gray-50 p-3.5 rounded-xl border border-gray-100 leading-relaxed">
                <p className="font-semibold text-gray-800 mb-1">Document Findings:</p>
                <p>{docFindings}</p>
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc, di) => (
                  <div key={doc.id || di} className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
                    <p className="font-semibold text-gray-700">{doc.fileName || doc.filename || 'Uploaded Document'}:</p>
                    {doc.findings && doc.findings.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {doc.findings.map((item, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                              item.status === 'High' ? 'bg-red-100 text-red-800 border-red-200' :
                              item.status === 'Low' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {item.test}: {item.value} {item.unit} ({item.status})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No tabular parameters extracted.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic p-3 rounded-xl bg-gray-50 border border-gray-100">
                No document scanned yet.
              </p>
            )}
          </div>

          {/* 3. Ayurvedic History (if any) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                3. Ayurvedic History (if any)
              </h4>
              <SourceTag source="patient" />
            </div>
            {ayurvedicHistory ? (
              <div className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                <p className="font-semibold text-brand">• {ayurvedicHistory}</p>
                <span className="block text-[10px] text-gray-400 italic">
                  *Self-reported questionnaire prototype; pending clinical correlation.
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic p-3 rounded-xl bg-gray-50 border border-gray-100">
                No Ayurvedic intake completed yet.
              </p>
            )}
          </div>

          {/* 4. AI Draft Observations (for physician review) */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand" />
                4. AI Draft Observations (for physician review)
              </h4>
              <SourceTag source="ai" />
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              {aiDraftObservations}
            </p>
            <span className="block text-[10px] text-gray-500">
              *Rule 1 compliant: strictly non-diagnostic; presents factual correlations & abnormal values only for physician correlation.
            </span>
          </div>

          {/* 5. Doctor-Only Fields: Doctor's Assessment and Doctor's Plan */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-blue-700" />
                5. Physician Evaluation (Doctor Only)
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                DOCTOR ONLY
              </span>
            </div>

            {/* Doctor's Assessment */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-blue-100">
              <span className="text-[11px] font-bold text-gray-800 block">Doctor's Assessment:</span>
              {doctorAssessment ? (
                <p className="text-xs text-gray-800 whitespace-pre-line font-medium">{doctorAssessment}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  (Doctor only — to be recorded by consulting physician during clinical examination)
                </p>
              )}
            </div>

            {/* Doctor's Plan */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-blue-100">
              <span className="text-[11px] font-bold text-gray-800 block">Doctor's Plan:</span>
              {doctorPlan ? (
                <p className="text-xs text-gray-800 whitespace-pre-line font-medium">{doctorPlan}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  (Doctor only — to be recorded by consulting physician during clinical examination)
                </p>
              )}
            </div>

            {/* Doctor's Clinical Notes */}
            {doctorNotes && (
              <div className="space-y-1 bg-white p-3 rounded-xl border border-blue-100">
                <span className="text-[11px] font-bold text-gray-800 block">Doctor's Examination Notes:</span>
                <p className="text-xs text-gray-800 whitespace-pre-line font-medium">{doctorNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Action Redirection Banner */}
        <div className="bg-mint-100 rounded-3xl p-6 border border-mint-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-sm text-gray-900">Are you a Doctor reviewing this case?</h4>
            <p className="text-xs text-gray-600">Access the doctor review queue to enter assessment, plan, and approve hospital consultation records.</p>
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
                    a.download = `RogMitra_FHIR_${activeUser.id}.json`;
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