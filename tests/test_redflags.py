# tests/test_redflags.py — Comprehensive unit tests for bilingual rule-based red flag engine
import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.services.redflags.engine import scan_for_red_flags, is_negated

def test_english_red_flag_positive_triggers():
    # Chest pain
    r1 = scan_for_red_flags("I have acute chest pain and pressure since 1 hour")
    assert len(r1) == 1
    assert r1[0]["id"] == "CHEST_PAIN"
    assert r1[0]["severity"] == "CRITICAL"

    # Dyspnea / Breathlessness
    r2 = scan_for_red_flags("Patient reports severe shortness of breath and difficulty breathing")
    assert any(rf["id"] == "BREATHLESSNESS" for rf in r2)

    # Loss of consciousness
    r3 = scan_for_red_flags("He passed out and lost consciousness at work")
    assert any(rf["id"] == "LOSS_OF_CONSCIOUSNESS" for rf in r3)

    # Severe bleeding
    r4 = scan_for_red_flags("Patient is vomiting blood since morning")
    assert any(rf["id"] == "SEVERE_BLEEDING" for rf in r4)

    # Stroke signs
    r5 = scan_for_red_flags("Sudden slurred speech and right arm weakness")
    assert any(rf["id"] == "STROKE_SIGNS" for rf in r5)

def test_hindi_red_flag_positive_triggers():
    # छाती में दर्द
    r1 = scan_for_red_flags("मुझे सुबह से छाती में तेज दर्द महसूस हो रहा है")
    assert any(rf["id"] == "CHEST_PAIN" for rf in r1)

    # सांस लेने में तकलीफ
    r2 = scan_for_red_flags("मरीज को सांस लेने में तकलीफ है और दम घुट रहा है")
    assert any(rf["id"] == "BREATHLESSNESS" for rf in r2)

    # बेहोशी
    r3 = scan_for_red_flags("रोगी चक्कर खाकर बेहोश हो गया")
    assert any(rf["id"] == "LOSS_OF_CONSCIOUSNESS" for rf in r3)

    # खून की उल्टी
    r4 = scan_for_red_flags("आज दो बार खून की उल्टी हुई है")
    assert any(rf["id"] == "SEVERE_BLEEDING" for rf in r4)

def test_english_negation_handling():
    # "no chest pain" should NOT trigger
    res_no = scan_for_red_flags("Patient has fever and cough, but no chest pain")
    assert not any(rf["id"] == "CHEST_PAIN" for rf in res_no)

    # "denies shortness of breath" should NOT trigger
    res_denies = scan_for_red_flags("Denies shortness of breath or difficulty breathing")
    assert not any(rf["id"] == "BREATHLESSNESS" for rf in res_denies)

    # "without bleeding" should NOT trigger
    res_without = scan_for_red_flags("Mild abdominal discomfort without bleeding")
    assert not any(rf["id"] == "SEVERE_BLEEDING" for rf in res_without)

def test_hindi_negation_handling():
    # "छाती में दर्द नहीं है" should NOT trigger
    res_hi_neg1 = scan_for_red_flags("हल्का बुखार है पर छाती में दर्द नहीं है")
    assert not any(rf["id"] == "CHEST_PAIN" for rf in res_hi_neg1)

    # "सांस फूलने की कोई शिकायत नहीं" should NOT trigger
    res_hi_neg2 = scan_for_red_flags("खांसी है लेकिन सांस फूलने की कोई शिकायत नहीं")
    assert not any(rf["id"] == "BREATHLESSNESS" for rf in res_hi_neg2)

    # "बेहोश नहीं हुआ" should NOT trigger
    res_hi_neg3 = scan_for_red_flags("चक्कर आया था पर मरीज बेहोश नहीं हुआ")
    assert not any(rf["id"] == "LOSS_OF_CONSCIOUSNESS" for rf in res_hi_neg3)
