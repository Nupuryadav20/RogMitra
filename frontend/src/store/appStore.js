// appStore.js — Zustand store for RogMitra client state
// Manages authentication, consent, intake session data, OCR documents, and doctor review

import { create } from 'zustand';
import { SYNTHETIC_PATIENTS } from '../data/syntheticPatients';

// Helper: restore user from localStorage on app startup
function restoreAuth() {
  try {
    const saved = localStorage.getItem('rogmitra_user');
    const token = localStorage.getItem('rogmitra_token');
    if (saved) {
      const user = JSON.parse(saved);
      return { user, role: user.role || 'patient', token: token || null, isAuthenticated: true };
    }
  } catch {}
  return { user: null, role: 'patient', token: null, isAuthenticated: false };
}

const savedAuth = restoreAuth();

export const useAppStore = create((set, get) => ({
  // Authentication & Role — restored from localStorage on startup
  user: savedAuth.user,
  role: savedAuth.role,
  token: savedAuth.token,
  isAuthenticated: savedAuth.isAuthenticated,

  // Consent (DPDP Act 2023)
  consented: localStorage.getItem('rogmitra_consented') === 'true',
  consentTimestamp: localStorage.getItem('rogmitra_consent_time') || null,

  // Language
  currentLanguage: localStorage.getItem('i18nextLng') || 'en',

  // Active Intake Interview Session
  interview: {
    sessionId: null,
    currentQuestionIndex: 0,
    answers: {},
    conversationHistory: [],
    detectedRedFlags: []
  },

  // Uploaded Documents & OCR entities (empty — only real uploaded documents)
  documents: [],

  // Ayurvedic Assessment (AYUSH Mode)
  ayurveda: {
    completed: true,
    prakriti: 'Pitta-Vata',
    answers: {
      P1Q1: 'B', // Medium
      P1Q2: 'B', // Warm, oily
      P1Q3: 'A', // Irregular bursts
      P2Q1: 'B', // Acidity / burning
      P3Q1: 'B', // Tikshnagni (strong appetite)
      P4Q1: 'B', // Madhyama (normal bowels)
      P5Q1: 'A'  // Spices preference
    }
  },

  // Doctor Dashboard Queue & Active Review
  doctorReview: {
    activePatientId: SYNTHETIC_PATIENTS[0]?.id || null,
    queue: [],
    summaryStatus: 'draft', // 'draft' | 'approved' | 'rejected'
    doctorNotes: '',
    editedFields: {},
    rejectReason: ''
  },

  // Actions
  setRole: (newRole) => set({ role: newRole }),
  
  login: (userData, role = 'patient', token = null) => {
    if (userData) {
      localStorage.setItem('rogmitra_user', JSON.stringify({ ...userData, role }));
    }
    if (token) {
      localStorage.setItem('rogmitra_token', token);
    }
    set({
      user: userData,
      role,
      token: token || get().token,
      isAuthenticated: true
    });
  },

  logout: () => {
    localStorage.removeItem('rogmitra_user');
    localStorage.removeItem('rogmitra_token');
    localStorage.removeItem('rogmitra_consented');
    set({
      user: null,
      role: 'patient',
      token: null,
      isAuthenticated: false
    });
  },

  grantConsent: () => {
    const now = new Date().toISOString();
    localStorage.setItem('rogmitra_consented', 'true');
    localStorage.setItem('rogmitra_consent_time', now);
    set({ consented: true, consentTimestamp: now });
  },

  revokeConsent: () => {
    localStorage.removeItem('rogmitra_consented');
    localStorage.removeItem('rogmitra_consent_time');
    set({ consented: false, consentTimestamp: null });
  },

  setLanguage: (lang) => {
    localStorage.setItem('i18nextLng', lang);
    set({ currentLanguage: lang });
  },

  saveAnswer: (field, value, nextIndex = null) => set((state) => ({
    interview: {
      ...state.interview,
      answers: {
        ...state.interview.answers,
        [field]: value
      },
      currentQuestionIndex: nextIndex !== null ? nextIndex : state.interview.currentQuestionIndex
    }
  })),

  addConversationTurn: (turn) => set((state) => ({
    interview: {
      ...state.interview,
      conversationHistory: [...state.interview.conversationHistory, turn]
    }
  })),

  addRedFlag: (alert) => set((state) => {
    const exists = state.interview.detectedRedFlags.some(a => a.id === alert.id);
    if (exists) return state;
    return {
      interview: {
        ...state.interview,
        detectedRedFlags: [...state.interview.detectedRedFlags, alert]
      }
    };
  }),

  addDocument: (doc) => set((state) => ({
    documents: [doc, ...state.documents]
  })),

  saveAyurvedaAnswer: (questionId, optionId) => set((state) => ({
    ayurveda: {
      ...state.ayurveda,
      answers: {
        ...state.ayurveda.answers,
        [questionId]: optionId
      }
    }
  })),

  selectDoctorPatient: (patientId) => set((state) => ({
    doctorReview: {
      ...state.doctorReview,
      activePatientId: patientId,
      summaryStatus: 'draft'
    }
  })),

  approveSummary: () => set((state) => ({
    doctorReview: {
      ...state.doctorReview,
      summaryStatus: 'approved'
    }
  })),

  rejectSummary: (reason) => set((state) => ({
    doctorReview: {
      ...state.doctorReview,
      summaryStatus: 'rejected',
      rejectReason: reason
    }
  })),

  updateDoctorNote: (note) => set((state) => ({
    doctorReview: {
      ...state.doctorReview,
      doctorNotes: note
    }
  })),

  editSummaryField: (field, val) => set((state) => ({
    doctorReview: {
      ...state.doctorReview,
      editedFields: {
        ...state.doctorReview.editedFields,
        [field]: val
      }
    }
  }))
}));

export default useAppStore;
