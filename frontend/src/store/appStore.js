// appStore.js — Zustand store for RogMitra client state
// Manages authentication, consent, intake session data, OCR documents, and doctor review

import { create } from 'zustand';
import { SYNTHETIC_PATIENTS } from '../data/syntheticPatients';
import { SYNTHETIC_DOCUMENTS } from '../data/syntheticDocuments';

export const useAppStore = create((set, get) => ({
  // Authentication & Role
  user: {
    id: 'patient-demo-1',
    name: 'Ananya Verma',
    role: 'patient',
    phone: '9876543210',
    age: 28,
    gender: 'Female',
    abhaId: '91-8765-4321-0987'
  },
  role: 'patient', // 'patient' | 'doctor'
  token: 'demo-jwt-token-rogmitra-btech',
  isAuthenticated: true,

  // Consent (DPDP Act 2023)
  consented: localStorage.getItem('rogmitra_consented') === 'true',
  consentTimestamp: localStorage.getItem('rogmitra_consent_time') || null,

  // Language
  currentLanguage: localStorage.getItem('i18nextLng') || 'en',

  // Active Intake Interview Session
  interview: {
    sessionId: 'session-live-001',
    currentQuestionIndex: 0,
    answers: {
      chief_complaint: 'Headache for 3 days, moderate intensity with mild fever',
      onset_duration: '3 days, gradual onset',
      character: 'Throbbing headache mainly frontal and temples',
      severity: 'Moderate (5 out of 10)',
      associated_symptoms: 'Mild fever and body pain, no vomiting, no neck stiffness',
      past_medical: 'No known chronic illness',
      medications: 'Took paracetamol 650mg SOS, not on regular medication',
      allergies: 'No known drug allergies (NKDA)',
      lifestyle: 'Vegetarian diet, non-smoker, sleep disturbed due to headache'
    },
    conversationHistory: [
      {
        id: 'msg-1',
        speaker: 'bot',
        textEn: 'Tell me about your current health problem. What brings you to the hospital today?',
        textHi: 'कृपया अपनी वर्तमान स्वास्थ्य समस्या के बारे में बताएं।',
        timestamp: '10:20 AM'
      },
      {
        id: 'msg-2',
        speaker: 'patient',
        text: 'Headache for 3 days, moderate intensity with mild fever',
        mode: 'voice',
        timestamp: '10:21 AM'
      }
    ],
    detectedRedFlags: [
      {
        id: 'PERSISTENT_HEADACHE_FEVER',
        severity: 'URGENT',
        messageEn: 'Persistent headache (>3 days) reported.',
        messageHi: 'लगातार 3 दिनों से अधिक सिरदर्द दर्ज किया गया है।',
        matchedKeyword: 'headache for 3 days'
      }
    ]
  },

  // Uploaded Documents & OCR entities
  documents: [
    ...SYNTHETIC_DOCUMENTS
  ],

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
    activePatientId: 'pat-1',
    queue: [
      ...SYNTHETIC_PATIENTS
    ],
    summaryStatus: 'draft', // 'draft' | 'approved' | 'rejected'
    doctorNotes: '',
    editedFields: {},
    rejectReason: ''
  },

  // Actions
  setRole: (newRole) => set({ role: newRole }),
  
  login: (userData, role = 'patient') => set({
    user: userData,
    role: role,
    isAuthenticated: true
  }),

  logout: () => set({
    user: null,
    role: 'patient',
    isAuthenticated: false
  }),

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
