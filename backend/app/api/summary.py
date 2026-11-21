# api/summary.py — Clinical Summary Assembly, Doctor Approval, and Rejection
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.db.models import (
    ClinicalSummary, InterviewSession, DoctorNote, AuditLog,
    User, RedFlagAlert, Document, AyurvedaAssessment
)
from app.schemas.summary import SummaryReviewSchema, SummaryRejectSchema, DoctorNoteSchema

router = APIRouter(prefix="/summary", tags=["Clinical Summary Engine"])

@router.get("/{patientId}")
def get_patient_summary(patientId: str, db: Session = Depends(get_db)):
    """
    Get structured clinical draft summary with source tags and red flags.
    Rule 1: Observations contain reported facts/abnormal values only (no diagnosis).
    Rule 4: Zero fake extracted lab values. If no document uploaded, documentFindings is None.
    """
    summary = (
        db.query(ClinicalSummary)
        .filter(ClinicalSummary.patient_id == patientId)
        .order_by(ClinicalSummary.created_at.desc())
        .first()
    )

    # Fetch real patient records from DB
    patient = db.query(User).filter(User.id == patientId).first()
    latest_session = (
        db.query(InterviewSession)
        .filter(InterviewSession.patient_id == patientId)
        .order_by(InterviewSession.started_at.desc())
        .first()
    )
    red_flags = db.query(RedFlagAlert).filter(RedFlagAlert.patient_id == patientId).all()
    docs = db.query(Document).filter(Document.patient_id == patientId).all()

    # Determine real document findings text
    doc_findings_text = None
    if docs:
        doc_summaries = []
        for d in docs:
            findings_parts = []
            for e in d.entities:
                flag = f" ({e.status_flag})" if e.status_flag in ("High", "Low") else ""
                findings_parts.append(f"{e.key_name}: {e.value_text} {e.unit or ''}{flag}")
            if findings_parts:
                doc_summaries.append(f"{d.original_filename}: {', '.join(findings_parts)}")
            else:
                doc_summaries.append(f"{d.original_filename} (Uploaded, no abnormal values detected)")
        doc_findings_text = " | ".join(doc_summaries)

    # Determine ayurveda summary
    ayurveda_text = None
    if latest_session:
        ayur = db.query(AyurvedaAssessment).filter(AyurvedaAssessment.session_id == latest_session.id).first()
        if ayur:
            ayurveda_text = f"Prakriti: {ayur.prakriti_result or 'N/A'} | Agni: {ayur.agni_type or 'N/A'} | Koshta: {ayur.koshta_type or 'N/A'} (Prototype)"

    # If already saved in DB, return with real dynamic red flags and document findings
    if summary:
        return {
            "id": summary.id,
            "patientId": summary.patient_id,
            "status": summary.status,
            "version": summary.version,
            "presentingComplaint": summary.presenting_complaint or "General Checkup",
            "hpi": summary.hpi_text or "No acute history reported.",
            "pastHistory": summary.past_medical or "No known chronic illnesses.",
            "medicationsAllergies": summary.medications_allergies or "No regular medications or known allergies.",
            "documentFindings": doc_findings_text or summary.document_findings,
            "ayurvedicAssessment": ayurveda_text or summary.ayurveda_summary,
            "aiDraftObservations": summary.ai_draft_observations or "Reported symptoms recorded for physician correlation. (No autonomous diagnosis rendered).",
            "doctorNotes": summary.doctor_notes,
            "reviewedBy": summary.reviewed_by,
            "reviewedAt": summary.reviewed_at.isoformat() if summary.reviewed_at else None,
            "redFlags": [
                {
                    "id": rf.id,
                    "category": rf.category,
                    "severity": rf.severity,
                    "keyword": rf.keyword_matched,
                    "message": rf.alert_message
                }
                for rf in red_flags
            ],
            "sourceTags": {
                "presentingComplaint": "patient-reported",
                "hpi": "patient-reported",
                "pastHistory": "patient-reported",
                "medications": "patient-reported",
                "documentFindings": "extracted-from-document" if doc_findings_text else None,
                "aiDraftObservations": "ai-generated-draft"
            }
        }

    # Dynamically assemble clinical summary if no summary row saved yet
    complaint = "General Checkup"
    hpi_parts = []
    past_med = "No known chronic medical illness"
    meds = "No regular medications reported; No known drug allergies (NKDA)"

    if latest_session and latest_session.answers:
        for ans in latest_session.answers:
            if ans.field_name == "chief_complaint":
                complaint = ans.answer_text
            elif ans.field_name in ("onset_duration", "character", "severity", "associated_symptoms"):
                hpi_parts.append(f"{ans.field_name.replace('_', ' ').capitalize()}: {ans.answer_text}")
            elif ans.field_name == "past_medical":
                past_med = ans.answer_text
            elif ans.field_name in ("medications", "allergies"):
                meds = f"{ans.field_name.capitalize()}: {ans.answer_text}"

    hpi_str = ". ".join(hpi_parts) if hpi_parts else "Patient presented for intake evaluation."

    ai_obs = f"Reported symptoms of '{complaint}'. "
    if doc_findings_text:
        ai_obs += f"Document findings: {doc_findings_text}. Kindly correlate clinically."
    else:
        ai_obs += "No physical documents scanned yet. Kindly correlate clinically with physical examination."
    ai_obs += " (No autonomous diagnosis rendered)."

    return {
        "id": f"sum-{patientId}",
        "patientId": patientId,
        "status": "draft",
        "version": 1,
        "presentingComplaint": complaint,
        "hpi": hpi_str,
        "pastHistory": past_med,
        "medicationsAllergies": meds,
        "documentFindings": doc_findings_text,
        "ayurvedicAssessment": ayurveda_text,
        "aiDraftObservations": ai_obs,
        "doctorNotes": None,
        "reviewedBy": None,
        "reviewedAt": None,
        "redFlags": [
            {
                "id": rf.id,
                "category": rf.category,
                "severity": rf.severity,
                "keyword": rf.keyword_matched,
                "message": rf.alert_message
            }
            for rf in red_flags
        ],
        "sourceTags": {
            "presentingComplaint": "patient-reported",
            "hpi": "patient-reported",
            "pastHistory": "patient-reported",
            "medications": "patient-reported",
            "documentFindings": "extracted-from-document" if doc_findings_text else None,
            "aiDraftObservations": "ai-generated-draft"
        }
    }


@router.post("/{summaryId}/approve")
def approve_summary(summaryId: str, payload: SummaryReviewSchema, db: Session = Depends(get_db)):
    """
    Physician approves the draft clinical summary and saves it to hospital records.
    Matches either by summaryId or by patientId.
    """
    summary = (
        db.query(ClinicalSummary)
        .filter((ClinicalSummary.id == summaryId) | (ClinicalSummary.patient_id == summaryId))
        .first()
    )
    now = datetime.utcnow()

    if not summary:
        # Create summary if approving for a patient that didn't have a persisted summary row
        patient_id = summaryId.replace("sum-", "")
        summary = ClinicalSummary(
            patient_id=patient_id,
            status="approved",
            reviewed_by=payload.doctorName or "Dr. R. Sharma",
            reviewed_at=now,
            doctor_notes=payload.doctorNotes or ""
        )
        db.add(summary)
    else:
        summary.status = "approved"
        summary.reviewed_by = payload.doctorName or "Dr. R. Sharma"
        summary.reviewed_at = now
        if payload.doctorNotes:
            summary.doctor_notes = payload.doctorNotes
        if payload.editedFields:
            for k, v in payload.editedFields.items():
                if hasattr(summary, k):
                    setattr(summary, k, v)

    db.commit()
    db.refresh(summary)

    return {
        "success": True,
        "status": "approved",
        "summaryId": summary.id,
        "reviewedBy": summary.reviewed_by,
        "reviewedAt": now.isoformat(),
        "message": "Clinical summary approved and saved into hospital consultation records."
    }


@router.post("/{summaryId}/reject")
def reject_summary(summaryId: str, payload: SummaryRejectSchema, db: Session = Depends(get_db)):
    """
    Physician rejects the draft note with an explicit reason.
    Matches either by summaryId or by patientId.
    """
    summary = (
        db.query(ClinicalSummary)
        .filter((ClinicalSummary.id == summaryId) | (ClinicalSummary.patient_id == summaryId))
        .first()
    )
    now = datetime.utcnow()

    if not summary:
        patient_id = summaryId.replace("sum-", "")
        summary = ClinicalSummary(
            patient_id=patient_id,
            status="rejected",
            rejection_reason=payload.reason,
            reviewed_by=payload.doctorName or "Dr. R. Sharma",
            reviewed_at=now
        )
        db.add(summary)
    else:
        summary.status = "rejected"
        summary.rejection_reason = payload.reason
        summary.reviewed_by = payload.doctorName or "Dr. R. Sharma"
        summary.reviewed_at = now

    db.commit()

    return {
        "success": True,
        "status": "rejected",
        "reason": payload.reason,
        "reviewedAt": now.isoformat(),
        "message": "Draft clinical summary rejected."
    }


@router.post("/{summaryId}/notes")
def add_doctor_note(summaryId: str, payload: DoctorNoteSchema, db: Session = Depends(get_db)):
    """
    Add physician consultation remarks or examination notes.
    """
    summary = (
        db.query(ClinicalSummary)
        .filter((ClinicalSummary.id == summaryId) | (ClinicalSummary.patient_id == summaryId))
        .first()
    )
    if summary:
        summary.doctor_notes = payload.noteText
        db.commit()

    note = DoctorNote(
        summary_id=summary.id if summary else summaryId,
        doctor_id="doc-1",
        note_text=payload.noteText
    )
    db.add(note)
    db.commit()

    return {
        "success": True,
        "noteId": note.id,
        "createdAt": note.created_at.isoformat()
    }
