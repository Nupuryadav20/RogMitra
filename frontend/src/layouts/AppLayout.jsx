// AppLayout.jsx — Main layout with sidebar, header with language toggle, DEMO badge, logo
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Mic, FileText, Leaf, ClipboardList,
  Stethoscope, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import Logo from '../components/Logo';
import DemoBadge from '../components/DemoBadge';
import LanguageToggle from '../components/LanguageToggle';
import useAppStore from '../store/appStore';

const PATIENT_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', labelHi: 'डैशबोर्ड' },
  { to: '/interview', icon: Mic, label: 'Voice Interview', labelHi: 'वॉयस इंटरव्यू' },
  { to: '/scanner', icon: FileText, label: 'Scan Documents', labelHi: 'दस्तावेज़ स्कैन' },
  { to: '/ayurveda', icon: Leaf, label: 'Ayurvedic History', labelHi: 'आयुर्वेदिक इतिहास' },
  { to: '/summary', icon: ClipboardList, label: 'View Summary', labelHi: 'सारांश देखें' },
];

const DOCTOR_NAV = [
  { to: '/doctor', icon: Stethoscope, label: 'Doctor Dashboard', labelHi: 'डॉक्टर डैशबोर्ड' },
];

export default function AppLayout({ children }) {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, role, logout } = useAppStore();

  const navItems = role === 'doctor' ? DOCTOR_NAV : PATIENT_NAV;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-surface-border">
        <Logo size="md" />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, labelHi }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/doctor'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-brand text-white shadow-button-green'
                  : 'text-gray-600 hover:bg-mint-100 hover:text-brand'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  style={{ width: '18px', height: '18px' }}
                  className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-brand'}`}
                />
                <span>{isHi ? labelHi : label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-surface-border space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-mint-200 flex items-center justify-center text-brand font-bold text-sm flex-shrink-0">
              {user.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
              <div className="text-xs text-gray-500 capitalize">{role}</div>
            </div>
          </div>
        )}
        <button
          onClick={() => { if (logout) logout(); navigate('/login'); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-sm text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {isHi ? 'लॉग आउट' : 'Log Out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-mint-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-surface-border flex-shrink-0 shadow-card">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-60 bg-white shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-surface-border flex items-center px-4 gap-3">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-1.5 rounded-xl hover:bg-mint-100 text-gray-500"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1" />

          {/* Demo badge */}
          <DemoBadge />

          {/* Language toggle */}
          <LanguageToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
