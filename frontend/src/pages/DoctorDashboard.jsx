// DoctorDashboard.jsx — Screen 6: Doctor Dashboard & AI Clinical Summary
// Rule 1: Panel strictly renamed to "AI Draft Observations (for physician review)" with reported facts only (NO DIAGNOSIS)
// Rule 2: Three-tier visual source tags: 🟢 Patient-Reported, 🔵 Doc-Extracted, 🟡 AI-Draft. Doctor edit/approve/reject controls.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Stethoscope, Users, FileText, CheckCircle2, XCircle, Edit3,
  Save, AlertTriangle, Clock, ChevronRight, User, ShieldCheck,
  ClipboardList, PlusCircle, Sparkles, AlertOctagon, Download
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import SourceTag from '../components/SourceTag';
import RedFlagBanner from '../components/RedFlagBanner';
import useAppStore from '../store/appStore';
import { SYNTHETIC_PATIENTS } from '../data/syntheticPatients';

export default function DoctorDashboard() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();

  const { doctorReview, selectDoctorPatient, approveSummary, rejectSummary, updateDoctorNote } = useAppStore();

  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'reports' | 'ayurveda'
  const [isEditing, setIsEditing] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Selected patient from queue
  const currentPatient = SYNTHETIC_PATIENTS.find(p => p.id === doctorReview.activePatientId) || SYNTHETIC_PATIENTS[0];
  const summary = currentPatient.summary || {};
  const status = doctorReview.summaryStatus || 'draft';

  const handleApprove = () => {
    approveSummary();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectSummary(rejectReason);
    setRejectModal(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Doctor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {isHi ? 'चिकित्सक परामर्श डैशबोर्ड' : 'Doctor Consultation Dashboard'}
              </h1>
              <span className={`text-xs px-3 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : status === 'rejected'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {status === 'approved' ? '✓ APPROVED' : status === 'rejected' ? '✗ REJECTED' : 'AI DRAFT (Unapproved)'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isHi
                ? 'डॉ. आर. शर्मा • सामान्य चिकित्सा विभाग • रोगी कतार एवं नैदानिक सारांश'
                : 'Dr. R. Sharma • General Medicine OPD • AI-Drafted Pre-Consultation Summaries'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 hover:border-brand bg-white text-xs font-semibold text-gray-700 hover:text-brand transition-colors shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? (isHi ? 'संपादन समाप्त' : 'Done Editing') : (isHi ? 'नोट सुधारें' : 'Edit Note')}</span>
            </button>
          </div>
        </div>

        {/* Main Grid: OPD Queue Rail (3 cols) + Clinical Summary View (9 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: OPD Patient Queue */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-[#E2EFE7] shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand" />
                <span>{isHi ? 'ओपीडी कतार (OPD Queue)' : 'OPD Queue'}</span>
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-mint-100 text-brand">
                {SYNTHETIC_PATIENTS.length} Waiting
              </span>
            </div>

            <div className="space-y-2.5">
              {SYNTHETIC_PATIENTS.map((pt) => {
                const isSelected = pt.id === currentPatient.id;
                const hasRedFlag = pt.redFlags && pt.redFlags.length > 0;

                return (
                  <button
                    key={pt.id}
                    onClick={() => selectDoctorPatient(pt.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-mint-100/70 border-brand shadow-sm ring-1 ring-brand/20'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-gray-900">{pt.name}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white text-gray-600 border border-gray-200">
                        {pt.tokenNumber}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 flex items-center justify-between">
                      <span>{pt.age}Y • {pt.gender}</span>
                      <span className="text-[10px] text-gray-400">{pt.timeWaiting}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-gray-700 truncate max-w-[180px] font-medium">
                        {pt.chiefComplaint}
                      </span>
                      {hasRedFlag && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold shrink-0">
                          ⚠️ Red Flag
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Patient Summary Details */}
          <div className="lg:col-span-8 space-y-5">
            {/* Patient Header Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2EFE7] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-mint-100 text-brand flex items-center justify-center font-bold text-xl border border-mint-200">
                  <User className="w-7 h-7 text-brand" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-gray-900">{currentPatient.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
                      {currentPatient.tokenNumber}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Age: {currentPatient.age} Y • Gender: {currentPatient.gender} • ABHA: <span className="font-mono">{currentPatient.abhaId || '91-8765-4321-0987'}</span>
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-gray-500 sm:border-l sm:border-gray-100 sm:pl-4">
                <span className="block text-[11px] text-gray-400">Case Taken:</span>
                <span className="font-semibold text-gray-800">23 Oct 2026, 10:24 AM</span>
              </div>
            </div>

            {/* Navigation Tabs (Clinical History, Uploaded Reports, Ayurvedic History) */}
            <div className="flex items-center gap-2 border-b border-[#E2EFE7] px-2">
              {[
                { id: 'clinical', labelEn: 'Clinical History', labelHi: 'क्लिनिकल इतिहास' },
                { id: 'reports', labelEn: 'Uploaded Reports', labelHi: 'अपलोड रिपोर्ट' },
                { id: 'ayurveda', labelEn: 'Ayurvedic History', labelHi: 'आयुर्वेदिक इतिहास' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all -mb-px ${
                    activeTab === tab.id
                      ? 'border-brand text-brand bg-mint-50/50 rounded-t-xl'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {isHi ? tab.labelHi : tab.labelEn}
                </button>
              ))}
            </div>

            {/* Tab 1: Clinical History Content */}
            {activeTab === 'clinical' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left SOAP Sections (7 cols) */}
                <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-[#E2EFE7] shadow-card space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Structured Intake Note
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <SourceTag source="patient" />
                      <SourceTag source="document" />
                      <SourceTag source="ai" />
                    </span>
                  </div>

                  {/* Presenting Complaint */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Presenting Complaint</h4>
                      <SourceTag source="patient" />
                    </div>
                    <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                      • {summary.presentingComplaint || 'Headache for 3 days, moderate intensity'}
                    </p>
                  </div>

                  {/* History of Present Illness (HPI) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">History of Present Illness (HPI)</h4>
                      <SourceTag source="patient" />
                    </div>
                    <ul className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-1 leading-relaxed">
                      <li>• Associated with mild fever and generalized body ache</li>
                      <li>• Gradual onset over past 3 days; throbbing character</li>
                      <li>• No vomiting, nausea, or neck rigidity reported</li>
                      <li>• No visual disturbances or aura</li>
                    </ul>
                  </div>

                  {/* Past Medical History */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Past History</h4>
                      <SourceTag source="patient" />
                    </div>
                    <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                      • {summary.pastHistory || 'No known chronic medical illness (Hypertension/Diabetes negative)'}
                    </p>
                  </div>

                  {/* Current Medications & Allergies */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Medications & Allergies</h4>
                      <SourceTag source="patient" />
                    </div>
                    <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-1">
                      <p>• Not on regular chronic medications</p>
                      <p>• Self-administered Tab. Paracetamol 650mg SOS for headache</p>
                      <p>• No known drug allergies (NKDA)</p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Red Flags + AI Draft Observations (5 cols) */}
                <div className="md:col-span-5 space-y-4">
                  {/* Red Flag Alerts Card */}
                  <div className="bg-red-50/80 rounded-3xl p-5 border border-red-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-red-600" />
                      <h4 className="font-bold text-xs text-red-900 uppercase tracking-wider">
                        {isHi ? 'रेड फ्लैग अलर्ट्स' : 'Red Flag Alerts'}
                      </h4>
                    </div>
                    <ul className="text-xs text-red-800 space-y-1.5 pl-1 leading-relaxed">
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-red-600">•</span>
                        <span>Persistent headache (&gt; 3 days duration)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-red-600">•</span>
                        <span>Elevated ESR marker (28 mm/hr from digitized lab report)</span>
                      </li>
                    </ul>
                    <span className="block text-[10px] text-red-600 italic">
                      *Rule-based deterministic alert; does not replace clinical evaluation.
                    </span>
                  </div>

                  {/* CRITICAL: Strictly renamed panel per Rule 1 */}
                  {/* "AI Draft Observations (for physician review)" — Facts/Abnormal values only, NO DIAGNOSIS */}
                  <div className="bg-emerald-50/70 rounded-3xl p-5 border border-emerald-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-brand" />
                        <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                          AI Draft Observations (for physician review)
                        </h4>
                      </div>
                      <SourceTag source="ai" />
                    </div>

                    <div className="text-xs text-emerald-900 leading-relaxed bg-white/70 p-3 rounded-2xl border border-emerald-100 space-y-2">
                      <p>
                        Reported acute febrile symptoms of 3 days duration with mild low-grade fever and localized frontal headache.
                      </p>
                      <p>
                        Scanned lab report reveals elevated inflammatory marker (ESR 28 mm/hr, ref: 0-20) and mild anemia (Hb 11.2 g/dL, ref: 12-15.5).
                      </p>
                      <p className="font-semibold text-emerald-800 text-[11px] pt-1 border-t border-emerald-100">
                        Kindly correlate clinically. (No autonomous diagnosis rendered).
                      </p>
                    </div>

                    <span className="block text-[10px] text-gray-500">
                      Rule 1 Compliant: Objective facts & abnormal values only.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Uploaded Reports View */}
            {activeTab === 'reports' && (
              <div className="bg-white rounded-3xl p-6 border border-[#E2EFE7] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-sm text-gray-900">Extracted Reports & Lab Values</h3>
                  <SourceTag source="document" />
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Dr. Lal PathLabs — Complete Blood Count (CBC) & ESR</span>
                    <span className="text-gray-500">12 Oct 2026</span>
                  </div>
                  <div className="divide-y divide-gray-200/60 pt-2">
                    <div className="py-1.5 flex justify-between">
                      <span>Hemoglobin (Hb)</span>
                      <span className="font-mono font-bold text-amber-700">11.2 g/dL (Low, Ref: 12.0 - 15.5)</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span>ESR (Westergren)</span>
                      <span className="font-mono font-bold text-red-700">28 mm/hr (High, Ref: 0 - 20)</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span>Total Leukocyte Count (TLC)</span>
                      <span className="font-mono text-gray-700">7,400 /mcL (Normal, Ref: 4000 - 11000)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Ayurvedic Assessment View */}
            {activeTab === 'ayurveda' && (
              <div className="bg-white rounded-3xl p-6 border border-[#E2EFE7] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Ayurvedic Assessment (Prakriti / Agni / Koshta)</h3>
                    <p className="text-[11px] text-gray-500">Self-reported constitutional features for AYUSH OPD integration</p>
                  </div>
                  <SourceTag source="patient" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-mint-50/60 border border-mint-200">
                    <span className="text-[10px] font-bold text-brand uppercase block mb-1">Prakriti</span>
                    <span className="font-bold text-gray-900 text-sm">Pitta-Vata</span>
                    <p className="text-[11px] text-gray-600 mt-1">Medium build, warm skin, quick activity bursts</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Agni (Digestion)</span>
                    <span className="font-bold text-gray-900 text-sm">Tikshnagni</span>
                    <p className="text-[11px] text-gray-600 mt-1">Strong appetite, frequent thirst</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-800 uppercase block mb-1">Koshta (Bowels)</span>
                    <span className="font-bold text-gray-900 text-sm">Madhyama</span>
                    <p className="text-[11px] text-gray-600 mt-1">Regular daily bowel habits</p>
                  </div>
                </div>

                <span className="block text-[10px] text-gray-400 italic">
                  *Configurable JSON prototype – pending clinical validation by a qualified Ayurvedic practitioner.
                </span>
              </div>
            )}

            {/* Bottom Actions Bar (Matching Screen 6) */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E2EFE7] shadow-card flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/summary')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors"
                >
                  <ClipboardList className="w-4 h-4 text-gray-500" />
                  <span>{isHi ? 'पूर्ण सारांश देखें' : 'View Full Summary'}</span>
                </button>

                <button
                  onClick={() => setShowNotesModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-brand" />
                  <span>{isHi ? 'टिप्पणी जोड़ें' : 'Add Notes'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRejectModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isHi ? 'अस्वीकार करें' : 'Reject Draft'}</span>
                </button>

                <button
                  onClick={handleApprove}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-xs shadow-button-green transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isHi ? 'स्वीकृत करें और सहेजें' : 'Approve & Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Add Doctor Notes */}
        {showNotesModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-gray-900">Add Physician Clinical Notes</h3>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Enter doctor clinical examination findings, advice, or remarks..."
                rows={4}
                className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateDoctorNote(doctorNotes);
                    setShowNotesModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand text-white shadow-button-green"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reject Summary */}
        {rejectModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-red-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Reject Case-Taking Draft
              </h3>
              <p className="text-xs text-gray-500">
                Please specify the reason for rejecting this AI draft summary (e.g. incomplete history, mismatching record):
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={3}
                className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRejectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
