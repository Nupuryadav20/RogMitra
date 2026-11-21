# tests/test_persistence_lifecycle.py
# Verification of end-to-end database persistence across server restarts / reloads
import sys
import os
import pytest
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.session import SessionLocal, Base, engine
from app.db.models import (
    User, PatientProfile, Consent, InterviewSession, InterviewAnswer,
    Document, ExtractedEntity, AyurvedaAssessment, ClinicalSummary,
    DoctorNote, RedFlagAlert
)
from app.api.auth import verify_otp, login_doctor
from app.schemas.auth import VerifyOtpSchema, LoginDoctorSchema
from app.api.consent import grant_consent, get_consent_status
from app.schemas.session import ConsentGrantSchema
from app.api.session import start_session, save_answer, submit_session, get_latest_patient_session
from app.schemas.session import AnswerSubmitSchema
from app.api.ayurveda import submit_ayurvedic_assessment
from app.schemas.ayurveda import AyurvedaSubmitSchema
from app.api.doctor import get_opd_queue, get_patient_redflags, get_doctor_patient_reports
from app.api.summary import get_patient_summary, approve_summary, add_doctor_note
from app.schemas.summary import SummaryReviewSchema, DoctorNoteSchema

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_full_database_persistence_and_reload(db):
    """
    Simulates:
    1. Patient registration & login -> saved in `users` & `patient_profiles`
    2. Consent acceptance -> saved in `consents`
    3. Voice interview question answers -> saved in `interview_sessions` & `interview_answers`
    4. Deterministic red flag triage -> saved in `red_flag_alerts`
    5. Document upload -> saved in `documents` & `extracted_entities`
    6. Ayurvedic assessment answers -> saved in `ayurveda_assessments`
    7. Summary generation -> saved in `clinical_summaries`
    8. Doctor reviews, adds clinical notes & approves note -> saved in `doctor_notes` & `clinical_summaries`
    9. Simulates database connection reset / restart and confirms all data is reloaded accurately.
    """
    test_phone = f"99{datetime.utcnow().strftime('%f')[:8]}"
    patient_name = "Kavita Nair"

    # Step 1: Patient Login / Registration
    auth_res = verify_otp(VerifyOtpSchema(phone=test_phone, otp="123456", name=patient_name), db=db)
    patient_id = auth_res.user_id
    assert patient_id is not None
    assert auth_res.role == "patient"

    # Step 2: Consent
    consent_res = grant_consent(ConsentGrantSchema(
        userId=patient_id,
        purpose="pre_consultation_case_taking",
        consentScope="all"
    ), db=db)
    assert consent_res["success"] is True
    assert get_consent_status(patient_id, db=db)["has_consent"] is True

    # Step 3: Voice / Touch Interview Session
    sess_res = start_session(patientId=patient_id, language="en", db=db)
    session_id = sess_res["sessionId"]

    ans1 = save_answer(AnswerSubmitSchema(
        sessionId=session_id,
        fieldName="chief_complaint",
        answerText="Severe persistent headache for 4 days with nausea",
        inputMode="voice"
    ), db=db)
    assert ans1["success"] is True

    ans2 = save_answer(AnswerSubmitSchema(
        sessionId=session_id,
        fieldName="past_medical",
        answerText="Asthma since childhood; uses salbutamol inhaler SOS",
        inputMode="touch"
    ), db=db)
    assert ans2["success"] is True

    submit_res = submit_session(sessionId=session_id, db=db)
    assert submit_res["success"] is True

    # Step 4: Red Flag Alert creation
    rf = RedFlagAlert(
        session_id=session_id,
        patient_id=patient_id,
        category="neurological",
        severity="URGENT",
        keyword_matched="headache for 4 days",
        alert_message="Persistent headache (> 3 days duration)"
    )
    db.add(rf)
    db.commit()

    # Step 5: Medical Document & Entity Upload
    doc = Document(
        session_id=session_id,
        patient_id=patient_id,
        original_filename="Patient_Lab_Report.pdf",
        stored_filename="stored_test_doc.pdf",
        file_path="uploads/stored_test_doc.pdf",
        file_size=10240,
        mime_type="application/pdf",
        report_type="Lab Report"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    entity = ExtractedEntity(
        document_id=doc.id,
        entity_type="vital",
        key_name="Blood Pressure",
        value_text="120/80",
        unit="mmHg",
        status_flag="Normal",
        is_abnormal=False
    )
    db.add(entity)
    db.commit()

    # Step 6: Ayurvedic Assessment
    ayur_res = submit_ayurvedic_assessment(AyurvedaSubmitSchema(
        sessionId=session_id,
        answers={"P1Q1": "A", "P1Q2": "B", "P3Q1": "B"}
    ), db=db)
    assert ayur_res["success"] is True

    # Step 7: Clinical Summary Retrieval & Generation
    summary = get_patient_summary(patientId=patient_id, db=db)
    assert summary["presentingComplaint"] == "Severe persistent headache for 4 days with nausea"
    summary_id = summary["id"]

    # Step 8: Doctor Review & Actions
    doc_auth = login_doctor(LoginDoctorSchema(email="dr.sharma@hospital.org", password="Doctor@123"), db=db)
    assert doc_auth.role == "doctor"

    note_res = add_doctor_note(summary_id, DoctorNoteSchema(noteText="Advised migraine protocol."), db=db)
    assert note_res["success"] is True

    appr_res = approve_summary(summary_id, SummaryReviewSchema(
        summaryId=summary_id,
        doctorName="Dr. R. Sharma",
        doctorNotes="Approved clinical summary note."
    ), db=db)
    assert appr_res["status"] == "approved"

    # Step 9: SIMULATE BACKEND RESTART & VERIFY DATA IS RELOADED FROM DISK
    db.close()
    new_db = SessionLocal()
    try:
        # Check user profile reloaded
        reloaded_user = new_db.query(User).filter(User.id == patient_id).first()
        assert reloaded_user is not None
        assert reloaded_user.full_name == patient_name
        assert reloaded_user.profile is not None

        # Check consent reloaded
        reloaded_consent = new_db.query(Consent).filter(Consent.user_id == patient_id).first()
        assert reloaded_consent is not None
        assert reloaded_consent.is_granted is True

        # Check interview answers reloaded
        reloaded_sess = get_latest_patient_session(patientId=patient_id, db=new_db)
        assert reloaded_sess["sessionId"] == session_id
        assert len(reloaded_sess["answers"]) == 2
        complaints = [a["answer"] for a in reloaded_sess["answers"]]
        assert "Severe persistent headache for 4 days with nausea" in complaints

        # Check red flags reloaded
        reloaded_rf = get_patient_redflags(patient_id=patient_id, db=new_db)
        assert len(reloaded_rf) == 1
        assert reloaded_rf[0]["severity"] == "URGENT"

        # Check documents & extracted entities reloaded
        reloaded_docs = get_doctor_patient_reports(patient_id=patient_id, db=new_db)
        assert len(reloaded_docs) == 1
        assert reloaded_docs[0]["filename"] == "Patient_Lab_Report.pdf"
        assert len(reloaded_docs[0]["findings"]) == 1
        assert reloaded_docs[0]["findings"][0]["test"] == "Blood Pressure"

        # Check ayurveda assessment reloaded
        ayur_record = new_db.query(AyurvedaAssessment).filter(AyurvedaAssessment.session_id == session_id).first()
        assert ayur_record is not None
        assert ayur_record.answers_json == {"P1Q1": "A", "P1Q2": "B", "P3Q1": "B"}

        # Check summary status & doctor review reloaded
        reloaded_summary = get_patient_summary(patientId=patient_id, db=new_db)
        assert reloaded_summary["status"] == "approved"
        assert reloaded_summary["reviewedBy"] == "Dr. R. Sharma"

        # Check OPD queue contains this patient
        opd_queue = get_opd_queue(db=new_db)
        queue_ids = [p["id"] for p in opd_queue]
        assert patient_id in queue_ids
    finally:
        new_db.close()
