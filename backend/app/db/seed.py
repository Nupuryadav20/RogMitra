# seed.py — Database seeding script with synthetic demo patients and doctor
import sys
import os
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.db.session import SessionLocal, engine, Base
from app.db.models import (
    User, PatientProfile, Consent, InterviewSession, InterviewAnswer,
    Document, ExtractedEntity, ClinicalSummary, RedFlagAlert, TimelineEvent
)
from app.core.security import get_password_hash

def seed_database():
    print("Initializing RogMitra Database Tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Doctor Account
        doc_email = "dr.sharma@hospital.org"
        doctor = db.query(User).filter(User.email == doc_email).first()
        if not doctor:
            doctor = User(
                email=doc_email,
                full_name="Dr. R. Sharma",
                role="doctor",
                hashed_password=get_password_hash("Doctor@123")
            )
            db.add(doctor)
            db.commit()
            db.refresh(doctor)
            print(f"✓ Created Doctor: {doctor.full_name} ({doctor.email})")

        # 2. Seed Patient 1: Ananya Verma (Headache + Elevated ESR)
        p1 = db.query(User).filter(User.phone == "9876543210").first()
        if not p1:
            p1 = User(
                phone="9876543210",
                full_name="Ananya Verma",
                role="patient"
            )
            db.add(p1)
            db.commit()
            db.refresh(p1)

            prof1 = PatientProfile(
                user_id=p1.id,
                abha_id="91-8765-4321-0987",
                age=28,
                gender="Female",
                blood_group="B+"
            )
            c1 = Consent(user_id=p1.id, is_granted=True)
            db.add_all([prof1, c1])

            s1 = InterviewSession(patient_id=p1.id, status="submitted", current_step="review")
            db.add(s1)
            db.commit()
            db.refresh(s1)

            ans1 = InterviewAnswer(session_id=s1.id, field_name="chief_complaint", answer_text="Headache for 3 days, moderate intensity with mild fever")
            ans2 = InterviewAnswer(session_id=s1.id, field_name="onset_duration", answer_text="3 days, gradual onset")
            ans3 = InterviewAnswer(session_id=s1.id, field_name="past_medical", answer_text="No known chronic illness")
            ans4 = InterviewAnswer(session_id=s1.id, field_name="medications", answer_text="Took Paracetamol 650mg SOS")
            db.add_all([ans1, ans2, ans3, ans4])

            rf1 = RedFlagAlert(
                session_id=s1.id,
                patient_id=p1.id,
                category="neurological",
                severity="URGENT",
                keyword_matched="headache for 3 days",
                alert_message="Persistent headache (> 3 days duration)"
            )
            rf2 = RedFlagAlert(
                session_id=s1.id,
                patient_id=p1.id,
                category="lab_marker",
                severity="URGENT",
                keyword_matched="ESR 28 mm/hr",
                alert_message="Elevated ESR inflammatory marker (28 mm/hr)"
            )
            db.add_all([rf1, rf2])

            doc1 = Document(
                session_id=s1.id,
                patient_id=p1.id,
                original_filename="CBC_ESR_Report.pdf",
                stored_filename="doc_cbc_esr_001.pdf",
                file_path="uploads/doc_cbc_esr_001.pdf",
                file_size=245000,
                mime_type="application/pdf",
                report_type="Lab Report",
                report_date="12 Oct 2026",
                raw_ocr_text="Hb: 11.2 g/dL (Low)\nESR: 28 mm/hr (High)\nWBC: 7400 /mcL"
            )
            db.add(doc1)
            db.commit()
            db.refresh(doc1)

            e1 = ExtractedEntity(document_id=doc1.id, entity_type="lab_test", key_name="Hemoglobin (Hb)", value_text="11.2", unit="g/dL", reference_range="12.0 - 15.5", is_abnormal=True, status_flag="Low")
            e2 = ExtractedEntity(document_id=doc1.id, entity_type="lab_test", key_name="ESR", value_text="28", unit="mm/hr", reference_range="0 - 20", is_abnormal=True, status_flag="High")
            db.add_all([e1, e2])

            sum1 = ClinicalSummary(
                session_id=s1.id,
                patient_id=p1.id,
                status="draft",
                version=1,
                presenting_complaint="Headache for 3 days, moderate intensity with mild fever",
                hpi_text="Gradual onset over past 3 days; throbbing frontal character. Associated with mild fever and generalized body ache. No vomiting, neck rigidity, or visual disturbances.",
                past_medical="No known chronic illness (Hypertension/Diabetes negative)",
                medications_allergies="Meds: Paracetamol 650mg SOS. Allergies: No known drug allergies (NKDA).",
                document_findings="Scanned Lab Report (12 Oct 2026): Hb 11.2 g/dL (Low), ESR 28 mm/hr (High).",
                ayurveda_summary="Prakriti: Pitta-Vata | Agni: Tikshnagni | Koshta: Madhyama (Prototype)",
                ai_draft_observations="Reported acute febrile illness symptoms of 3 days duration with elevated inflammatory marker (ESR 28 mm/hr) and mild anemia (Hb 11.2 g/dL). Kindly correlate clinically. (No autonomous diagnosis rendered)."
            )
            db.add(sum1)
            db.commit()
            print(f"✓ Created Patient 1: {p1.full_name} ({p1.phone}) with draft summary")

        # 3. Seed Patient 2: Rajan Mehra (Chest Pain & Breathlessness — Emergency Red Flag)
        p2 = db.query(User).filter(User.phone == "9800000002").first()
        if not p2:
            p2 = User(phone="9800000002", full_name="Rajan Mehra", role="patient")
            db.add(p2)
            db.commit()
            db.refresh(p2)

            prof2 = PatientProfile(user_id=p2.id, abha_id="91-1122-3344-5566", age=55, gender="Male")
            c2 = Consent(user_id=p2.id, is_granted=True)
            s2 = InterviewSession(patient_id=p2.id, status="submitted", current_step="review")
            db.add_all([prof2, c2, s2])
            db.commit()
            db.refresh(s2)

            rf_cardiac = RedFlagAlert(
                session_id=s2.id,
                patient_id=p2.id,
                category="cardiovascular",
                severity="CRITICAL",
                keyword_matched="chest tightness and breathlessness",
                alert_message="Severe / Acute Chest Pain or Pressure detected. Potential cardiac emergency."
            )
            sum2 = ClinicalSummary(
                session_id=s2.id,
                patient_id=p2.id,
                status="draft",
                version=1,
                presenting_complaint="Chest discomfort and breathlessness for 4 hours",
                hpi_text="Acute onset retrosternal chest pressure radiating to left arm. Associated with diaphoresis and shortness of breath.",
                past_medical="Type 2 Diabetes for 8 years, Hypertension for 5 years",
                medications_allergies="Meds: Metformin 500mg BD, Amlodipine 5mg OD. Allergies: None reported.",
                ai_draft_observations="Acute retrosternal chest pressure with dyspnea in a high-risk diabetic/hypertensive individual. Immediate ECG and cardiac enzymes correlation advised. (No autonomous diagnosis rendered)."
            )
            db.add_all([rf_cardiac, sum2])
            db.commit()
            print(f"✓ Created Patient 2: {p2.full_name} (Critical Red Flag)")

        # 4. Seed Patient 3: Priya Sharma (AYUSH / Digestive Intake)
        p3 = db.query(User).filter(User.phone == "9800000003").first()
        if not p3:
            p3 = User(phone="9800000003", full_name="Priya Sharma", role="patient")
            db.add(p3)
            db.commit()
            db.refresh(p3)

            prof3 = PatientProfile(user_id=p3.id, abha_id="91-9988-7766-5544", age=34, gender="Female")
            c3 = Consent(user_id=p3.id, is_granted=True)
            s3 = InterviewSession(patient_id=p3.id, status="submitted", current_step="review")
            db.add_all([prof3, c3, s3])
            db.commit()
            db.refresh(s3)

            sum3 = ClinicalSummary(
                session_id=s3.id,
                patient_id=p3.id,
                status="draft",
                version=1,
                presenting_complaint="Chronic acidity, indigestion and fatigue for 2 months",
                hpi_text="Recurrent post-prandial heartburn and bloating. Sleep quality disturbed by acid reflux.",
                past_medical="No major hospitalizations",
                medications_allergies="Meds: Antacid syrup SOS. Allergies: None.",
                ayurveda_summary="Prakriti: Pitta dominant | Agni: Tikshnagni | Koshta: Krura",
                ai_draft_observations="Chronic upper gastrointestinal dyspepsia symptoms reported. Constitutional Pitta aggravation noted. Correlate with dietary patterns. (No autonomous diagnosis rendered)."
            )
            db.add(sum3)
            db.commit()
            print(f"✓ Created Patient 3: {p3.full_name} (AYUSH Consultation)")

        print("✅ Database Seeding Completed Successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
