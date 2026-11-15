# api/ayurveda.py — Ayurvedic Question Bank and Assessment API
import os
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.db.models import AyurvedaAssessment, InterviewSession
from app.schemas.ayurveda import AyurvedaSubmitSchema

router = APIRouter(prefix="/ayurveda", tags=["Ayurvedic Intake (AYUSH Mode)"])

QUESTIONS_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "services", "ayurveda", "questions.json"
)

def load_questions_data():
    if os.path.exists(QUESTIONS_FILE):
        with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"pillars": []}

@router.get("/questions")
def get_ayurvedic_questions():
    """
    Returns the configurable JSON question bank for Dashavidha Pariksha, Prakriti, Agni, Koshta.
    Rule 8: Includes prototype research disclaimer.
    """
    data = load_questions_data()
    return data

@router.post("/submit")
def submit_ayurvedic_assessment(payload: AyurvedaSubmitSchema, db: Session = Depends(get_db)):
    """
    Submit patient answers for Ayurvedic assessment.
    Records constitutional tendencies (Vata/Pitta/Kapha) without autonomous diagnosis.
    """
    session = db.query(InterviewSession).filter(InterviewSession.id == payload.sessionId).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    # Simple dosha scoring from answers
    vata_count = 0
    pitta_count = 0
    kapha_count = 0

    for q_id, opt in payload.answers.items():
        if opt == "A":
            vata_count += 1
        elif opt == "B":
            pitta_count += 1
        elif opt == "C":
            kapha_count += 1

    prakriti = "Pitta-Vata" if pitta_count >= vata_count and pitta_count >= kapha_count else "Vata-Pitta"

    assessment = AyurvedaAssessment(
        session_id=session.id,
        patient_id=session.patient_id,
        prakriti_result=prakriti,
        agni_type="Tikshnagni" if pitta_count > 0 else "Samagni",
        koshta_type="Madhyama",
        answers_json=payload.answers,
        is_prototype=True,
        practitioner_validated=False
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return {
        "success": True,
        "assessmentId": assessment.id,
        "prakriti": assessment.prakriti_result,
        "agni": assessment.agni_type,
        "koshta": assessment.koshta_type,
        "isPrototype": True,
        "disclaimer": "Prototype – pending validation by a qualified Ayurvedic practitioner."
    }
