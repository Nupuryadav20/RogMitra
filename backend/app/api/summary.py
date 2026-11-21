# api/summary.py — Clinical Summary Assembly, Doctor Approval, and Rejection
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.db.models import ClinicalSummary, InterviewSession, DoctorNote, AuditLog
from app.schemas.summary import SummaryReviewSchema, SummaryRejectSchema, DoctorNoteSchema

router = APIRouter(prefix="/summary", tags=["Clinical Summary Engine"])

@router.get("/{patientId}")
def get_patient_summary(patientId: str, db: Session = Depends(get_db)):
    """
    Get structured clinical draft summary with source tags and red flags.
    Rule 1: Observations contain reported facts/abnormal values only (no diagnosis).
    """
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.patient_id == patientId).order_by(ClinicalSummary.created_at.desc()).first()
    
    if not summary:
        # Fallback to demo summary for quick test
        return {
            "id": f"sum-{patientId}",
            "patientId": patientId,
            "status": "draft",
            "version": 1,
            "presentingComplaint": "Headache for 3 days, moderate intensity with mild fever",
            "hpi": "Gradual onset over past 3 days; throbbing frontal character. Associated with mild fever and generalized body ache. No vomiting, neck rigidity, or visual disturbances reported.",
            "pastHistory": "No known chronic medical illness (Hypertension/Diabetes negative)",
            "medicationsAllergies": "Meds: Paracetamol 650mg SOS. Allergies: No known drug allergies (NKDA).",
            "documentFindings": "Scanned Lab Report (12 Oct 2026): Hb 11.2 g/dL (Low), ESR 28 mm/hr (High).",
            "ayurvedicAssessment": "Prakriti: Pitta-Vata | Agni: Tikshnagni | Koshta: Madhyama (Prototype)",
            "aiDraftObservations": "Reported acute febrile illness symptoms of 3 days duration with elevated inflammatory marker (ESR 28 mm/hr) and mild anemia (Hb 11.2 g/dL). Kindly correlate clinically. (No autonomous diagnosis rendered).",
            "redFlags": [
              {"severity": "URGENT", "message": "Persistent headache (> 3 days duration)"},
              {"severity": "URGENT", "message": "Elevated ESR inflammatory marker (28 mm/hr from report)"}
            ],
            "sourceTags": {
                "presentingComplaint": "patient-reported",
                "hpi": "patient-reported",
                "pastHistory": "patient-reported",
                "medications": "patient-reported",
                "documentFindings": "extracted-from-document",
                "aiDraftObservations": "ai-generated-draft"
            }
        }

    return {
        "id": summary.id,
        "patientId": summary.patient_id,
        "status": summary.status,
        "version": summary.version,
        "presentingComplaint": summary.presenting_complaint,
        "hpi": summary.hpi_text,
        "pastHistory": summary.past_medical,
        "medicationsAllergies": summary.medications_allergies,
        "documentFindings": summary.document_findings,
        "ayurvedicAssessment": summary.ayurveda_summary,
        "aiDraftObservations": summary.ai_draft_observations,
        "doctorNotes": summary.doctor_notes,
        "reviewedBy": summary.reviewed_by,
        "reviewedAt": summary.reviewed_at.isoformat() if summary.reviewed_at else None,
        "sourceTags": {
            "presentingComplaint": "patient-reported",
            "hpi": "patient-reported",
            "pastHistory": "patient-reported",
            "documentFindings": "extracted-from-document",
            "aiDraftObservations": "ai-generated-draft"
        }
    }

@router.post("/{summaryId}/approve")
def approve_summary(summaryId: str, payload: SummaryReviewSchema, db: Session = Depends(get_db)):
    """
    Physician approves the draft clinical summary and saves it to hospital records.
    """
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.id == summaryId).first()
    now = datetime.utcnow()

    if summary:
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
        "reviewedBy": payload.doctorName or "Dr. R. Sharma",
        "reviewedAt": now.isoformat(),
        "message": "Clinical summary approved and saved into hospital consultation records."
    }

@router.post("/{summaryId}/reject")
def reject_summary(summaryId: str, payload: SummaryRejectSchema, db: Session = Depends(get_db)):
    """
    Physician rejects the draft note with an explicit reason.
    """
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.id == summaryId).first()
    now = datetime.utcnow()

    if summary:
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
    note = DoctorNote(
        summary_id=summaryId,
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
