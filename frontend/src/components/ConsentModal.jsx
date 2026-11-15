// ConsentModal.jsx — DPDP consent modal
// Rule 6 (PROJECT_RULES.md): Consent screen before data collection, revocable, DPDP Act 2023
import React, { useState, useRef } from 'react';
import { ShieldCheck, Volume2, X, Check, AlertTriangle } from 'lucide-react';

const CONSENT_TEXT = {
  en: `RogMitra collects your health information (symptoms, documents, voice input) solely to generate a draft clinical summary for your doctor's review. Your data is processed under the Digital Personal Data Protection Act (DPDP) 2023 and ABDM guidelines. You may withdraw your consent at any time. This is a DEMO prototype — no real data leaves this device.`,
  hi: `रोगमित्र आपकी स्वास्थ्य जानकारी (लक्षण, दस्तावेज़, वॉयस इनपुट) केवल आपके डॉक्टर के लिए एक ड्राफ्ट क्लिनिकल सारांश तैयार करने हेतु एकत्र करता है। आपका डेटा डिजिटल पर्सनल डेटा प्रोटेक्शन एक्ट (DPDP) 2023 और ABDM दिशानिर्देशों के तहत संसाधित किया जाता है। आप किसी भी समय अपनी सहमति वापस ले सकते हैं। यह एक DEMO प्रोटोटाइप है — कोई वास्तविक डेटा इस डिवाइस से बाहर नहीं जाता।`,
};

export default function ConsentModal({ onAccept, onDecline }) {
  const [checkedConsent, setCheckedConsent] = useState(false);
  const [checkedRevoke, setCheckedRevoke] = useState(false);
  const [lang, setLang] = useState('en');
  const synthRef = useRef(null);

  const handleTTS = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(CONSENT_TEXT[lang]);
    u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    u.rate = 0.9;
    synthRef.current = u;
    window.speechSynthesis.speak(u);
  };

  const canAccept = checkedConsent && checkedRevoke;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-surface-border">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-mint-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h2 id="consent-title" className="font-bold text-gray-900 text-lg">
              Data Consent / डेटा सहमति
            </h2>
            <p className="text-xs text-gray-500">DPDP Act 2023 • ABDM Guidelines</p>
          </div>
        </div>

        {/* Demo notice */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2 text-xs text-amber-700 font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          DEMO / SYNTHETIC DATA — No real patient data is used or stored
        </div>

        {/* Language toggle */}
        <div className="flex gap-2">
          {['en', 'hi'].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                lang === l
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-600 border-surface-border'
              }`}
            >
              {l === 'en' ? 'English' : 'हिन्दी'}
            </button>
          ))}
        </div>

        {/* Consent text */}
        <div className="rounded-2xl bg-mint-50 border border-mint-200 p-4 text-sm text-gray-700 leading-relaxed max-h-40 overflow-y-auto">
          {CONSENT_TEXT[lang]}
        </div>

        {/* TTS button */}
        <button
          onClick={handleTTS}
          className="flex items-center gap-2 text-xs text-brand font-medium hover:underline"
          aria-label="Read consent aloud"
        >
          <Volume2 className="w-4 h-4" />
          {lang === 'en' ? 'Read aloud (Audio)' : 'ज़ोर से पढ़ें (ऑडियो)'}
        </button>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkedConsent}
              onChange={(e) => setCheckedConsent(e.target.checked)}
              className="mt-0.5 accent-brand w-4 h-4"
            />
            <span className="text-sm text-gray-700">
              {lang === 'en'
                ? 'I consent to the collection and processing of my health information as described above.'
                : 'मैं ऊपर वर्णित अनुसार अपनी स्वास्थ्य जानकारी के संग्रह और प्रसंस्करण के लिए सहमत हूँ।'}
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkedRevoke}
              onChange={(e) => setCheckedRevoke(e.target.checked)}
              className="mt-0.5 accent-brand w-4 h-4"
            />
            <span className="text-sm text-gray-700">
              {lang === 'en'
                ? 'I understand I can revoke consent at any time by contacting support or clearing my session.'
                : 'मैं समझता/समझती हूँ कि मैं किसी भी समय सहायता से संपर्क करके या अपना सत्र साफ़ करके सहमति रद्द कर सकता/सकती हूँ।'}
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-surface-border text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
            {lang === 'en' ? 'Decline' : 'अस्वीकार करें'}
          </button>
          <button
            onClick={onAccept}
            disabled={!canAccept}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-brand text-white text-sm font-semibold shadow-button-green hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            {lang === 'en' ? 'I Agree & Continue' : 'मैं सहमत हूँ'}
          </button>
        </div>
      </div>
    </div>
  );
}
