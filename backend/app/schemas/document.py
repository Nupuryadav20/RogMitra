# schemas/document.py — Schemas for document upload, OCR extraction, and timeline
from pydantic import BaseModel
from typing import Optional, List

class ExtractedEntitySchema(BaseModel):
    test: str
    value: str
    unit: Optional[str] = None
    refRange: Optional[str] = None
    status: str = "Normal" # 'Low', 'Normal', 'High', 'Critical'
    isAbnormal: bool = False

class DocumentResponseSchema(BaseModel):
    id: str
    originalFilename: str
    reportType: str
    reportDate: Optional[str] = None
    tests: Optional[str] = None
    findings: List[ExtractedEntitySchema] = []
    rawOcrText: Optional[str] = None
    uploadedAt: str

class TimelineEventSchema(BaseModel):
    id: str
    eventDate: str
    eventType: str
    title: str
    description: Optional[str] = None
