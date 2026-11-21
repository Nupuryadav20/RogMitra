# models.py — SQLAlchemy database models for RogMitra
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    phone = Column(String(15), unique=True, index=True, nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="patient") # 'patient' or 'doctor'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    profile = relationship("PatientProfile", back_populates="user", uselist=False)
    consents = relationship("Consent", back_populates="user")
    sessions = relationship("InterviewSession", back_populates="user")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    abha_id = Column(String(50), unique=True, nullable=True) # Mock ABHA identifier
    age = Column(Integer, nullable=True)
    gender = Column(String(15), nullable=True)
    blood_group = Column(String(5), nullable=True)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="profile")

class Consent(Base):
    __tablename__ = "consents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    consent_version = Column(String(20), default="1.0.0")
    purpose = Column(String(255), default="Pre-consultation case-taking and clinical documentation under DPDP Act 2023")
    is_granted = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="consents")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="in_progress") # 'in_progress', 'submitted', 'reviewed', 'deleted'
    current_step = Column(String(50), default="symptoms")
    language = Column(String(10), default="en")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")
    answers = relationship("InterviewAnswer", back_populates="session", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="session", cascade="all, delete-orphan")
    red_flags = relationship("RedFlagAlert", back_populates="session", cascade="all, delete-orphan")
    ayurveda = relationship("AyurvedaAssessment", back_populates="session", uselist=False, cascade="all, delete-orphan")
    summary = relationship("ClinicalSummary", back_populates="session", uselist=False, cascade="all, delete-orphan")

class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id"), nullable=False)
    field_name = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=True)
    question_source = Column(String(30), default="rule-based") # 'rule-based' or 'llm-generated'
    answer_text = Column(Text, nullable=False)
    input_mode = Column(String(20), default="voice") # 'voice' or 'touch'
    source_tag = Column(String(20), default="patient-reported")
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="answers")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id"), nullable=True)
    patient_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    report_type = Column(String(50), default="Lab Report")
    report_date = Column(String(30), nullable=True)
    raw_ocr_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="documents")
    entities = relationship("ExtractedEntity", back_populates="document", cascade="all, delete-orphan")

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    entity_type = Column(String(50), default="lab_test") # 'lab_test', 'medication', 'vital'
    key_name = Column(String(100), nullable=False)
    value_text = Column(String(50), nullable=False)
    unit = Column(String(30), nullable=True)
    reference_range = Column(String(50), nullable=True)
    is_abnormal = Column(Boolean, default=False)
    status_flag = Column(String(20), default="Normal") # 'Low', 'Normal', 'High', 'Critical'
    source_tag = Column(String(20), default="extracted-from-document")

    document = relationship("Document", back_populates="entities")

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    event_date = Column(String(30), nullable=False)
    event_type = Column(String(50), default="Consultation")
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    source_reference = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AyurvedaAssessment(Base):
    __tablename__ = "ayurveda_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id"), nullable=False)
    patient_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    prakriti_result = Column(String(50), nullable=True)
    vikriti_result = Column(String(50), nullable=True)
    agni_type = Column(String(50), nullable=True)
    koshta_type = Column(String(50), nullable=True)
    answers_json = Column(JSON, nullable=True)
    is_prototype = Column(Boolean, default=True)
    practitioner_validated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="ayurveda")

class ClinicalSummary(Base):
    __tablename__ = "clinical_summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id"), nullable=False)
    patient_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    version = Column(Integer, default=1)
    status = Column(String(20), default="draft") # 'draft', 'approved', 'rejected'
    
    # SOAP History Sections with 3-tier attribution
    presenting_complaint = Column(Text, nullable=True)
    hpi_text = Column(Text, nullable=True)
    past_medical = Column(Text, nullable=True)
    medications_allergies = Column(Text, nullable=True)
    document_findings = Column(Text, nullable=True)
    ayurveda_summary = Column(Text, nullable=True)
    
    # Strictly non-diagnostic observations per Rule 1 (Facts/abnormal values only; no AI diagnosis/plan)
    ai_draft_observations = Column(Text, nullable=True)
    
    # Doctor-only fields (strictly filled by physician, never by AI)
    doctor_assessment = Column(Text, nullable=True)
    doctor_plan = Column(Text, nullable=True)
    
    doctor_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="summary")
    notes = relationship("DoctorNote", back_populates="summary", cascade="all, delete-orphan")

class RedFlagAlert(Base):
    __tablename__ = "red_flag_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id"), nullable=False)
    patient_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), default="URGENT") # 'URGENT' or 'CRITICAL'
    keyword_matched = Column(String(100), nullable=False)
    alert_message = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="red_flags")

class DoctorNote(Base):
    __tablename__ = "doctor_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    summary_id = Column(String(36), ForeignKey("clinical_summaries.id"), nullable=False)
    doctor_id = Column(String(36), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    summary = relationship("ClinicalSummary", back_populates="notes")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    action = Column(String(50), nullable=False) # 'LOGIN', 'CONSENT_GRANTED', 'SESSION_DELETE', etc.
    resource = Column(String(50), nullable=False)
    details_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
