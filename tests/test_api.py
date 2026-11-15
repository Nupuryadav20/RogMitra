# test_api.py — Comprehensive pytest unit tests for Phase 4 APIs
import sys
import os
import pytest
from io import BytesIO

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.session import SessionLocal, Base, engine
from app.main import app
from app.db import models

# Use a direct test database session
@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_api_health_endpoint():
    from app.main import health_check
    res = health_check()
    assert res["status"] == "healthy"
    assert res["project"] == "RogMitra"
    assert res["services"]["database"] == "sqlite_ready"

def test_auth_request_and_verify_otp(db):
    from app.api.auth import request_otp, verify_otp
    from app.schemas.auth import RequestOtpSchema, VerifyOtpSchema

    # 1. Request OTP
    req = request_otp(RequestOtpSchema(phone="9876543210"), db=db)
    assert req["success"] is True
    assert req["demo_otp"] == "123456"

    # 2. Verify OTP
    ver = verify_otp(VerifyOtpSchema(phone="9876543210", otp="123456"), db=db)
    assert ver.access_token is not None
    assert ver.role == "patient"
    assert ver.phone == "9876543210"

def test_auth_doctor_login(db):
    from app.api.auth import login_doctor
    from app.schemas.auth import LoginDoctorSchema

    doc_res = login_doctor(LoginDoctorSchema(email="dr.sharma@hospital.org", password="Doctor@123"), db=db)
    assert doc_res.role == "doctor"
    assert doc_res.full_name == "Dr. R. Sharma"

def test_consent_lifecycle(db):
    from app.api.consent import grant_consent, get_consent_status, revoke_consent
    from app.schemas.session import ConsentGrantSchema
    from app.db.models import User

    patient = db.query(User).filter(User.phone == "9876543210").first()
    assert patient is not None

    # Grant
    g_res = grant_consent(ConsentGrantSchema(userId=patient.id), db=db)
    assert g_res["success"] is True

    # Check status
    st = get_consent_status(patient.id, db=db)
    assert st["has_consent"] is True

    # Revoke
    rev = revoke_consent(patient.id, db=db)
    assert rev["success"] is True

    # Check status again
    st_after = get_consent_status(patient.id, db=db)
    assert st_after["has_consent"] is False

def test_session_lifecycle_and_draft_summary(db):
    from app.api.session import start_session, save_answer, submit_session, get_session
    from app.schemas.session import AnswerSubmitSchema
    from app.db.models import User

    patient = db.query(User).filter(User.phone == "9876543210").first()
    
    # 1. Start session
    s_res = start_session(patientId=patient.id, language="en", db=db)
    session_id = s_res["sessionId"]
    assert session_id is not None

    # 2. Save answers
    ans_res = save_answer(AnswerSubmitSchema(
        sessionId=session_id,
        fieldName="chief_complaint",
        questionText="What is your main problem?",
        answerText="Severe headache and fever",
        inputMode="voice"
    ), db=db)
    assert ans_res["success"] is True

    # 3. Submit session
    sub_res = submit_session(session_id, db=db)
    assert sub_res["success"] is True
    assert sub_res["status"] == "draft"

    # 4. Verify in get_session
    info = get_session(session_id, db=db)
    assert info["status"] == "submitted"
    assert len(info["answers"]) >= 1

def test_ayurveda_questions_and_submission(db):
    from app.api.ayurveda import get_ayurvedic_questions, submit_ayurvedic_assessment
    from app.schemas.ayurveda import AyurvedaSubmitSchema
    from app.db.models import InterviewSession

    # Get questions
    q_data = get_ayurvedic_questions()
    assert "pillars" in q_data
    assert len(q_data["pillars"]) >= 4

    session = db.query(InterviewSession).first()
    assert session is not None

    # Submit assessment
    sub = submit_ayurvedic_assessment(AyurvedaSubmitSchema(
        sessionId=session.id,
        answers={"P1Q1": "B", "P1Q2": "B", "P1Q3": "A"}
    ), db=db)
    assert sub["success"] is True
    assert sub["isPrototype"] is True

def test_summary_approval_and_rejection_workflow(db):
    from app.api.summary import get_patient_summary, approve_summary, reject_summary
    from app.schemas.summary import SummaryReviewSchema, SummaryRejectSchema
    from app.db.models import ClinicalSummary

    summary = db.query(ClinicalSummary).first()
    assert summary is not None

    # Test approve
    app_res = approve_summary(summary.id, SummaryReviewSchema(
        summaryId=summary.id,
        doctorNotes="Patient examined. Advised rest and fluids."
    ), db=db)
    assert app_res["success"] is True
    assert app_res["status"] == "approved"

    # Test reject
    rej_res = reject_summary(summary.id, SummaryRejectSchema(
        summaryId=summary.id,
        reason="Incomplete medication history recorded."
    ), db=db)
    assert rej_res["success"] is True
    assert rej_res["status"] == "rejected"

def test_doctor_opd_queue(db):
    from app.api.doctor import get_opd_queue
    queue = get_opd_queue(db=db)
    assert len(queue) >= 3
    # Verify Red Flag presence
    has_cardiac = any("Chest" in q["chiefComplaint"] or any(rf["severity"] == "CRITICAL" for rf in q["redFlags"]) for q in queue)
    assert has_cardiac is True
