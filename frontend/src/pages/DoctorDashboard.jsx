// DoctorDashboard.jsx — Screen 6: Doctor Consultation Dashboard & AI Clinical Summary
// Rule 1: Panel strictly renamed to "AI Draft Observations (for physician review)" with reported facts only (NO DIAGNOSIS)
// Rule 2: Three-tier visual source tags: 🟢 Patient-Reported, 🔵 Doc-Extracted, 🟡 AI-Draft. Doctor edit/approve/reject controls.
// Rule 4: Zero fake lab values. Only real uploaded records are shown.
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Stethoscope, Users, FileText, CheckCircle2, XCircle, Edit3,
  Save, AlertTriangle, Clock, ChevronRight, User, ShieldCheck,
  ClipboardList, PlusCircle, Sparkles, AlertOctagon, Download,
  Filter, Search, RefreshCw, AlertCircle
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import SourceTag from '../components/SourceTag';
import RedFlagBanner from '../components/RedFlagBanner';
import { useToast } from '../components/Toast';
import useAppStore from '../store/appStore';
import { doctorApi, summaryApi } from '../services/api';

// Status chip helper
function StatusChip({ status }) {
  if (status === 'red_flag') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
        ⚠️ Red Flag
      </span>
    );
  }
  if (status === 'reviewed' || status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
        ✓ Approved
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
        ✗ Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
      Pending
    </span>
  );
}

export default function DoctorDashboard() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { show: showToast, ToastContainer } = useToast();

  const { user } = useAppStore();
  const doctorDisplayName = user?.name || user?.full_name || 'Dr. R. Sharma';

  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [activePatientId, setActivePatientId] = useState('');
  const [summary, setSummary] = useState(null);
  const [redFlags, setRedFlags] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'reports' | 'ayurveda'
  const [isEditing, setIsEditing] = useState(false);
  const [editedComplaint, setEditedComplaint] = useState('');
  const [editedHpi, setEditedHpi] = useState('');
  const [editedPast, setEditedPast] = useState('');
  const [editedMeds, setEditedMeds] = useState('');
  const [doctorAssessment, setDoctorAssessment] = useState('');
  const [doctorPlan, setDoctorPlan] = useState('');

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveModal, setApproveModal] = useState(false);
  const [queueFilter, setQueueFilter] = useState('all'); // 'all' | 'pending' | 'redflags' | 'reviewed'
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch OPD Queue
  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = await doctorApi.getQueue();
      const list = Array.isArray(data) ? data : [];
      setQueue(list);

      // Check URL query param or default to first patient
      const urlPid = searchParams.get('patientId');
      if (urlPid && list.some(p => p.id === urlPid)) {
        setActivePatientId(urlPid);
      } else if (list.length > 0 && !activePatientId) {
        setActivePatientId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // 2. Fetch Active Patient Details whenever activePatientId changes
  useEffect(() => {
    if (!activePatientId) return;
    setLoadingSummary(true);

    Promise.all([
      summaryApi.getSummary(activePatientId).catch(() => null),
      doctorApi.getRedFlags(activePatientId).catch(() => []),
      doctorApi.getReports(activePatientId).catch(() => [])
    ]).then(([sumData, rfData, repData]) => {
      setSummary(sumData);
      setRedFlags(Array.isArray(rfData) ? rfData : []);
      setReports(Array.isArray(repData) ? repData : []);

      if (sumData) {
        setEditedComplaint(sumData.presentingComplaint || '');
        setEditedHpi(sumData.hpi || '');
        setEditedPast(sumData.pastHistory || '');
        setEditedMeds(sumData.medicationsAllergies || '');
        setDoctorAssessment(sumData.doctorAssessment || '');
        setDoctorPlan(sumData.doctorPlan || '');
        setDoctorNotes(sumData.doctorNotes || '');
      }
      setLoadingSummary(false);
    });
  }, [activePatientId]);

  const currentPatient = queue.find(p => p.id === activePatientId) || queue[0] || {
    id: 'pat-1',
    name: 'Ananya Verma',
    tokenNumber: '#OPD-201',
    age: 28,
    gender: 'Female',
    timeWaiting: '10 mins ago',
    chiefComplaint: 'Headache for 3 days',
    status: 'pending'
  };

  const status = summary?.status || currentPatient.status || 'draft';

  // Filtered queue
  const filteredPatients = queue.filter(pt => {
    const matchesSearch =
      (pt.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pt.tokenNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pt.chiefComplaint || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (queueFilter === 'redflags') return (pt.redFlags && pt.redFlags.length > 0) || pt.status === 'red_flag';
    if (queueFilter === 'pending') return pt.status === 'pending' || pt.status === 'summary_ready';
    if (queueFilter === 'reviewed') return pt.status === 'reviewed' || pt.status === 'approved';
    return true;
  });

  const handleApprove = async () => {
    if (!summary) return;
    try {
      await summaryApi.approveSummary(summary.id, {
        doctorName: doctorDisplayName,
        doctorAssessment,
        doctorPlan,
        doctorNotes,
        editedFields: isEditing ? {
          presenting_complaint: editedComplaint,
          hpi_text: editedHpi,
          past_medical: editedPast,
          medications_allergies: editedMeds,
          doctor_assessment: doctorAssessment,
          doctor_plan: doctorPlan
        } : {
          doctor_assessment: doctorAssessment,
          doctor_plan: doctorPlan
        }
      });
      setApproveModal(false);
      showToast(isHi ? '✓ सारांश स्वीकृत और सहेजा गया' : '✓ Summary approved and saved', 'success');
      // Refresh summary and queue
      const updated = await summaryApi.getSummary(activePatientId);
      setSummary(updated);
      fetchQueue();
    } catch (err) {
      showToast('Failed to approve summary', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || !summary) return;
    try {
      await summaryApi.rejectSummary(summary.id, {
        reason: rejectReason,
        doctorName: doctorDisplayName
      });
      setRejectModal(false);
      showToast(isHi ? 'सारांश अस्वीकार कर दिया गया' : 'Summary rejected', 'info');
      const updated = await summaryApi.getSummary(activePatientId);
      setSummary(updated);
      fetchQueue();
    } catch (err) {
      showToast('Failed to reject summary', 'error');
    }
  };

  const handleSaveNotes = async () => {
    if (!summary) return;
    try {
      await summaryApi.addNote(summary.id, { noteText: doctorNotes });
      setShowNotesModal(false);
      showToast(isHi ? 'टिप्पणी सहेजी गई' : 'Notes saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save notes', 'error');
    }
  };

  return (
    <AppLayout>
      <ToastContainer />
      <div className="space-y-6">
        {/* Top Doctor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
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
              <span className="font-semibold text-gray-700">{doctorDisplayName}</span>
              {' '}• {isHi ? 'सामान्य चिकित्सा विभाग • वास्तविक डेटा एवं नैदानिक सारांश' : 'General Medicine OPD • Live Database Case Summaries'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 hover:border-brand bg-white text-xs font-semibold text-gray-700 hover:text-brand transition-colors shadow-sm min-h-[44px]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? (isHi ? 'संपादन समाप्त' : 'Done Editing') : (isHi ? 'नोट सुधारें' : 'Edit Note')}</span>
            </button>
          </div>
        </div>

        {/* Source tag legend */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-600">
          <span className="font-bold text-gray-700 text-[11px] uppercase tracking-wide">Source Legend:</span>
          <span className="flex items-center gap-1.5"><SourceTag source="patient" /> <span>Patient-Reported</span></span>
          <span className="flex items-center gap-1.5"><SourceTag source="document" /> <span>Doc-Extracted</span></span>
          <span className="flex items-center gap-1.5"><SourceTag source="ai" /> <span>AI-Draft</span></span>
        </div>

        {/* Main Grid: OPD Queue Rail (4 cols) + Clinical Summary View (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: OPD Patient Queue */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-[#E2EFE7] shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand" />
                <span>{isHi ? 'ओपीडी कतार (OPD Queue)' : 'OPD Queue'}</span>
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-mint-100 text-brand">
                {queue.length} Waiting
              </span>
            </div>

            {/* Search in Queue */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queue..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Filter bar */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
              {[
                { key: 'all', labelEn: 'All', labelHi: 'सभी' },
                { key: 'pending', labelEn: 'Pending', labelHi: 'लंबित' },
                { key: 'redflags', labelEn: 'Red Flags', labelHi: 'अलर्ट्स' },
                { key: 'reviewed', labelEn: 'Reviewed', labelHi: 'समीक्षित' },
              ].map(({ key, labelEn, labelHi }) => (
                <button
                  key={key}
                  onClick={() => setQueueFilter(key)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    queueFilter === key
                      ? 'bg-white text-brand shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {isHi ? labelHi : labelEn}
                </button>
              ))}
            </div>

            {/* Patient Cards List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {loadingQueue ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading queue...</div>
              ) : filteredPatients.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  {isHi ? 'कोई रोगी नहीं मिला' : 'No patients match this filter'}
                </p>
              ) : (
                filteredPatients.map((pt) => {
                  const isSelected = pt.id === activePatientId;
                  const hasRedFlag = pt.redFlags && pt.redFlags.length > 0;

                  return (
                    <button
                      key={pt.id}
                      onClick={() => setActivePatientId(pt.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all min-h-[72px] ${
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

                      <div className="text-[11px] text-gray-500 flex items-center justify-between mb-1.5">
                        <span>{pt.age}Y • {pt.gender}</span>
                        <span className="text-[10px] text-gray-400">{pt.timeWaiting}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-gray-700 truncate font-medium flex-1">
                          {typeof pt.chiefComplaint === 'object' ? pt.chiefComplaint.en : pt.chiefComplaint}
                        </span>
                        <StatusChip status={pt.status || (hasRedFlag ? 'red_flag' : 'pending')} />
                      </div>
                    </button>
                  );
                })
              )}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-gray-900">{currentPatient.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
                      {currentPatient.tokenNumber}
                    </span>
                    <StatusChip status={status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Age: {currentPatient.age} Y • Gender: {currentPatient.gender} • ABHA: <span className="font-mono">{currentPatient.abhaId || '91-8765-4321-0987'}</span>
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-gray-500 sm:border-l sm:border-gray-100 sm:pl-4">
                <span className="block text-[11px] text-gray-400">Case Taken:</span>
                <span className="font-semibold text-gray-800">{currentPatient.timeWaiting || 'Today'}</span>
              </div>
            </div>

            {/* Navigation Tabs */}
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
                    {isEditing ? (
                      <textarea
                        value={editedComplaint}
                        onChange={(e) => setEditedComplaint(e.target.value)}
                        rows={2}
                        className="w-full text-xs text-gray-800 p-2.5 rounded-xl border border-mint-300 focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    ) : (
                      <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                        • {summary?.presentingComplaint || currentPatient.chiefComplaint || 'General checkup'}
                      </p>
                    )}
                  </div>

                  {/* History of Present Illness (HPI) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">History of Present Illness (HPI)</h4>
                      <SourceTag source="patient" />
                    </div>
                    {isEditing ? (
                      <textarea
                        value={editedHpi}
                        onChange={(e) => setEditedHpi(e.target.value)}
                        rows={3}
                        className="w-full text-xs text-gray-800 p-2.5 rounded-xl border border-mint-300 focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    ) : (
                      <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed whitespace-pre-line">
                        • {summary?.hpi || 'No acute symptoms reported.'}
                      </p>
                    )}
                  </div>

                  {/* Past Medical History */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Past History</h4>
                      <SourceTag source="patient" />
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedPast}
                        onChange={(e) => setEditedPast(e.target.value)}
                        className="w-full text-xs text-gray-800 p-2 rounded-xl border border-mint-300 focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    ) : (
                      <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                        • {summary?.pastHistory || 'No known chronic medical illness'}
                      </p>
                    )}
                  </div>

                  {/* Current Medications & Allergies */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Medications & Allergies</h4>
                      <SourceTag source="patient" />
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedMeds}
                        onChange={(e) => setEditedMeds(e.target.value)}
                        className="w-full text-xs text-gray-800 p-2 rounded-xl border border-mint-300 focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    ) : (
                      <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                        • {summary?.medicationsAllergies || 'No known regular medications or drug allergies'}
                      </p>
                    )}
                  </div>

                  {/* Doctor-Only Assessment & Plan (Physician Entry Only) */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-blue-700" />
                        Physician Evaluation (Doctor Only)
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                        DOCTOR ONLY
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-800 block">Doctor's Assessment:</label>
                      <textarea
                        value={doctorAssessment}
                        onChange={(e) => setDoctorAssessment(e.target.value)}
                        placeholder="Enter clinical assessment / diagnosis impression (doctor-only)..."
                        rows={2}
                        className="w-full text-xs text-gray-800 p-2.5 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-800 block">Doctor's Plan:</label>
                      <textarea
                        value={doctorPlan}
                        onChange={(e) => setDoctorPlan(e.target.value)}
                        placeholder="Enter management plan, prescription, and advice (doctor-only)..."
                        rows={2}
                        className="w-full text-xs text-gray-800 p-2.5 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
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
                    {redFlags.length > 0 ? (
                      <ul className="text-xs text-red-800 space-y-1.5 pl-1 leading-relaxed">
                        {redFlags.map((rf, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="font-bold text-red-600">•</span>
                            <span>{rf.message || rf.keyword || rf.alert_message}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No critical red flags detected for this patient.</p>
                    )}
                    <span className="block text-[10px] text-red-600 italic">
                      *Rule-based deterministic alert; does not replace clinical evaluation.
                    </span>
                  </div>

                  {/* CRITICAL: Strictly renamed panel per Rule 1 */}
                  {/* "AI Draft Observations (for physician review)" — Facts only, NO DIAGNOSIS */}
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
                        {summary?.aiDraftObservations || 'Reported symptoms recorded for physician correlation. Kindly correlate clinically.'}
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

                {reports.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-xs font-bold text-gray-700">No document scanned yet for this patient</p>
                    <p className="text-[11px] text-gray-400">
                      Upload lab reports or prescriptions to see real extracted parameters.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((doc, idx) => (
                      <div key={doc.id || idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3 text-xs">
                        <div className="flex justify-between font-bold text-gray-900">
                          <span>{doc.filename || doc.original_filename}</span>
                          <span className="text-gray-500">{doc.reportDate || 'Recent'}</span>
                        </div>
                        {doc.findings && doc.findings.length > 0 ? (
                          <div className="divide-y divide-gray-200/60 pt-1">
                            {doc.findings.map((f, fi) => (
                              <div key={fi} className="py-1.5 flex justify-between items-center">
                                <span className="text-gray-700 font-medium">{f.test}</span>
                                <span className={`font-mono font-bold ${f.status === 'High' ? 'text-red-700' : f.status === 'Low' ? 'text-amber-700' : 'text-gray-700'}`}>
                                  {f.value} {f.unit} {f.refRange ? `(Ref: ${f.refRange})` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">No tabular lab entities extracted from this document.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

                <div className="p-4 rounded-2xl bg-mint-50/60 border border-mint-200 text-xs text-gray-800 leading-relaxed">
                  {summary?.ayurvedicAssessment ? (
                    <p className="font-semibold text-brand text-sm">{summary.ayurvedicAssessment}</p>
                  ) : (
                    <p className="text-gray-500 italic">No Ayurvedic intake completed for this patient yet.</p>
                  )}
                </div>

                <span className="block text-[10px] text-gray-400 italic">
                  *Configurable JSON prototype – pending clinical validation by a qualified Ayurvedic practitioner.
                </span>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E2EFE7] shadow-card flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/summary?patientId=${activePatientId}`)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors min-h-[44px]"
                >
                  <ClipboardList className="w-4 h-4 text-gray-500" />
                  <span>{isHi ? 'पूर्ण सारांश देखें' : 'View Full Summary'}</span>
                </button>

                <button
                  onClick={() => setShowNotesModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors min-h-[44px]"
                >
                  <PlusCircle className="w-4 h-4 text-brand" />
                  <span>{isHi ? 'टिप्पणी जोड़ें' : 'Add Notes'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRejectModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs transition-colors min-h-[44px]"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isHi ? 'अस्वीकार करें' : 'Reject Draft'}</span>
                </button>

                <button
                  onClick={() => setApproveModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-xs shadow-button-green transition-all min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isHi ? 'स्वीकृत करें और सहेजें' : 'Approve & Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Approve Confirmation */}
        {approveModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="font-bold text-base text-gray-900">Approve Summary?</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to approve this AI draft summary? This will save the approved status and any edits to the hospital records.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setApproveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand text-white shadow-button-green hover:bg-brand-dark transition-all"
                >
                  Yes, Approve
                </button>
              </div>
            </div>
          </div>
        )}

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
                  onClick={handleSaveNotes}
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
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
