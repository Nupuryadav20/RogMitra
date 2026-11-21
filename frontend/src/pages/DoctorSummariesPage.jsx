// DoctorSummariesPage.jsx — Clinical Summaries Directory for Doctors
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList, Search, CheckCircle2, XCircle, Clock,
  ArrowRight, RefreshCw, FileText
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import { doctorApi } from '../services/api';

export default function DoctorSummariesPage() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'draft' | 'approved' | 'rejected'

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await doctorApi.getQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = queue.filter((item) => {
    const q = search.toLowerCase();
    const match =
      (item.name || '').toLowerCase().includes(q) ||
      (item.tokenNumber || '').toLowerCase().includes(q) ||
      (item.chiefComplaint || '').toLowerCase().includes(q);

    if (!match) return false;

    if (statusFilter === 'approved') return item.summaryStatus === 'approved' || item.status === 'reviewed';
    if (statusFilter === 'rejected') return item.summaryStatus === 'rejected' || item.status === 'rejected';
    if (statusFilter === 'draft') return item.summaryStatus !== 'approved' && item.summaryStatus !== 'rejected';
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-brand" />
              <span>{isHi ? 'रोगी सारांश समीक्षा' : 'Patient Clinical Summaries'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Review and sign off pre-consultation SOAP intake summaries prepared by AI.
            </p>
          </div>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:text-brand shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E2EFE7] shadow-card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name or complaints..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          <div className="flex gap-1.5 p-1 bg-gray-50 rounded-2xl border border-gray-100">
            {[
              { id: 'all', label: 'All Summaries' },
              { id: 'draft', label: 'Draft (Pending)' },
              { id: 'approved', label: '✓ Approved' },
              { id: 'rejected', label: '✗ Rejected' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === f.id
                    ? 'bg-brand text-white shadow-button-green'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E2EFE7]">
            <RefreshCw className="w-8 h-8 text-brand animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading summaries...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E2EFE7] space-y-2">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No summaries match your filter</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E2EFE7] shadow-card overflow-hidden divide-y divide-gray-100">
            {filtered.map((pt) => {
              const isApproved = pt.summaryStatus === 'approved' || pt.status === 'reviewed';
              const isRejected = pt.summaryStatus === 'rejected';

              return (
                <div key={pt.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-gray-900 text-sm">{pt.name}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {pt.tokenNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isRejected
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {isApproved ? '✓ APPROVED' : isRejected ? '✗ REJECTED' : 'AI DRAFT (Unapproved)'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 font-medium">
                      Complaint: {typeof pt.chiefComplaint === 'object' ? pt.chiefComplaint.en : pt.chiefComplaint}
                    </p>

                    <p className="text-[11px] text-gray-400">
                      Age: {pt.age}Y • Gender: {pt.gender} • ABHA: <span className="font-mono">{pt.abhaId || 'None'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => navigate(`/summary?patientId=${pt.id}`)}
                      className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      View Summary
                    </button>
                    <button
                      onClick={() => navigate(`/doctor?patientId=${pt.id}`)}
                      className="px-4 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold shadow-button-green hover:bg-brand-dark transition-all flex items-center gap-1.5"
                    >
                      <span>Review in OPD</span>
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
