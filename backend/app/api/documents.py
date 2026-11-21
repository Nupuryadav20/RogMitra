# api/documents.py — Document upload, safe storage, and OCR extraction entities
import os
import uuid
import re
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db.session import get_db
from app.db.models import Document, ExtractedEntity, TimelineEvent, User
from app.schemas.document import DocumentResponseSchema, ExtractedEntitySchema, TimelineEventSchema

router = APIRouter(prefix="/documents", tags=["Document Intelligence & OCR"])

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB

# Deterministic reference ranges for standard Indian lab parameters
STANDARD_RANGES = {
    "hemoglobin": {"min": 12.0, "max": 15.5, "unit": "g/dL"},
    "esr": {"min": 0.0, "max": 20.0, "unit": "mm/hr"},
    "wbc": {"min": 4000.0, "max": 11000.0, "unit": "/mcL"},
    "platelets": {"min": 150000.0, "max": 450000.0, "unit": "/mcL"},
    "glucose_random": {"min": 70.0, "max": 140.0, "unit": "mg/dL"},
}

def analyze_value(name: str, val_num: float):
    key = name.lower()
    for ref_key, ref_info in STANDARD_RANGES.items():
        if ref_key in key:
            if val_num < ref_info["min"]:
                return "Low", True, f"{ref_info['min']} - {ref_info['max']}"
            elif val_num > ref_info["max"]:
                return "High", True, f"{ref_info['min']} - {ref_info['max']}"
            else:
                return "Normal", False, f"{ref_info['min']} - {ref_info['max']}"
    return "Normal", False, "Standard"

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    sessionId: Optional[str] = Form(None),
    patientId: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload a medical report image or PDF with validation and safe storage.
    Extracts entities using regex/rule parser with abnormal value detection.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: JPG, PNG, PDF."
        )

    # Read content to check size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds maximum 10MB size limit.")

    # Generate safe unique filename
    safe_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(stored_path, "wb") as f:
        f.write(contents)

    # Determine or fallback patient
    resolved_patient_id = patientId
    if not resolved_patient_id:
        p = db.query(User).filter(User.role == "patient").first()
        resolved_patient_id = p.id if p else "demo-patient"

    # --- REAL regex-based text extraction from actual file content ---
    # Step 1: Try to decode file content as UTF-8 text (works for text-based PDFs and plain text)
    raw_text = ""
    try:
        raw_text = contents.decode("utf-8", errors="ignore")
    except Exception:
        raw_text = ""

    # Step 2: If pytesseract is available and file is an image, use OCR
    if not raw_text.strip() and ext in {".jpg", ".jpeg", ".png"}:
        try:
            import pytesseract
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(contents))
            raw_text = pytesseract.image_to_string(img)
        except Exception:
            raw_text = ""

    # Step 3: Regex patterns for common Indian lab parameters
    LAB_PATTERNS = [
        ("Hemoglobin", r"(?:Hemoglobin|Haemoglobin|Hb)\s*[:\-=]?\s*(\d+\.?\d*)\s*(g/dL|g/dl|gm/dL)?", "g/dL"),
        ("ESR", r"ESR\s*[:\-=]?\s*(\d+\.?\d*)\s*(mm/hr|mm/h)?", "mm/hr"),
        ("WBC", r"(?:WBC|TLC|Total\s+Leukocyte)\s*[:\-=]?\s*([\d,]+\.?\d*)\s*(/mcL|/uL|cells/mcL)?", "/mcL"),
        ("Platelets", r"(?:Platelets?|PLT)\s*[:\-=]?\s*([\d,]+\.?\d*)\s*(/mcL|/uL|lakhs)?", "/mcL"),
        ("Glucose", r"(?:Glucose|Blood\s+Sugar|RBS|FBS)\s*[:\-=]?\s*(\d+\.?\d*)\s*(mg/dL|mg/dl)?", "mg/dL"),
    ]

    findings = []
    entities_to_add = []

    for param_name, pattern, default_unit in LAB_PATTERNS:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            val_str = match.group(1).replace(",", "")
            unit = match.group(2) if match.lastindex >= 2 and match.group(2) else default_unit
            try:
                val_num = float(val_str)
            except ValueError:
                continue
            status_flag, is_abnormal, ref_range = analyze_value(param_name, val_num)
            findings.append({
                "test": param_name,
                "value": val_str,
                "unit": unit,
                "status": status_flag,
                "refRange": ref_range,
                "isAbnormal": is_abnormal
            })
            entities_to_add.append(ExtractedEntity(
                entity_type="lab_test",
                key_name=param_name,
                value_text=val_str,
                unit=unit,
                reference_range=ref_range,
                is_abnormal=is_abnormal,
                status_flag=status_flag,
                source_tag="extracted-from-document"
            ))

    # Step 4: Determine report metadata
    report_type = "Lab Report" if findings else "Uploaded Document"
    upload_date = datetime.utcnow().strftime("%d %b %Y")

    if not raw_text.strip():
        raw_text = f"[Binary file — no text content extracted]\nFile: {file.filename}"

    doc = Document(
        session_id=sessionId,
        patient_id=resolved_patient_id,
        original_filename=file.filename,
        stored_filename=safe_name,
        file_path=stored_path,
        file_size=len(contents),
        mime_type=file.content_type or "application/octet-stream",
        report_type=report_type,
        report_date=upload_date,
        raw_ocr_text=raw_text[:4000]  # cap stored text
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Attach entities to document
    for ent in entities_to_add:
        ent.document_id = doc.id
    db.add_all(entities_to_add)

    # Add timeline event only if we extracted something meaningful
    tl_desc = ", ".join(
        f"{f['test']}: {f['value']} {f['unit']} ({f['status']})" for f in findings
    ) if findings else "No structured lab values extracted from document."
    tl = TimelineEvent(
        patient_id=resolved_patient_id,
        event_date=upload_date,
        event_type=report_type,
        title=f"Document Uploaded: {file.filename}",
        description=tl_desc
    )
    db.add(tl)
    db.commit()

    return {
        "id": doc.id,
        "originalFilename": doc.original_filename,
        "reportType": doc.report_type,
        "date": doc.report_date,
        "tests": ", ".join(f["test"] for f in findings) if findings else "None extracted",
        "findings": findings,
        "rawText": doc.raw_ocr_text,
        "_demoMode": False
    }

@router.get("/patient/{patientId}")
def get_patient_documents(patientId: str, db: Session = Depends(get_db)):
    """
    List all digitized documents for a patient.
    """
    docs = db.query(Document).filter(Document.patient_id == patientId).all()
    return [
        {
            "id": d.id,
            "filename": d.original_filename,
            "reportType": d.report_type,
            "reportDate": d.report_date,
            "uploadedAt": d.uploaded_at.isoformat(),
            "findingsCount": len(d.entities)
        }
        for d in docs
    ]

@router.get("/timeline/{patientId}")
def get_patient_timeline(patientId: str, db: Session = Depends(get_db)):
    """
    Get the patient's medical history timeline events.
    """
    events = db.query(TimelineEvent).filter(TimelineEvent.patient_id == patientId).order_by(TimelineEvent.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "date": e.event_date,
            "type": e.event_type,
            "title": e.title,
            "description": e.description
        }
        for e in events
    ]
