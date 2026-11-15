// ayurvedaQuestions.js — Re-exports Ayurvedic question bank with prototype disclaimer
// Rule 8: Prototype question bank — marked "pending validation by a qualified Ayurvedic practitioner"
import questionsJson from './ayurvedaQuestions.json';

export const AYURVEDA_DISCLAIMER_EN = "This Ayurvedic questionnaire is a prototype for research and pre-consultation intake. Pending validation by a qualified Ayurvedic practitioner (BAMS/MD). Not for autonomous diagnosis or treatment.";
export const AYURVEDA_DISCLAIMER_HI = "यह आयुर्वेदिक प्रश्नावली शोध और पूर्व-परामर्श के लिए एक प्रोटोटाइप है। योग्य आयुर्वेदिक चिकित्सक (BAMS/MD) द्वारा सत्यापन लंबित है। इसका उपयोग निदान या उपचार के लिए न करें।";

export const ayurvedaData = questionsJson;
export const ayurvedaPillars = questionsJson.pillars;

export default ayurvedaData;
