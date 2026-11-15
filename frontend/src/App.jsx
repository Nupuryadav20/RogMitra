// App.jsx — RogMitra Root Router & Role Guards
// Manages navigation across all 6 Theme 3 screens: Login, Patient Dashboard, Voice Interview, Scanner, Ayurveda, Doctor
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';

import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import VoiceInterviewPage from './pages/VoiceInterviewPage';
import DocumentScannerPage from './pages/DocumentScannerPage';
import AyurvedaPage from './pages/AyurvedaPage';
import DoctorDashboard from './pages/DoctorDashboard';
import SummaryPage from './pages/SummaryPage';
import useAppStore from './store/appStore';

// Protected Route for Patients
function PatientRoute({ children }) {
  const { user } = useAppStore();
  // In demo mode, default allows access, but redirect if explicitly not logged in
  if (user === null) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Protected Route for Doctors
function DoctorRoute({ children }) {
  const { user, role } = useAppStore();
  if (user === null) {
    return <Navigate to="/login" replace />;
  }
  // Allow doctors or preview in demo mode
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Screen 1: Login / Welcome */}
        <Route path="/login" element={<LoginPage />} />

        {/* Screen 2: Patient Dashboard */}
        <Route
          path="/dashboard"
          element={
            <PatientRoute>
              <PatientDashboard />
            </PatientRoute>
          }
        />

        {/* Screen 3: AI Voice Interview */}
        <Route
          path="/interview"
          element={
            <PatientRoute>
              <VoiceInterviewPage />
            </PatientRoute>
          }
        />

        {/* Screen 4: Medical Document Scan (OCR) */}
        <Route
          path="/scanner"
          element={
            <PatientRoute>
              <DocumentScannerPage />
            </PatientRoute>
          }
        />

        {/* Screen 5: Ayurvedic History (AYUSH Mode) */}
        <Route
          path="/ayurveda"
          element={
            <PatientRoute>
              <AyurvedaPage />
            </PatientRoute>
          }
        />

        {/* Screen 6: Doctor Dashboard – AI Clinical Summary */}
        <Route
          path="/doctor"
          element={
            <DoctorRoute>
              <DoctorDashboard />
            </DoctorRoute>
          }
        />

        {/* Full Clinical Summary Review View */}
        <Route
          path="/summary"
          element={
            <PatientRoute>
              <SummaryPage />
            </PatientRoute>
          }
        />

        {/* Default Landing: Redirect to dashboard or login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
