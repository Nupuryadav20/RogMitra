// DoctorSettingsPage.jsx — Doctor Profile & Consultation Workspace Configuration
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings, User, Stethoscope, Shield, Bell, Check,
  LogOut, Globe, Hospital, Save
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import useAppStore from '../store/appStore';
import { useToast } from '../components/Toast';

export default function DoctorSettingsPage() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();
  const { user, logout } = useAppStore();
  const { show: showToast, ToastContainer } = useToast();

  const [docName, setDocName] = useState(user?.name || user?.full_name || 'Dr. R. Sharma');
  const [department, setDepartment] = useState('General Medicine');
  const [roomNumber, setRoomNumber] = useState('Room 104, OPD Block B');
  const [autoTriageAlerts, setAutoTriageAlerts] = useState(true);

  const handleSave = () => {
    showToast('Settings saved successfully', 'success');
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  return (
    <AppLayout>
      <ToastContainer />
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-brand" />
            <span>{isHi ? 'चिकित्सक कार्यस्थान सेटिंग्स' : 'Doctor Workspace Settings'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Configure consultation room, OPD triage notifications, and physician profile.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EFE7] shadow-card space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-3xl bg-mint-100 text-brand flex items-center justify-center font-extrabold text-2xl border border-mint-200">
              <Stethoscope className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">{docName}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{department} • {roomNumber}</p>
              <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Active Clinician Session
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Doctor Full Name
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                OPD Room / Station
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Role Gate
              </label>
              <input
                type="text"
                value="Licensed Medical Practitioner (Doctor Role)"
                disabled
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-xs text-gray-500"
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Clinical Notification Preferences</h3>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-gray-800 block">Critical Red Flag Audio Alert</span>
                <span className="text-[11px] text-gray-500">Play immediate audio chime when a patient reports critical cardiac or dyspnea signs</span>
              </div>
              <input
                type="checkbox"
                checked={autoTriageAlerts}
                onChange={(e) => setAutoTriageAlerts(e.target.checked)}
                className="w-4 h-4 text-brand rounded focus:ring-brand"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand text-white text-xs font-bold shadow-button-green hover:bg-brand-dark transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
