# api/session.py — Case-taking interview session lifecycle and dialogue turns
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.db.models import (
    InterviewSession, InterviewAnswer, User, ClinicalSummary,
    RedFlagAlert, AuditLog
)
from app.schemas.session import AnswerSubmitSchema

router = APIRouter(prefix="/session", tags=["Interview Session"])

@router.post("/start")
def start_session(patientId: str, language: str = "en", db: Session = Depends(get_db)):
    """
    Start a new case-taking interview session for a patient.
    """
    user = db.query(User).filter(User.id == patientId).first()
    if not user:
        raise HTTPException(status_code=404, detail="Patient user not found")

    session = InterviewSession(
        patient_id=user.id,
        language=language,
        status="in_progress",
        current_step="symptoms",
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "sessionId": session.id,
        "patientId": session.patient_id,
        "status": session.status,
        "language": session.language,
        "startedAt": session.started_at.isoformat()
    }

@router.post("/answer")
def save_answer(payload: AnswerSubmitSchema, db: Session = Depends(get_db)):
    """
    Save an individual question answer in the interview session.
    """
    session = db.query(InterviewSession).filter(InterviewSession.id == payload.sessionId).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    answer = InterviewAnswer(
        session_id=session.id,
        field_name=payload.fieldName,
        question_text=payload.questionText,
        answer_text=payload.answerText,
        input_mode=payload.inputMode,
        source_tag="patient-reported"
    )
    db.add(answer)
    db.commit()

    return {
        "success": True,
        "answerId": answer.id,
        "fieldName": answer.field_name,
        "sourceTag": answer.source_tag
    }

@router.post("/submit/{sessionId}")
def submit_session(sessionId: str, db: Session = Depends(get_db)):
    """
    Submit completed intake session and auto-generate draft clinical summary for doctor review.
    """
    session = db.query(InterviewSession).filter(InterviewSession.id == sessionId).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    session.status = "submitted"
    session.completed_at = datetime.utcnow()

    # Collect answers into draft summary fields
    answers = {a.field_name: a.answer_text for a in session.answers}

    summary = db.query(ClinicalSummary).filter(ClinicalSummary.session_id == session.id).first()
    if not summary:
        summary = ClinicalSummary(
            session_id=session.id,
            patient_id=session.patient_id,
            status="draft",
            presenting_complaint=answers.get("chief_complaint", "Not reported"),
            hpi_text=f"Onset: {answers.get('onset_duration', 'N/A')}. Character: {answers.get('character', 'N/A')}. Associated: {answers.get('associated_symptoms', 'None')}",
            past_medical=answers.get("past_medical", "No known chronic illnesses"),
            medications_allergies=f"Meds: {answers.get('medications', 'None')}. Allergies: {answers.get('allergies', 'NKDA')}",
            ai_draft_observations="Reported acute symptoms awaiting physician clinical correlation. (No autonomous diagnosis rendered).",
            version=1
        )
        db.add(summary)

    db.commit()
    db.refresh(summary)

    return {
        "success": True,
        "message": "Session submitted. Draft summary generated for doctor review.",
        "sessionId": session.id,
        "summaryId": summary.id,
        "status": summary.status
    }

@router.delete("/delete/{sessionId}")
def delete_temporary_session(sessionId: str, db: Session = Depends(get_db)):
    """
    Rule 6: Delete temporary session scratch buffers and audio recordings after submission.
    """
    session = db.query(InterviewSession).filter(InterviewSession.id == sessionId).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    patient_id = session.patient_id
    db.delete(session)

    audit = AuditLog(
        user_id=patient_id,
        action="SESSION_TEMPORARY_DATA_DELETED",
        resource="session",
        details_json={"sessionId": sessionId}
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": "Temporary session data scrubbed successfully under DPDP Act privacy rules."
    }

@router.get("/patient/{patientId}/latest")
def get_latest_patient_session(patientId: str, db: Session = Depends(get_db)):
    """
    Get the latest session ID and answers for a patient (supports frontend reload after refresh).
    """
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.patient_id == patientId)
        .order_by(InterviewSession.started_at.desc())
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="No session found for this patient")

    return {
        "sessionId": session.id,
        "patientId": session.patient_id,
        "status": session.status,
        "startedAt": session.started_at.isoformat(),
        "answers": [
            {
                "id": a.id,
                "field": a.field_name,
                "answer": a.answer_text,
                "mode": a.input_mode,
                "sourceTag": a.source_tag
            }
            for a in session.answers
        ],
        "redFlags": [
            {
                "id": rf.id,
                "category": rf.category,
                "severity": rf.severity,
                "keyword": rf.keyword_matched,
                "message": rf.alert_message
            }
            for rf in session.red_flags
        ]
    }


@router.get("/{sessionId}")
def get_session(sessionId: str, db: Session = Depends(get_db)):
    """
    Get full session status, answers, and red flags.
    """
    session = db.query(InterviewSession).filter(InterviewSession.id == sessionId).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "sessionId": session.id,
        "patientId": session.patient_id,
        "status": session.status,
        "startedAt": session.started_at.isoformat(),
        "answers": [
            {
                "id": a.id,
                "field": a.field_name,
                "answer": a.answer_text,
                "mode": a.input_mode,
                "sourceTag": a.source_tag
            }
            for a in session.answers
        ],
        "redFlags": [
            {
                "id": rf.id,
                "category": rf.category,
                "severity": rf.severity,
                "keyword": rf.keyword_matched,
                "message": rf.alert_message
            }
            for rf in session.red_flags
        ]
    }
