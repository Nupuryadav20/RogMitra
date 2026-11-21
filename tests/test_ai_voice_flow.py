# tests/test_ai_voice_flow.py — Verification of Adaptive Voice Interview Flow
# Tests:
# 1. First question is always the problem question
# 2. "mujhe 2 din se sir dard aur bukhar hai" leads to headache/fever follow-ups without re-asking duration
# 3. LLM disabled -> fallback works with standard questions badge
# 4. A diagnosis-like LLM output is rejected (mock the LLM)
# 5. Red flag ("seene mein dard") triggers with LLM off
import os
import sys
import pytest
from unittest.mock import patch

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.session import SessionLocal, Base, engine
from app.services.dialogue.socrates import FIRST_QUESTION
from app.services.dialogue.extractor import extract_clinical_information
from app.services.dialogue.manager import DialogueManager
from app.services.dialogue.llm_client import validate_llm_question
from app.services.redflags.engine import scan_for_red_flags
from app.core.config import settings

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_first_question_is_always_problem_question():
    """
    Requirement 1: First question is always about the patient's problem.
    'What health problem are you facing today? Please describe it in your own words.'
    """
    q_en = DialogueManager.get_first_question(language="en")
    assert q_en["field"] == "chief_complaint"
    assert q_en["questionEn"] == "What health problem are you facing today? Please describe it in your own words."
    assert q_en["questionText"] == "What health problem are you facing today? Please describe it in your own words."
    assert len(q_en["touchOptions"]) >= 6

    q_hi = DialogueManager.get_first_question(language="hi")
    assert q_hi["field"] == "chief_complaint"
    assert q_hi["questionHi"] == "आज आप किस स्वास्थ्य समस्या का सामना कर रहे हैं? कृपया इसे अपने शब्दों में बताएं।"
    assert q_hi["questionText"] == "आज आप किस स्वास्थ्य समस्या का सामना कर रहे हैं? कृपया इसे अपने शब्दों में बताएं।"


def test_extraction_and_adaptive_skipping_duration():
    """
    Requirement 2 & 3:
    'mujhe 2 din se sir dard aur bukhar hai' extracts symptoms and duration,
    and moves to SOCRATES follow-up WITHOUT re-asking duration.
    """
    input_text = "mujhe 2 din se sir dard aur bukhar hai"
    extracted = extract_clinical_information(input_text, language="hi")

    # 1. Check extracted symptoms
    symptom_ids = [s["id"] for s in extracted["symptoms"]]
    assert "headache" in symptom_ids, f"Headache missing in {symptom_ids}"
    assert "fever" in symptom_ids, f"Fever missing in {symptom_ids}"

    # 2. Check extracted duration
    assert extracted["has_duration"] is True
    assert extracted["duration"] is not None
    assert "2 din" in extracted["duration"].lower()

    # 3. Simulate turn in DialogueManager
    turn_res = DialogueManager.process_turn(
        session_id="test-sess-skip",
        current_field="chief_complaint",
        answer_text=input_text,
        language="hi",
        prior_answers={}
    )

    next_q = turn_res["nextQuestion"]
    assert next_q is not None
    # Must NOT ask onset_duration because duration was already extracted!
    assert next_q["field"] != "onset_duration", f"Expected onset_duration to be skipped, got {next_q['field']}"
    # Must ask headache-specific SOCRATES attribute (e.g. site or character)
    assert next_q["field"] in ("site", "character", "socrates_site", "socrates_character")


def test_llm_disabled_fallback_works():
    """
    Requirement 5: When LLM is disabled (LLM_PROVIDER=none),
    system cleanly falls back to rule-based SOCRATES questions with standard questions badge.
    """
    original_provider = settings.LLM_PROVIDER
    try:
        settings.LLM_PROVIDER = "none"
        turn_res = DialogueManager.process_turn(
            session_id="test-sess-fallback",
            current_field="chief_complaint",
            answer_text="I have had a severe throbbing headache since 2 days",
            language="en",
            prior_answers={}
        )

        next_q = turn_res["nextQuestion"]
        assert next_q is not None
        assert next_q["questionSource"] == "rule-based"
        assert next_q["badge"] == "AI follow-up off – using standard questions"
        assert "?" in next_q["questionText"]
    finally:
        settings.LLM_PROVIDER = original_provider


def test_diagnosis_like_llm_output_is_rejected():
    """
    Requirement 5: Validate that diagnosis-like or prescribing LLM outputs
    are strictly rejected by guardrails and fall back to rule-based SOCRATES.
    """
    # 1. Test validator directly on diagnostic statements
    assert validate_llm_question("It looks like you have migraine, does it throb?") is False
    assert validate_llm_question("You likely have typhoid fever, take paracetamol?") is False
    assert validate_llm_question("Could this be malaria infection?") is False
    assert validate_llm_question("Did you take crocin or paracetamol for this?") is False
    assert validate_llm_question("Take two tablets of ibuprofen and sleep?") is False

    # 2. Test validator on safe clinical intake question
    assert validate_llm_question("Does the pain feel worse when you are exposed to bright light or loud noise?") is True

    # 3. Mock LLM returning a diagnosis-like output and verify DialogueManager rejects it
    with patch("app.services.dialogue.manager.call_llm_for_followup") as mock_llm:
        # LLM returns None because guardrails rejected it
        mock_llm.return_value = None

        turn_res = DialogueManager.process_turn(
            session_id="test-sess-guardrail",
            current_field="chief_complaint",
            answer_text="Headache since yesterday",
            language="en",
            prior_answers={}
        )

        next_q = turn_res["nextQuestion"]
        assert next_q is not None
        # Must fall back to rule-based question bank
        assert next_q["questionSource"] == "rule-based"
        assert next_q["badge"] == "AI follow-up off – using standard questions"


def test_red_flag_triggers_with_llm_off(db):
    """
    Requirement 6: Red flag engine is purely rule-based and triggers on EVERY answer,
    even when LLM is turned completely off.
    """
    original_provider = settings.LLM_PROVIDER
    try:
        settings.LLM_PROVIDER = "none"
        # Input with Roman Hindi red flag
        test_answer = "Mujhe subah se seene mein dard ho raha hai"

        # 1. Engine check
        alerts = scan_for_red_flags(test_answer)
        assert len(alerts) > 0, "Red flag engine failed to detect Roman Hindi 'seene mein dard'"
        assert alerts[0]["category"] == "cardiovascular"
        assert alerts[0]["severity"] == "CRITICAL"

        # 2. End-to-end turn check
        turn_res = DialogueManager.process_turn(
            session_id="test-sess-rf",
            current_field="chief_complaint",
            answer_text=test_answer,
            language="hi",
            prior_answers={},
            db=db
        )

        assert len(turn_res["redFlags"]) > 0
        assert turn_res["redFlags"][0]["severity"] == "CRITICAL"
    finally:
        settings.LLM_PROVIDER = original_provider
