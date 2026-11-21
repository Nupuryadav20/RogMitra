# tests/test_doctor_workflow.py
# Automated test that logs in as doctor and confirms dashboard, queue, redflags, and summary review APIs work
import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.session import SessionLocal, Base, engine
from app.api.auth import login_doctor
from app.schemas.auth import LoginDoctorSchema
from app.api.doctor import get_opd_queue, get_patient_redflags, get_doctor_stats, get_doctor_patient_reports
from app.api.summary import get_patient_summary, approve_summary, reject_summary, add_doctor_note
from app.schemas.summary import SummaryReviewSchema, SummaryRejectSchema, DoctorNoteSchema

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_doctor_login_and_queue_workflow(db):
    # 1. Doctor login via demo or credentials
    doc = login_doctor(
        LoginDoctorSchema(email="dr.sharma@hospital.org", password="Doctor@123", name="Dr. R. Sharma"),
        db=db
    )
    assert doc.role == "doctor"
    assert "Dr. R. Sharma" in doc.full_name
    assert doc.access_token is not None

    # 2. Doctor stats
    stats = get_doctor_stats(db=db)
    assert isinstance(stats, dict)
    assert "totalPatients" in stats
    assert "redFlagsCount" in stats
    assert "reviewedCount" in stats
    assert stats["totalPatients"] > 0

    # 3. Doctor OPD queue
    queue = get_opd_queue(db=db)
    assert isinstance(queue, list)
    assert len(queue) > 0, "OPD Queue must contain patients"

    first_patient = queue[0]
    assert "id" in first_patient
    assert "name" in first_patient
    assert "tokenNumber" in first_patient
    assert "status" in first_patient
    assert "redFlags" in first_patient
    assert first_patient["name"] is not None

    patient_id = first_patient["id"]

    # 4. Standalone red flags endpoint
    redflags = get_patient_redflags(patient_id=patient_id, db=db)
    assert isinstance(redflags, list)

    # 5. Patient summary retrieval
    summary = get_patient_summary(patientId=patient_id, db=db)
    assert isinstance(summary, dict)
    assert "presentingComplaint" in summary
    assert "aiDraftObservations" in summary
    assert "sourceTags" in summary

    # 6. Doctor adds notes
    note_res = add_doctor_note(
        summaryId=summary["id"],
        payload=DoctorNoteSchema(noteText="Patient instructed on hydration and rest. Review in 3 days."),
        db=db
    )
    assert note_res["success"] is True

    # 7. Doctor approves summary
    approve_res = approve_summary(
        summaryId=summary["id"],
        payload=SummaryReviewSchema(summaryId=summary["id"], doctorName="Dr. R. Sharma", doctorNotes="Approved for medical record."),
        db=db
    )
    assert approve_res["success"] is True
    assert approve_res["status"] == "approved"

    # 8. Doctor reports retrieval (clean empty state or real files)
    reports = get_doctor_patient_reports(patient_id=patient_id, db=db)
    assert isinstance(reports, list)
