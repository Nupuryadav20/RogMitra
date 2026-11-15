# api/consent.py — DPDP Act 2023 compliant Consent Management
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.db.models import Consent, User, AuditLog
from app.schemas.session import ConsentGrantSchema

router = APIRouter(prefix="/consent", tags=["Consent Management"])

@router.post("/grant")
def grant_consent(payload: ConsentGrantSchema, db: Session = Depends(get_db)):
    """
    Record explicit patient consent for pre-consultation data collection.
    """
    user = db.query(User).filter(User.id == payload.userId).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    consent = Consent(
        user_id=user.id,
        consent_version="1.0.0",
        purpose=payload.purpose or "Pre-consultation case-taking and clinical documentation under DPDP Act 2023",
        is_granted=True,
        granted_at=datetime.utcnow()
    )
    db.add(consent)

    audit = AuditLog(
        user_id=user.id,
        action="CONSENT_GRANTED",
        resource="consent",
        details_json={"version": "1.0.0"}
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": "Consent recorded successfully under DPDP Act 2023.",
        "granted_at": consent.granted_at.isoformat()
    }

@router.post("/revoke/{userId}")
def revoke_consent(userId: str, db: Session = Depends(get_db)):
    """
    Revoke patient consent and mark active consent as withdrawn.
    """
    consents = db.query(Consent).filter(Consent.user_id == userId, Consent.is_granted == True).all()
    now = datetime.utcnow()
    for c in consents:
        c.is_granted = False
        c.revoked_at = now

    audit = AuditLog(
        user_id=userId,
        action="CONSENT_REVOKED",
        resource="consent"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": "Consent revoked successfully.",
        "revoked_at": now.isoformat()
    }

@router.get("/status/{userId}")
def get_consent_status(userId: str, db: Session = Depends(get_db)):
    """
    Check if a patient has active consent.
    """
    active_consent = db.query(Consent).filter(Consent.user_id == userId, Consent.is_granted == True).order_by(Consent.granted_at.desc()).first()
    return {
        "has_consent": active_consent is not None,
        "granted_at": active_consent.granted_at.isoformat() if active_consent else None
    }
