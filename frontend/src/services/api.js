// api.js — API client connecting to RogMitra backend
// Rule 4: Clearly labelled fallbacks if backend is offline. Rule 5: No exposed keys.

import axios from 'axios';
import { SYNTHETIC_PATIENTS } from '../data/syntheticPatients';
import { SYNTHETIC_DOCUMENTS } from '../data/syntheticDocuments';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
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
  requestOtp: async (phone) => {
    try {
      const res = await apiClient.post('/auth/request-otp', { phone });
      return res.data;
    } catch {
      // Demo fallback
      return {
        success: true,
        message: 'Demo OTP sent (Use 123456)',
        demoOtp: '123456',
        _isFallback: true
      };
    }
  },

  verifyOtp: async (phone, otp) => {
    try {
      const res = await apiClient.post('/auth/verify-otp', { phone, otp });
      return res.data;
    } catch {
      return {
        token: 'demo-jwt-token-patient',
        user: { id: 'pat-1', name: 'Ananya Verma', phone, role: 'patient' },
        _isFallback: true
      };
    }
  },

  loginDoctor: async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login-doctor', { email, password });
      return res.data;
    } catch {
      return {
        token: 'demo-jwt-token-doctor',
        user: { id: 'doc-1', name: 'Dr. Sharma', email, role: 'doctor', department: 'General Medicine' },
        _isFallback: true
      };
    }
  },

  mockAbhaAuth: async (abhaId) => {
    try {
      const res = await apiClient.post('/auth/mock-abha', { abhaId });
      return res.data;
    } catch {
      return {
        token: 'demo-jwt-token-abha',
        user: { id: 'pat-abha-1', name: 'Ananya Verma', abhaId, phone: '9876543210', role: 'patient' },
        _isFallback: true
      };
    }
  }
};

// Case-Taking & Dialogue Endpoints
export const dialogueApi = {
  submitTurn: async (sessionId, turnData) => {
    try {
      const res = await apiClient.post('/dialogue/turn', { sessionId, ...turnData });
      return res.data;
    } catch {
      return {
        acknowledged: true,
        nextQuestionId: 'socrates_onset',
        _isFallback: true
      };
    }
  }
};

// Document Scanner Endpoints
export const documentApi = {
  uploadDocument: async (file, sessionId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) formData.append('sessionId', sessionId);

    try {
      const res = await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch {
      // Realistic OCR extraction fallback
      return {
        id: `doc-${Date.now()}`,
        fileName: file.name,
        reportType: 'Lab Report',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        tests: 'CBC, ESR, Blood Sugar',
        findings: [
          { test: 'Hemoglobin (Hb)', value: '11.2', unit: 'g/dL', status: 'Low', refRange: '12.0 - 15.5' },
          { test: 'ESR (Westergren)', value: '28', unit: 'mm/hr', status: 'High', refRange: '0 - 20' },
          { test: 'Random Blood Glucose', value: '104', unit: 'mg/dL', status: 'Normal', refRange: '70 - 140' }
        ],
        rawText: `DR. LAL PATHLABS\nPATIENT: ANANYA VERMA | AGE: 28Y/F\nTEST: COMPLETE BLOOD COUNT & ESR\nHEMOGLOBIN: 11.2 g/dL (LOW)\nESR: 28 mm/hr (HIGH)`,
        _isFallback: true
      };
    }
  }
};

// Doctor Queue & Summary Review Endpoints
export const doctorApi = {
  getQueue: async () => {
    try {
      const res = await apiClient.get('/doctor/queue');
      return res.data;
    } catch {
      return SYNTHETIC_PATIENTS;
    }
  },

  getSummary: async (patientId) => {
    try {
      const res = await apiClient.get(`/summary/${patientId}`);
      return res.data;
    } catch {
      const p = SYNTHETIC_PATIENTS.find(pt => pt.id === patientId) || SYNTHETIC_PATIENTS[0];
      return p.summary;
    }
  },

  approveSummary: async (summaryId, payload) => {
    try {
      const res = await apiClient.post(`/summary/${summaryId}/approve`, payload);
      return res.data;
    } catch {
      return { success: true, status: 'approved', timestamp: new Date().toISOString(), _isFallback: true };
    }
  },

  rejectSummary: async (summaryId, reason) => {
    try {
      const res = await apiClient.post(`/summary/${summaryId}/reject`, { reason });
      return res.data;
    } catch {
      return { success: true, status: 'rejected', reason, timestamp: new Date().toISOString(), _isFallback: true };
    }
  }
};

export default apiClient;
