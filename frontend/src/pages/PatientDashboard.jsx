// PatientDashboard.jsx — Screen 2: Patient Friendly Dashboard
// Theme 3: Soft Green (#0D7A46), Light Mint (#EDF8F1), Canvas (#F4FBF7), Rounded Cards, 4 Quick Actions
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mic, FileText, Leaf, ClipboardList, ArrowRight, Clock,
  Calendar, ShieldCheck, AlertCircle, FileCheck2, User, CheckCircle2, Circle
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import useAppStore from '../store/appStore';

// Determine greeting by time of day
function getGreeting(isHi) {
  const hour = new Date().getHours();
  if (hour < 12) return isHi ? 'सुप्रभात' : 'Good morning';
  if (hour < 17) return isHi ? 'नमस्ते' : 'Good afternoon';
  return isHi ? 'शुभ संध्या' : 'Good evening';
}

export default function PatientDashboard() {
  const { t, i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();
  const { user, interview, documents, ayurveda } = useAppStore();

  const patientName = user?.name || user?.full_name || (isHi ? 'अनन्या वर्मा' : 'Ananya Verma');
  const greeting = getGreeting(isHi);

  // Flow progress steps
  const interviewDone = interview.conversationHistory.length > 0 || !!interview.answers.chief_complaint;
  const docsDone = documents.length > 0;
  const ayurvedaDone = ayurveda.completed;
  const summaryReady = interviewDone;

  const flowSteps = [
    {
      id: 'interview',
      labelEn: 'Interview', labelHi: 'इंटरव्यू',
      done: interviewDone, to: '/interview'
    },
    {
      id: 'documents',
      labelEn: 'Documents', labelHi: 'दस्तावेज़',
      done: docsDone, to: '/scanner'
    },
    {
      id: 'ayurveda',
      labelEn: 'Ayurveda', labelHi: 'आयुर्वेद',
      done: ayurvedaDone, to: '/ayurveda'
    },
    {
      id: 'review',
      labelEn: 'Review', labelHi: 'समीक्षा',
      done: summaryReady && docsDone, to: '/summary'
    },
  ];

  const quickActions = [
    {
      id: 'voice',
      to: '/interview',
      titleEn: 'Voice Interview',
      titleHi: 'वॉयस इंटरव्यू',
      descEn: 'Answer clinical questions by voice or touch',
      descHi: 'आवाज या टच स्क्रीन से प्रश्नों के उत्तर दें',
      icon: Mic,
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'scan',
      to: '/scanner',
      titleEn: 'Scan Documents',
      titleHi: 'दस्तावेज़ स्कैन',
      descEn: 'Digitize prescriptions & lab reports via OCR',
      descHi: 'पुरानी पर्ची और जांच रिपोर्ट डिजिटाइज़ करें',
      icon: FileText,
      bg: 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'ayurveda',
      to: '/ayurveda',
      titleEn: 'Ayurvedic History',
      titleHi: 'आयुर्वेदिक इतिहास',
      descEn: 'Prakriti, Agni & Koshta assessment (AYUSH)',
      descHi: 'प्रकृति, अग्नि व कोष्ठ आकलन (आयुष मोड)',
      icon: Leaf,
      bg: 'bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-300',
      iconBg: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'summary',
      to: '/summary',
      titleEn: 'View Summary',
      titleHi: 'सारांश देखें',
      descEn: 'Review your case summary before consultation',
      descHi: 'डॉक्टर से मिलने से पहले अपना सारांश देखें',
      icon: ClipboardList,
      bg: 'bg-purple-50 text-purple-700 border-purple-100 hover:border-purple-300',
      iconBg: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Banner — time-of-day greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {greeting}, {patientName} 🌿
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isHi
                ? 'बेहतर परामर्श के लिए आइए आपकी स्वास्थ्य जानकारी दर्ज करें।'
                : "Let's capture your health history for a better consultation."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E2EFE7] text-xs font-medium text-gray-600 shadow-sm self-start">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            <span>OPD Token: <strong className="text-brand">#OPD-204</strong> (General Medicine)</span>
          </div>
        </div>

        {/* Primary CTA: Start Case-Taking */}
        <div className="bg-gradient-to-br from-brand to-[#0A5E35] rounded-3xl p-5 sm:p-6 text-white shadow-button-green flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">
              {isHi ? 'प्राथमिक कार्य' : 'Primary Action'}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">
              {isHi ? 'अपना केस-टेकिंग शुरू करें' : 'Start Your Case-Taking'}
            </h2>
            <p className="text-sm text-white/80 max-w-sm">
              {isHi
                ? 'आवाज या टच से आसान प्रश्नों के उत्तर दें।'
                : 'Answer a few simple questions through voice or touch.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/interview')}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-brand font-bold text-sm shadow-sm hover:bg-mint-50 transition-all transform hover:-translate-y-0.5 shrink-0 min-h-[48px]"
          >
            <Mic className="w-5 h-5" />
            {isHi ? 'अभी शुरू करें' : 'Start Now'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Patient Flow Progress Indicator */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2EFE7] shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            {isHi ? 'आपकी प्रगति' : 'Your Progress'}
          </h3>
          <div className="flex items-center gap-0">
            {flowSteps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => navigate(step.to)}
                  className="flex flex-col items-center gap-1.5 flex-1 group"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    step.done
                      ? 'bg-brand text-white shadow-button-green'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-mint-100 group-hover:text-brand'
                  }`}>
                    {step.done
                      ? <CheckCircle2 className="w-5 h-5" />
                      : <Circle className="w-4 h-4" />
                    }
                  </div>
                  <span className={`text-[10px] font-semibold text-center leading-tight ${
                    step.done ? 'text-brand' : 'text-gray-400'
                  }`}>
                    {isHi ? step.labelHi : step.labelEn}
                  </span>
                </button>
                {idx < flowSteps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded-full mb-4 transition-colors ${
                    flowSteps[idx + 1].done || step.done ? 'bg-brand/40' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Hero Card: AI Case-Taking */}
        <div className="bg-gradient-to-br from-mint-100 via-mint-50 to-[#E6F4EA] rounded-3xl p-6 sm:p-8 border border-mint-200 shadow-card relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-brand text-xs font-bold border border-mint-200 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-brand" />
                {isHi ? 'पूर्व-परामर्श केस-टेकिंग' : 'Pre-Consultation Case-Taking'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                {isHi ? 'अपनी एआई केस-टेकिंग शुरू करें' : 'Start Your AI Case-Taking'}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed max-w-xl">
                {isHi
                  ? 'आवाज या टच के माध्यम से कुछ सरल प्रश्नों के उत्तर दें, और हम डॉक्टर के लिए आपका संपूर्ण मेडिकल सारांश तैयार कर देंगे।'
                  : "Answer a few simple questions through voice or touch, and we'll prepare your structured medical summary for the doctor before consultation."}
              </p>

              {/* Empty state encouragement if no interview done */}
              {!interviewDone && (
                <div className="p-3.5 rounded-xl bg-white/80 border border-mint-200 text-xs text-gray-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>
                    {isHi
                      ? 'अभी तक कोई इंटरव्यू पूरा नहीं हुआ। ऊपर "Start Now" दबाएं!'
                      : 'No interview completed yet. Tap "Start Now" above to begin — it only takes a few minutes!'}
                  </span>
                </div>
              )}

              <div className="pt-1">
                <button
                  onClick={() => navigate('/interview')}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-sm shadow-button-green transition-all transform hover:-translate-y-0.5 min-h-[48px]"
                >
                  <span>{isHi ? 'अभी शुरू करें' : 'Start Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Friendly Robot Mascot */}
            <div className="md:col-span-4 flex justify-center md:justify-end">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white/80 backdrop-blur-sm border border-mint-200 flex flex-col items-center justify-center p-4 shadow-sm text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-3xl sm:text-4xl shadow-inner mb-2 animate-bounce">
                  🤖
                </div>
                <span className="text-xs font-bold text-brand">RogMitra Assistant</span>
                <span className="text-[10px] text-gray-400">Ready to assist</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {isHi ? 'त्वरित कार्य (Quick Actions)' : 'Quick Actions'}
            </h3>
            <span className="text-xs text-gray-400 font-medium">Select any action to begin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.to)}
                  className={`text-left p-5 rounded-2xl border transition-all duration-200 hover:shadow-card-hover transform hover:-translate-y-1 flex flex-col justify-between h-44 min-h-[48px] ${action.bg}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${action.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-gray-900 mb-1">
                      {isHi ? action.titleHi : action.titleEn}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {isHi ? action.descHi : action.descEn}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Skeleton (shown while data loads — demo shimmer) */}
        {false && (
          <div className="space-y-3 animate-pulse">
            <div className="h-5 bg-gray-200 rounded-xl w-1/3" />
            <div className="h-32 bg-gray-100 rounded-2xl" />
          </div>
        )}

        {/* Previous Consultation Records & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Active Intake Status */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#E2EFE7] shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-brand" />
                {isHi ? 'वर्तमान सत्र की स्थिति' : 'Current Intake Session Status'}
              </h4>
              <span className="text-xs px-2.5 py-1 rounded-full bg-mint-100 text-brand font-semibold border border-mint-200">
                In Progress
              </span>
            </div>

            <div className="space-y-3 divide-y divide-gray-100 text-sm">
              <div className="pt-2 flex items-center justify-between">
                <span className="text-gray-600 font-medium">Chief Complaint:</span>
                <span className="text-gray-900 font-semibold text-right max-w-xs truncate">
                  {interview.answers.chief_complaint || (
                    <span className="text-gray-400 italic font-normal">Pending input</span>
                  )}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-gray-600 font-medium">Uploaded Documents:</span>
                <span className="text-gray-900 font-semibold">
                  {documents.length} report(s) digitized
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-gray-600 font-medium">Ayurvedic Assessment:</span>
                <span className="text-gray-900 font-semibold">
                  {ayurveda.completed ? `Completed (${ayurveda.prakriti})` : 'Pending'}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-gray-600 font-medium">Red Flag Screening:</span>
                <span className={`font-semibold ${interview.detectedRedFlags.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {interview.detectedRedFlags.length > 0
                    ? `⚠️ ${interview.detectedRedFlags.length} flag(s) reported`
                    : '✅ No emergency flags'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/summary')}
                className="w-full py-3 rounded-xl border border-brand text-brand hover:bg-mint-50 font-semibold text-xs transition-colors flex items-center justify-center gap-2 min-h-[48px]"
              >
                <span>{isHi ? 'पूर्ण सारांश की समीक्षा करें' : 'Review Complete Draft Summary'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Past Records / Hospital Timeline */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#E2EFE7] shadow-card space-y-4">
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              {isHi ? 'पिछले दौरे (Past Records)' : 'Past Records'}
            </h4>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  12 Oct
                </div>
                <div>
                  <h5 className="font-semibold text-xs text-gray-900">General OPD Consultation</h5>
                  <p className="text-[11px] text-gray-500 mt-0.5">CBC & ESR Lab Report attached</p>
                  <span className="inline-block mt-1 text-[10px] text-brand font-medium">Dr. R. Sharma • Approved</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  18 Aug
                </div>
                <div>
                  <h5 className="font-semibold text-xs text-gray-900">Seasonal Viral Episode</h5>
                  <p className="text-[11px] text-gray-500 mt-0.5">Paracetamol SOS prescription</p>
                  <span className="inline-block mt-1 text-[10px] text-brand font-medium">Dr. V. Mehra • Resolved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
