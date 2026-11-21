# backend/app/services/dialogue/llm_client.py
# Optional LLM Integration (Gemini / Ollama) with Strict Non-Diagnostic Guardrails
import re
import os
import json
import logging
from typing import Optional, Dict, Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# Strict prohibited words for LLM outputs (Rule 1: Never diagnose, never prescribe, never advise)
FORBIDDEN_DIAGNOSIS_PATTERNS = [
    r"\b(diagnosis|diagnose[ds]?|diagnostic)\b",
    r"\b(you (might|could|seem to|probably|likely) have)\b",
    r"\b(suffering from|afflicted with|infected with)\b",
    r"\b(it looks like|sounds like you have)\b",
    r"\b(migraine|malaria|typhoid|dengue|covid|pneumonia|tuberculosis|jaundice|diabetes|hypertension)\b",
    r"(आपको\s*(माइग्रेन|मलेरिया|टाइफाइड|डेंगू|संक्रमण|बीमारी)\s*हो\s*सकता\s*है)",
    r"(यह\s*(लक्षण|बीमारी)\s*का\s*संकेत\s*है)"
]

FORBIDDEN_MEDICATION_PATTERNS = [
    r"\b(take|taking|prescribe[ds]?|prescription|dosage|dose|mg|ml)\b",
    r"\b(tablet|capsule|syrup|injection|pill|antibiotic|paracetamol|ibuprofen|aspirin|crocin)\b",
    r"\b(treatment|cure|remedy|home\s*remedy|treatment\s*plan)\b",
    r"(दवा|दवाई|गोली|खुराक|इलाज|उपचार|पेरासिटामोल)"
]

def validate_llm_question(raw_text: str, language: str = "en") -> bool:
    """
    Validates that the LLM response is strictly a single, concise clinical intake question.
    Rejects any response that contains:
    1. Multiple questions or statements
    2. Length > 220 characters or > 35 words
    3. Any diagnostic speculation
    4. Any medication or treatment suggestions
    5. Absence of a question mark
    """
    if not raw_text or not isinstance(raw_text, str):
        return False

    cleaned = raw_text.strip()

    # Must end with question mark
    if not (cleaned.endswith("?") or cleaned.endswith("？")):
        return False

    # Length guardrail (concise single question)
    if len(cleaned) > 220:
        return False
    words = cleaned.split()
    if len(words) < 3 or len(words) > 35:
        return False

    # Check for multiple sentences (cannot have multiple periods or multiple question marks)
    if cleaned.count("?") > 1 or cleaned.count(".") > 1:
        return False

    # Prohibit diagnosis keywords
    for pat in FORBIDDEN_DIAGNOSIS_PATTERNS:
        if re.search(pat, cleaned, re.IGNORECASE):
            logger.warning(f"Guardrail tripped: Prohibited diagnosis pattern '{pat}' in LLM output: {cleaned}")
            return False

    # Prohibit medication and prescribing keywords
    for pat in FORBIDDEN_MEDICATION_PATTERNS:
        if re.search(pat, cleaned, re.IGNORECASE):
            logger.warning(f"Guardrail tripped: Prohibited medication pattern '{pat}' in LLM output: {cleaned}")
            return False

    return True


def call_llm_for_followup(
    symptoms: list,
    duration: Optional[str],
    current_answer: str,
    language: str = "en"
) -> Optional[str]:
    """
    Calls the configured LLM (Gemini or Ollama) to generate a single follow-up question.
    Returns None if:
    - LLM_PROVIDER is 'none' or unconfigured
    - Call times out or errors
    - Output fails strict guardrail validation
    """
    provider = (getattr(settings, "LLM_PROVIDER", None) or "none").strip().lower()
    if provider == "none" or not provider:
        return None

    lang_instr = "Hindi (Devanagari script or clean Roman Hindi)" if language.startswith("hi") else "English"
    sym_str = ", ".join([s.get("name_en", "") for s in symptoms]) if symptoms else "reported discomfort"

    system_prompt = (
        f"You are RogMitra's Clinical Intake Question Assistant. Your ONLY job is to suggest ONE single, concise follow-up question in {lang_instr} to ask the patient about their reported symptoms.\n"
        "STRICT SAFETY RULES:\n"
        "1. NEVER diagnose, state or guess any disease name (do NOT say migraine, infection, malaria, typhoid, etc.).\n"
        "2. NEVER prescribe, suggest or name any medicine, drug, treatment, or remedy.\n"
        "3. NEVER give medical advice.\n"
        "4. Ask exactly ONE concise question (under 25 words), ending with a question mark.\n"
        "5. Output ONLY the question text and nothing else."
    )

    user_prompt = (
        f"Patient reported symptom(s): {sym_str}. "
        f"Duration: {duration or 'not specified'}. "
        f"Patient's latest statement: '{current_answer}'. "
        f"Suggest the next SOCRATES follow-up question in {lang_instr}."
    )

    try:
        raw_output = None

        if provider == "gemini":
            api_key = getattr(settings, "GEMINI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
            if not api_key:
                return None
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(f"{system_prompt}\n\n{user_prompt}")
                raw_output = response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini LLM call failed: {e}")
                return None

        elif provider == "ollama":
            base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
            model_name = getattr(settings, "OLLAMA_MODEL", "llama3")
            try:
                import httpx
                with httpx.Client(timeout=4.0) as client:
                    resp = client.post(
                        f"{base_url}/api/generate",
                        json={
                            "model": model_name,
                            "prompt": f"{system_prompt}\n\n{user_prompt}",
                            "stream": False
                        }
                    )
                    if resp.status_code == 200:
                        raw_output = resp.json().get("response", "").strip()
            except Exception as e:
                logger.warning(f"Ollama call failed: {e}")
                return None

        if raw_output:
            # Strip enclosing quotes or prefixes like "Doctor: "
            cleaned = re.sub(r'^(Question|Doctor|Assistant):\s*', '', raw_output, flags=re.IGNORECASE).strip(' "')
            if validate_llm_question(cleaned, language):
                return cleaned
            else:
                logger.info(f"LLM output rejected by clinical guardrails: '{raw_output}'")
                return None

    except Exception as e:
        logger.warning(f"LLM invocation failed: {e}")
        return None

    return None
