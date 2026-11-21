# backend/app/services/dialogue/extractor.py
# Rule-based clinical entity and symptom extractor (Hindi + English)
# Extracts: symptom names, duration, severity, character, associations.
import re
from typing import Dict, Any, List, Optional

# Canonical symptom definitions with bilingual keywords and patterns
SYMPTOM_ONTOLOGY = [
    {
        "id": "headache",
        "name_en": "headache",
        "name_hi": "सिरदर्द",
        "patterns": [
            r"\b(headache|head\s*ache|head\s*pain|throbbing\s*head)\b",
            r"(सिर\s*दर्द|सर\s*दर्द|सिर\s*में\s*दर्द|माथा\s*दर्द|अधकपारी)",
            r"\b(sir\s*dard|sar\s*dard|sir\s*me\s*dard|sar\s*mein\s*dard|sar\s*dukh\s*raha)\b"
        ]
    },
    {
        "id": "fever",
        "name_en": "fever",
        "name_hi": "बुखार",
        "patterns": [
            r"\b(fever|chills|high\s*temperature|pyrexia|febrile)\b",
            r"(बुखार|ताप|ठंड\s*लग\s*रही|कंपकंपी)",
            r"\b(bukhar|bukhaar|taap|thand\s*lag\s*rahi|fever)\b"
        ]
    },
    {
        "id": "cough",
        "name_en": "cough",
        "name_hi": "खांसी",
        "patterns": [
            r"\b(cough|coughing|phlegm|sputum|dry\s*cough)\b",
            r"(खांसी|बलगम|खराश)",
            r"\b(khansi|khaansi|balgam|sukhi\s*khansi)\b"
        ]
    },
    {
        "id": "chest_pain",
        "name_en": "chest pain",
        "name_hi": "छाती में दर्द",
        "patterns": [
            r"\b(chest\s*pain|chest\s*pressure|chest\s*tightness|heart\s*pain)\b",
            r"(छाती\s*में\s*दर्द|सीने\s*में\s*दर्द|सीने\s*में\s*जलन|सीने\s*में\s*दबाव)",
            r"\b(seene\s*me\s*dard|seene\s*mein\s*dard|chhati\s*me\s*dard|sine\s*me\s*dard)\b"
        ]
    },
    {
        "id": "stomach_pain",
        "name_en": "stomach pain",
        "name_hi": "पेट दर्द",
        "patterns": [
            r"\b(stomach\s*pain|abdominal\s*pain|belly\s*ache|tummy\s*ache|cramps)\b",
            r"(पेट\s*दर्द|पेट\s*में\s*दर्द|मरोड़|पेट\s*खराब)",
            r"\b(pet\s*dard|pet\s*me\s*dard|pet\s*kharab|stomach\s*pain)\b"
        ]
    },
    {
        "id": "vomiting_nausea",
        "name_en": "nausea and vomiting",
        "name_hi": "उल्टी और जी मिचलाना",
        "patterns": [
            r"\b(vomiting|nausea|nauseous|throwing\s*up|puking)\b",
            r"(उल्टी|जी\s*मिचलाना|उबकाई|कै)",
            r"\b(ulti|vomit|ji\s*michlana|ubkai)\b"
        ]
    },
    {
        "id": "breathlessness",
        "name_en": "breathlessness",
        "name_hi": "सांस फूलना",
        "patterns": [
            r"\b(shortness\s*of\s*breath|breathless(ness)?|difficulty\s*breathing|dyspnea)\b",
            r"(सांस\s*फूलना|सांस\s*लेने\s*में\s*तकलीफ|दम\s*घुटता)",
            r"\b(saans\s*phoolna|saans\s*lene\s*me\s*taklif|breathless)\b"
        ]
    },
    {
        "id": "joint_body_pain",
        "name_en": "joint and body pain",
        "name_hi": "बदन व जोड़ों में दर्द",
        "patterns": [
            r"\b(body\s*pain|joint\s*pain|muscle\s*ache|myalgia|arthralgia|back\s*pain)\b",
            r"(बदन\s*दर्द|शरीर\s*में\s*दर्द|जोड़ों\s*में\s*दर्द|कमर\s*दर्द|घुटने\s*में\s*दर्द)",
            r"\b(badan\s*dard|jodon\s*me\s*dard|kamar\s*dard|body\s*pain)\b"
        ]
    },
    {
        "id": "dizziness",
        "name_en": "dizziness",
        "name_hi": "चक्कर आना",
        "patterns": [
            r"\b(dizziness|dizzy|lightheaded|vertigo|giddiness)\b",
            r"(चक्कर\s*आना|सिर\s*घूमना)",
            r"\b(chakkar|sir\s*ghumna|giddiness)\b"
        ]
    },
    {
        "id": "sore_throat",
        "name_en": "sore throat",
        "name_hi": "गले में खराश",
        "patterns": [
            r"\b(sore\s*throat|throat\s*pain|pain\s*swallowing)\b",
            r"(गले\s*में\s*खराश|गले\s*में\s*दर्द|निगलने\s*में\s*दर्द)",
            r"\b(gale\s*me\s*kharash|gale\s*me\s*dard|sore\s*throat)\b"
        ]
    }
]

# Duration patterns (Hindi, Roman Hindi, English)
DURATION_PATTERNS = [
    # Roman Hindi / Hindi digit + time unit: "2 din se", "3 dino se", "1 hafte se", "2 mahine se"
    r"(\d+|ek|do|teen|char|paanch|chheh|saat|aath|nau|das|one|two|three|four|five)\s*(दिनों?|din|dino|days?|हफ़्तों?|हफ्ते?|hafte|hafto|weeks?|महीनों?|mahine|mahino|months?|घंटे?|ghante|hours?)\s*(से|se|ago|since|duration)?",
    # English: "for 2 days", "since 3 days", "last 2 days", "for 1 week"
    r"(for|since|last|past)\s+(\d+|one|two|three|four|five|several|a\s+few)\s+(days?|weeks?|months?|hours?)",
    # Specific times: "aaj subah se", "kal se", "since yesterday", "since morning"
    r"(आज\s*सुबह\s*से|कल\s*से|aaj\s*subah\s*se|kal\s*se|kal\s*raat\s*se|since\s*morning|since\s*yesterday|since\s*last\s*night)"
]

def extract_duration(text: str) -> Optional[str]:
    """
    Extracts duration mentioned in the patient's text.
    Examples: "2 din se" -> "2 days / 2 din", "since morning" -> "since morning"
    """
    if not text:
        return None
    for pat in DURATION_PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            matched_str = m.group(0).strip()
            # Normalize common words
            norm = matched_str.lower()
            if "aaj subah" in norm or "morning" in norm:
                return "Since morning / आज सुबह से"
            elif "kal se" in norm or "yesterday" in norm:
                return "Since yesterday / कल से"
            return matched_str
    return None

def extract_symptoms(text: str) -> List[Dict[str, str]]:
    """
    Extracts all mentioned symptom categories in text using rule-based ontology.
    """
    if not text:
        return []
    found = []
    norm = text.lower()

    for sym in SYMPTOM_ONTOLOGY:
        for pat in sym["patterns"]:
            if re.search(pat, norm, re.IGNORECASE):
                found.append({
                    "id": sym["id"],
                    "name_en": sym["name_en"],
                    "name_hi": sym["name_hi"]
                })
                break
    return found

def extract_details(text: str) -> Dict[str, Any]:
    """
    Extracts severity, character, and radiation if already mentioned.
    """
    norm = text.lower()
    details: Dict[str, Any] = {}

    # Severity
    if re.search(r"\b(severe|very\s*bad|unbearable|bahut\s*tez|tez|bhayanak|8/10|9/10|10/10)\b", norm):
        details["severity"] = "Severe / तेज (7-10/10)"
    elif re.search(r"\b(mild|halka|halka\s*sa|slight|1/10|2/10|3/10)\b", norm):
        details["severity"] = "Mild / हल्का (1-3/10)"
    elif re.search(r"\b(moderate|madhyam|theek\s*thaak|medium|4/10|5/10|6/10)\b", norm):
        details["severity"] = "Moderate / मध्यम (4-6/10)"

    # Character
    if re.search(r"\b(throbbing|pulsing|dhadak|pulsating)\b", norm):
        details["character"] = "Throbbing / धड़कता हुआ"
    elif re.search(r"\b(sharp|stabbing|tez|chubhan)\b", norm):
        details["character"] = "Sharp / Stabbing / चुभने वाला"
    elif re.search(r"\b(burning|jalan)\b", norm):
        details["character"] = "Burning / जलन"
    elif re.search(r"\b(dull|heavy|bhari|continuous)\b", norm):
        details["character"] = "Dull ache / भारीपन"

    # Radiation
    if re.search(r"\b(gardankan|neck|aankh|eyes|haath|arm|shoulder|peeth|back)\b", norm):
        details["radiation"] = "Spread noted / फैलाव का उल्लेख"

    return details

def extract_clinical_information(text: str, language: str = "en") -> Dict[str, Any]:
    """
    High-level extraction entry point:
    Returns structured symptoms, duration, severity, and details.
    """
    symptoms = extract_symptoms(text)
    duration = extract_duration(text)
    details = extract_details(text)

    primary_sym = symptoms[0] if symptoms else None
    associated_syms = symptoms[1:] if len(symptoms) > 1 else []

    return {
        "raw_text": text,
        "symptoms": symptoms,
        "primary_symptom": primary_sym,
        "associated_symptoms": associated_syms,
        "duration": duration,
        "severity": details.get("severity"),
        "character": details.get("character"),
        "radiation": details.get("radiation"),
        "has_duration": duration is not None,
        "has_symptoms": len(symptoms) > 0
    }
