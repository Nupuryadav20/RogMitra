// dialogueFlow.js — SOCRATES clinical history taking flow
// Structured pre-consultation questions in English and Hindi with voice and touch options

export const DIALOGUE_STEPS = [
  { id: 'symptoms', labelEn: 'Symptoms', labelHi: 'लक्षण' },
  { id: 'history', labelEn: 'History', labelHi: 'इतिहास' },
  { id: 'lifestyle', labelEn: 'Lifestyle', labelHi: 'जीवनशैली' },
  { id: 'review', labelEn: 'Review', labelHi: 'समीक्षा' }
];

export const INITIAL_QUESTIONS = [
  {
    id: 'chief_complaint',
    step: 'symptoms',
    field: 'chief_complaint',
    questionEn: 'Tell me about your current health problem. What brings you to the hospital today?',
    questionHi: 'कृपया अपनी वर्तमान स्वास्थ्य समस्या के बारे में बताएं। आज अस्पताल आने का मुख्य कारण क्या है?',
    exampleChips: [
      { en: 'I have a headache since 3 days', hi: 'मुझे 3 दिनों से सिरदर्द है' },
      { en: 'I feel fever and body pain', hi: 'मुझे बुखार और शरीर में दर्द महसूस हो रहा है' },
      { en: 'I have cough and throat irritation', hi: 'मुझे खांसी और गले में खराश है' },
      { en: 'I have stomach ache and nausea', hi: 'मुझे पेट में दर्द और जी मिचलाना है' }
    ],
    touchOptions: [
      { value: 'Headache', labelEn: 'Headache', labelHi: 'सिरदर्द' },
      { value: 'Fever', labelEn: 'Fever / Chills', labelHi: 'बुखार / ठंड लगना' },
      { value: 'Cough', labelEn: 'Cough / Cold', labelHi: 'खांसी / जुकाम' },
      { value: 'Chest Pain', labelEn: 'Chest Pain / Discomfort', labelHi: 'छाती में दर्द' },
      { value: 'Stomach Pain', labelEn: 'Abdominal / Stomach Pain', labelHi: 'पेट दर्द' },
      { value: 'Joint Pain', labelEn: 'Joint / Body Pain', labelHi: 'जोड़ों / शरीर में दर्द' }
    ]
  },
  {
    id: 'socrates_onset',
    step: 'symptoms',
    field: 'onset_duration',
    questionEn: 'How long have you had this issue, and did it start suddenly or gradually?',
    questionHi: 'यह समस्या आपको कितने समय से है, और क्या यह अचानक शुरू हुई या धीरे-धीरे?',
    exampleChips: [
      { en: 'Started suddenly this morning', hi: 'आज सुबह अचानक शुरू हुआ' },
      { en: 'Gradually worsening over 3-4 days', hi: '3-4 दिनों में धीरे-धीरे बढ़ रहा है' },
      { en: 'Been there for over 2 weeks', hi: '2 सप्ताह से अधिक समय से है' }
    ],
    touchOptions: [
      { value: 'Less than 24 hours', labelEn: '< 24 Hours (Sudden)', labelHi: '24 घंटे से कम (अचानक)' },
      { value: '2-3 days', labelEn: '2-3 Days', labelHi: '2-3 दिन' },
      { value: '1-2 weeks', labelEn: '1-2 Weeks', labelHi: '1-2 सप्ताह' },
      { value: 'More than a month', labelEn: '> 1 Month (Chronic)', labelHi: '1 महीने से अधिक' }
    ]
  },
  {
    id: 'socrates_character',
    step: 'symptoms',
    field: 'character',
    questionEn: 'How would you describe the sensation or pain (e.g. throbbing, sharp, dull, burning)?',
    questionHi: 'आप इस दर्द या परेशानी को कैसे बताएंगे (जैसे धड़कता हुआ, तेज, हल्का, या जलन भरा)?',
    exampleChips: [
      { en: 'Throbbing and pulsing on one side', hi: 'एक तरफ धड़कता हुआ दर्द' },
      { en: 'Continuous dull ache', hi: 'लगातार हल्का दर्द' },
      { en: 'Sharp pain when moving', hi: 'हिलने-डुलने पर तेज दर्द' }
    ],
    touchOptions: [
      { value: 'Throbbing', labelEn: 'Throbbing / Pulsating', labelHi: 'धड़कता हुआ' },
      { value: 'Sharp / Stabbing', labelEn: 'Sharp / Stabbing', labelHi: 'तेज / चुभने वाला' },
      { value: 'Dull Ache', labelEn: 'Dull Continuous Ache', labelHi: 'लगातार हल्का दर्द' },
      { value: 'Burning', labelEn: 'Burning sensation', labelHi: 'जलन' }
    ]
  },
  {
    id: 'socrates_severity',
    step: 'symptoms',
    field: 'severity',
    questionEn: 'On a scale from 1 (mild) to 10 (unbearable), how severe is the discomfort right now?',
    questionHi: '1 (हल्का) से 10 (असहनीय) के पैमाने पर, अभी यह परेशानी कितनी गंभीर है?',
    exampleChips: [
      { en: 'Moderate, around 5 out of 10', hi: 'मध्यम, 10 में से लगभग 5' },
      { en: 'Severe, 8 out of 10, cannot work', hi: 'गंभीर, 10 में से 8, काम नहीं हो पा रहा' }
    ],
    touchOptions: [
      { value: 'Mild (1-3)', labelEn: 'Mild (1 - 3)', labelHi: 'हल्का (1 - 3)' },
      { value: 'Moderate (4-6)', labelEn: 'Moderate (4 - 6)', labelHi: 'मध्यम (4 - 6)' },
      { value: 'Severe (7-8)', labelEn: 'Severe (7 - 8)', labelHi: 'गंभीर (7 - 8)' },
      { value: 'Very Severe (9-10)', labelEn: 'Very Severe (9 - 10)', labelHi: 'अति गंभीर (9 - 10)' }
    ]
  },
  {
    id: 'socrates_associated',
    step: 'symptoms',
    field: 'associated_symptoms',
    questionEn: 'Are there any associated symptoms like fever, nausea, vomiting, dizziness, or vision changes?',
    questionHi: 'क्या इसके साथ बुखार, उल्टी, जी मिचलाना, चक्कर आना या धुंधला दिखना जैसे कोई अन्य लक्षण भी हैं?',
    exampleChips: [
      { en: 'Mild fever and body pain, no vomiting', hi: 'हल्का बुखार और बदन दर्द, कोई उल्टी नहीं' },
      { en: 'Feeling nauseous and dizzy', hi: 'जी मिचलाना और चक्कर आ रहे हैं' },
      { en: 'No other symptoms', hi: 'कोई अन्य लक्षण नहीं' }
    ],
    touchOptions: [
      { value: 'Fever', labelEn: 'Fever / Chills', labelHi: 'बुखार / ठंड' },
      { value: 'Nausea / Vomiting', labelEn: 'Nausea / Vomiting', labelHi: 'जी मिचलाना / उल्टी' },
      { value: 'Dizziness', labelEn: 'Dizziness / Weakness', labelHi: 'चक्कर / कमजोरी' },
      { value: 'None', labelEn: 'No other symptoms', labelHi: 'कोई अन्य लक्षण नहीं' }
    ]
  },
  {
    id: 'past_medical_history',
    step: 'history',
    field: 'past_medical',
    questionEn: 'Do you have any existing diagnosed conditions such as Diabetes, Hypertension, Asthma, or Thyroid disorder?',
    questionHi: 'क्या आपको पहले से कोई बीमारी है जैसे डायबिटीज (शुगर), हाई बीपी, दमा (अस्थमा) या थायरॉयड?',
    exampleChips: [
      { en: 'No known chronic conditions', hi: 'पहले से कोई बीमारी नहीं है' },
      { en: 'I have hypertension for 5 years', hi: 'मुझे 5 साल से हाई बीपी है' },
      { en: 'Type 2 diabetes under control', hi: 'टाइप 2 डायबिटीज नियंत्रित है' }
    ],
    touchOptions: [
      { value: 'None', labelEn: 'No Known Illness', labelHi: 'कोई पुरानी बीमारी नहीं' },
      { value: 'Hypertension', labelEn: 'Hypertension (High BP)', labelHi: 'हाई बीपी' },
      { value: 'Diabetes', labelEn: 'Diabetes (Sugar)', labelHi: 'डायबिटीज' },
      { value: 'Thyroid', labelEn: 'Thyroid Disorder', labelHi: 'थायरॉयड' },
      { value: 'Asthma', labelEn: 'Asthma / Respiratory', labelHi: 'दमा / सांस की बीमारी' }
    ]
  },
  {
    id: 'current_medications',
    step: 'history',
    field: 'medications',
    questionEn: 'Are you taking any regular medications, vitamins, or over-the-counter painkillers?',
    questionHi: 'क्या आप नियमित रूप से कोई दवाई, विटामिन या दर्द निवारक ले रहे हैं?',
    exampleChips: [
      { en: 'Not on regular medication', hi: 'नियमित कोई दवा नहीं ले रहे' },
      { en: 'Took paracetamol yesterday for pain', hi: 'कल दर्द के लिए पैरासिटामोल ली थी' },
      { en: 'Taking Telmisartan 40mg daily for BP', hi: 'बीपी के लिए रोज टेल्मिसार्टन 40mg ले रहे हैं' }
    ],
    touchOptions: [
      { value: 'No regular meds', labelEn: 'Not on regular medication', labelHi: 'कोई नियमित दवा नहीं' },
      { value: 'BP medication', labelEn: 'Blood Pressure medicine', labelHi: 'बीपी की दवा' },
      { value: 'Diabetes medication', labelEn: 'Diabetes / Insulin', labelHi: 'शुगर की दवा' },
      { value: 'Took OTC painkiller', labelEn: 'Took painkiller recently', labelHi: 'हाल ही में दर्द की गोली ली' }
    ]
  },
  {
    id: 'allergies',
    step: 'history',
    field: 'allergies',
    questionEn: 'Do you have any known allergies to medicines (like Penicillin, Sulfa) or food items?',
    questionHi: 'क्या आपको किसी दवा (जैसे पेनिसिलिन, सल्फा) या खाद्य पदार्थ से कोई एलर्जी है?',
    exampleChips: [
      { en: 'No known drug allergies (NKDA)', hi: 'किसी दवा से कोई एलर्जी नहीं है' },
      { en: 'Allergic to Penicillin (gets skin rash)', hi: 'पेनिसिलिन से एलर्जी है (चकत्ते होते हैं)' }
    ],
    touchOptions: [
      { value: 'No known allergies', labelEn: 'No Known Allergies (NKDA)', labelHi: 'कोई ज्ञात एलर्जी नहीं' },
      { value: 'Penicillin allergy', labelEn: 'Penicillin allergy', labelHi: 'पेनिसिलिन एलर्जी' },
      { value: 'Sulfa allergy', labelEn: 'Sulfa drugs allergy', labelHi: 'सल्फा दवा एलर्जी' },
      { value: 'Dust / Pollen', labelEn: 'Environmental / Dust', labelHi: 'धूल / मौसम एलर्जी' }
    ]
  },
  {
    id: 'lifestyle_habits',
    step: 'lifestyle',
    field: 'lifestyle',
    questionEn: 'Could you share briefly about your diet, sleep quality, and if you use tobacco or alcohol?',
    questionHi: 'क्या आप संक्षेप में अपने खान-पान, नींद और तंबाकू या शराब के उपयोग के बारे में बता सकते हैं?',
    exampleChips: [
      { en: 'Vegetarian diet, sleep is disturbed due to pain, non-smoker', hi: 'शाकाहारी भोजन, दर्द के कारण नींद खराब, धूम्रपान नहीं' },
      { en: 'Normal diet, 7 hours sleep, no tobacco or alcohol', hi: 'सामान्य आहार, 7 घंटे नींद, नशा नहीं' }
    ],
    touchOptions: [
      { value: 'Vegetarian, non-smoker', labelEn: 'Vegetarian, Non-smoker', labelHi: 'शाकाहारी, धूम्रपान नहीं' },
      { value: 'Non-vegetarian, non-smoker', labelEn: 'Non-vegetarian, Non-smoker', labelHi: 'मांसाहारी, धूम्रपान नहीं' },
      { value: 'Occasional smoker', labelEn: 'Occasional Smoker', labelHi: 'कभी-कभार धूम्रपान' },
      { value: 'Sleep disturbed', labelEn: 'Poor / Disturbed Sleep', labelHi: 'नींद में बाधा' }
    ]
  }
];
