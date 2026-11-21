// OpdQueuePage.jsx — Dedicated OPD Patient Queue Workspace for Doctors
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Search, Filter, AlertOctagon, CheckCircle2, Clock,
  ArrowRight, User, RefreshCw, Sparkles, AlertCircle
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { doctorApi } from '../services/api';

export default function OpdQueuePage() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'red_flag' | 'reviewed'

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await doctorApi.getQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch OPD queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const filteredQueue = queue.filter((pt) => {
    const matchesSearch =
      (pt.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (pt.tokenNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (pt.chiefComplaint || '').toLowerCase().includes(search.toLowerCase()) ||
      (pt.abhaId || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'red_flag') {
      return (pt.redFlags && pt.redFlags.length > 0) || pt.status === 'red_flag';
    }
    if (filter === 'reviewed') {
      return pt.status === 'reviewed' || pt.summaryStatus === 'approved';
    }
    if (filter === 'pending') {
      return pt.status === 'pending' || pt.status === 'summary_ready';
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-brand" />
              <span>{isHi ? 'ओपीडी कतार (OPD Queue)' : 'OPD Patient Queue'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {isHi
                ? 'आज के सभी पंजीकृत मरीज, उनके लक्षण और त्वरित प्राथमिकता स्थिति।'
                : 'Real-time outpatient consultation queue with automated red flag triage.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchQueue}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-300 hover:border-brand bg-white text-xs font-semibold text-gray-700 hover:text-brand shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isHi ? 'ताज़ा करें' : 'Refresh Queue'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E2EFE7] shadow-card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isHi ? 'नाम, टोकन नंबर या लक्षण से खोजें...' : 'Search by patient name, token number, ABHA ID or symptoms...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-gray-50 rounded-2xl border border-gray-100">
            {[
              { id: 'all', labelEn: 'All Patients', labelHi: 'सभी मरीज' },
              { id: 'pending', labelEn: 'Pending Review', labelHi: 'लंबित' },
              { id: 'red_flag', labelEn: '⚠️ Red Flags', labelHi: '⚠️ रेड फ्लैग' },
              { id: 'reviewed', labelEn: '✓ Reviewed', labelHi: '✓ स्वीकृत' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filter === f.id
                    ? 'bg-brand text-white shadow-button-green'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
              >
                {isHi ? f.labelHi : f.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Queue List */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E2EFE7] shadow-card">
            <RefreshCw className="w-8 h-8 text-brand animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading live patient queue from backend database...</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E2EFE7] shadow-card space-y-2">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-700 text-sm">No patients found</h3>
            <p className="text-xs text-gray-400">Try adjusting your search query or filter chip.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredQueue.map((pt, idx) => {
              const hasRedFlag = pt.redFlags && pt.redFlags.length > 0;
              const isReviewed = pt.status === 'reviewed' || pt.summaryStatus === 'approved';

              return (
                <div
                  key={pt.id || idx}
                  className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-card hover:shadow-lg ${
                    hasRedFlag
                      ? 'border-red-300 ring-1 ring-red-200 bg-red-50/20'
                      : isReviewed
                      ? 'border-emerald-200'
                      : 'border-[#E2EFE7]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Token & Status */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-mint-100 text-brand border border-mint-200">
                        {pt.tokenNumber || `#OPD-${idx + 1}`}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          hasRedFlag
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : isReviewed
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {hasRedFlag ? '⚠️ Red Flag' : isReviewed ? '✓ Reviewed' : 'Pending'}
                      </span>
                    </div>

                    {/* Patient Name & Demographics */}
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">{pt.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {pt.age}Y • {pt.gender} • <span className="font-mono">{pt.abhaId || 'No ABHA'}</span>
                      </p>
                    </div>

                    {/* Chief Complaint */}
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                        Chief Complaint
                      </span>
                      <p className="text-xs text-gray-800 font-medium line-clamp-2">
                        {typeof pt.chiefComplaint === 'object' ? pt.chiefComplaint.en : pt.chiefComplaint || 'General checkup'}
                      </p>
                    </div>

                    {/* Red Flag Alerts */}
                    {hasRedFlag && (
                      <div className="p-2.5 rounded-2xl bg-red-50 border border-red-200 space-y-1">
                        <span className="text-[10px] font-bold text-red-700 uppercase flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          Red Flag Alert
                        </span>
                        <p className="text-xs text-red-900 font-medium">
                          {pt.redFlags[0].message || pt.redFlags[0].keyword}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {pt.timeWaiting || 'Waiting'}
                    </span>

                    <button
                      onClick={() => navigate(`/doctor?patientId=${pt.id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold shadow-button-green hover:bg-brand-dark transition-all"
                    >
                      <span>Review Case</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
