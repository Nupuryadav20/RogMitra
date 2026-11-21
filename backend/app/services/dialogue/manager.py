# backend/app/services/dialogue/manager.py
# Intelligent Adaptive Clinical Dialogue Manager with SOCRATES slot-filling,
# deterministic bilingual red flags, adaptive skipping, and guarded LLM follow-ups.
from typing import Dict, Any, List, Optional
import json

from app.services.dialogue.extractor import extract_clinical_information
from app.services.dialogue.socrates import (
    FIRST_QUESTION, SOCRATES_QUESTIONS_MAP, GENERIC_SOCRATES_ONSET,
    SYSTEMIC_QUESTIONS
)
from app.services.dialogue.llm_client import call_llm_for_followup
from app.services.redflags.engine import scan_for_red_flags
from app.db.models import RedFlagAlert

class DialogueManager:
    """
    Orchestrates the patient interview:
    1. First question is ALWAYS FIRST_QUESTION (Chief Complaint).
    2. Runs rule-based entity extractor for symptoms, duration, and details.
    3. Traverses SOCRATES for active symptoms, skipping already answered slots (e.g. duration).
    4. Seamlessly checks and records rule-based red flags on every turn.
    5. Optionally attempts guarded LLM follow-up question; falls back to rule-based on failure/timeout.
    """

    @staticmethod
    def get_first_question(language: str = "en") -> Dict[str, Any]:
        """
        Rule 1: The first question is non-negotiable and always about the patient's complaint.
        """
        is_hi = language.startswith("hi")
        q = dict(FIRST_QUESTION)
        q["questionText"] = q["questionHi"] if is_hi else q["questionEn"]
        q["badge"] = "AI follow-up off – using standard questions"
        return q

    @staticmethod
    def process_turn(
        session_id: str,
        current_field: str,
        answer_text: str,
        language: str = "en",
        prior_answers: Optional[Dict[str, str]] = None,
        db: Optional[Any] = None
    ) -> Dict[str, Any]:
        is_hi = language.startswith("hi")
        prior = prior_answers or {}
        prior[current_field] = answer_text

        # -------------------------------------------------------------
        # STEP 1: Purely rule-based red-flag detection on EVERY answer
        # -------------------------------------------------------------
        alerts = scan_for_red_flags(answer_text)
        saved_alerts = []
        if alerts and db:
            for a in alerts:
                rf_entry = RedFlagAlert(
                    session_id=session_id,
                    patient_id=session_id,
                    category=a["category"],
                    severity=a["severity"],
                    keyword_matched=a["keyword"],
                    alert_message=a["message_hi"] if is_hi else a["message_en"],
                    is_acknowledged=False
                )
                db.add(rf_entry)
                saved_alerts.append(a)
            db.commit()
        elif alerts:
            saved_alerts = alerts

        # -------------------------------------------------------------
        # STEP 2: Clinical Entity & Symptom Extraction
        # -------------------------------------------------------------
        # Analyze chief complaint or combined patient symptom text
        complaint_text = prior.get("chief_complaint", answer_text)
        extraction = extract_clinical_information(complaint_text, language)

        # Check if duration was mentioned in the current answer as well
        cur_dur = extract_clinical_information(answer_text, language).get("duration")
        if cur_dur and not extraction.get("duration"):
            extraction["duration"] = cur_dur
            extraction["has_duration"] = True

        # If duration is already extracted, mark onset_duration as satisfied
        if extraction.get("has_duration") and not prior.get("onset_duration"):
            prior["onset_duration"] = extraction["duration"]

        symptoms = extraction.get("symptoms", [])
        primary_sym_id = extraction["primary_symptom"]["id"] if extraction.get("primary_symptom") else "headache"
        secondary_sym_ids = [s["id"] for s in extraction.get("associated_symptoms", [])]

        # -------------------------------------------------------------
        # STEP 3: SOCRATES Slot Selection (Skipping already answered)
        # -------------------------------------------------------------
        next_q_data = None
        socrates_order = ["site", "onset_duration", "character", "radiation", "associated_symptoms", "time_course", "exacerbating_relieving", "severity"]

        # Check slots for primary symptom
        sym_q_map = SOCRATES_QUESTIONS_MAP.get(primary_sym_id, SOCRATES_QUESTIONS_MAP["headache"])

        for slot in socrates_order:
            if slot in prior and prior[slot]:
                continue
            if slot == "onset_duration" and extraction.get("has_duration"):
                continue # Skip asking onset/duration because patient already gave duration!

            if slot in sym_q_map:
                next_q_data = dict(sym_q_map[slot])
                break
            elif slot == "onset_duration":
                next_q_data = dict(GENERIC_SOCRATES_ONSET)
                break

        # If primary symptom SOCRATES is satisfied, check secondary symptoms
        if not next_q_data and secondary_sym_ids:
            for sec_id in secondary_sym_ids:
                sec_map = SOCRATES_QUESTIONS_MAP.get(sec_id)
                if sec_map:
                    for sec_slot, sec_q in sec_map.items():
                        field_key = f"{sec_id}_{sec_slot}"
                        if field_key not in prior and sec_slot not in prior:
                            next_q_data = dict(sec_q)
                            next_q_data["field"] = field_key
                            break
                if next_q_data:
                    break

        # If symptom SOCRATES is complete, proceed to systemic medical history
        if not next_q_data:
            for sys_q in SYSTEMIC_QUESTIONS:
                if sys_q["field"] not in prior:
                    next_q_data = dict(sys_q)
                    break

        # If all slots filled, interview is complete!
        if not next_q_data:
            return {
                "redFlags": saved_alerts,
                "extracted": extraction,
                "nextQuestion": None,
                "isComplete": True,
                "badge": "Interview Completed"
            }

        # -------------------------------------------------------------
        # STEP 4: LLM Question Generation with Strict Guardrails
        # -------------------------------------------------------------
        # Attempt LLM generation if configured
        llm_question = call_llm_for_followup(
            symptoms=symptoms,
            duration=extraction.get("duration"),
            current_answer=answer_text,
            language=language
        )

        if llm_question:
            # LLM successfully produced a safe, validated single follow-up question
            next_q_data["questionText"] = llm_question
            next_q_data["questionSource"] = "llm-generated"
            next_q_data["badge"] = "AI-generated question"
        else:
            # Deterministic SOCRATES rule-based fallback
            next_q_data["questionText"] = next_q_data["questionHi"] if is_hi else next_q_data["questionEn"]
            next_q_data["questionSource"] = "rule-based"
            next_q_data["badge"] = "AI follow-up off – using standard questions"

        return {
            "redFlags": saved_alerts,
            "extracted": extraction,
            "nextQuestion": next_q_data,
            "isComplete": False,
            "badge": next_q_data["badge"]
        }
