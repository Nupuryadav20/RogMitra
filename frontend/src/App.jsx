// App.jsx — RogMitra Root Router & Role Guards
// Manages navigation across all Theme 3 screens: Login, Patient Dashboard, Voice Interview, Scanner, Ayurveda, Doctor Workspace
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';

import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import VoiceInterviewPage from './pages/VoiceInterviewPage';
import DocumentScannerPage from './pages/DocumentScannerPage';
import AyurvedaPage from './pages/AyurvedaPage';
import DoctorDashboard from './pages/DoctorDashboard';
import OpdQueuePage from './pages/OpdQueuePage';
import DoctorSummariesPage from './pages/DoctorSummariesPage';
import DoctorReportsPage from './pages/DoctorReportsPage';
import DoctorSettingsPage from './pages/DoctorSettingsPage';
import SummaryPage from './pages/SummaryPage';
import useAppStore from './store/appStore';

// Protected Route for Patients
function PatientRoute({ children }) {
  const { user, role } = useAppStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'doctor') {
    return <Navigate to="/doctor" replace />;
  }
  return children;
}

// Protected Route for Doctors
function DoctorRoute({ children }) {
  const { user, role } = useAppStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role !== 'doctor') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Protected Route for Authenticated Users (Both Patient and Doctor)
function AuthenticatedRoute({ children }) {
  const { user } = useAppStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
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

        {/* Doctor Workspace: OPD Queue */}
        <Route
          path="/doctor/queue"
          element={
            <DoctorRoute>
              <OpdQueuePage />
            </DoctorRoute>
          }
        />

        {/* Doctor Workspace: Summaries Directory */}
        <Route
          path="/doctor/summaries"
          element={
            <DoctorRoute>
              <DoctorSummariesPage />
            </DoctorRoute>
          }
        />

        {/* Doctor Workspace: Uploaded Reports Directory */}
        <Route
          path="/doctor/reports"
          element={
            <DoctorRoute>
              <DoctorReportsPage />
            </DoctorRoute>
          }
        />

        {/* Doctor Workspace: Settings */}
        <Route
          path="/doctor/settings"
          element={
            <DoctorRoute>
              <DoctorSettingsPage />
            </DoctorRoute>
          }
        />

        {/* Full Clinical Summary Review View — Accessible to both Patient & Doctor */}
        <Route
          path="/summary"
          element={
            <AuthenticatedRoute>
              <SummaryPage />
            </AuthenticatedRoute>
          }
        />

        {/* Default Landing: Redirect to dashboard or login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
