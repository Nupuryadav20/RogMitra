/**
 * data/syntheticPatients.js
 * ⚠️ DEMO / SYNTHETIC DATA — NOT real patient records.
 * Three demo patients for RogMitra frontend demonstration.
 */

export const DEMO_BADGE = '⚠️ DEMO / SYNTHETIC DATA';

/**
 * Patient 1: Ananya Verma — 28F, Headache + Fever + Elevated ESR
 */
export const ananyaVerma = {
  id: 'DEMO-PT-001',
  name: 'Ananya Verma',
  nameHi: 'अनन्या वर्मा',
  age: 28,
  gender: 'Female',
  genderHi: 'महिला',
  dob: '1996-04-12',
  abhaId: 'ABHA-MOCK-AV28F',      // MOCK — ABHA demo only
  phone: '+91-9800000001',
  address: 'B-14, Lajpat Nagar, New Delhi',
  language: 'hi',
  _synthetic: true,
  _demoLabel: DEMO_BADGE,

  chiefComplaint: {
    en: 'Persistent headache and fever for 5 days',
    hi: 'पाँच दिनों से लगातार सिरदर्द और बुखार',
  },

  vitals: {
    temperature_C: 38.6,
    pulse_bpm: 92,
    bp_mmHg: '118/76',
    spo2_percent: 98,
    rr_per_min: 18,
    weight_kg: 54,
    height_cm: 160,
    bmi: 21.1,
  },

  socrates: {
    site: { en: 'Frontal and temporal regions, bilateral', hi: 'माथे और कनपटी के दोनों तरफ' },
    onset: { en: '5 days ago, gradual', hi: '5 दिन पहले, धीरे-धीरे' },
    character: { en: 'Dull, throbbing', hi: 'हल्का, धड़कता हुआ' },
    radiation: { en: 'None', hi: 'कोई नहीं' },
    associations: { en: 'Fever, body ache, mild nausea, photophobia', hi: 'बुखार, शरीर दर्द, हल्की मतली, रोशनी से तकलीफ' },
    timeCourse: { en: 'Continuous, worse in the morning', hi: 'लगातार, सुबह बदतर' },
    exacerbating: { en: 'Worsened by light and noise; relieved slightly by rest', hi: 'रोशनी और शोर से बढ़ता है; आराम से थोड़ा कम होता है' },
    severity: 6,
  },

  history: {
    pastMedical: { en: 'No significant past history', hi: 'कोई महत्वपूर्ण इतिहास नहीं' },
    family: { en: 'Mother has hypertension', hi: 'माँ को उच्च रक्तचाप है' },
    medications: { en: 'Paracetamol 500mg SOS (self-medicated)', hi: 'पैरासिटामोल 500mg ज़रूरत पर (स्वयं ली)' },
    allergies: { en: 'None known', hi: 'कोई ज्ञात नहीं' },
    surgical: { en: 'None', hi: 'कोई नहीं' },
    social: { en: 'Non-smoker, non-drinker, vegetarian, software engineer', hi: 'धूम्रपान नहीं, शराब नहीं, शाकाहारी, सॉफ़्टवेयर इंजीनियर' },
  },

  labResults: [],

  aiDraftObservation: {
    _tag: '🟡',
    _disclaimer: 'AI Draft Observations (for physician review) — NOT a diagnosis',
    text: {
      en: 'Patient presents with 5-day history of bilateral frontal headache and low-grade fever. Reported acute febrile symptoms. Kindly correlate clinically.',
      hi: 'रोगी को 5 दिनों से द्विपक्षीय ललाट सिरदर्द और हल्का बुखार है। रिपोर्ट किए गए तीव्र ज्वर लक्षण। कृपया चिकित्सकीय रूप से सहसंबंधित करें।',
    },
  },

  redFlags: [],
  sessionStatus: 'in_progress',
  consentGiven: true,
};

/**
 * Patient 2: Rajan Mehra — 55M, Chest Pain RED FLAG
 */
export const rajanMehra = {
  id: 'DEMO-PT-002',
  name: 'Rajan Mehra',
  nameHi: 'राजन मेहरा',
  age: 55,
  gender: 'Male',
  genderHi: 'पुरुष',
  dob: '1969-08-23',
  abhaId: 'ABHA-MOCK-RM55M',
  phone: '+91-9800000002',
  address: '22, Civil Lines, Lucknow, UP',
  language: 'hi',
  _synthetic: true,
  _demoLabel: DEMO_BADGE,

  chiefComplaint: {
    en: 'Severe chest pain radiating to left arm, with breathlessness — started 2 hours ago',
    hi: 'बाएं हाथ तक फैलने वाला तेज़ छाती दर्द, साथ में सांस की तकलीफ — 2 घंटे पहले शुरू हुआ',
  },

  vitals: {
    temperature_C: 37.1,
    pulse_bpm: 110,
    bp_mmHg: '160/95',
    spo2_percent: 94,
    rr_per_min: 24,
    weight_kg: 82,
    height_cm: 172,
    bmi: 27.7,
  },

  socrates: {
    site: { en: 'Central chest, behind sternum', hi: 'छाती के बीच में, उरोस्थि के पीछे' },
    onset: { en: 'Sudden, 2 hours ago while climbing stairs', hi: 'अचानक, 2 घंटे पहले सीढ़ी चढ़ते समय' },
    character: { en: 'Crushing, pressure-like, 9/10', hi: 'दबाने वाला, 9/10' },
    radiation: { en: 'Left arm and jaw', hi: 'बाएं हाथ और जबड़े तक' },
    associations: { en: 'Breathlessness, sweating, nausea, dizziness', hi: 'सांस की तकलीफ, पसीना, मतली, चक्कर' },
    timeCourse: { en: 'Constant since onset, not improving', hi: 'शुरू से लगातार, कोई सुधार नहीं' },
    exacerbating: { en: 'Worse on exertion; no relief at rest', hi: 'परिश्रम से बढ़ता है; आराम से भी राहत नहीं' },
    severity: 9,
  },

  history: {
    pastMedical: { en: 'Hypertension (10 years), Type 2 Diabetes (5 years)', hi: 'उच्च रक्तचाप (10 वर्ष), टाइप 2 मधुमेह (5 वर्ष)' },
    family: { en: 'Father died of heart attack at age 60', hi: 'पिताजी की 60 वर्ष की आयु में दिल का दौरा पड़ने से मृत्यु' },
    medications: { en: 'Amlodipine 5mg, Metformin 500mg, Aspirin 75mg', hi: 'अम्लोडिपिन 5mg, मेटफॉर्मिन 500mg, एस्पिरिन 75mg' },
    allergies: { en: 'Penicillin (rash)', hi: 'पेनिसिलिन (रैश)' },
    surgical: { en: 'Appendectomy 2001', hi: 'अपेंडेक्टॉमी 2001' },
    social: { en: 'Smoker (20 pack-years, quit 2 years ago), occasional alcohol, sedentary lifestyle', hi: 'धूम्रपान (20 पैक-वर्ष, 2 साल पहले छोड़ा), कभी-कभी शराब, बैठे रहने की जीवनशैली' },
  },

  labResults: [],

  aiDraftObservation: {
    _tag: '🟡',
    _disclaimer: 'AI Draft Observations (for physician review) — NOT a diagnosis',
    text: {
      en: 'Patient presents with acute severe chest pain radiating to left arm with diaphoresis and breathlessness in a diabetic and hypertensive individual. Immediate emergency physician evaluation advised.',
      hi: 'मधुमेह और उच्च रक्तचाप वाले व्यक्ति में पसीना और सांस की तकलीफ के साथ बाएं हाथ तक फैलने वाला तीव्र सीने में दर्द। तत्काल आपातकालीन चिकित्सक मूल्यांकन की सलाह।',
    },
  },

  redFlags: [
    {
      keyword: 'chest pain',
      keywordHi: 'छाती में दर्द',
      severity: 'critical',
      message_en: 'Chest pain may indicate cardiac or pulmonary emergency. Immediate evaluation required.',
      message_hi: 'छाती में दर्द हृदय या फुफ्फुसीय आपातकाल का संकेत हो सकता है। तत्काल मूल्यांकन आवश्यक।',
    },
    {
      keyword: 'breathlessness',
      keywordHi: 'सांस की तकलीफ',
      severity: 'critical',
      message_en: 'Severe breathlessness may indicate respiratory or cardiac emergency.',
      message_hi: 'गंभीर सांस की तकलीफ श्वसन या हृदय आपातकाल का संकेत हो सकती है।',
    },
  ],

  sessionStatus: 'red_flag',
  consentGiven: true,
};

/**
 * Patient 3: Priya Sharma — 34F, Ayurvedic Profile
 */
export const priyaSharma = {
  id: 'DEMO-PT-003',
  name: 'Priya Sharma',
  nameHi: 'प्रिया शर्मा',
  age: 34,
  gender: 'Female',
  genderHi: 'महिला',
  dob: '1990-11-05',
  abhaId: 'ABHA-MOCK-PS34F',
  phone: '+91-9800000003',
  address: '7, Tagore Garden, Jaipur, Rajasthan',
  language: 'hi',
  _synthetic: true,
  _demoLabel: DEMO_BADGE,

  chiefComplaint: {
    en: 'Chronic fatigue, digestive issues, irregular sleep — seeking Ayurvedic assessment',
    hi: 'पुरानी थकान, पाचन समस्याएं, अनियमित नींद — आयुर्वेदिक आकलन चाहती हैं',
  },

  vitals: {
    temperature_C: 36.8,
    pulse_bpm: 72,
    bp_mmHg: '110/70',
    spo2_percent: 99,
    rr_per_min: 16,
    weight_kg: 58,
    height_cm: 162,
    bmi: 22.1,
  },

  socrates: {
    site: { en: 'Generalised fatigue; abdominal discomfort', hi: 'सामान्य थकान; पेट में तकलीफ' },
    onset: { en: 'Gradual over 6 months', hi: '6 महीने में धीरे-धीरे' },
    character: { en: 'Constant low energy, bloating after meals', hi: 'लगातार कम ऊर्जा, खाने के बाद पेट फूलना' },
    radiation: { en: 'None', hi: 'कोई नहीं' },
    associations: { en: 'Irregular bowel, disturbed sleep, mild anxiety', hi: 'अनियमित मल, नींद में गड़बड़ी, हल्की चिंता' },
    timeCourse: { en: 'Worse in autumn and winter', hi: 'शरद और शीत में बदतर' },
    exacerbating: { en: 'Spicy or cold food worsens; warm food and yoga help', hi: 'मसालेदार या ठंडा खाना बदतर बनाता है; गर्म खाना और योग मदद करते हैं' },
    severity: 4,
  },

  history: {
    pastMedical: { en: 'Irritable Bowel Syndrome (diagnosed 2021)', hi: 'इरिटेबल बोवेल सिंड्रोम (2021 में निदान)' },
    family: { en: 'Mother has hypothyroidism', hi: 'माँ को हाइपोथायरायडिज़्म है' },
    medications: { en: 'No current allopathic medication', hi: 'वर्तमान में कोई एलोपैथिक दवा नहीं' },
    allergies: { en: 'Dust (rhinitis)', hi: 'धूल (राइनाइटिस)' },
    surgical: { en: 'None', hi: 'कोई नहीं' },
    social: { en: 'Non-smoker, non-drinker, vegetarian, yoga practitioner, teacher', hi: 'धूम्रपान नहीं, शराब नहीं, शाकाहारी, योगाभ्यासी, अध्यापक' },
  },

  labResults: [],

  ayurvedaProfile: {
    _prototype: true,
    _disclaimer: 'Ayurvedic assessment is a JSON prototype — NOT a clinical recommendation.',
    prakriti: { dominant: 'Vata', secondary: 'Pitta', en: 'Vata-Pitta constitution', hi: 'वात-पित्त प्रकृति' },
    vikriti: { en: 'Vata aggravation — dryness, irregular digestion, poor sleep', hi: 'वात वृद्धि — रूखापन, अनियमित पाचन, कमज़ोर नींद' },
    agni: { type: 'Vishama', en: 'Irregular digestive fire', hi: 'विषम अग्नि — अनियमित पाचन' },
    koshta: { type: 'Krura', en: 'Hard bowel tendency', hi: 'क्रूर कोष्ठ — कठोर मल प्रवृत्ति' },
    scores: { vata: 72, pitta: 58, kapha: 30 },
  },

  redFlags: [],
  sessionStatus: 'summary_ready',
  consentGiven: true,
};

/**
 * All synthetic demo patients as an array.
 * ⚠️ DEMO / SYNTHETIC DATA
 */
export const syntheticPatients = [ananyaVerma, rajanMehra, priyaSharma];
export const SYNTHETIC_PATIENTS = syntheticPatients;

export default syntheticPatients;
