# backend/app/services/redflags/engine.py
# Rule-based bilingual red-flag detection engine with negation handling
# Rule 3: Deterministic ONLY, bilingual (English + Hindi), negation-aware, NEVER LLM-only.

import re
from typing import List, Dict, Any, Optional

RED_FLAG_DEFINITIONS = [
    {
        "id": "CHEST_PAIN",
        "category": "cardiovascular",
        "severity": "CRITICAL",
        "patterns_en": [
            r"\b(chest pain|chest tightness|pressure in chest|heart pain|angina|crushing chest|pain radiating to (left arm|jaw))\b"
        ],
        "patterns_hi": [
            r"(छाती|सीने|दिल)[^\.\,\!\?]{0,25}(दर्द|जकड़न|दबाव)",
            r"(बाएं\s+हाथ\s+में\s+दर्द)"
        ],
        "message_en": "Severe / Acute Chest Pain or Pressure detected. Potential cardiac emergency.",
        "message_hi": "सीने में तेज दर्द या दबाव का पता चला है। यह आपातकालीन स्थिति हो सकती है।",
        "action_en": "Immediate triage to Emergency Department (Casualty). Do not wait in OPD queue.",
        "action_hi": "तुरंत आपातकालीन विभाग (कैजुअल्टी) जाएं। ओपीडी कतार में प्रतीक्षा न करें।"
    },
    {
        "id": "BREATHLESSNESS",
        "category": "respiratory",
        "severity": "CRITICAL",
        "patterns_en": [
            r"\b(shortness of breath|difficulty breathing|breathless(ness)?|can'?t breathe|gasping for air|dyspnea|severe asthma attack)\b"
        ],
        "patterns_hi": [
            r"(सांस लेने में (तकलीफ|दिक्कत|कठिनाई)|दम घुट(ना| रहा)|सांस फूल(ना| रही)|सांस नहीं आ रही)"
        ],
        "message_en": "Severe difficulty breathing or shortness of breath detected.",
        "message_hi": "सांस लेने में गंभीर कठिनाई या सांस फूलने का पता चला है।",
        "action_en": "Assess oxygen saturation (SpO2) immediately and administer supplemental O2 if needed.",
        "action_hi": "तुरंत ऑक्सीजन स्तर (SpO2) की जांच कराएं और आपातकालीन कक्ष में संपर्क करें।"
    },
    {
        "id": "LOSS_OF_CONSCIOUSNESS",
        "category": "neurological",
        "severity": "CRITICAL",
        "patterns_en": [
            r"\b(loss of consciousness|passed out|fainted|unconscious|blackout|seizure|convulsions|syncope)\b"
        ],
        "patterns_hi": [
            r"(बेहोश(ी)?|चक्कर खाकर गिर|दौरा पड़(ना| गया)|अचेत)"
        ],
        "message_en": "Loss of consciousness, fainting, or seizure episode reported.",
        "message_hi": "बेहोशी, अचेत होने या दौरे पड़ने की सूचना मिली है।",
        "action_en": "Ensure airway patency, check blood glucose, and urgently evaluate vitals.",
        "action_hi": "मरीज को सुरक्षित लिटाएं, श्वास मार्ग खुला रखें और तत्काल डॉक्टर को दिखाएं।"
    },
    {
        "id": "SEVERE_BLEEDING",
        "category": "trauma_hemorrhage",
        "severity": "CRITICAL",
        "patterns_en": [
            r"\b(severe bleeding|coughing blood|hemoptysis|vomiting blood|hematemesis|blood in stool|profuse bleeding|uncontrolled bleeding)\b"
        ],
        "patterns_hi": [
            r"(खून की उल्टी|खांसी में खून|मल में खून|अत्यधिक खून बहना|खून बंद नहीं हो रहा)"
        ],
        "message_en": "Significant active hemorrhage or bleeding reported.",
        "message_hi": "गंभीर या अनियंत्रित रक्तस्राव (खून बहना) की सूचना मिली है।",
        "action_en": "Apply direct pressure if external; immediate intravenous access and fluid resuscitation.",
        "action_hi": "रक्तस्राव वाले स्थान को दबाकर रखें और तत्काल आपातकालीन विभाग में भर्ती करें।"
    },
    {
        "id": "PERSISTENT_HEADACHE_FEVER",
        "category": "infectious_neurology",
        "severity": "URGENT",
        "patterns_en": [
            r"\b(persistent headache|headache for [3-9] days|headache with stiff neck|severe sudden thunderclap headache)\b"
        ],
        "patterns_hi": [
            r"(लगातार सिरदर्द|[3-9] दिनों से सिरदर्द|गर्दन में अकड़न के साथ सिरदर्द|अचानक भयानक सिरदर्द)"
        ],
        "message_en": "Persistent headache (>3 days) or associated with fever / meningeal signs.",
        "message_hi": "लगातार 3 दिन से अधिक सिरदर्द या गर्दन में जकड़न के साथ सिरदर्द।",
        "action_en": "Physician evaluation required to rule out central nervous system infection or intracranial etiology.",
        "action_hi": "संभावित संक्रमण की जांच के लिए तुरंत चिकित्सक से विस्तृत परामर्श लें।"
    },
    {
        "id": "STROKE_SIGNS",
        "category": "neurological",
        "severity": "CRITICAL",
        "patterns_en": [
            r"\b(slurred speech|face drooping|arm weakness|facial numbness|sudden paralysis|unable to speak)\b"
        ],
        "patterns_hi": [
            r"(बोली लड़खड़ाना|मुंह टेढ़ा होना|हाथ-पैर में लकवा|अचानक कमजोरी|बोलने में असमर्थ)"
        ],
        "message_en": "Signs suggestive of acute stroke (FAST protocol: Face, Arms, Speech, Time).",
        "message_hi": "तीव्र स्ट्रोक (लकवा) के संभावित लक्षण।",
        "action_en": "Activate emergency stroke protocol immediately; time-sensitive neuroimaging needed.",
        "action_hi": "बिना देर किए आपातकालीन न्यूरोलॉजी विभाग या नजदीकी बड़े अस्पताल ले जाएं।"
    }
]

def is_negated(full_text: str, match_start: int, match_end: int) -> bool:
    """
    Checks if a matched pattern is negated in English or Hindi context.
    """
    prefix = full_text[max(0, match_start - 35):match_start].lower()
    suffix = full_text[match_end:min(len(full_text), match_end + 35)].lower()

    # English negations before: "no chest pain", "denies shortness of breath", "without bleeding"
    if re.search(r"\b(no|not|never|denies|denied|without|negative for|rules? out)\s*$", prefix):
        return True

    # Hindi negations after: "छाती में दर्द नहीं है", "सांस फूलने की कोई शिकायत नहीं"
    if re.search(r"^\s*(नहीं है|नहीं|ना|नहीं हुआ|की कोई शिकायत नहीं|नहीं था)", suffix):
        return True

    return False

def scan_for_red_flags(text: str) -> List[Dict[str, Any]]:
    """
    Scans clinical text or patient utterances against deterministic bilingual red-flag rules.
    Returns list of triggered alerts with emergency messages and severity levels.
    """
    if not text or not isinstance(text, str):
        return []

    normalized = text.strip()
    triggered_alerts = []

    for defn in RED_FLAG_DEFINITIONS:
        matched = False

        # 1. English patterns
        for pattern in defn["patterns_en"]:
            m = re.search(pattern, normalized, re.IGNORECASE)
            if m:
                if not is_negated(normalized, m.start(), m.end()):
                    matched = True
                    triggered_alerts.append({
                        "id": defn["id"],
                        "category": defn["category"],
                        "severity": defn["severity"],
                        "keyword": m.group(0),
                        "message_en": defn["message_en"],
                        "message_hi": defn["message_hi"],
                        "action_en": defn["action_en"],
                        "action_hi": defn["action_hi"]
                    })
                    break

        if matched:
            continue

        # 2. Hindi patterns
        for pattern in defn["patterns_hi"]:
            m = re.search(pattern, normalized)
            if m:
                if not is_negated(normalized, m.start(), m.end()):
                    triggered_alerts.append({
                        "id": defn["id"],
                        "category": defn["category"],
                        "severity": defn["severity"],
                        "keyword": m.group(0),
                        "message_en": defn["message_en"],
                        "message_hi": defn["message_hi"],
                        "action_en": defn["action_en"],
                        "action_hi": defn["action_hi"]
                    })
                    break

    return triggered_alerts
