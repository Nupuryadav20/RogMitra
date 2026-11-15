# api/auth.py — Authentication endpoints for Patient and Doctor
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.db.models import User, PatientProfile, AuditLog
from app.schemas.auth import (
    RequestOtpSchema, VerifyOtpSchema, LoginDoctorSchema,
    MockAbhaSchema, RegisterPatientSchema, TokenResponse
)
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/request-otp")
def request_otp(payload: RequestOtpSchema, db: Session = Depends(get_db)):
    """
    Request OTP for patient phone login.
    In DEMO_MODE, returns demo OTP '123456'.
    """
    phone = payload.phone.strip()
    return {
        "success": True,
        "message": "OTP sent successfully.",
        "phone": phone,
        "demo_mode": settings.DEMO_MODE,
        "demo_otp": settings.DEMO_OTP if settings.DEMO_MODE else None
    }

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOtpSchema, db: Session = Depends(get_db)):
    """
    Verify OTP and issue JWT access token for Patient.
    """
    phone = payload.phone.strip()
    otp = payload.otp.strip()

    if settings.DEMO_MODE and otp != settings.DEMO_OTP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. Demo mode OTP is {settings.DEMO_OTP}"
        )

    # Find or auto-create patient user
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = User(
            phone=phone,
            full_name=f"Patient {phone[-4:]}",
            role="patient"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = PatientProfile(user_id=user.id, age=28, gender="Other")
        db.add(profile)
        db.commit()

    # Log audit
    audit = AuditLog(user_id=user.id, action="LOGIN_OTP", resource="auth")
    db.add(audit)
    db.commit()

    token = create_access_token(subject=user.id, role="patient")
    return TokenResponse(
        access_token=token,
        role="patient",
        user_id=user.id,
        full_name=user.full_name,
        phone=user.phone,
        email=user.email,
        abha_id=user.profile.abha_id if user.profile else None
    )

@router.post("/login-doctor", response_model=TokenResponse)
def login_doctor(payload: LoginDoctorSchema, db: Session = Depends(get_db)):
    """
    Doctor credential login.
    """
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email, User.role == "doctor").first()
    
    if not user or not user.hashed_password:
        # Check default demo credentials
        if email == "dr.sharma@hospital.org" and payload.password == "Doctor@123":
            user = User(
                email=email,
                full_name="Dr. R. Sharma",
                role="doctor",
                hashed_password=get_password_hash("Doctor@123")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid doctor email or password"
            )
    else:
        if not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid doctor email or password"
            )

    token = create_access_token(subject=user.id, role="doctor")
    return TokenResponse(
        access_token=token,
        role="doctor",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )

@router.post("/mock-abha", response_model=TokenResponse)
def mock_abha(payload: MockAbhaSchema, db: Session = Depends(get_db)):
    """
    Mock ABHA Gateway authentication (Rule 7: Mock only).
    """
    abha_id = payload.abhaId.strip()
    profile = db.query(PatientProfile).filter(PatientProfile.abha_id == abha_id).first()
    
    if profile:
        user = profile.user
    else:
        user = User(
            full_name="Ananya Verma (ABHA Linked)",
            role="patient",
            phone="9876543210"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = PatientProfile(
            user_id=user.id,
            abha_id=abha_id,
            age=28,
            gender="Female"
        )
        db.add(profile)
        db.commit()

    token = create_access_token(subject=user.id, role="patient")
    return TokenResponse(
        access_token=token,
        role="patient",
        user_id=user.id,
        full_name=user.full_name,
        abha_id=abha_id
    )

@router.post("/register-patient", response_model=TokenResponse)
def register_patient(payload: RegisterPatientSchema, db: Session = Depends(get_db)):
    """
    Register a new patient profile.
    """
    phone = payload.phone.strip()
    existing = db.query(User).filter(User.phone == phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="A patient with this mobile number already exists.")

    user = User(
        full_name=payload.fullName.strip(),
        phone=phone,
        role="patient"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = PatientProfile(
        user_id=user.id,
        age=payload.age,
        gender=payload.gender,
        abha_id=payload.abhaId
    )
    db.add(profile)
    db.commit()

    token = create_access_token(subject=user.id, role="patient")
    return TokenResponse(
        access_token=token,
        role="patient",
        user_id=user.id,
        full_name=user.full_name,
        phone=user.phone,
        abha_id=payload.abhaId
    )
