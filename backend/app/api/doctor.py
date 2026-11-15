# api/doctor.py — Doctor OPD Queue and Consultation Views
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, PatientProfile, InterviewSession, ClinicalSummary, RedFlagAlert

router = APIRouter(prefix="/doctor", tags=["Doctor OPD Workspace"])

@router.get("/queue")
def get_opd_queue(db: Session = Depends(get_db)):
    """
    Returns active patients waiting in the OPD queue with red flag triage indicators.
    """
    patients = db.query(User).filter(User.role == "patient").all()
    queue = []

    for i, p in enumerate(patients, start=1):
        latest_session = db.query(InterviewSession).filter(InterviewSession.patient_id == p.id).order_by(InterviewSession.started_at.desc()).first()
        red_flags = db.query(RedFlagAlert).filter(RedFlagAlert.patient_id == p.id).all() if latest_session else []

        # Find complaint
        complaint = "General Checkup"
        if latest_session and latest_session.answers:
            for ans in latest_session.answers:
                if ans.field_name == "chief_complaint":
                    complaint = ans.answer_text
                    break

        queue.append({
            "id": p.id,
            "name": p.full_name,
            "tokenNumber": f"#OPD-20{i}",
            "age": p.profile.age if p.profile else 28,
            "gender": p.profile.gender if p.profile else "Female",
            "timeWaiting": f"{i * 12} mins ago",
            "chiefComplaint": complaint,
            "abhaId": p.profile.abha_id if p.profile else None,
            "redFlags": [
                {
                    "severity": rf.severity,
                    "message": rf.alert_message
                }
                for rf in red_flags
            ]
        })

    # Return default synthetic queue if database is empty
    if not queue:
        return [
            {
                "id": "pat-1",
                "name": "Ananya Verma",
                "tokenNumber": "#OPD-204",
                "age": 28,
                "gender": "Female",
                "timeWaiting": "15 mins ago",
                "chiefComplaint": "Headache for 3 days, mild fever",
                "abhaId": "91-8765-4321-0987",
                "redFlags": [
                    {"severity": "URGENT", "message": "Persistent headache (> 3 days)"},
                    {"severity": "URGENT", "message": "Elevated ESR (28 mm/hr)"}
                ]
            },
            {
                "id": "pat-2",
                "name": "Rajan Mehra",
                "tokenNumber": "#OPD-205",
                "age": 55,
                "gender": "Male",
                "timeWaiting": "25 mins ago",
                "chiefComplaint": "Chest discomfort and breathlessness",
                "abhaId": "91-1122-3344-5566",
                "redFlags": [
                    {"severity": "CRITICAL", "message": "Acute Chest Discomfort / Breathlessness detected (Emergency)"}
                ]
            },
            {
                "id": "pat-3",
                "name": "Priya Sharma",
                "tokenNumber": "#OPD-206",
                "age": 34,
                "gender": "Female",
                "timeWaiting": "40 mins ago",
                "chiefComplaint": "Chronic acidity and sleep disturbance (AYUSH Intake)",
                "abhaId": "91-9988-7766-5544",
                "redFlags": []
            }
        ]

    return queue
