# api/auth.py — Authentication endpoints for Patient and Doctor
# Controlled by DEMO_LOGIN_OPEN: In demo mode, any input works and auto-creates demo users in DB.
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

@router.get("/config")
def get_auth_config():
    """
    Returns public authentication configuration flags for frontend.
    """
    return {
        "demo_login_open": settings.DEMO_LOGIN_OPEN,
        "demo_mode": settings.DEMO_MODE,
        "demo_otp": settings.DEMO_OTP
    }

@router.post("/request-otp")
def request_otp(payload: RequestOtpSchema, db: Session = Depends(get_db)):
    """
    Request OTP for patient phone login.
    In DEMO_LOGIN_OPEN mode, any phone is accepted and returns a friendly message.
    In real mode, requires a valid 10-digit phone number.
    """
    raw_phone = (payload.phone or "").strip()

    if settings.DEMO_LOGIN_OPEN:
        phone = raw_phone if raw_phone else "demo-patient"
        return {
            "success": True,
            "message": "Demo mode: enter any OTP",
            "phone": phone,
            "demo_login_open": True,
            "demo_mode": settings.DEMO_MODE,
            "demo_otp": settings.DEMO_OTP
        }

    # Real validation mode
    if not raw_phone or len(raw_phone) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid 10-digit mobile number."
        )

    return {
        "success": True,
        "message": "OTP sent successfully.",
        "phone": raw_phone,
        "demo_mode": settings.DEMO_MODE,
        "demo_otp": settings.DEMO_OTP if settings.DEMO_MODE else None
    }

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOtpSchema, db: Session = Depends(get_db)):
    """
    Verify OTP and issue JWT access token for Patient.
    In DEMO_LOGIN_OPEN mode: ANY input accepted (even empty or wrong OTP).
    Auto-creates user if new, using typed name or 'Demo Patient'.
    If same mobile is used again, logs into the same user.
    """
    raw_phone = (payload.phone or "").strip()
    raw_otp = (payload.otp or "").strip()

    if settings.DEMO_LOGIN_OPEN:
        phone = raw_phone if raw_phone else "demo-patient"
        user = db.query(User).filter(User.phone == phone).first()

        if not user:
            user_name = (payload.name or "").strip()
            if not user_name:
                user_name = "Demo Patient" if phone == "demo-patient" else f"Patient {phone[-4:] if len(phone) >= 4 else phone}"
            user = User(
                phone=phone,
                full_name=user_name,
                role="patient"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            profile = PatientProfile(user_id=user.id, age=28, gender="Other")
            db.add(profile)
            db.commit()
        else:
            if payload.name and payload.name.strip():
                user.full_name = payload.name.strip()
                db.commit()
                db.refresh(user)

        # Audit log
        audit = AuditLog(user_id=user.id, action="DEMO_LOGIN_OTP", resource="auth")
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

    # Real validation mode when DEMO_LOGIN_OPEN is False
    if not raw_phone or len(raw_phone) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid 10-digit mobile number."
        )

    if settings.DEMO_MODE and raw_otp != settings.DEMO_OTP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. Demo mode OTP is {settings.DEMO_OTP}"
        )

    user = db.query(User).filter(User.phone == raw_phone).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not registered. Please register first."
        )

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
    Doctor login endpoint.
    In DEMO_LOGIN_OPEN mode: ANY input accepted (even empty or wrong credentials).
    Auto-creates doctor if new, using typed name or 'Dr. Demo'.
    If same email is used again, logs into the same doctor.
    """
    raw_email = (payload.email or "").strip().lower()
    raw_pwd = payload.password or ""

    if settings.DEMO_LOGIN_OPEN:
        email = raw_email if raw_email else "dr.demo@hospital.org"
        user = db.query(User).filter(User.email == email, User.role == "doctor").first()

        if not user:
            doc_name = (payload.name or "").strip() or "Dr. Demo"
            user = User(
                email=email,
                full_name=doc_name,
                role="doctor",
                hashed_password=get_password_hash("Doctor@123")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            if payload.name and payload.name.strip():
                user.full_name = payload.name.strip()
                db.commit()
                db.refresh(user)

        audit = AuditLog(user_id=user.id, action="DEMO_LOGIN_DOCTOR", resource="auth")
        db.add(audit)
        db.commit()

        token = create_access_token(subject=user.id, role="doctor")
        return TokenResponse(
            access_token=token,
            role="doctor",
            user_id=user.id,
            full_name=user.full_name,
            email=user.email
        )

    # Real validation mode when DEMO_LOGIN_OPEN is False
    if not raw_email or not raw_pwd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor email and password are required."
        )

    user = db.query(User).filter(User.email == raw_email, User.role == "doctor").first()
    if not user or not user.hashed_password or not verify_password(raw_pwd, user.hashed_password):
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
    In DEMO_LOGIN_OPEN mode: ANY input accepted (even empty).
    Auto-creates user if new, using typed name or 'Demo Patient (ABHA)'.
    """
    raw_abha = (payload.abhaId or "").strip()

    if settings.DEMO_LOGIN_OPEN:
        abha_id = raw_abha if raw_abha else "demo@abdm"
    else:
        if not raw_abha:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ABHA ID is required."
            )
        abha_id = raw_abha

    profile = db.query(PatientProfile).filter(PatientProfile.abha_id == abha_id).first()
    if profile:
        user = profile.user
        if payload.name and payload.name.strip():
            user.full_name = payload.name.strip()
            db.commit()
            db.refresh(user)
    else:
        user_name = (payload.name or "").strip() or "Demo Patient (ABHA)"
        phone_suffix = abha_id.replace("@", "").replace("-", "")[-6:]
        phone_placeholder = f"abha-{phone_suffix}" if phone_suffix else "abha-demo"
        
        # Check if phone collision exists
        existing_phone = db.query(User).filter(User.phone == phone_placeholder).first()
        if existing_phone:
            phone_placeholder = f"abha-{datetime.utcnow().timestamp()}"

        user = User(
            full_name=user_name,
            role="patient",
            phone=phone_placeholder
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = PatientProfile(
            user_id=user.id,
            abha_id=abha_id,
            age=28,
            gender="Other"
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
