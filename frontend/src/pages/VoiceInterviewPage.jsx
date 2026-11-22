// VoiceInterviewPage.jsx — Screen 3: AI Voice Interview (Case-Taking)
// Theme 3: Patient Friendly, Concentric Mic Orb, Waveform, SOCRATES questions, Bilingual Web Speech API
// Rule 1: First question is always "What health problem are you facing today? Please describe it in your own words."
// Rule 3: Deterministic bilingual red flag triage on every turn
// Rule 5: Guarded LLM follow-up or SOCRATES rule-based fallback
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mic, MicOff, ArrowLeft, ArrowRight, Pause, Play, Send,
  Volume2, AlertTriangle, CheckCircle2, MessageSquare, ChevronLeft, ChevronRight,
  Sparkles, SkipForward, X
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import StepperBar from '../components/StepperBar';
import RedFlagBanner from '../components/RedFlagBanner';
import useAppStore from '../store/appStore';
import { DIALOGUE_STEPS } from '../data/dialogueFlow';
import { checkRedFlags } from '../data/redFlagRules';
import { sessionApi } from '../services/api';

const DEFAULT_FIRST_QUESTION = {
  id: 'chief_complaint',
  step: 'symptoms',
  field: 'chief_complaint',
  questionEn: 'What health problem are you facing today? Please describe it in your own words.',
  questionHi: 'आज आप किस स्वास्थ्य समस्या का सामना कर रहे हैं? कृपया इसे अपने शब्दों में बताएं।',
  questionSource: 'rule-based',
  badge: 'AI follow-up off – using standard questions',
  exampleChips: [
    { en: 'I have a headache since 2 days and fever', hi: 'मुझे 2 दिन से सिरदर्द और बुखार है' },
    { en: 'I have chest discomfort since morning', hi: 'मुझे आज सुबह से छाती में भारीपन है' },
    { en: 'Stomach pain and vomiting since yesterday', hi: 'कल से पेट दर्द और उल्टी हो रही है' },
    { en: 'Severe cough and sore throat for 3 days', hi: '3 दिनों से तेज खांसी और गले में खराश है' }
  ],
  touchOptions: [
    { value: 'Headache', labelEn: 'Headache', labelHi: 'सिरदर्द' },
    { value: 'Fever', labelEn: 'Fever & Chills', labelHi: 'बुखार और ठंड' },
    { value: 'Cough', labelEn: 'Cough & Cold', labelHi: 'खांसी और जुकाम' },
    { value: 'Chest Discomfort', labelEn: 'Chest Discomfort', labelHi: 'छाती में दर्द' },
    { value: 'Stomach Pain', labelEn: 'Stomach / Abdominal Pain', labelHi: 'पेट दर्द' },
    { value: 'Joint Pain', labelEn: 'Joint & Body Pain', labelHi: 'जोड़ों व बदन दर्द' },
    { value: 'Breathlessness', labelEn: 'Breathlessness', labelHi: 'सांस फूलना' },
    { value: 'Nausea / Vomiting', labelEn: 'Nausea & Vomiting', labelHi: 'उल्टी व जी मिचलाना' }
  ]
};

export default function VoiceInterviewPage() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();

  const { user, interview, saveAnswer, addConversationTurn, addRedFlag } = useAppStore();

  const [sessionId, setSessionId] = useState(interview.sessionId || null);
  const [currentQuestion, setCurrentQuestion] = useState(DEFAULT_FIRST_QUESTION);
  const [questionCount, setQuestionCount] = useState(1);
  const [showEarlyFinishModal, setShowEarlyFinishModal] = useState(false);
  const estimatedTotal = 12;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState('');
  const [speakingBot, setSpeakingBot] = useState(false);

  const recognitionRef = useRef(null);

  // Initialize session and restore state from backend
  useEffect(() => {
    if (user?.id) {
      sessionApi.getLatestSession(user.id).then((sess) => {
        const activeId = sess?.sessionId || sess?.id;
        if (activeId && sess.status === 'in_progress') {
          setSessionId(activeId);
          if (sess.answers && Array.isArray(sess.answers)) {
            sess.answers.forEach((ans) => {
              saveAnswer(ans.field || ans.field_name, ans.answer || ans.answer_text);
            });
            if (sess.answers.length > 0) {
              setQuestionCount(sess.answers.length + 1);
              // Fetch next adaptive question from backend
              sessionApi.getNextQuestion(activeId, isHi ? 'hi' : 'en').then((qData) => {
                const nextQ = qData?.nextQuestion || (qData?.id ? qData : null);
                if (nextQ) {
                  setCurrentQuestion(nextQ);
                }
              }).catch(() => {});
            }
          }
        } else {
          sessionApi.startSession(user.id, isHi ? 'hi' : 'en').then((res) => {
            if (res?.sessionId) {
              setSessionId(res.sessionId);
              if (res.firstQuestion) {
                setCurrentQuestion(res.firstQuestion);
              }
            }
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [user?.id, isHi]);

  // Stepper mapping
  const stepMap = { symptoms: 0, history: 1, lifestyle: 2, review: 3 };
  const currentStepIndex = stepMap[currentQuestion?.step || 'symptoms'] ?? 0;

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = isHi ? 'hi-IN' : 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError('');
    };

    recognition.onresult = (event) => {
      let currentResult = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentResult += event.results[i][0].transcript;
      }
      setTranscript(currentResult);
      setManualText(currentResult);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setSpeechError(isHi ? 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया टेक्स्ट इनपुट का उपयोग करें।' : 'Microphone permission denied. Please use text input.');
      } else {
        setSpeechError(`Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isHi]);

  // Read question aloud via SpeechSynthesis (TTS)
  const speakQuestion = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isHi ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeakingBot(true);
    utterance.onend = () => setSpeakingBot(false);
    utterance.onerror = () => setSpeakingBot(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!speechSupported) return;
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setSpeechError('');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Recognition start error:', err);
      }
    }
  };

  const handleApplyChip = (chipText) => {
    setManualText(chipText);
    setTranscript(chipText);
  };

  const handleSubmitAnswer = async (answerValue) => {
    const value = answerValue || manualText || transcript;
    if (!value || !value.trim()) return;

    const trimmed = value.trim();

    // 1. Client-side deterministic red flag check
    const localFlags = checkRedFlags(trimmed);
    if (localFlags.length > 0) {
      localFlags.forEach((flag) => addRedFlag(flag));
    }

    // 2. Save in app store
    saveAnswer(currentQuestion.field || 'chief_complaint', trimmed);

    // 3. Record conversation turn
    addConversationTurn({
      id: `turn-${Date.now()}`,
      speaker: 'patient',
      text: trimmed,
      mode: transcript ? 'voice' : 'touch',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // 4. Save to backend database & get adaptive next question
    let activeSessionId = sessionId;
    if (!activeSessionId && user?.id) {
      try {
        const newSess = await sessionApi.startSession(user.id, isHi ? 'hi' : 'en');
        activeSessionId = newSess?.sessionId;
        setSessionId(activeSessionId);
      } catch (e) {
        console.error(e);
      }
    }

    setManualText('');
    setTranscript('');

    if (activeSessionId) {
      try {
        const qText = isHi ? (currentQuestion.questionHi || currentQuestion.questionText) : (currentQuestion.questionEn || currentQuestion.questionText);
        const res = await sessionApi.saveAnswer(
          activeSessionId,
          currentQuestion.field || 'chief_complaint',
          trimmed,
          transcript ? 'voice' : 'touch',
          qText,
          currentQuestion.questionSource || 'rule-based',
          isHi ? 'hi' : 'en'
        );

        // Record backend red flags if any
        if (res?.redFlags && Array.isArray(res.redFlags)) {
          res.redFlags.forEach((rf) => {
            addRedFlag({
              category: rf.category,
              severity: rf.severity,
              keywordMatched: rf.keyword,
              messageEn: rf.message_en || rf.message,
              messageHi: rf.message_hi || rf.message,
              actionEn: rf.action_en || rf.action,
              actionHi: rf.action_hi || rf.action
            });
          });
        }

        // Advance to next question or complete
        if (res?.isComplete) {
          await sessionApi.submitSession(activeSessionId);
          navigate('/summary');
        } else if (res?.nextQuestion) {
          setCurrentQuestion(res.nextQuestion);
          setQuestionCount((c) => c + 1);
          const nextPrompt = isHi
            ? (res.nextQuestion.questionHi || res.nextQuestion.questionText)
            : (res.nextQuestion.questionEn || res.nextQuestion.questionText);
          speakQuestion(nextPrompt);
        } else {
          // If nextQuestion is missing in response, query backend getNextQuestion
          try {
            const nextQRes = await sessionApi.getNextQuestion(activeSessionId, isHi ? 'hi' : 'en');
            const nextQ = nextQRes?.nextQuestion || (nextQRes?.id ? nextQRes : null);
            if (nextQ) {
              setCurrentQuestion(nextQ);
              setQuestionCount((c) => c + 1);
              const nextPrompt = isHi ? (nextQ.questionHi || nextQ.questionText) : (nextQ.questionEn || nextQ.questionText);
              speakQuestion(nextPrompt);
            } else if (nextQRes?.isComplete) {
              await sessionApi.submitSession(activeSessionId);
              navigate('/summary');
            }
          } catch (_) {}
        }
      } catch (err) {
        console.error('Save answer error:', err);
      }
    }
  };

  const handleSkipQuestion = () => {
    handleSubmitAnswer('[SKIPPED_BY_PATIENT]');
  };

  const handleEarlyFinishConfirm = async () => {
    setShowEarlyFinishModal(false);
    let activeId = sessionId;
    if (!activeId && user?.id) {
      try {
        const sess = await sessionApi.getLatestSession(user.id);
        activeId = sess?.sessionId || sess?.id;
      } catch (_) {}
    }
    if (activeId) {
      try {
        await sessionApi.submitSession(activeId);
      } catch (e) {
        console.warn('Submit session error:', e);
      }
    }
    navigate('/summary');
  };

  const displayedQuestionText = isHi
    ? (currentQuestion.questionHi || currentQuestion.questionText)
    : (currentQuestion.questionEn || currentQuestion.questionText);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:text-brand hover:border-brand transition-colors min-h-[40px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isHi ? 'डैशबोर्ड' : 'Dashboard'}</span>
          </button>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-mint-100 text-brand border border-mint-200">
            {isHi ? `प्रश्न संख्या: ${questionCount}` : `Question #${questionCount}`}
          </span>

          <button
            onClick={() => setShowEarlyFinishModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors min-h-[40px]"
            title={isHi ? 'समय से पहले समाप्त करें और सारांश देखें' : 'Finish early and review summary'}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span>{isHi ? 'समाप्त करें और समीक्षा' : 'Finish & Review'}</span>
          </button>
        </div>

        {/* Stepper Bar (Symptoms -> History -> Lifestyle -> Review) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2EFE7] shadow-sm space-y-3">
          <StepperBar
            steps={DIALOGUE_STEPS.map((s) => (isHi ? s.labelHi : s.labelEn))}
            current={currentStepIndex}
          />
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span className="font-semibold text-gray-700">
              {isHi
                ? `अनुभाग: ${currentQuestion?.step || 'symptoms'} • प्रश्न #${questionCount}`
                : `Section: ${currentQuestion?.step || 'symptoms'} • Question #${questionCount}`}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-mint-100 text-brand font-bold text-[11px] border border-mint-200">
              {currentQuestion?.badge || (isHi ? 'मानक प्रश्न' : 'Standard question')}
            </span>
          </div>
        </div>

        {/* Emergency Red Flag Alerts Banner if detected */}
        {interview.detectedRedFlags.length > 0 && (
          <div className="space-y-2">
            {interview.detectedRedFlags.map((flag, idx) => (
              <RedFlagBanner
                key={idx}
                severity={flag.severity}
                message={isHi ? (flag.messageHi || flag.alertMessage) : (flag.messageEn || flag.alertMessage)}
                action={isHi ? flag.actionHi : flag.actionEn}
              />
            ))}
          </div>
        )}

        {/* Central Stage: Question Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2EFE7] shadow-card text-center space-y-5">
          {/* Badge: AI-generated vs Rule-based Standard Question */}
          <div className="flex items-center justify-center">
            {currentQuestion.questionSource === 'llm-generated' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200 shadow-sm animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                AI-generated question
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-mint-100 text-brand border border-mint-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                AI follow-up off – using standard questions
              </span>
            )}
          </div>

          {/* Concentric Mic Orb Animation */}
          <div className="relative flex items-center justify-center py-2">
            {/* Outer pulsating ring */}
            <div
              className={`absolute w-36 h-36 rounded-full transition-all duration-700 ${
                isListening ? 'bg-brand/10 animate-ping scale-125' : 'bg-mint-100/60'
              }`}
            ></div>

            {/* Middle mint ring */}
            <div
              className={`absolute w-28 h-28 rounded-full transition-all duration-300 ${
                isListening ? 'bg-mint-200 scale-110' : 'bg-mint-100'
              }`}
            ></div>

            {/* Core Circular Mic Button */}
            <button
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform shadow-button-green ${
                isListening
                  ? 'bg-emerald-600 scale-105 ring-4 ring-emerald-300 ring-offset-2 animate-pulse'
                  : 'bg-brand hover:bg-brand-dark hover:scale-105'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <Mic className="w-9 h-9" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          {/* Audio Waveform Graphic */}
          <div className="flex items-center justify-center gap-1.5 h-8">
            {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35, 70, 85].map((h, i) => (
              <span
                key={i}
                style={{ height: isListening ? `${h}%` : '15%' }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isListening ? 'bg-brand' : 'bg-mint-200'
                }`}
              ></span>
            ))}
          </div>

          {/* Status Label */}
          <div className="text-xs font-semibold tracking-wide uppercase">
            {isListening ? (
              <span className="text-emerald-700 animate-pulse flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                {isHi ? 'सुन रहे हैं... कृपया बोलें' : 'Listening... Please speak clearly'}
              </span>
            ) : (
              <span className="text-gray-400">
                {isHi ? 'माइक पर टैप करके बोलें या नीचे विकल्प चुनें' : 'Tap microphone to speak or choose an option below'}
              </span>
            )}
          </div>

          {/* Main Question Typography */}
          <div className="max-w-2xl mx-auto space-y-2">
            <h2
              className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-snug"
              style={{ fontSize: 'clamp(1rem, 2.5vw, 1.75rem)' }}
            >
              {displayedQuestionText}
            </h2>
            <button
              onClick={() => speakQuestion(displayedQuestionText)}
              className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline font-medium pt-1"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isHi ? 'प्रश्न सुनें (Audio)' : 'Read question aloud'}</span>
            </button>
          </div>

          {/* Speech Error Warning if any */}
          {speechError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 max-w-lg mx-auto flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Guidance Chips ("You can say, for example:") */}
          {currentQuestion.exampleChips && (
            <div className="space-y-2 pt-2">
              <span className="text-xs text-gray-500 font-medium">
                {isHi ? 'उदाहरण के लिए, आप कह सकते हैं:' : 'You can say, for example:'}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                {currentQuestion.exampleChips.map((chip, idx) => {
                  const text = isHi ? chip.hi : chip.en;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleApplyChip(text)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-mint-50 hover:bg-mint-100 text-brand border border-mint-200 transition-colors shadow-sm"
                    >
                      "{text}"
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Touch-Based Answer Options */}
          {currentQuestion.touchOptions && (
            <div className="pt-4 border-t border-gray-100 max-w-2xl mx-auto space-y-2">
              <span className="text-xs text-gray-400 font-medium">
                {isHi ? 'या सीधे टच करके चुनें:' : 'Or tap to select answer:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentQuestion.touchOptions.map((opt, idx) => {
                  const label = isHi ? opt.labelHi : opt.labelEn;
                  const isSelected = manualText === opt.value || manualText === label;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setManualText(label);
                        handleSubmitAnswer(label);
                      }}
                      className={`p-3 rounded-xl text-xs font-semibold border transition-all text-left truncate min-h-[44px] ${
                        isSelected
                          ? 'bg-brand text-white border-brand'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Text Input / Transcription Confirmation Box */}
          <div className="max-w-2xl mx-auto pt-4 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (manualText.trim() || transcript.trim())) {
                    handleSubmitAnswer();
                  }
                }}
                placeholder={isHi ? 'अपनी प्रतिक्रिया यहां लिखें या सुधारें...' : 'Type or edit your response here...'}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm bg-gray-50/50"
                style={{ fontSize: '16px' }}
              />
              <button
                onClick={() => handleSubmitAnswer()}
                disabled={!manualText.trim() && !transcript.trim()}
                className="px-5 py-3 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-button-green transition-all flex items-center gap-1.5 min-h-[48px]"
              >
                <span>{isHi ? 'आगे' : 'Next'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Skip question button */}
            <div className="flex justify-between items-center pt-1 px-1">
              <button
                onClick={handleSkipQuestion}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium py-1.5 px-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                title={isHi ? 'इस प्रश्न को छोड़ें और अगले पर जाएं' : 'Skip this question and move to next'}
              >
                <SkipForward className="w-3.5 h-3.5 text-gray-400" />
                <span>{isHi ? 'यह प्रश्न छोड़ें (Skip question)' : 'Skip this question'}</span>
              </button>

              <button
                onClick={() => setShowEarlyFinishModal(true)}
                className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-semibold py-1 px-2 rounded-lg hover:bg-amber-50 transition-colors sm:hidden"
              >
                <span>{isHi ? 'समाप्त करें' : 'Finish early'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Early Finish Confirmation Modal */}
        {showEarlyFinishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-amber-200 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-amber-800 font-bold">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <span>{isHi ? 'साक्षात्कार समाप्त करें?' : 'Finish Interview Early?'}</span>
                </div>
                <button
                  onClick={() => setShowEarlyFinishModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1.5">
                <p className="font-semibold">
                  {isHi
                    ? 'क्या आप वाकई समय से पहले समाप्त करना चाहते हैं? आपके डॉक्टर को अधूरा स्वास्थ्य इतिहास दिखाई देगा।'
                    : 'Are you sure you want to finish early? Your doctor will see an incomplete clinical history.'}
                </p>
                <p className="text-[11px] text-amber-800">
                  {isHi
                    ? 'सभी प्रश्नों का उत्तर देने से डॉक्टर को सटीक सलाह व उपचार देने में मदद मिलती है।'
                    : 'Completing the full intake provides essential context for the physician to formulate a proper assessment.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowEarlyFinishModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors min-h-[40px]"
                >
                  {isHi ? 'जारी रखें' : 'Keep Answering'}
                </button>
                <button
                  onClick={handleEarlyFinishConfirm}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all min-h-[40px]"
                >
                  {isHi ? 'हाँ, समाप्त करें' : 'Yes, Finish Early'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Q&A History Log */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2EFE7] shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-brand" />
            <span>{isHi ? 'बातचीत का इतिहास (Conversation Log)' : 'Conversation Log'}</span>
          </h4>

          {interview.conversationHistory.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <div className="text-3xl">💬</div>
              <p className="text-xs text-gray-400 font-medium">
                {isHi
                  ? 'अभी तक कोई बातचीत दर्ज नहीं हुई। ऊपर माइक पर टैप करके शुरू करें!'
                  : 'No conversation yet. Tap the microphone above to begin your interview!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 text-xs">
              {interview.conversationHistory.map((turn, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl flex items-start gap-2 ${
                    turn.speaker === 'patient'
                      ? 'bg-mint-50/70 border border-mint-200 text-gray-800'
                      : 'bg-gray-50 border border-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-bold text-[10px] uppercase text-brand min-w-[50px]">
                    {turn.speaker === 'patient' ? 'Patient:' : 'RogMitra:'}
                  </span>
                  <span className="flex-1">{turn.text}</span>
                  <span className="text-[10px] text-gray-400">{turn.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
