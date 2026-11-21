# schemas/summary.py — Schemas for clinical summary review, doctor notes, and approvals
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SummaryReviewSchema(BaseModel):
    summaryId: str
    doctorNotes: Optional[str] = None
    editedFields: Optional[Dict[str, str]] = None
    doctorName: Optional[str] = None

class SummaryRejectSchema(BaseModel):
    summaryId: str
    reason: str
    doctorName: Optional[str] = None

class DoctorNoteSchema(BaseModel):
    noteText: str
