# tests/test_demo_auth.py — Verification of DEMO LOGIN MODE & strict fallback validation
import os
import sys
import pytest

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.session import SessionLocal
from app.db.models import User
from app.api.auth import request_otp, verify_otp, login_doctor, mock_abha, get_auth_config
from app.schemas.auth import RequestOtpSchema, VerifyOtpSchema, LoginDoctorSchema, MockAbhaSchema
from app.core.config import settings
from fastapi import HTTPException

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_demo_login_config():
    cfg = get_auth_config()
    assert "demo_login_open" in cfg
    assert cfg["demo_login_open"] is True

def test_demo_patient_empty_input(db):
    # In demo mode, empty inputs succeed and create a Demo Patient
    req = verify_otp(VerifyOtpSchema(phone="", otp="", name=""), db=db)
    assert req.role == "patient"
    assert req.access_token is not None
    assert req.full_name == "Demo Patient"

def test_demo_patient_random_input(db):
    # Any phone (even 1 digit or random text) and any OTP succeeds
    payload = VerifyOtpSchema(phone="9", otp="999999", name="Vikram Malhotra")
    res = verify_otp(payload, db=db)
    assert res.role == "patient"
    assert res.full_name == "Vikram Malhotra"
    assert res.phone == "9"

    # Re-login with same phone should retrieve the same user
    res2 = verify_otp(VerifyOtpSchema(phone="9", otp="000"), db=db)
    assert res2.user_id == res.user_id

def test_demo_doctor_empty_and_random_input(db):
    # Empty inputs for doctor succeed and create Dr. Demo
    res1 = login_doctor(LoginDoctorSchema(email="", password="", name=""), db=db)
    assert res1.role == "doctor"
    assert res1.full_name == "Dr. Demo"

    # Random credentials succeed
    res2 = login_doctor(LoginDoctorSchema(email="random.doc@cityclinic.in", password="any", name="Dr. Ayesha Khan"), db=db)
    assert res2.role == "doctor"
    assert res2.full_name == "Dr. Ayesha Khan"

def test_demo_mock_abha_random(db):
    # Any ABHA ID succeeds
    res = mock_abha(MockAbhaSchema(abhaId="random-health-id@abdm", name="Pooja Sharma"), db=db)
    assert res.role == "patient"
    assert res.abha_id == "random-health-id@abdm"
    assert res.full_name == "Pooja Sharma"

def test_real_validation_when_demo_closed(db):
    # Temporarily switch DEMO_LOGIN_OPEN to False
    original_flag = settings.DEMO_LOGIN_OPEN
    try:
        settings.DEMO_LOGIN_OPEN = False

        # Request OTP with invalid phone should raise 400
        with pytest.raises(HTTPException) as exc_otp:
            request_otp(RequestOtpSchema(phone="123"), db=db)
        assert exc_otp.value.status_code == 400

        # Verify OTP with invalid phone should raise 400
        with pytest.raises(HTTPException) as exc_v:
            verify_otp(VerifyOtpSchema(phone="123", otp="123456"), db=db)
        assert exc_v.value.status_code == 400

        # Doctor login with invalid credentials should raise 400/401
        with pytest.raises(HTTPException) as exc_doc:
            login_doctor(LoginDoctorSchema(email="", password=""), db=db)
        assert exc_doc.value.status_code == 400

        # Mock ABHA with empty string should raise 400
        with pytest.raises(HTTPException) as exc_abha:
            mock_abha(MockAbhaSchema(abhaId=""), db=db)
        assert exc_abha.value.status_code == 400

    finally:
        settings.DEMO_LOGIN_OPEN = original_flag
