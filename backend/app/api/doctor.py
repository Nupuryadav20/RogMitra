# api/doctor.py — Doctor OPD Queue and Consultation Views
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.db.models import (
    User, PatientProfile, InterviewSession, ClinicalSummary,
    RedFlagAlert, Document, AyurvedaAssessment
)

router = APIRouter(prefix="/doctor", tags=["Doctor OPD Workspace"])

@router.get("/queue")
def get_opd_queue(db: Session = Depends(get_db)):
    """
    Returns active patients waiting in the OPD queue with red flag triage indicators.
    Reads directly from the database.
    """
    patients = db.query(User).filter(User.role == "patient").all()
    queue = []

    for i, p in enumerate(patients, start=1):
        latest_session = (
            db.query(InterviewSession)
            .filter(InterviewSession.patient_id == p.id)
            .order_by(InterviewSession.started_at.desc())
            .first()
        )

        red_flags = (
            db.query(RedFlagAlert)
            .filter(RedFlagAlert.patient_id == p.id)
            .all()
        )

        latest_summary = (
            db.query(ClinicalSummary)
            .filter(ClinicalSummary.patient_id == p.id)
            .order_by(ClinicalSummary.created_at.desc())
            .first()
        )

        doc_count = db.query(Document).filter(Document.patient_id == p.id).count()

        ayurveda_record = (
            db.query(AyurvedaAssessment)
            .filter(AyurvedaAssessment.session_id == latest_session.id)
            .first()
            if latest_session else None
        )

        # Extract chief complaint from session answers
        complaint = "General Checkup"
        if latest_session and latest_session.answers:
            for ans in latest_session.answers:
                if ans.field_name == "chief_complaint":
                    complaint = ans.answer_text
                    break
        elif latest_summary and latest_summary.presenting_complaint:
            complaint = latest_summary.presenting_complaint

        # Determine queue status
        has_critical_rf = any(rf.severity in ("CRITICAL", "URGENT") for rf in red_flags)
        if has_critical_rf:
            status_chip = "red_flag"
        elif latest_summary and latest_summary.status in ("approved", "reviewed"):
            status_chip = "reviewed"
        elif latest_summary and latest_summary.status == "rejected":
            status_chip = "rejected"
        elif latest_summary:
            status_chip = "summary_ready"
        else:
            status_chip = "pending"

        queue.append({
            "id": p.id,
            "name": p.full_name,
            "tokenNumber": f"#OPD-20{i}",
            "age": p.profile.age if p.profile else 28,
            "gender": p.profile.gender if p.profile else "Female",
            "timeWaiting": f"{max(5, i * 10)} mins ago",
            "chiefComplaint": complaint,
            "abhaId": p.profile.abha_id if p.profile else None,
            "status": status_chip,
            "sessionStatus": status_chip,
            "summaryId": latest_summary.id if latest_summary else None,
            "summaryStatus": latest_summary.status if latest_summary else "draft",
            "hasAyurveda": ayurveda_record is not None,
            "documentsCount": doc_count,
            "redFlags": [
                {
                    "id": rf.id,
                    "category": rf.category,
                    "severity": rf.severity,
                    "keyword": rf.keyword_matched,
                    "message": rf.alert_message
                }
                for rf in red_flags
            ]
        })

    return queue


@router.get("/redflags/{patient_id}")
def get_patient_redflags(patient_id: str, db: Session = Depends(get_db)):
    """
    Standalone GET endpoint returning all deterministic red flag alerts for a given patient.
    """
    alerts = db.query(RedFlagAlert).filter(RedFlagAlert.patient_id == patient_id).all()
    return [
        {
            "id": a.id,
            "patientId": a.patient_id,
            "sessionId": a.session_id,
            "category": a.category,
            "severity": a.severity,
            "keyword": a.keyword_matched,
            "message": a.alert_message,
            "createdAt": a.created_at.isoformat() if a.created_at else None
        }
        for a in alerts
    ]


@router.get("/stats")
def get_doctor_stats(db: Session = Depends(get_db)):
    """
    Returns aggregate stats for the doctor overview workspace.
    """
    total_patients = db.query(User).filter(User.role == "patient").count()
    red_flag_count = (
        db.query(RedFlagAlert.patient_id)
        .filter(RedFlagAlert.severity.in_(["CRITICAL", "URGENT"]))
        .distinct()
        .count()
    )
    approved_summaries = (
        db.query(ClinicalSummary)
        .filter(ClinicalSummary.status == "approved")
        .count()
    )
    pending_summaries = (
        db.query(ClinicalSummary)
        .filter(ClinicalSummary.status == "draft")
        .count()
    )

    return {
        "totalPatients": total_patients,
        "redFlagsCount": red_flag_count,
        "reviewedCount": approved_summaries,
        "pendingCount": pending_summaries
    }


@router.get("/reports/{patient_id}")
def get_doctor_patient_reports(patient_id: str, db: Session = Depends(get_db)):
    """
    Returns uploaded medical documents and extracted entities for a patient.
    """
    docs = db.query(Document).filter(Document.patient_id == patient_id).all()
    results = []
    for d in docs:
        results.append({
            "id": d.id,
            "patientId": d.patient_id,
            "filename": d.original_filename,
            "reportType": d.report_type or "Uploaded Document",
            "reportDate": d.report_date or (d.uploaded_at.strftime("%d %b %Y") if d.uploaded_at else "Recent"),
            "rawText": d.raw_ocr_text,
            "findings": [
                {
                    "test": e.key_name,
                    "value": e.value_text,
                    "unit": e.unit,
                    "status": e.status_flag,
                    "refRange": e.reference_range,
                    "isAbnormal": e.is_abnormal
                }
                for e in d.entities
            ]
        })
    return results
