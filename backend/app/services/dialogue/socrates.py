# backend/app/services/dialogue/socrates.py
# Deterministic bilingual SOCRATES question bank and systemic review flow
from typing import Dict, Any, List, Optional

# The FIRST question is non-negotiable per Rule 1:
FIRST_QUESTION = {
    "id": "chief_complaint",
    "field": "chief_complaint",
    "step": "symptoms",
    "questionEn": "What health problem are you facing today? Please describe it in your own words.",
    "questionHi": "आज आप किस स्वास्थ्य समस्या का सामना कर रहे हैं? कृपया इसे अपने शब्दों में बताएं।",
    "questionSource": "rule-based",
    "badge": "Standard Question",
    "exampleChips": [
        {"en": "I have a headache since 2 days and fever", "hi": "मुझे 2 दिन से सिरदर्द और बुखार है"},
        {"en": "I have chest discomfort since morning", "hi": "मुझे आज सुबह से छाती में भारीपन है"},
        {"en": "Stomach pain and vomiting since yesterday", "hi": "कल से पेट दर्द और उल्टी हो रही है"},
        {"en": "Severe cough and sore throat for 3 days", "hi": "3 दिनों से तेज खांसी और गले में खराश है"}
    ],
    "touchOptions": [
        {"value": "Headache", "labelEn": "Headache", "labelHi": "सिरदर्द"},
        {"value": "Fever", "labelEn": "Fever & Chills", "labelHi": "बुखार और ठंड"},
        {"value": "Cough & Cold", "labelEn": "Cough & Cold", "labelHi": "खांसी और जुकाम"},
        {"value": "Chest Discomfort", "labelEn": "Chest Discomfort", "labelHi": "छाती में दर्द"},
        {"value": "Stomach Pain", "labelEn": "Stomach / Abdominal Pain", "labelHi": "पेट दर्द"},
        {"value": "Joint Pain", "labelEn": "Joint & Body Pain", "labelHi": "जोड़ों व बदन दर्द"},
        {"value": "Breathlessness", "labelEn": "Breathlessness", "labelHi": "सांस फूलना"},
        {"value": "Nausea / Vomiting", "labelEn": "Nausea / Vomiting", "labelHi": "उल्टी / जी मिचलाना"}
    ]
}

# Symptom-specific SOCRATES definitions
SOCRATES_QUESTIONS_MAP: Dict[str, Dict[str, Dict[str, Any]]] = {
    "headache": {
        "site": {
            "id": "socrates_site",
            "field": "site",
            "step": "symptoms",
            "questionEn": "Where exactly is the headache located (e.g. forehead, temples/one side, or back of head)?",
            "questionHi": "सिर में दर्द किस जगह पर ज्यादा है (जैसे माथे पर, एक तरफ, या सिर के पीछे)?",
            "exampleChips": [
                {"en": "Forehead and behind eyes", "hi": "माथे पर और आँखों के पीछे"},
                {"en": "One side of head (throbbing)", "hi": "सिर के एक तरफ धड़कता हुआ"},
                {"en": "Back of head and neck", "hi": "सिर के पीछे और गर्दन में"}
            ],
            "touchOptions": [
                {"value": "Forehead", "labelEn": "Forehead / Frontal", "labelHi": "माथा"},
                {"value": "One Side (Temples)", "labelEn": "One Side / Temples", "labelHi": "एक तरफ (कनपटी)"},
                {"value": "Back of Head", "labelEn": "Back of Head (Occipital)", "labelHi": "सिर के पीछे"},
                {"value": "Entire Head", "labelEn": "All over the head", "labelHi": "पूरे सिर में"}
            ]
        },
        "character": {
            "id": "socrates_character",
            "field": "character",
            "step": "symptoms",
            "questionEn": "How does the pain feel (e.g. throbbing/pulsing, dull heavy ache, sharp stabbing)?",
            "questionHi": "दर्द का अहसास कैसा है (जैसे धड़कता हुआ, लगातार भारीपन, या तेज चुभने वाला)?",
            "exampleChips": [
                {"en": "Throbbing pulse like a heartbeat", "hi": "धड़कता हुआ जैसे दिल धड़कता है"},
                {"en": "Continuous dull heavy pressure", "hi": "लगातार भारीपन और दबाव"},
                {"en": "Sharp shooting sensation", "hi": "तेज चुभने वाला दर्द"}
            ],
            "touchOptions": [
                {"value": "Throbbing", "labelEn": "Throbbing / Pulsating", "labelHi": "धड़कता हुआ"},
                {"value": "Dull Ache", "labelEn": "Dull Heavy Pressure", "labelHi": "भारीपन / मंद दर्द"},
                {"value": "Sharp", "labelEn": "Sharp / Stabbing", "labelHi": "तेज / चुभने वाला"},
                {"value": "Tight Band", "labelEn": "Tight band around head", "labelHi": "सिर पर कसाव"}
            ]
        },
        "radiation": {
            "id": "socrates_radiation",
            "field": "radiation",
            "step": "symptoms",
            "questionEn": "Does the headache spread or radiate anywhere else, like to your neck, eyes, or shoulders?",
            "questionHi": "क्या यह दर्द सिर से आँखों, गर्दन या कंधों तक फैलता है?",
            "exampleChips": [
                {"en": "Radiates down the neck", "hi": "गर्दन की तरफ जाता है"},
                {"en": "Spreads into the left eye", "hi": "बाईं आँख की तरफ फैलता है"},
                {"en": "Stays in one place", "hi": "सिर्फ सिर में रहता है, कहीं नहीं फैलता"}
            ],
            "touchOptions": [
                {"value": "To Eyes", "labelEn": "Spreads to Eyes", "labelHi": "आँखों में फैलता है"},
                {"value": "To Neck", "labelEn": "Spreads to Neck", "labelHi": "गर्दन तक जाता है"},
                {"value": "To Shoulders", "labelEn": "Spreads to Shoulders", "labelHi": "कंधों तक जाता है"},
                {"value": "No Spread", "labelEn": "Does not spread", "labelHi" : "कहीं नहीं फैलता"}
            ]
        },
        "associations": {
            "id": "socrates_associated",
            "field": "associated_symptoms",
            "step": "symptoms",
            "questionEn": "Do you notice any nausea, sensitivity to bright light or loud sounds, or blurred vision?",
            "questionHi": "क्या आपको जी मिचलाना, उल्टी, तेज रोशनी या शोर से परेशानी, या धुंधला दिखना जैसा कुछ हो रहा है?",
            "exampleChips": [
                {"en": "Bright light hurts eyes, mild nausea", "hi": "तेज रोशनी से परेशानी और हल्का जी मिचलाना"},
                {"en": "Feeling dizzy and weak", "hi": "चक्कर और कमजोरी महसूस हो रही है"},
                {"en": "No other symptoms", "hi": "कोई अन्य लक्षण नहीं है"}
            ],
            "touchOptions": [
                {"value": "Light Sensitivity", "labelEn": "Sensitivity to Light", "labelHi": "रोशनी से परेशानी"},
                {"value": "Nausea", "labelEn": "Nausea / Giddiness", "labelHi": "जी मिचलाना"},
                {"value": "Sound Sensitivity", "labelEn": "Sensitivity to Noise", "labelHi": "शोर से परेशानी"},
                {"value": "None", "labelEn": "No other symptoms", "labelHi": "कोई अन्य समस्या नहीं"}
            ]
        },
        "time_course": {
            "id": "socrates_timing",
            "field": "time_course",
            "step": "symptoms",
            "questionEn": "Is the headache continuous all day, or does it come and go in episodes?",
            "questionHi": "क्या सिरदर्द दिन भर लगातार बना रहता है, या बीच-बीच में कम और ज्यादा होता है?",
            "exampleChips": [
                {"en": "Continuous throughout the day", "hi": "दिन भर लगातार बना रहता है"},
                {"en": "Comes and goes in attacks", "hi": "रुक-रुक कर आता है"},
                {"en": "Worse in the morning", "hi": "सुबह उठने पर ज्यादा रहता है"}
            ],
            "touchOptions": [
                {"value": "Continuous", "labelEn": "Continuous / Constant", "labelHi": "लगातार"},
                {"value": "Intermittent", "labelEn": "Comes and Goes", "labelHi": "रुक-रुक कर"},
                {"value": "Morning Peak", "labelEn": "Worse in Morning", "labelHi": "सुबह ज्यादा"},
                {"value": "Evening Peak", "labelEn": "Worse in Evening", "labelHi": "शाम को ज्यादा"}
            ]
        },
        "exacerbating_relieving": {
            "id": "socrates_exacerbating",
            "field": "exacerbating_relieving",
            "step": "symptoms",
            "questionEn": "Does anything make the pain better or worse (like rest, dark room, coughing, or bending)?",
            "questionHi": "क्या किसी चीज़ से दर्द बढ़ता या घटता है (जैसे आराम करने से, अंधेरे कमरे में लेटने से या झुकने से)?",
            "exampleChips": [
                {"en": "Lying in dark room helps", "hi": "अंधेरे कमरे में लेटने से आराम मिलता है"},
                {"en": "Bending forward makes it worse", "hi": "आगे झुकने से दर्द बढ़ जाता है"},
                {"en": "No change with anything", "hi": "किसी चीज़ से कोई फर्क नहीं पड़ता"}
            ],
            "touchOptions": [
                {"value": "Better with Rest", "labelEn": "Relieved by Rest / Dark", "labelHi": "आराम / अंधेरे से राहत"},
                {"value": "Worse with Bending", "labelEn": "Worse with Bending / Strain", "labelHi": "झुकने या खांसने से बढ़ता है"},
                {"value": "Better with Paracetamol", "labelEn": "Better with Paracetamol", "labelHi": "गोली लेने पर आराम"},
                {"value": "No Change", "labelEn": "Nothing changes it", "labelHi": "कोई असर नहीं"}
            ]
        },
        "severity": {
            "id": "socrates_severity",
            "field": "severity",
            "step": "symptoms",
            "questionEn": "On a scale from 1 (mild) to 10 (unbearable), how severe is the discomfort right now?",
            "questionHi": "1 (हल्का) से 10 (असहनीय) के पैमाने पर, अभी यह परेशानी कितनी गंभीर है?",
            "exampleChips": [
                {"en": "Moderate, around 5/10", "hi": "मध्यम, लगभग 5/10"},
                {"en": "Severe, 8/10, cannot do normal work", "hi": "तेज, 8/10, काम नहीं हो पा रहा"}
            ],
            "touchOptions": [
                {"value": "Mild (1-3)", "labelEn": "Mild (1 - 3)", "labelHi": "हल्का (1 - 3)"},
                {"value": "Moderate (4-6)", "labelEn": "Moderate (4 - 6)", "labelHi": "मध्यम (4 - 6)"},
                {"value": "Severe (7-8)", "labelEn": "Severe (7 - 8)", "labelHi": "गंभीर (7 - 8)"},
                {"value": "Very Severe (9-10)", "labelEn": "Very Severe (9 - 10)", "labelHi": "अति गंभीर (9 - 10)"}
            ]
        }
    },
    "fever": {
        "onset": {
            "id": "fever_onset",
            "field": "onset_duration",
            "step": "symptoms",
            "questionEn": "When did the fever start, and did it come on suddenly or gradually?",
            "questionHi": "बुखार कब शुरू हुआ, और क्या यह अचानक आया या धीरे-धीरे बढ़ा?",
            "exampleChips": [
                {"en": "Started suddenly yesterday", "hi": "कल अचानक शुरू हुआ"},
                {"en": "Gradual low fever for 3 days", "hi": "3 दिनों से हल्का बुखार है"}
            ],
            "touchOptions": [
                {"value": "< 24 Hours", "labelEn": "< 24 Hours (Sudden)", "labelHi": "24 घंटे से कम (अचानक)"},
                {"value": "2-3 Days", "labelEn": "2-3 Days", "labelHi": "2-3 दिन"},
                {"value": "1 Week+", "labelEn": "> 1 Week", "labelHi": "1 सप्ताह से अधिक"}
            ]
        },
        "character": {
            "id": "fever_pattern",
            "field": "fever_character",
            "step": "symptoms",
            "questionEn": "Regarding the fever: does it come with chills and shivering, or sweating when it breaks?",
            "questionHi": "बुखार के बारे में: क्या यह ठंड और कंपकंपी के साथ आता है, या पसीना आकर उतरता है?",
            "exampleChips": [
                {"en": "High fever with severe chills", "hi": "ठंड और कंपकंपी के साथ तेज बुखार"},
                {"en": "Continuous mild body heat", "hi": "लगातार हल्का बुखार बना रहता है"}
            ],
            "touchOptions": [
                {"value": "High with Chills", "labelEn": "High fever with chills", "labelHi": "ठंड लगकर तेज बुखार"},
                {"value": "Continuous Low", "labelEn": "Continuous low grade", "labelHi": "लगातार हल्का बुखार"},
                {"value": "Night Sweats", "labelEn": "Comes with sweating", "labelHi": "पसीना आकर उतरता है"}
            ]
        },
        "severity": {
            "id": "fever_severity",
            "field": "fever_severity",
            "step": "symptoms",
            "questionEn": "Have you measured your body temperature? How high does it feel?",
            "questionHi": "क्या आपने थर्मामीटर से तापमान नापा है? बुखार कितना तेज महसूस हो रहा है?",
            "exampleChips": [
                {"en": "Measured around 101-102 F", "hi": "लगभग 101-102 डिग्री नापा था"},
                {"en": "Did not measure, but body feels very hot", "hi": "नापा नहीं, पर बदन बहुत गर्म है"}
            ],
            "touchOptions": [
                {"value": "Mild (99-100 F)", "labelEn": "Mild (99 - 100°F)", "labelHi": "हल्का (99 - 100°F)"},
                {"value": "Moderate (101-102 F)", "labelEn": "Moderate (101 - 102°F)", "labelHi": "मध्यम (101 - 102°F)"},
                {"value": "High (> 102 F)", "labelEn": "High (> 102°F)", "labelHi": "तेज (> 102°F)"}
            ]
        }
    },
    "cough": {
        "character": {
            "id": "cough_character",
            "field": "cough_character",
            "step": "symptoms",
            "questionEn": "Is your cough dry, or do you bring up phlegm/mucus?",
            "questionHi": "क्या आपकी खांसी सूखी है, या बलगम/कफ आ रहा है?",
            "exampleChips": [
                {"en": "Dry irritating cough", "hi": "सूखी और गले में चुभने वाली खांसी"},
                {"en": "Cough with thick yellow phlegm", "hi": "गाढ़ा पीला बलगम आ रहा है"}
            ],
            "touchOptions": [
                {"value": "Dry", "labelEn": "Dry Cough", "labelHi": "सूखी खांसी"},
                {"value": "Productive / Phlegm", "labelEn": "With Phlegm / Mucus", "labelHi": "बलगम वाली खांसी"},
                {"value": "Blood-tinged", "labelEn": "Blood in sputum", "labelHi": "कफ में खून"}
            ]
        },
        "severity": {
            "id": "cough_severity",
            "field": "cough_severity",
            "step": "symptoms",
            "questionEn": "Does the coughing disturb your sleep or make it difficult to catch your breath?",
            "questionHi": "क्या खांसी की वजह से रात को नींद टूटती है या सांस लेने में परेशानी होती है?",
            "exampleChips": [
                {"en": "Disturbs sleep at night", "hi": "रात में सोने में परेशानी होती है"},
                {"en": "Mild cough during daytime only", "hi": "सिर्फ दिन में हल्की खांसी होती है"}
            ],
            "touchOptions": [
                {"value": "Disturbs sleep", "labelEn": "Severe night coughing", "labelHi": "रात में ज्यादा"},
                {"value": "Mild", "labelEn": "Mild daytime only", "labelHi": "हल्की दिन में"},
                {"value": "Causes breathlessness", "labelEn": "Causes Breathlessness", "labelHi": "सांस फूलती है"}
            ]
        }
    },
    "chest_discomfort": {
        "character": {
            "id": "chest_character",
            "field": "chest_character",
            "step": "symptoms",
            "questionEn": "Can you describe the chest sensation (e.g. heavy tightness, pressure, burning, or sharp)?",
            "questionHi": "छाती में कैसा अहसास हो रहा है (जैसे भारीपन, दबाव, जलन या तेज चुभन)?",
            "exampleChips": [
                {"en": "Heavy tight band across chest", "hi": "छाती में भारी कसाव महसूस हो रहा है"},
                {"en": "Burning in center of chest", "hi": "छाती के बीच में जलन हो रही है"}
            ],
            "touchOptions": [
                {"value": "Pressure / Tightness", "labelEn": "Pressure / Tightness", "labelHi": "दबाव / भारीपन"},
                {"value": "Burning / Acidity", "labelEn": "Burning Sensation", "labelHi": "जलन"},
                {"value": "Sharp", "labelEn": "Sharp Stabbing", "labelHi": "तेज चुभन"}
            ]
        },
        "radiation": {
            "id": "chest_radiation",
            "field": "chest_radiation",
            "step": "symptoms",
            "questionEn": "Does the chest sensation spread to your left arm, shoulder, jaw, or back?",
            "questionHi": "क्या यह दर्द बाईं बांह, कंधे, जबड़े या पीठ तक फैलता है?",
            "exampleChips": [
                {"en": "Spreads to left arm and jaw", "hi": "बाईं बांह और जबड़े तक फैलता है"},
                {"en": "Stays right in the center", "hi": "सिर्फ बीच में रहता है, कहीं नहीं फैलता"}
            ],
            "touchOptions": [
                {"value": "To Left Arm/Jaw", "labelEn": "Left Arm or Jaw", "labelHi": "बाईं बांह / जबड़ा"},
                {"value": "To Back", "labelEn": "Back / Shoulders", "labelHi": "पीठ / कंधे"},
                {"value": "No Spread", "labelEn": "Does not spread", "labelHi": "कहीं नहीं फैलता"}
            ]
        }
    }
}

# Generic fallback SOCRATES question for any other symptom
GENERIC_SOCRATES_ONSET = {
    "id": "socrates_onset",
    "field": "onset_duration",
    "step": "symptoms",
    "questionEn": "How long have you had this issue, and did it start suddenly or gradually?",
    "questionHi": "यह समस्या आपको कितने समय से है, और क्या यह अचानक शुरू हुई या धीरे-धीरे?",
    "exampleChips": [
        {"en": "Started 2-3 days ago", "hi": "2-3 दिन पहले शुरू हुआ"},
        {"en": "Started suddenly this morning", "hi": "आज सुबह अचानक शुरू हुआ"}
    ],
    "touchOptions": [
        {"value": "< 24 Hours", "labelEn": "< 24 Hours", "labelHi": "< 24 घंटे"},
        {"value": "2-3 Days", "labelEn": "2-3 Days", "labelHi": "2-3 दिन"},
        {"value": "1-2 Weeks", "labelEn": "1-2 Weeks", "labelHi": "1-2 सप्ताह"},
        {"value": "> 1 Month", "labelEn": "> 1 Month", "labelHi": "> 1 महीना"}
    ]
}

# Systemic Medical History Questions (Asked after symptom SOCRATES is complete)
SYSTEMIC_QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": "hpi_summary_check",
        "field": "hpi_summary",
        "step": "history",
        "questionEn": "Thank you for explaining your symptoms. Did this problem ever happen to you in the past?",
        "questionHi": "लक्षणों को विस्तार से बताने के लिए धन्यवाद। क्या यह समस्या आपको पहले कभी हुई थी?",
        "exampleChips": [
            {"en": "First time having this problem", "hi": "पहली बार यह समस्या हुई है"},
            {"en": "Similar episode happened a month ago", "hi": "एक महीने पहले भी ऐसा हुआ था"}
        ],
        "touchOptions": [
            {"value": "First time", "labelEn": "First time ever", "labelHi": "पहली बार"},
            {"value": "Recurrent", "labelEn": "Happens repeatedly", "labelHi": "बार-बार होता है"},
            {"value": "Occasional", "labelEn": "Happened once or twice", "labelHi": "पहले एक-दो बार हुआ"}
        ]
    },
    {
        "id": "past_medical",
        "field": "past_medical",
        "step": "history",
        "questionEn": "Do you have any existing chronic illnesses such as Diabetes, High BP, Thyroid, or Asthma?",
        "questionHi": "क्या आपको पहले से कोई पुरानी बीमारी है जैसे डायबिटीज (शुगर), हाई बीपी, थायरॉयड या दमा?",
        "exampleChips": [
            {"en": "No known chronic illnesses", "hi": "पहले से कोई पुरानी बीमारी नहीं है"},
            {"en": "Hypertension for 5 years", "hi": "5 साल से हाई बीपी है"},
            {"en": "Type 2 Diabetes controlled", "hi": "डायबिटीज (शुगर) की बीमारी है"}
        ],
        "touchOptions": [
            {"value": "None", "labelEn": "No Known Illness", "labelHi": "कोई बीमारी नहीं"},
            {"value": "Hypertension", "labelEn": "High BP", "labelHi": "हाई बीपी"},
            {"value": "Diabetes", "labelEn": "Diabetes (Sugar)", "labelHi": "शुगर (डायबिटीज)"},
            {"value": "Asthma", "labelEn": "Asthma / Respiratory", "labelHi": "दमा / सांस की बीमारी"},
            {"value": "Thyroid", "labelEn": "Thyroid disorder", "labelHi": "थायरॉयड"}
        ]
    },
    {
        "id": "surgical_history",
        "field": "surgical_history",
        "step": "history",
        "questionEn": "Have you had any operations, surgeries, or major hospital admissions in the past?",
        "questionHi": "क्या पहले कभी आपका कोई ऑपरेशन, सर्जरी या अस्पताल में भर्ती होना पड़ा है?",
        "exampleChips": [
            {"en": "No previous surgeries", "hi": "पहले कोई ऑपरेशन नहीं हुआ"},
            {"en": "Appendectomy 3 years ago", "hi": "3 साल पहले अपेंडिक्स का ऑपरेशन हुआ था"}
        ],
        "touchOptions": [
            {"value": "No Surgery", "labelEn": "No Prior Surgeries", "labelHi": "कोई ऑपरेशन नहीं"},
            {"value": "Minor Surgery", "labelEn": "Minor Operation", "labelHi": "छोटी सर्जरी"},
            {"value": "Major Surgery", "labelEn": "Major Surgery in past", "labelHi": "बड़ा ऑपरेशन हुआ है"}
        ]
    },
    {
        "id": "medications",
        "field": "medications",
        "step": "history",
        "questionEn": "Are you currently taking any regular prescription medicines, vitamins, or over-the-counter painkillers?",
        "questionHi": "क्या आप नियमित रूप से कोई दवाई, विटामिन या दर्द निवारक ले रहे हैं?",
        "exampleChips": [
            {"en": "Not taking regular medicines", "hi": "कोई नियमित दवा नहीं ले रहे"},
            {"en": "Took paracetamol 650mg yesterday", "hi": "कल पैरासिटामोल 650mg ली थी"},
            {"en": "Daily BP medicine in morning", "hi": "रोज सुबह बीपी की दवा लेते हैं"}
        ],
        "touchOptions": [
            {"value": "No regular meds", "labelEn": "No Regular Meds", "labelHi": "कोई नियमित दवा नहीं"},
            {"value": "BP medication", "labelEn": "BP Medicine", "labelHi": "बीपी की दवा"},
            {"value": "Sugar medication", "labelEn": "Diabetes / Insulin", "labelHi": "शुगर की दवा"},
            {"value": "Took painkiller", "labelEn": "Took OTC Painkiller", "labelHi": "दर्द की गोली ली"}
        ]
    },
    {
        "id": "allergies",
        "field": "allergies",
        "step": "history",
        "questionEn": "Do you have any known allergies to medicines (like Penicillin, Sulfa) or specific foods?",
        "questionHi": "क्या आपको किसी दवा (जैसे पेनिसिलिन, सल्फा) या किसी खाने की चीज़ से कोई एलर्जी है?",
        "exampleChips": [
            {"en": "No known drug allergies (NKDA)", "hi": "किसी दवा से कोई एलर्जी नहीं है"},
            {"en": "Allergic to Penicillin (gets skin rash)", "hi": "पेनिसिलिन से एलर्जी है (चकत्ते होते हैं)"}
        ],
        "touchOptions": [
            {"value": "NKDA", "labelEn": "No Known Allergies (NKDA)", "labelHi": "कोई ज्ञात एलर्जी नहीं"},
            {"value": "Penicillin Allergy", "labelEn": "Penicillin / Antibiotic", "labelHi": "पेनिसिलिन से एलर्जी"},
            {"value": "Food Allergy", "labelEn": "Food Allergy (e.g. Peanuts)", "labelHi": "खाद्य पदार्थ से एलर्जी"}
        ]
    },
    {
        "id": "family_history",
        "field": "family_history",
        "step": "history",
        "questionEn": "Does anyone in your immediate family have conditions like heart disease, diabetes, or high blood pressure?",
        "questionHi": "क्या आपके परिवार में किसी को दिल की बीमारी, डायबिटीज (शुगर) या हाई बीपी की समस्या है?",
        "exampleChips": [
            {"en": "Father has diabetes and high BP", "hi": "पिताजी को शुगर और हाई बीपी है"},
            {"en": "No major illnesses in family", "hi": "परिवार में कोई गंभीर बीमारी नहीं है"}
        ],
        "touchOptions": [
            {"value": "None", "labelEn": "No significant family history", "labelHi": "कोई पारिवारिक बीमारी नहीं"},
            {"value": "Family Diabetes", "labelEn": "Diabetes in family", "labelHi": "परिवार में डायबिटीज"},
            {"value": "Family Heart Disease", "labelEn": "Heart Disease in family", "labelHi": "परिवार में दिल की बीमारी"},
            {"value": "Family Hypertension", "labelEn": "High BP in family", "labelHi": "परिवार में हाई बीपी"}
        ]
    },
    {
        "id": "lifestyle",
        "field": "lifestyle",
        "step": "lifestyle",
        "questionEn": "Tell us briefly about your daily routine, sleep pattern, diet, and whether you smoke or drink alcohol.",
        "questionHi": "अपनी दिनचर्या, नींद, खान-पान और क्या आप धूम्रपान या शराब का सेवन करते हैं, के बारे में संक्षेप में बताएं।",
        "exampleChips": [
            {"en": "Vegetarian diet, 7 hours sleep, no smoking or alcohol", "hi": "शाकाहारी भोजन, 7 घंटे नींद, कोई नशा नहीं"},
            {"en": "Irregular sleep, high stress work", "hi": "अनियमित नींद और काम का तनाव रहता है"}
        ],
        "touchOptions": [
            {"value": "Healthy routine", "labelEn": "Good sleep, non-smoker", "labelHi": "अच्छी नींद, कोई नशा नहीं"},
            {"value": "Poor sleep", "labelEn": "Disturbed Sleep / Stress", "labelHi": "तनाव / कम नींद"},
            {"value": "Occasional smoker", "labelEn": "Occasional tobacco / smoke", "labelHi": "धूम्रपान की आदत"}
        ]
    }
]
