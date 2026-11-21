// DoctorReportsPage.jsx — Uploaded Medical Reports & OCR Entities Browser for Doctors
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText, Search, RefreshCw, CheckCircle2, User, AlertCircle,
  Clock, ArrowRight
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { doctorApi } from '../services/api';

export default function DoctorReportsPage() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientReports, setPatientReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    doctorApi.getQueue().then((data) => {
      const q = Array.isArray(data) ? data : [];
      setQueue(q);
      if (q.length > 0) {
        setSelectedPatientId(q[0].id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    setLoadingReports(true);
    doctorApi.getReports(selectedPatientId).then((reports) => {
      setPatientReports(Array.isArray(reports) ? reports : []);
      setLoadingReports(false);
    }).catch(() => {
      setPatientReports([]);
      setLoadingReports(false);
    });
  }, [selectedPatientId]);

  const activePatient = queue.find((p) => p.id === selectedPatientId) || queue[0];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand" />
            <span>{isHi ? 'अपलोड किए गए दस्तावेज़ एवं ओसीआर रिपोर्ट्स' : 'Uploaded Medical Records & OCR'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            View real uploaded lab reports, prescriptions, and digitized key findings. Zero fake values.
          </p>
        </div>

        {/* Patient Switcher */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E2EFE7] shadow-card">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Select Patient from OPD:
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {queue.map((pt) => (
              <button
                key={pt.id}
                onClick={() => setSelectedPatientId(pt.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-2 ${
                  selectedPatientId === pt.id
                    ? 'bg-mint-100 border-brand text-brand shadow-sm ring-1 ring-brand/30'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{pt.name}</span>
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded-full border">
                  {pt.tokenNumber}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Reports Content */}
        {loadingReports ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E2EFE7]">
            <RefreshCw className="w-8 h-8 text-brand animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading documents for {activePatient?.name}...</p>
          </div>
        ) : patientReports.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E2EFE7] shadow-card space-y-3">
            <FileText className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">No documents scanned yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              This patient has not uploaded any lab reports, prescriptions or scans yet. Only real uploaded records are displayed here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {patientReports.map((doc, idx) => (
              <div key={doc.id || idx} className="bg-white rounded-3xl p-6 border border-[#E2EFE7] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{doc.filename}</h3>
                    <span className="text-[11px] text-gray-400">{doc.reportType} • {doc.reportDate}</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-mint-100 text-brand font-semibold">
                    Digitized
                  </span>
                </div>

                {/* Findings Table */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block">
                    Extracted Values ({doc.findings?.length || 0})
                  </span>
                  {doc.findings && doc.findings.length > 0 ? (
                    <div className="space-y-1.5">
                      {doc.findings.map((f, fi) => (
                        <div key={fi} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-800">{f.test}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900">{f.value} {f.unit}</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              f.status === 'High' ? 'bg-red-100 text-red-700' : f.status === 'Low' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {f.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No tabular parameters extracted from this file.</p>
                  )}
                </div>

                {/* Raw OCR preview */}
                {doc.rawText && (
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                      OCR Transcript
                    </span>
                    <pre className="text-[11px] font-mono text-gray-600 whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {doc.rawText}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
