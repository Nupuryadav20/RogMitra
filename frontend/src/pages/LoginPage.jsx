// LoginPage.jsx — Screen 1: Patient/Doctor toggle, Mobile+OTP, ABHA mock, DPDP consent
// Rule 6: Consent gate on first login | Rule 7: Mock ABHA, clearly labelled SANDBOX/MOCK
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Shield, User, Stethoscope, ArrowRight, Info, X } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import ConsentModal from '../components/ConsentModal';
import DemoBadge from '../components/DemoBadge';
import useAppStore from '../store/appStore';

const DEMO_OTP = '123456';

export default function LoginPage() {
  const navigate = useNavigate();
  const store = useAppStore();

  const handleSendOtp = () => {
    if (!mobile || mobile.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleVerifyOtp = () => {
    if (otp !== DEMO_OTP) {
      setError(`Incorrect OTP. (Demo OTP: ${DEMO_OTP})`);
      return;
    }
    setError('');
    // Show consent on first login
    const hasConsented = localStorage.getItem('rogmitra_consented');
    if (!hasConsented) {
      setShowConsent(true);
    } else {
      doLogin();
    }
  };

  const doLogin = () => {
    const demoUser = role === 'patient'
      ? { name: 'Ananya Verma', mobile, role: 'patient', id: 'P001' }
      : { name: 'Dr. Ramesh Sharma', mobile, role: 'doctor', id: 'D001' };

    if (store?.login) {
      store.login(demoUser);
    } else {
      localStorage.setItem('rogmitra_user', JSON.stringify(demoUser));
    }

    navigate(role === 'doctor' ? '/doctor' : '/dashboard');
  };

  const handleConsentAccept = () => {
    localStorage.setItem('rogmitra_consented', 'true');
    setShowConsent(false);
    doLogin();
  };

  const handleConsentDecline = () => {
    setShowConsent(false);
    setStep('mobile');
    setOtp('');
  };

  return (
    <AuthLayout>
      {showConsent && (
        <ConsentModal onAccept={handleConsentAccept} onDecline={handleConsentDecline} />
      )}

      {/* ABHA Modal */}
      {showAbhaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-surface-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">ABHA ID Login</h3>
                <p className="text-xs text-amber-600 font-semibold">🧪 SANDBOX / MOCK — Not connected to NHA production</p>
              </div>
              <button onClick={() => setShowAbhaModal(false)} className="p-1.5 rounded-xl hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              This is a mock ABHA gateway for demonstration purposes only. It does not connect to the National Health Authority (NHA) production systems.
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ABHA ID / Health ID</label>
                <input
                  type="text"
                  placeholder="e.g. ananya@abdm (DEMO)"
                  defaultValue="ananya@abdm"
                  className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setShowAbhaModal(false);
                const hasConsented = localStorage.getItem('rogmitra_consented');
                if (!hasConsented) setShowConsent(true);
                else doLogin();
              }}
              className="w-full py-2.5 rounded-2xl bg-brand text-white text-sm font-semibold shadow-button-green"
            >
              Continue with Mock ABHA (Demo)
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to access RogMitra</p>
        </div>

        {/* Role toggle */}
        <div className="flex gap-2 p-1 bg-mint-100 rounded-2xl">
          {[
            { key: 'patient', label: 'Patient', icon: User },
            { key: 'doctor', label: 'Doctor', icon: Stethoscope },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setRole(key); setStep('mobile'); setOtp(''); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                role === key
                  ? 'bg-white text-brand shadow-card'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-4">
          {step === 'mobile' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mobile Number</label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 py-2.5 rounded-xl border border-surface-border bg-mint-50 text-sm text-gray-600 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                    maxLength={10}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                {/* Demo hint */}
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Demo: any 10-digit number works. OTP will be {DEMO_OTP}
                </p>
              </div>
              {error && <p className="text-xs text-flagRed-text">{error}</p>}
              <button
                onClick={handleSendOtp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand text-white text-sm font-bold shadow-button-green hover:bg-brand-dark transition-colors"
              >
                <Phone className="w-4 h-4" />
                Send OTP
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit OTP"
                  maxLength={6}
                  className="w-full px-3 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 tracking-widest text-center text-lg font-mono"
                />
                {/* Demo OTP hint box */}
                <div className="mt-2 rounded-xl bg-mint-100 border border-mint-200 px-3 py-2 text-xs text-brand font-semibold flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  DEMO OTP: <span className="font-mono tracking-widest">{DEMO_OTP}</span>
                </div>
              </div>
              {error && <p className="text-xs text-flagRed-text">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setStep('mobile'); setOtp(''); setError(''); }}
                  className="flex-1 py-2.5 rounded-2xl border border-surface-border text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOtp}
                  className="flex-1 py-2.5 rounded-2xl bg-brand text-white text-sm font-bold shadow-button-green hover:bg-brand-dark transition-colors"
                >
                  Verify & Login
                </button>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-surface-border" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-surface-border" />
        </div>

        {/* ABHA login */}
        <button
          onClick={() => setShowAbhaModal(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-surface-border bg-white text-sm font-semibold text-gray-700 hover:bg-mint-50 transition-colors"
        >
          <span>🏥</span>
          Continue with ABHA ID
          <span className="text-xs text-amber-600 font-normal">(Mock)</span>
        </button>

        {/* New patient link */}
        <p className="text-center text-xs text-gray-500">
          New patient?{' '}
          <button
            className="text-brand font-semibold hover:underline"
            onClick={() => {
              setMobile('9999999999');
              setRole('patient');
              setStep('otp');
            }}
          >
            Register here (Demo)
          </button>
        </p>

        {/* Compliance note */}
        <p className="text-center text-[10px] text-gray-400">
          Protected under DPDP Act 2023 • ABDM Sandbox • No real data collected
        </p>
      </div>
    </AuthLayout>
  );
}
