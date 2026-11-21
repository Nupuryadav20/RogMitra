// LoginPage.jsx — Screen 1: Patient/Doctor Login with DEMO MODE support
// Rule 6: Consent gate on first login | Rule 7: Mock ABHA, clearly labelled SANDBOX/MOCK
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, Shield, User, Stethoscope, ArrowRight, Info, X,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import ConsentModal from '../components/ConsentModal';
import useAppStore from '../store/appStore';
import { authApi } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const store = useAppStore();

  const [role, setRole] = useState('patient'); // 'patient' | 'doctor'
  const [demoLoginOpen, setDemoLoginOpen] = useState(true);

  // Patient fields
  const [patientName, setPatientName] = useState('');
  const [mobile, setMobile] = useState('');

  // 6-box OTP
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const otp = otpDigits.join('');

  const [otpSent, setOtpSent] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const resendIntervalRef = useRef(null);

  // Doctor fields
  const [doctorName, setDoctorName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ABHA Modal
  const [showAbhaModal, setShowAbhaModal] = useState(false);
  const [abhaId, setAbhaId] = useState('ananya@abdm');

  // Consent & UI State
  const [showConsent, setShowConsent] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  // Language toggle (derived from i18n; local fallback)
  const [lang, setLang] = useState(() => localStorage.getItem('i18nextLng') || 'en');
  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    localStorage.setItem('i18nextLng', next);
    try { window.i18next?.changeLanguage(next); } catch (_) {}
  };

  // Check demo login configuration from backend
  useEffect(() => {
    let isMounted = true;
    authApi.getConfig().then((cfg) => {
      if (isMounted && typeof cfg.demo_login_open === 'boolean') {
        setDemoLoginOpen(cfg.demo_login_open);
      }
    }).catch(() => {
      // Keep default demoLoginOpen=true
    });
    return () => { isMounted = false; };
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (resendIntervalRef.current) clearInterval(resendIntervalRef.current); };
  }, []);

  const startResendTimer = () => {
    setResendTimer(60);
    if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
    resendIntervalRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(resendIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // OTP box handlers
  const handleOtpDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const digits = pasted.split('').concat(['', '', '', '', '', '']).slice(0, 6);
      setOtpDigits(digits);
      const nextEmpty = digits.findIndex(d => !d);
      const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
      otpRefs.current[focusIdx]?.focus();
    }
  };

  // "Get OTP" handler
  const handleGetOtp = async () => {
    setError('');
    if (!demoLoginOpen) {
      if (!mobile || mobile.replace(/\D/g, '').length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
    }
    setOtpLoading(true);
    setOtpSuccess(false);
    try {
      const res = await authApi.requestOtp(mobile);
      setOtpSent(true);
      setOtpSuccess(true);
      if (demoLoginOpen) {
        setOtpNotice('Demo mode: enter any 6 digits');
        setOtpDigits(['1', '2', '3', '4', '5', '6']);
      } else {
        setOtpNotice(res.message || 'OTP sent to your mobile.');
      }
      startResendTimer();
    } catch (err) {
      if (demoLoginOpen) {
        setOtpSent(true);
        setOtpSuccess(true);
        setOtpNotice('Demo mode: enter any 6 digits');
        setOtpDigits(['1', '2', '3', '4', '5', '6']);
        startResendTimer();
      } else {
        setError(err.response?.data?.detail || 'Failed to send OTP.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Complete login and route
  const finalizeLogin = (userData, userRole, token) => {
    if (store?.login) {
      store.login(userData, userRole, token);
    } else {
      localStorage.setItem('rogmitra_user', JSON.stringify(userData));
      if (token) localStorage.setItem('rogmitra_token', token);
    }
    if (userRole === 'doctor') {
      navigate('/doctor');
    } else {
      navigate('/dashboard');
    }
  };

  // Patient Login submission
  const handlePatientLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setIsLoading(true);

    if (!demoLoginOpen) {
      if (!mobile || mobile.replace(/\D/g, '').length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        setIsLoading(false);
        return;
      }
      if (!otp || otp.length < 6) {
        setError('Please enter the 6-digit OTP sent to your phone.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await authApi.verifyOtp(mobile, otp, patientName);
      const userObj = res.user || {
        id: res.user_id || 'pat-1',
        name: res.full_name || patientName || 'Demo Patient',
        phone: res.phone || mobile || 'demo-patient',
        role: 'patient'
      };
      const token = res.token || res.access_token || 'demo-token';

      const hasConsented = localStorage.getItem('rogmitra_consented') === 'true';
      if (!hasConsented) {
        setPendingUser({ user: userObj, role: 'patient', token });
        setShowConsent(true);
      } else {
        finalizeLogin(userObj, 'patient', token);
      }
    } catch (err) {
      if (demoLoginOpen) {
        const fallbackUser = {
          id: 'pat-demo-fallback',
          name: patientName.trim() || 'Demo Patient',
          phone: mobile || 'demo-patient',
          role: 'patient'
        };
        const hasConsented = localStorage.getItem('rogmitra_consented') === 'true';
        if (!hasConsented) {
          setPendingUser({ user: fallbackUser, role: 'patient', token: 'demo-token' });
          setShowConsent(true);
        } else {
          finalizeLogin(fallbackUser, 'patient', 'demo-token');
        }
      } else {
        setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Doctor Login submission
  const handleDoctorLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setIsLoading(true);

    if (!demoLoginOpen) {
      if (!email || !password) {
        setError('Doctor email and password are required.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await authApi.loginDoctor(email, password, doctorName);
      const userObj = res.user || {
        id: res.user_id || 'doc-1',
        name: res.full_name || doctorName || 'Dr. Demo',
        email: res.email || email || 'dr.demo@hospital.org',
        role: 'doctor',
        department: 'General Medicine'
      };
      const token = res.token || res.access_token || 'demo-token-doctor';
      finalizeLogin(userObj, 'doctor', token);
    } catch (err) {
      if (demoLoginOpen) {
        const fallbackDoc = {
          id: 'doc-demo-fallback',
          name: doctorName.trim() || 'Dr. Demo',
          email: email || 'dr.demo@hospital.org',
          role: 'doctor',
          department: 'General Medicine'
        };
        finalizeLogin(fallbackDoc, 'doctor', 'demo-token-doctor');
      } else {
        setError(err.response?.data?.detail || 'Invalid doctor email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mock ABHA login
  const handleAbhaLogin = async () => {
    setShowAbhaModal(false);
    setError('');
    setIsLoading(true);

    try {
      const res = await authApi.mockAbhaAuth(abhaId, patientName);
      const userObj = res.user || {
        id: res.user_id || 'pat-abha-1',
        name: res.full_name || patientName || 'Demo Patient (ABHA)',
        abhaId: res.abha_id || abhaId || 'demo@abdm',
        role: 'patient'
      };
      const token = res.token || res.access_token || 'demo-token-abha';

      const hasConsented = localStorage.getItem('rogmitra_consented') === 'true';
      if (!hasConsented) {
        setPendingUser({ user: userObj, role: 'patient', token });
        setShowConsent(true);
      } else {
        finalizeLogin(userObj, 'patient', token);
      }
    } catch {
      const fallbackUser = {
        id: 'pat-abha-demo',
        name: patientName.trim() || 'Demo Patient (ABHA)',
        abhaId: abhaId || 'demo@abdm',
        role: 'patient'
      };
      const hasConsented = localStorage.getItem('rogmitra_consented') === 'true';
      if (!hasConsented) {
        setPendingUser({ user: fallbackUser, role: 'patient', token: 'demo-token' });
        setShowConsent(true);
      } else {
        finalizeLogin(fallbackUser, 'patient', 'demo-token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsentAccept = () => {
    localStorage.setItem('rogmitra_consented', 'true');
    setShowConsent(false);
    if (pendingUser) {
      finalizeLogin(pendingUser.user, pendingUser.role, pendingUser.token);
      setPendingUser(null);
    }
  };

  const handleConsentDecline = () => {
    setShowConsent(false);
    setPendingUser(null);
  };

  return (
    <AuthLayout>
      {/* Language toggle — top right pill */}
      <div className="absolute top-4 right-16 z-20">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-surface-border text-xs font-bold text-gray-700 shadow-sm hover:bg-mint-50 transition-colors"
        >
          <span className={lang === 'en' ? 'text-brand' : 'text-gray-400'}>EN</span>
          <span className="text-gray-300">|</span>
          <span className={lang === 'hi' ? 'text-brand' : 'text-gray-400'}>हिं</span>
        </button>
      </div>

      {/* DPDP Consent Modal */}
      {showConsent && (
        <ConsentModal onAccept={handleConsentAccept} onDecline={handleConsentDecline} />
      )}

      {/* Mock ABHA Modal */}
      {showAbhaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <span>🏥</span> Continue with ABHA ID
                </h3>
                <p className="text-xs text-amber-600 font-semibold mt-0.5">
                  🧪 SANDBOX / MOCK — Not connected to NHA production
                </p>
              </div>
              <button
                onClick={() => setShowAbhaModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
              This is a mock ABHA (Ayushman Bharat Digital Mission) gateway for research & demonstration purposes under the DPDP Act 2023. Real verification is simulated.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ABHA ID / Health ID {demoLoginOpen && <span className="text-gray-400 font-normal">(Any input works)</span>}
                </label>
                <input
                  type="text"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  placeholder="e.g. ananya@abdm or 91-1234-5678-9012"
                  className="w-full px-3 py-3 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>

            <button
              onClick={handleAbhaLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-brand text-white text-sm font-bold shadow-button-green hover:bg-brand-dark transition-all flex items-center justify-center gap-2"
            >
              Continue with Mock ABHA
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* DEMO MODE BANNER — compact */}
        {demoLoginOpen && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-300/70 shadow-sm">
            <span className="text-sm shrink-0">ℹ️</span>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">DEMO MODE</span>
              <span className="text-[11px] text-amber-800 ml-1.5">— Any mobile / OTP / ABHA will work.</span>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Welcome to RogMitra</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            AI-Assisted Patient Pre-Consultation Case-Taking Software
          </p>
        </div>

        {/* Role toggle (Patient / Doctor) with smooth transition */}
        <div className="flex gap-1.5 p-1 bg-mint-100 rounded-2xl">
          {[
            { key: 'patient', label: 'Patient Portal', icon: User },
            { key: 'doctor', label: 'Doctor Portal', icon: Stethoscope },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setRole(key);
                setError('');
                setOtpNotice('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                role === key
                  ? 'bg-white text-brand shadow-card font-bold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* PATIENT TAB FORM */}
        {role === 'patient' && (
          <form onSubmit={handlePatientLogin} className="space-y-3.5 text-left">
            {/* Optional Name Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Patient Name <span className="text-gray-400 font-normal">(Optional — default: Demo Patient)</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-3 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition-shadow"
              />
            </div>

            {/* Mobile Number & Get OTP */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mobile Number {demoLoginOpen && <span className="text-gray-400 font-normal">(Any input works)</span>}
              </label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 py-3 rounded-xl border border-surface-border bg-mint-50 text-xs text-gray-600 font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter mobile number"
                  className="flex-1 px-3 py-3 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition-shadow"
                />
                <button
                  type="button"
                  onClick={handleGetOtp}
                  disabled={otpLoading || (resendTimer > 0 && otpSent)}
                  className={`px-3.5 py-3 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-1.5 ${
                    otpSuccess
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-mint-100 text-brand hover:bg-mint-200 border-mint-200'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {otpLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : otpSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : null}
                  {otpLoading ? 'Sending...' : otpSuccess ? 'Sent!' : 'Get OTP'}
                </button>
              </div>
            </div>

            {/* OTP Notice */}
            {otpNotice && (
              <div className="rounded-xl bg-mint-50 border border-mint-200 p-2.5 text-xs text-brand font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                <span>{otpNotice}</span>
              </div>
            )}

            {/* 6-box OTP input */}
            {(otpSent || demoLoginOpen) && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Enter OTP {demoLoginOpen && <span className="text-gray-400 font-normal">(Any 6 digits)</span>}
                  </label>
                  {/* Resend timer */}
                  {otpSent && (
                    <button
                      type="button"
                      onClick={resendTimer === 0 ? handleGetOtp : undefined}
                      disabled={resendTimer > 0}
                      className="text-xs font-semibold text-brand disabled:text-gray-400 hover:underline disabled:no-underline disabled:cursor-default transition-colors"
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  )}
                </div>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => { otpRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigit(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 rounded-xl border border-surface-border text-center text-lg font-bold font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all bg-white"
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-flagRed-text font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-flagRed-text shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand text-white text-sm font-bold shadow-button-green hover:bg-brand-dark transition-all min-h-[48px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Phone className="w-4 h-4" />
              )}
              {isLoading ? 'Signing In...' : 'Login as Patient'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-surface-border" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-surface-border" />
            </div>

            {/* ABHA login button */}
            <button
              type="button"
              onClick={() => setShowAbhaModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-surface-border bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:bg-mint-50 transition-colors shadow-sm min-h-[48px]"
            >
              <span>🏥</span>
              Continue with ABHA ID
              <span className="text-xs text-amber-600 font-bold ml-1">(Mock)</span>
            </button>

            {/* Trust line */}
            <p className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5 pt-1">
              <Shield className="w-3 h-3 text-brand shrink-0" />
              Your data is private and used only with your consent
            </p>
          </form>
        )}

        {/* DOCTOR TAB FORM */}
        {role === 'doctor' && (
          <form onSubmit={handleDoctorLogin} className="space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Doctor Name <span className="text-gray-400 font-normal">(Optional — default: Dr. Demo)</span>
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Ramesh Sharma"
                className="w-full px-3 py-3 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Doctor Email / ID {demoLoginOpen && <span className="text-gray-400 font-normal">(Any input works)</span>}
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.sharma@hospital.org"
                className="w-full px-3 py-3 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password / PIN {demoLoginOpen && <span className="text-gray-400 font-normal">(Any password works)</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-3 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition-shadow"
              />
            </div>

            {demoLoginOpen && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-brand shrink-0" />
                Demo mode: Any input will log in and show the seeded OPD queue.
              </p>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-flagRed-text font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-flagRed-text shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand text-white text-sm font-bold shadow-button-green hover:bg-brand-dark transition-all min-h-[48px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Stethoscope className="w-4 h-4" />
              )}
              {isLoading ? 'Signing In...' : 'Login as Doctor'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Trust line */}
            <p className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5 pt-1">
              <Shield className="w-3 h-3 text-brand shrink-0" />
              Your data is private and used only with your consent
            </p>
          </form>
        )}

        {/* DPDP Compliance Footer */}
        <p className="text-center text-[10px] text-gray-400 pt-2 border-t border-surface-border/60">
          Protected under Digital Personal Data Protection Act 2023 • ABDM Sandbox Mock • No clinical diagnosis or prescription provided
        </p>
      </div>
    </AuthLayout>
  );
}
