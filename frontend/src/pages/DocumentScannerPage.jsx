// DocumentScannerPage.jsx — Screen 4: Medical Document Scan (OCR)
// Theme 3: Two-panel layout, upload dropzone, camera trigger, extracted key-value panel with abnormal flags, timeline
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UploadCloud, Camera, FileText, CheckCircle2, AlertCircle,
  Clock, Edit3, Save, Trash2, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import useAppStore from '../store/appStore';
import { documentApi } from '../services/api';

export default function DocumentScannerPage() {
  const { i18n } = useTranslation();
  const isHi = i18n.language?.startsWith('hi');
  const navigate = useNavigate();

  const { documents, addDocument } = useAppStore();

  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedFindings, setEditedFindings] = useState('');

  const activeDoc = documents[selectedDocIndex] || documents[0];

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const extracted = await documentApi.uploadDocument(file);
      addDocument(extracted);
      setSelectedDocIndex(0);
    } catch (err) {
      console.error('OCR Upload Error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {isHi ? 'चिकित्सा दस्तावेज़ स्कैन करें (OCR)' : 'Scan Medical Documents'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isHi
                ? 'पुरानी पर्ची, लैब रिपोर्ट और डिस्चार्ज सारांश को एआई ओसीआर से डिजिटाइज़ करें।'
                : 'Digitize prescriptions, lab reports & discharge summaries with automated extraction.'}
            </p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold self-start flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI OCR: Demo Mode (Regex / Rule Extractor)</span>
          </span>
        </div>

        {/* Two-Panel Layout (Matching Screen 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Upload or Scan Your Reports */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#E2EFE7] shadow-card space-y-5">
            <h3 className="text-lg font-bold text-gray-900">
              {isHi ? 'रिपोर्ट अपलोड या स्कैन करें' : 'Upload or Scan Your Reports'}
            </h3>

            {/* Dropzone Card with Dashed Border */}
            <div className="border-2 border-dashed border-mint-300 rounded-2xl p-6 sm:p-8 text-center bg-mint-50/50 hover:bg-mint-50 transition-colors relative">
              <input
                type="file"
                id="doc-file-input"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-white text-brand shadow-sm flex items-center justify-center mx-auto mb-3 border border-mint-200">
                <UploadCloud className="w-8 h-8 text-brand animate-pulse" />
              </div>

              <h4 className="font-bold text-gray-800 text-sm mb-1">
                {uploading ? (isHi ? 'दस्तावेज़ स्कैन हो रहा है...' : 'Scanning document...') : (isHi ? 'फ़ाइल यहाँ खींचें या चुनें' : 'Drag & drop file here')}
              </h4>
              <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                {isHi ? 'पर्चा, लैब रिपोर्ट, डिस्चार्ज सारांश, एक्स-रे आदि (PDF, JPG, PNG)' : 'Prescription, Lab Reports, Discharge Summary, X-ray, etc.'}
              </p>

              {/* Action Buttons: Choose File + Camera Trigger */}
              <div className="flex items-center justify-center gap-3">
                <label
                  htmlFor="doc-file-input"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-xs shadow-button-green cursor-pointer transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isHi ? 'फ़ाइल चुनें' : 'Choose File'}</span>
                </label>

                <label
                  htmlFor="doc-file-input"
                  className="p-2.5 rounded-xl border border-mint-300 bg-white hover:bg-mint-100 text-brand cursor-pointer transition-all shadow-sm"
                  title="Camera Capture"
                >
                  <Camera className="w-4 h-4" />
                </label>
              </div>
            </div>

            {/* Document Thumbnail Previews / Switcher */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {isHi ? 'अपलोड किए गए दस्तावेज़' : 'Uploaded Records'} ({documents.length})
              </span>
              <div className="space-y-2">
                {documents.map((doc, idx) => (
                  <button
                    key={doc.id || idx}
                    onClick={() => setSelectedDocIndex(idx)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedDocIndex === idx
                        ? 'bg-mint-100 border-brand text-gray-900 shadow-sm'
                        : 'bg-gray-50/50 hover:bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className={`w-4 h-4 shrink-0 ${selectedDocIndex === idx ? 'text-brand' : 'text-gray-400'}`} />
                      <div className="truncate">
                        <span className="font-semibold text-xs block truncate">{doc.reportType || doc.fileName}</span>
                        <span className="text-[10px] text-gray-400">{doc.date || 'Date: Recent'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-brand border border-mint-200">
                      View
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Extracted Information (AI OCR) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EFE7] shadow-card space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-mint-100 text-brand flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {isHi ? 'निकाली गई जानकारी (AI OCR)' : 'Extracted Information (AI OCR)'}
                  </h3>
                  <span className="text-[11px] text-gray-400">Deterministic key-value extraction</span>
                </div>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-brand text-xs font-semibold text-gray-700 hover:text-brand transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{editing ? (isHi ? 'रद्द करें' : 'Cancel') : (isHi ? 'सुधारें' : 'Edit')}</span>
              </button>
            </div>

            {/* Extracted Details Table */}
            {activeDoc ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Report Type
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{activeDoc.reportType || 'Lab Report'}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Date
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{activeDoc.date || '12 Oct 2026'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    Test(s) Mentioned
                  </span>
                  <span className="font-bold text-gray-900 text-sm">{activeDoc.tests || 'Complete Blood Count (CBC), ESR'}</span>
                </div>

                {/* Key Findings List with Abnormal Badges */}
                <div className="p-4 rounded-2xl bg-white border border-[#E2EFE7] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Key Findings & Values
                    </span>
                    <span className="text-[10px] text-gray-400">Values compared to reference ranges</span>
                  </div>

                  <div className="space-y-2">
                    {(activeDoc.findings || [
                      { test: 'Hemoglobin (Hb)', value: '11.2', unit: 'g/dL', status: 'Low', refRange: '12.0 - 15.5' },
                      { test: 'ESR (Westergren)', value: '28', unit: 'mm/hr', status: 'High', refRange: '0 - 20' }
                    ]).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-gray-900">{item.test}</span>
                          <span className="text-gray-500 text-[11px] ml-2">
                            Ref: {item.refRange} {item.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900">{item.value} {item.unit}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              item.status === 'High'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : item.status === 'Low'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw OCR Text Snippet */}
                {activeDoc.rawText && (
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Raw Digitized Text
                    </span>
                    <pre className="text-[11px] font-mono text-gray-600 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                      {activeDoc.rawText}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                No document selected. Please upload or choose a record.
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => navigate('/ayurveda')}
                className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-xs shadow-button-green transition-all flex items-center gap-2"
              >
                <span>{isHi ? 'आयुर्वेदिक इतिहास पर जाएं' : 'Proceed to Ayurvedic History'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
