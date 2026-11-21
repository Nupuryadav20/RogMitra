// VoiceInterviewPage.jsx — Screen 3: AI Voice Interview (Case-Taking)
// Theme 3: Patient Friendly, Concentric Mic Orb, Waveform, SOCRATES questions, Bilingual Web Speech API
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mic, MicOff, ArrowLeft, ArrowRight, Pause, Play, Send,
  Volume2, AlertTriangle, CheckCircle2, MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import StepperBar from '../components/StepperBar';
import RedFlagBanner from '../components/RedFlagBanner';
import useAppStore from '../store/appStore';
import { DIALOGUE_STEPS, INITIAL_QUESTIONS } from '../data/dialogueFlow';
import { checkRedFlags } from '../data/redFlagRules';

export default function VoiceInterviewPage() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();

  const { interview, saveAnswer, addConversationTurn, addRedFlag } = useAppStore();

  const [currentIndex, setCurrentIndex] = useState(interview.currentQuestionIndex || 0);
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState('');
  const [speakingBot, setSpeakingBot] = useState(false);

  const recognitionRef = useRef(null);
  const currentQuestion = INITIAL_QUESTIONS[currentIndex] || INITIAL_QUESTIONS[0];
  const totalQuestions = INITIAL_QUESTIONS.length;

  // Map step to StepperBar index: symptoms(0), history(1), lifestyle(2), review(3)
  const stepMap = { symptoms: 0, history: 1, lifestyle: 2, review: 3 };
  const currentStepIndex = stepMap[currentQuestion.step] ?? 0;

  // Step label for progress bar
  const stepLabels = [
    { en: 'Chief Complaint', hi: 'मुख्य शिकायत' },
    { en: 'History of Present Illness', hi: 'वर्तमान रोग इतिहास' },
    { en: 'Past Medical History', hi: 'पुराना इतिहास' },
    { en: 'Lifestyle & Social', hi: 'जीवनशैली' },
    { en: 'Medications & Allergies', hi: 'दवाएं और एलर्जी' },
    { en: 'Family History', hi: 'पारिवारिक इतिहास' },
    { en: 'Review', hi: 'समीक्षा' },
  ];
  const currentStepLabel = stepLabels[Math.min(currentIndex, stepLabels.length - 1)];

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

  const handleSubmitAnswer = (answerValue) => {
    const value = answerValue || manualText || transcript;
    if (!value || !value.trim()) return;

    // Check for deterministic red flags
    const detected = checkRedFlags(value);
    if (detected.length > 0) {
      detected.forEach((flag) => addRedFlag(flag));
    }

    // Save answer in store
    saveAnswer(currentQuestion.field, value.trim());

    // Record turn in conversation
    addConversationTurn({
      id: `turn-${Date.now()}`,
      speaker: 'patient',
      text: value.trim(),
      mode: transcript ? 'voice' : 'touch',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setManualText('');
    setTranscript('');

    // Advance to next question or review
    if (currentIndex < INITIAL_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate('/summary');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Progress bar: Step X of Y */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2EFE7] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700">
              {isHi
                ? `चरण ${currentIndex + 1} / ${totalQuestions}: ${currentStepLabel.hi}`
                : `Step ${currentIndex + 1} of ${totalQuestions}: ${currentStepLabel.en}`}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-mint-100 text-brand border border-mint-200">
              {Math.round(((currentIndex) / totalQuestions) * 100)}% {isHi ? 'पूर्ण' : 'done'}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
              else navigate('/dashboard');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:text-brand hover:border-brand transition-colors min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isHi ? 'वापस' : 'Back'}</span>
          </button>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-mint-100 text-brand border border-mint-200">
            {isHi ? `प्रश्न ${currentIndex + 1} / ${INITIAL_QUESTIONS.length}` : `Question ${currentIndex + 1} of ${INITIAL_QUESTIONS.length}`}
          </span>

          <button
            onClick={() => handleSubmitAnswer()}
            disabled={!manualText.trim() && !transcript.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-bold shadow-button-green hover:bg-brand-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            <span>{currentIndex < INITIAL_QUESTIONS.length - 1 ? (isHi ? 'अगला' : 'Next') : (isHi ? 'सबमिट' : 'Submit')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Bar (Symptoms -> History -> Lifestyle -> Review) */}
        <StepperBar
          steps={DIALOGUE_STEPS.map(s => isHi ? s.labelHi : s.labelEn)}
          currentStep={currentStepIndex}
        />

        {/* Emergency Red Flag Alerts Banner if detected */}
        {interview.detectedRedFlags.length > 0 && (
          <div className="space-y-2">
            {interview.detectedRedFlags.map((flag, idx) => (
              <RedFlagBanner
                key={idx}
                severity={flag.severity}
                message={isHi ? flag.messageHi : flag.messageEn}
                action={isHi ? flag.actionHi : flag.actionEn}
              />
            ))}
          </div>
        )}

        {/* Central Stage: Large Question Card with Concentric Mic Rings */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2EFE7] shadow-card text-center space-y-6">
          {/* Concentric Mic Orb Animation */}
          <div className="relative flex items-center justify-center py-4">
            {/* Outer pulsating ring */}
            <div
              className={`absolute w-36 h-36 rounded-full transition-all duration-700 ${isListening
                  ? 'bg-brand/10 animate-ping scale-125'
                  : 'bg-mint-100/60'
                }`}
            ></div>

            {/* Middle mint ring */}
            <div
              className={`absolute w-28 h-28 rounded-full transition-all duration-300 ${isListening ? 'bg-mint-200 scale-110' : 'bg-mint-100'
                }`}
            ></div>

            {/* Core Circular Mic Button — animated ring when active */}
            <button
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform shadow-button-green ${isListening
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
                className={`w-1 rounded-full transition-all duration-150 ${isListening ? 'bg-brand' : 'bg-mint-200'
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

          {/* Main Question Typography — min 16px */}
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-snug" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.75rem)' }}>
              {isHi ? currentQuestion.questionHi : currentQuestion.questionEn}
            </h2>
            <button
              onClick={() => speakQuestion(isHi ? currentQuestion.questionHi : currentQuestion.questionEn)}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      className={`p-3 rounded-xl text-xs font-semibold border transition-all text-left truncate min-h-[44px] ${isSelected
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
          <div className="max-w-2xl mx-auto pt-4 flex gap-2">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
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
        </div>

        {/* Conversation Q&A History Log */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2EFE7] shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-brand" />
            <span>{isHi ? 'बातचीत का इतिहास (Conversation Log)' : 'Conversation Log'}</span>
          </h4>

          {interview.conversationHistory.length === 0 ? (
            /* Friendly empty state */
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
                  className={`p-2.5 rounded-xl flex items-start gap-2 ${turn.speaker === 'patient'
                      ? 'bg-mint-50 ml-6 text-gray-800 border border-mint-200'
                      : 'bg-gray-50 mr-6 text-gray-600 border border-gray-100'
                    }`}
                >
                  <span className="font-bold text-brand uppercase text-[10px] shrink-0">
                    {turn.speaker === 'patient' ? (isHi ? 'मरीज:' : 'You:') : (isHi ? 'रोगमित्र:' : 'RogMitra:')}
                  </span>
                  <span className="flex-1">{turn.text || (isHi ? turn.textHi : turn.textEn)}</span>
                  {turn.mode && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-gray-400 font-mono">
                      {turn.mode}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom nav bar */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
              else navigate('/dashboard');
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:text-brand hover:border-brand transition-colors min-h-[48px]"
          >
            <ArrowLeft className="w-4 h-4" />
            {isHi ? 'वापस जाएं' : 'Back'}
          </button>
          <button
            onClick={() => handleSubmitAnswer()}
            disabled={!manualText.trim() && !transcript.trim()}
            className="flex-2 flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-brand hover:bg-brand-dark text-white text-sm font-bold shadow-button-green transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
          >
            {currentIndex < INITIAL_QUESTIONS.length - 1 ? (isHi ? 'अगला प्रश्न' : 'Next Question') : (isHi ? 'सारांश देखें' : 'View Summary')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
