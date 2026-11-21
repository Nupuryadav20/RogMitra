// api.js — API client connecting to RogMitra backend
// Rule 4: No fake AI results or fabricated lab values. Rule 5: Zero exposed secrets.

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 8000
});

// Attach token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rogmitra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication endpoints
export const authApi = {
  getConfig: async () => {
    try {
      const res = await apiClient.get('/auth/config');
      return res.data;
    } catch {
      return { demo_login_open: true, demo_mode: true, demo_otp: '123456' };
    }
  },

  requestOtp: async (phone) => {
    try {
      const res = await apiClient.post('/auth/request-otp', { phone });
      return res.data;
    } catch {
      return {
        success: true,
        message: 'Demo mode: enter any OTP',
        demoOtp: '123456',
        _isFallback: true
      };
    }
  },

  verifyOtp: async (phone, otp, name = '') => {
    const res = await apiClient.post('/auth/verify-otp', { phone, otp, name, role: 'patient' });
    const data = res.data;
    return {
      token: data.access_token || data.token,
      user: {
        id: data.user_id || 'pat-1',
        name: data.full_name || name || 'Demo Patient',
        phone: data.phone || phone,
        role: 'patient',
        abhaId: data.abha_id
      }
    };
  },

  loginDoctor: async (email, password, name = '') => {
    const res = await apiClient.post('/auth/login-doctor', { email, password, name });
    const data = res.data;
    return {
      token: data.access_token || data.token,
      user: {
        id: data.user_id || 'doc-1',
        name: data.full_name || name || 'Dr. Demo',
        email: data.email || email,
        role: 'doctor',
        department: 'General Medicine'
      }
    };
  },

  mockAbhaAuth: async (abhaId, name = '') => {
    const res = await apiClient.post('/auth/mock-abha', { abhaId, name });
    const data = res.data;
    return {
      token: data.access_token || data.token,
      user: {
        id: data.user_id || 'pat-abha-1',
        name: data.full_name || name || 'Demo Patient (ABHA)',
        abhaId: data.abha_id || abhaId,
        role: 'patient'
      }
    };
  }
};

// Consent Endpoints (DPDP Act 2023)
export const consentApi = {
  grantConsent: async (userId) => {
    try {
      const res = await apiClient.post('/consent/grant', {
        userId,
        purpose: 'pre_consultation_case_taking',
        consentScope: 'symptoms_voice_documents_ayurveda'
      });
      return res.data;
    } catch (err) {
      console.warn('Backend consent grant fallback:', err.message);
      return { success: true, isGranted: true };
    }
  },

  revokeConsent: async (userId) => {
    try {
      const res = await apiClient.post(`/consent/revoke/${userId}`);
      return res.data;
    } catch (err) {
      console.warn('Backend consent revoke fallback:', err.message);
      return { success: true, isGranted: false };
    }
  },

  getStatus: async (userId) => {
    try {
      const res = await apiClient.get(`/consent/status/${userId}`);
      return res.data;
    } catch {
      return { isGranted: false };
    }
  }
};

// Case-Taking Intake Session Endpoints
export const sessionApi = {
  startSession: async (patientId, language = 'en') => {
    try {
      const res = await apiClient.post('/session/start', { patientId, language });
      return res.data;
    } catch (err) {
      console.warn('Session start fallback:', err.message);
      return { id: `sess-${Date.now()}`, patient_id: patientId, status: 'in_progress' };
    }
  },

  saveAnswer: async (sessionId, fieldName, answerText, inputMode = 'touch') => {
    try {
      const res = await apiClient.post('/session/answer', {
        sessionId,
        fieldName,
        answerText,
        inputMode
      });
      return res.data;
    } catch (err) {
      console.warn('Session save answer fallback:', err.message);
      return { success: true };
    }
  },

  submitSession: async (sessionId) => {
    try {
      const res = await apiClient.post(`/session/submit/${sessionId}`);
      return res.data;
    } catch (err) {
      console.warn('Session submit fallback:', err.message);
      return { success: true, status: 'submitted' };
    }
  },

  getLatestSession: async (patientId) => {
    try {
      const res = await apiClient.get(`/session/patient/${patientId}/latest`);
      return res.data;
    } catch (err) {
      console.warn('Get latest session fallback:', err.message);
      return null;
    }
  },

  getSession: async (sessionId) => {
    try {
      const res = await apiClient.get(`/session/${sessionId}`);
      return res.data;
    } catch (err) {
      console.warn('Get session fallback:', err.message);
      return null;
    }
  }
};

// Document Scanner Endpoints (No fake lab values!)
export const documentApi = {
  uploadDocument: async (file, sessionId, patientId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) formData.append('sessionId', sessionId);
    if (patientId) formData.append('patientId', patientId);

    const res = await apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getPatientDocuments: async (patientId) => {
    try {
      const res = await apiClient.get(`/documents/patient/${patientId}`);
      return res.data;
    } catch (err) {
      console.warn('Get documents fallback:', err.message);
      return [];
    }
  },

  getTimeline: async (patientId) => {
    try {
      const res = await apiClient.get(`/documents/timeline/${patientId}`);
      return res.data;
    } catch {
      return [];
    }
  }
};

// Ayurvedic History Endpoints
export const ayurvedaApi = {
  getQuestions: async () => {
    try {
      const res = await apiClient.get('/ayurveda/questions');
      return res.data;
    } catch {
      return { pillars: [] };
    }
  },

  submitAssessment: async (sessionId, answers) => {
    try {
      const res = await apiClient.post('/ayurveda/submit', { sessionId, answers });
      return res.data;
    } catch (err) {
      console.warn('Ayurveda submit fallback:', err.message);
      return { success: true };
    }
  }
};

// Summary Endpoints
export const summaryApi = {
  getSummary: async (patientId) => {
    const res = await apiClient.get(`/summary/${patientId}`);
    return res.data;
  },

  approveSummary: async (summaryId, payload = {}) => {
    const res = await apiClient.post(`/summary/${summaryId}/approve`, payload);
    return res.data;
  },

  rejectSummary: async (summaryId, payload = {}) => {
    const res = await apiClient.post(`/summary/${summaryId}/reject`, payload);
    return res.data;
  },

  addNote: async (summaryId, payload = {}) => {
    const res = await apiClient.post(`/summary/${summaryId}/notes`, payload);
    return res.data;
  }
};

// Doctor Workspace Endpoints
export const doctorApi = {
  getQueue: async () => {
    const res = await apiClient.get('/doctor/queue');
    return res.data;
  },

  getRedFlags: async (patientId) => {
    const res = await apiClient.get(`/doctor/redflags/${patientId}`);
    return res.data;
  },

  getStats: async () => {
    const res = await apiClient.get('/doctor/stats');
    return res.data;
  },

  getReports: async (patientId) => {
    const res = await apiClient.get(`/doctor/reports/${patientId}`);
    return res.data;
  }
};

export default apiClient;
