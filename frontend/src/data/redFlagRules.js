// redFlagRules.js — Rule-based bilingual red-flag detection engine
// Non-negotiable Rule 3: Rule-based ONLY, bilingual (English + Hindi), negation-aware, never LLM-only.

export const RED_FLAG_DEFINITIONS = [
  {
    id: 'CHEST_PAIN',
    category: 'cardiovascular',
    severity: 'CRITICAL',
    patternsEn: [
      /\b(chest pain|chest tightness|pressure in chest|heart pain|angina|pain radiating to (left arm|jaw)|crushing chest)\b/i
    ],
    patternsHi: [
      /(छाती में दर्द|सीने में दर्द|सीने में जकड़न|सीने पर दबाव|दिल में दर्द|बाएं हाथ में दर्द)/
    ],
    messageEn: 'Severe / Acute Chest Pain or Pressure detected. Potential cardiac emergency.',
    messageHi: 'सीने में तेज दर्द या दबाव का पता चला है। यह आपातकालीन स्थिति हो सकती है।',
    actionEn: 'Immediate triage to Emergency Department (ED / Casualty). Do not wait in OPD queue.',
    actionHi: 'तुरंत आपातकालीन विभाग (कैजुअल्टी) जाएं। ओपीडी कतार में प्रतीक्षा न करें।'
  },
  {
    id: 'BREATHLESSNESS',
    category: 'respiratory',
    severity: 'CRITICAL',
    patternsEn: [
      /\b(shortness of breath|difficulty breathing|breathless(ness)?|can'?t breathe|gasping for air|dyspnea|severe asthma attack)\b/i
    ],
    patternsHi: [
      /(सांस लेने में (तकलीफ|दिक्कत|कठिनाई)|दम घुट(ना| रहा)|सांस फूल(ना| रही)|सांस नहीं आ रही)/
    ],
    messageEn: 'Severe difficulty breathing or shortness of breath detected.',
    messageHi: 'सांस लेने में गंभीर कठिनाई या सांस फूलने का पता चला है।',
    actionEn: 'Assess oxygen saturation (SpO2) immediately and administer supplemental O2 if needed.',
    actionHi: 'तुरंत ऑक्सीजन स्तर (SpO2) की जांच कराएं और आपातकालीन कक्ष में संपर्क करें।'
  },
  {
    id: 'LOSS_OF_CONSCIOUSNESS',
    category: 'neurological',
    severity: 'CRITICAL',
    patternsEn: [
      /\b(loss of consciousness|passed out|fainted|unconscious|blackout|seizure|convulsions|syncope)\b/i
    ],
    patternsHi: [
      /(बेहोश(ी)?|चक्कर खाकर गिर|दौरा पड़(ना| गया)|अचेत)/
    ],
    messageEn: 'Loss of consciousness, fainting, or seizure episode reported.',
    messageHi: 'बेहोशी, अचेत होने या दौरे पड़ने की सूचना मिली है।',
    actionEn: 'Ensure airway patency, check blood glucose, and urgently evaluate vitals.',
    actionHi: 'मरीज को सुरक्षित लिटाएं, श्वास मार्ग खुला रखें और तत्काल डॉक्टर को दिखाएं।'
  },
  {
    id: 'SEVERE_BLEEDING',
    category: 'trauma_hemorrhage',
    severity: 'CRITICAL',
    patternsEn: [
      /\b(severe bleeding|coughing blood|hemoptysis|vomiting blood|hematemesis|blood in stool|profuse bleeding|uncontrolled bleeding)\b/i
    ],
    patternsHi: [
      /(खून की उल्टी|खांसी में खून|मल में खून|अत्यधिक खून बहना|खून बंद नहीं हो रहा)/
    ],
    messageEn: 'Significant active hemorrhage or bleeding reported.',
    messageHi: 'गंभीर या अनियंत्रित रक्तस्राव (खून बहना) की सूचना मिली है।',
    actionEn: 'Apply direct pressure if external; immediate intravenous access and fluid resuscitation.',
    actionHi: 'रक्तस्राव वाले स्थान को दबाकर रखें और तत्काल आपातकालीन विभाग में भर्ती करें।'
  },
  {
    id: 'PERSISTENT_HEADACHE_FEVER',
    category: 'infectious_neurology',
    severity: 'URGENT',
    patternsEn: [
      /\b(persistent headache|headache for [3-9] days|headache with stiff neck|severe sudden thunderclap headache)\b/i
    ],
    patternsHi: [
      /(लगातार सिरदर्द|[3-9] दिनों से सिरदर्द|गर्दन में अकड़न के साथ सिरदर्द|अचानक भयानक सिरदर्द)/
    ],
    messageEn: 'Persistent headache (>3 days) or associated with fever / meningeal signs.',
    messageHi: 'लगातार 3 दिन से अधिक सिरदर्द या गर्दन में जकड़न के साथ सिरदर्द।',
    actionEn: 'Physician evaluation required to rule out central nervous system infection or intracranial etiology.',
    actionHi: 'संभावित संक्रमण की जांच के लिए तुरंत चिकित्सक से विस्तृत परामर्श लें।'
  },
  {
    id: 'STROKE_SIGNS',
    category: 'neurological',
    severity: 'CRITICAL',
    patternsEn: [
      /\b(slurred speech|face drooping|arm weakness|facial numbness|sudden paralysis|unable to speak)\b/i
    ],
    patternsHi: [
      /(बोली लड़खड़ाना|मुंह टेढ़ा होना|हाथ-पैर में लकवा|अचानक कमजोरी|बोलने में असमर्थ)/
    ],
    messageEn: 'Signs suggestive of acute stroke (FAST protocol: Face, Arms, Speech, Time).',
    messageHi: 'तीव्र स्ट्रोक (लकवा) के संभावित लक्षण।',
    actionEn: 'Activate emergency stroke protocol immediately; time-sensitive neuroimaging needed.',
    actionHi: 'बिना देर किए आपातकालीन न्यूरोलॉजी विभाग या नजदीकी बड़े अस्पताल ले जाएं।'
  }
];

// Negation phrases in English and Hindi
const NEGATIONS_EN = [
  /\bno\s+([a-z\s]+)/i,
  /\bnot\s+having\s+([a-z\s]+)/i,
  /\bwithout\s+([a-z\s]+)/i,
  /\bdenies\s+([a-z\s]+)/i,
  /\bnegative\s+for\s+([a-z\s]+)/i,
  /\bnever\s+had\s+([a-z\s]+)/i,
  /\brules?\s+out\s+([a-z\s]+)/i
];

const NEGATIONS_HI = [
  /([^\s]+)\s+(नहीं है|नहीं हुआ|नहीं हो रहा|नहीं था|की कोई शिकायत नहीं)/
];

/**
 * Checks whether matched substring is negated in context
 */
function isNegated(fullText, matchIndex, matchLength) {
  const windowBefore = fullText.slice(Math.max(0, matchIndex - 30), matchIndex).toLowerCase();
  const windowAfter = fullText.slice(matchIndex + matchLength, Math.min(fullText.length, matchIndex + matchLength + 30)).toLowerCase();

  // English negations before: "no chest pain", "denies shortness of breath"
  if (/\b(no|not|never|denies|denied|without|negative for)\s*$/i.test(windowBefore)) {
    return true;
  }
  // Hindi negations after: "छाती में दर्द नहीं है"
  if (/^\s*(नहीं है|नहीं|ना|नहीं हुआ|की कोई शिकायत नहीं)/.test(windowAfter)) {
    return true;
  }

  return false;
}

/**
 * Checks text against all deterministic red-flag patterns
 * @param {string} text - User input string
 * @returns {Array<Object>} List of detected red flags
 */
export function checkRedFlags(text) {
  if (!text || typeof text !== 'string') return [];
  const normalized = text.trim();
  const alerts = [];

  for (const def of RED_FLAG_DEFINITIONS) {
    let triggered = false;

    // Check English patterns
    for (const pattern of def.patternsEn) {
      const match = pattern.exec(normalized);
      if (match) {
        if (!isNegated(normalized, match.index, match[0].length)) {
          triggered = true;
          alerts.push({
            id: def.id,
            category: def.category,
            severity: def.severity,
            matchedKeyword: match[0],
            messageEn: def.messageEn,
            messageHi: def.messageHi,
            actionEn: def.actionEn,
            actionHi: def.actionHi
          });
          break;
        }
      }
    }

    if (triggered) continue;

    // Check Hindi patterns
    for (const pattern of def.patternsHi) {
      const match = pattern.exec(normalized);
      if (match) {
        if (!isNegated(normalized, match.index, match[0].length)) {
          alerts.push({
            id: def.id,
            category: def.category,
            severity: def.severity,
            matchedKeyword: match[0],
            messageEn: def.messageEn,
            messageHi: def.messageHi,
            actionEn: def.actionEn,
            actionHi: def.actionHi
          });
          break;
        }
      }
    }
  }

  return alerts;
}

export default checkRedFlags;
