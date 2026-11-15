// AyurvedaPage.jsx — Screen 5: Ayurvedic History (Ayush Mode)
// Theme 3: 5-step stepper (Prakriti, Vikriti, Agni, Koshta, Aahara-Vihara), visual selection cards, prototype disclaimer
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Leaf, Wind, Flame, ShieldAlert, ArrowLeft, ArrowRight,
  CheckCircle2, Sparkles, Info
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import StepperBar from '../components/StepperBar';
import useAppStore from '../store/appStore';
import { ayurvedaPillars, AYURVEDA_DISCLAIMER_EN, AYURVEDA_DISCLAIMER_HI } from '../data/ayurvedaQuestions';

export default function AyurvedaPage() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();

  const { ayurveda, saveAyurvedaAnswer } = useAppStore();

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState(ayurveda.answers || {});

  const currentPillar = ayurvedaPillars[activeStepIndex] || ayurvedaPillars[0];
  const stepLabels = ayurvedaPillars.map(p => isHi ? p.label_hi : p.label_en);

  const handleSelect = (questionId, optionId) => {
    const updated = { ...selectedOptions, [questionId]: optionId };
    setSelectedOptions(updated);
    saveAyurvedaAnswer(questionId, optionId);
  };

  const handleNext = () => {
    if (activeStepIndex < ayurvedaPillars.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    } else {
      navigate('/summary');
    }
  };

  const handleBack = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-sm">
              <Leaf className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {isHi ? 'आयुर्वेदिक इतिहास (आयुष मोड)' : 'Ayurvedic History (Ayush Mode)'}
              </h1>
              <p className="text-xs text-gray-500">
                {isHi ? 'दशविध परीक्षा, प्रकृति, अग्नि एवं कोष्ठ पूर्व-आकलन' : 'Dashavidha Pariksha, Prakriti, Agni & Koshta assessment'}
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 self-start">
            Pillar {activeStepIndex + 1} of {ayurvedaPillars.length}
          </span>
        </div>

        {/* Mandatory Rule 8 Disclaimer Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 shadow-sm">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold block mb-0.5">
              {isHi ? '⚠️ प्रोटोटाइप सूचना:' : '⚠️ Research Prototype Notice:'}
            </strong>
            <span>{isHi ? AYURVEDA_DISCLAIMER_HI : AYURVEDA_DISCLAIMER_EN}</span>
          </div>
        </div>

        {/* 5-Step Stepper (Prakriti, Vikriti, Agni, Koshta, Aahara-Vihara) */}
        <StepperBar
          steps={stepLabels}
          currentStep={activeStepIndex}
        />

        {/* Main Pillar Assessment Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2EFE7] shadow-card space-y-8 relative overflow-hidden">
          {/* Pillar Header */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {isHi ? currentPillar.label_hi : currentPillar.label_en}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              {isHi ? currentPillar.description_hi : currentPillar.description_en}
            </p>
          </div>

          {/* Question List for Current Pillar */}
          <div className="space-y-8">
            {currentPillar.questions.map((q, qIdx) => {
              const currentChoice = selectedOptions[q.id] || (qIdx === 0 && activeStepIndex === 0 ? 'B' : null);

              return (
                <div key={q.id} className="space-y-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-mint-100 text-brand text-xs font-bold flex items-center justify-center border border-mint-200">
                      {qIdx + 1}
                    </span>
                    <span>{isHi ? q.question_hi : q.question_en}</span>
                  </h3>

                  {/* 3 Visual Cards (Vata, Pitta, Kapha or Option Cards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {q.options.map((opt) => {
                      const isSelected = currentChoice === opt.id;
                      
                      // Assign representative icons and colors
                      let Icon = Leaf;
                      let iconColor = 'text-emerald-700 bg-emerald-100';
                      if (opt.dosha === 'vata') {
                        Icon = Wind;
                        iconColor = 'text-blue-700 bg-blue-100';
                      } else if (opt.dosha === 'pitta') {
                        Icon = Flame;
                        iconColor = 'text-amber-700 bg-amber-100';
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelect(q.id, opt.id)}
                          className={`p-5 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between h-44 ${
                            isSelected
                              ? 'bg-mint-50/70 border-brand ring-2 ring-brand/30 shadow-card-hover transform -translate-y-1'
                              : 'bg-white hover:bg-gray-50/80 border-gray-200 shadow-sm'
                          }`}
                        >
                          {/* Selection Checkmark Badge */}
                          {isSelected && (
                            <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center shadow-sm">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          )}

                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-2">
                            <div className={`w-full h-full rounded-xl flex items-center justify-center ${iconColor}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                          </div>

                          <div>
                            <span className="text-xs font-bold text-brand uppercase tracking-wider block mb-1">
                              {opt.dosha ? opt.dosha.toUpperCase() : `Option ${opt.id}`}
                            </span>
                            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                              {isHi ? opt.text_hi : opt.text_en}
                            </h4>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isHi ? 'वापस' : 'Back'}</span>
            </button>

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-xs shadow-button-green transition-all"
            >
              <span>{activeStepIndex < ayurvedaPillars.length - 1 ? (isHi ? 'अगला स्तंभ' : 'Next') : (isHi ? 'सारांश देखें' : 'View Summary')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
