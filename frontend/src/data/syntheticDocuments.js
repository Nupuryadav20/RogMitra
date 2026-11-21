/**
 * data/syntheticDocuments.js
 * ⚠️ DEMO / SYNTHETIC DATA — Simulated OCR-extracted lab documents.
 * All values are fabricated for demonstration purposes only.
 * 🔵 Doc-Extracted tag applied to all values.
 */

export const DEMO_BADGE = '⚠️ DEMO / SYNTHETIC DATA';
export const DOC_TAG = '🔵'; // Doc-extracted

/**
 * Helper: build a lab parameter entry
 */
function param(name, value, unit, refRange, isAbnormal, note = '') {
  return { parameter: name, value, unit, referenceRange: refRange, isAbnormal, note, _tag: DOC_TAG };
}

// ─────────────────────────────────────────────────────────────
// Document 1: Ananya Verma — CBC + ESR + CRP (DEMO-PT-001)
// ─────────────────────────────────────────────────────────────
export const doc_AV_CBC = {
  id: 'DEMO-DOC-001',
  patientId: 'DEMO-PT-001',
  patientName: 'Ananya Verma',
  _synthetic: true,
  _demoLabel: DEMO_BADGE,
  documentType: 'Lab Report',
  labName: 'SynthLab Diagnostics (Demo)',
  reportDate: '2026-11-14',
  ocrRawText: `SAMPLE MEDICAL DOCUMENT
Patient: Ananya Verma | Age/Sex: 28F
Date: Recent

NOTE: This is a prototype document slot. Real reports display extracted values only upon user upload.`,

  extractedValues: [],
    param('CRP', 24, 'mg/L', '<5', true, 'HIGH — elevated acute phase reactant'),
  ],

  abnormalSummary: {
    en: 'Sample uploaded medical document.',
    hi: 'नमूना अपलोड किया गया चिकित्सा दस्तावेज़।',
  },
};

// ─────────────────────────────────────────────────────────────
// Document 2: Rajan Mehra — Cardiac Markers + Lipids (DEMO-PT-002)
// ─────────────────────────────────────────────────────────────
export const doc_RM_Cardiac = {
  id: 'DEMO-DOC-002',
  patientId: 'DEMO-PT-002',
  patientName: 'Rajan Mehra',
  _synthetic: true,
  _demoLabel: DEMO_BADGE,
  documentType: 'Lab Report',
  labName: 'SynthLab Diagnostics (Demo)',
  reportDate: '2026-11-15',
  ocrRawText: `CARDIAC ENZYME PANEL & LIPID PROFILE
Patient: Rajan Mehra | Age/Sex: 55M | Ref. No: DEMO-002
Date: 15-Nov-2026 | URGENT

Troponin-I (hs)  0.42 ng/mL   [Ref: <0.04]    *** CRITICAL HIGH ***
CK-MB            28 U/L        [Ref: <25]       ** HIGH **
LDH              290 U/L       [Ref: 100-250]   * HIGH *
Blood Sugar (R)  218 mg/dL    [Ref: <140]      ** HIGH **
Creatinine       1.3 mg/dL    [Ref: 0.7-1.2]  * HIGH *
eGFR             62 ml/min    [Ref: >60]       Borderline
LDL Cholesterol  162 mg/dL    [Ref: <100]      ** HIGH **
HDL Cholesterol  38 mg/dL     [Ref: >40 (M)]   * LOW *
Total Cholesterol 242 mg/dL   [Ref: <200]      ** HIGH **
Triglycerides    198 mg/dL    [Ref: <150]      * HIGH *

NOTE: This is a SYNTHETIC DEMO report. Not for clinical use.`,

  extractedValues: [
    param('Troponin-I (hs)', 0.42, 'ng/mL', '<0.04', true, 'CRITICAL HIGH — myocardial injury marker'),
    param('CK-MB', 28, 'U/L', '<25', true, 'HIGH — elevated cardiac enzyme'),
    param('LDH', 290, 'U/L', '100–250', true, 'HIGH — tissue damage marker'),
    param('Blood Sugar (Random)', 218, 'mg/dL', '<140', true, 'HIGH — hyperglycaemia'),
    param('Creatinine', 1.3, 'mg/dL', '0.7–1.2', true, 'HIGH — borderline renal function'),
    param('eGFR', 62, 'mL/min/1.73m²', '>60', false, 'Borderline'),
    param('LDL Cholesterol', 162, 'mg/dL', '<100', true, 'HIGH — dyslipidaemia'),
    param('HDL Cholesterol', 38, 'mg/dL', '>40 (M)', true, 'LOW — reduced cardioprotective lipid'),
    param('Total Cholesterol', 242, 'mg/dL', '<200', true, 'HIGH'),
    param('Triglycerides', 198, 'mg/dL', '<150', true, 'HIGH'),
  ],

  abnormalSummary: {
    en: 'Critically elevated Troponin-I (0.42), elevated CK-MB, uncontrolled blood sugar (218), and dyslipidaemia. Findings consistent with acute myocardial injury in a high-risk patient.',
    hi: 'अत्यधिक ऊंचा ट्रोपोनिन-I (0.42), ऊंचा CK-MB, अनियंत्रित रक्त शर्करा (218), और डिस्लिपिडेमिया। उच्च-जोखिम रोगी में तीव्र मायोकार्डियल चोट के अनुरूप निष्कर्ष।',
  },

  _redFlagLinked: ['chest pain', 'breathlessness'],
};

// ─────────────────────────────────────────────────────────────
// Document 3: Rajan Mehra — ECG Report (Simulated text extraction)
// ─────────────────────────────────────────────────────────────
export const doc_RM_ECG = {
  id: 'DEMO-DOC-003',
  patientId: 'DEMO-PT-002',
  patientName: 'Rajan Mehra',
  _synthetic: true,
  _demoLabel: DEMO_BADGE,
  documentType: 'ECG Report',
  labName: 'SynthLab Diagnostics (Demo)',
  reportDate: '2026-11-15',
  ocrRawText: `12-LEAD ECG REPORT
Patient: Rajan Mehra | Age: 55M
Date: 15-Nov-2026 | Time: 09:35 AM

Rate: 110 bpm | Rhythm: Sinus Tachycardia
PR Interval: 180ms | QRS: 90ms | QTc: 440ms

Findings:
- ST elevation in leads II, III, aVF (1-2mm)
- Reciprocal ST depression V1-V3
- Q waves: Absent
- LVH pattern: Possible

IMPRESSION (DEMO — NOT CLINICAL):
Findings suggestive of inferior STEMI pattern.
Physician correlation mandatory.

NOTE: This is a SYNTHETIC DEMO report. Not for clinical use.`,

  extractedValues: [
    param('Heart Rate', 110, 'bpm', '60–100', true, 'HIGH — tachycardia'),
    param('PR Interval', 180, 'ms', '120–200', false, 'Normal'),
    param('QRS Duration', 90, 'ms', '70–100', false, 'Normal'),
    param('QTc', 440, 'ms', '<450', false, 'Normal'),
  ],

  ecgFindings: {
    rhythm: 'Sinus Tachycardia',
    stChanges: { en: 'ST elevation II, III, aVF — possible inferior injury pattern', hi: 'II, III, aVF में ST उन्नयन — संभावित अवर चोट पैटर्न' },
    impression: { en: 'DEMO ECG — physician correlation mandatory', hi: 'डेमो ECG — चिकित्सक सहसंबंध अनिवार्य' },
  },

  abnormalSummary: {
    en: 'Sinus tachycardia (110 bpm) with inferior ST elevation — consistent with inferior STEMI pattern. DEMO ONLY.',
    hi: 'अवर ST उन्नयन के साथ साइनस टैकीकार्डिया (110 bpm) — अवर STEMI पैटर्न के अनुरूप। केवल डेमो।',
  },
};

// ─────────────────────────────────────────────────────────────
// Document 4: Priya Sharma — Thyroid + Vitamins (DEMO-PT-003)
// ─────────────────────────────────────────────────────────────
export const doc_PS_Thyroid = {
  id: 'DEMO-DOC-004',
  patientId: 'DEMO-PT-003',
  patientName: 'Priya Sharma',
  _synthetic: true,
  _demoLabel: DEMO_BADGE,
  documentType: 'Lab Report',
  labName: 'SynthLab Diagnostics (Demo)',
  reportDate: '2026-11-10',
  ocrRawText: `THYROID FUNCTION + MICRONUTRIENT PANEL
Patient: Priya Sharma | Age/Sex: 34F | Ref. No: DEMO-004
Date: 10-Nov-2026

TSH           3.8 mIU/L   [Ref: 0.4-4.0]  Normal
Free T4       1.1 ng/dL   [Ref: 0.8-1.8]  Normal
Hemoglobin    11.8 g/dL   [Ref: 12-15]    * LOW *
Ferritin      12 ng/mL    [Ref: 12-150]   Borderline
Vitamin D     18 ng/mL    [Ref: >30]      ** LOW **
Vitamin B12   210 pg/mL   [Ref: 200-900]  Borderline Low

NOTE: This is a SYNTHETIC DEMO report. Not for clinical use.`,

  extractedValues: [
    param('TSH', 3.8, 'mIU/L', '0.4–4.0', false, 'Normal'),
    param('Free T4', 1.1, 'ng/dL', '0.8–1.8', false, 'Normal'),
    param('Hemoglobin', 11.8, 'g/dL', '12–15 (F)', true, 'LOW — mild anaemia'),
    param('Ferritin', 12, 'ng/mL', '12–150', false, 'Borderline — lower end of normal'),
    param('Vitamin D', 18, 'ng/mL', '>30', true, 'LOW — Vitamin D insufficiency'),
    param('Vitamin B12', 210, 'pg/mL', '200–900', false, 'Borderline low'),
  ],

  abnormalSummary: {
    en: 'Mild anaemia (Hb 11.8), Vitamin D insufficiency (18 ng/mL), borderline ferritin and B12. Thyroid function normal.',
    hi: 'हल्का एनीमिया (Hb 11.8), विटामिन D की कमी (18 ng/mL), सीमारेखा फेरिटिन और B12। थायरॉइड कार्य सामान्य।',
  },
};

/**
 * All synthetic documents indexed by patient ID.
 * ⚠️ DEMO / SYNTHETIC DATA
 */
export const syntheticDocuments = [
  doc_AV_CBC,
  doc_RM_Cardiac,
  doc_RM_ECG,
  doc_PS_Thyroid,
];

export const SYNTHETIC_DOCUMENTS = syntheticDocuments;

export const documentsByPatient = {
  'DEMO-PT-001': [doc_AV_CBC],
  'DEMO-PT-002': [doc_RM_Cardiac, doc_RM_ECG],
  'DEMO-PT-003': [doc_PS_Thyroid],
};

export default syntheticDocuments;
