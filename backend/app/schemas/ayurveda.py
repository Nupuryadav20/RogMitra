# schemas/ayurveda.py — Schemas for Ayurvedic assessments
from pydantic import BaseModel
from typing import Dict, Any, Optional

class AyurvedaSubmitSchema(BaseModel):
    sessionId: str
    patientId: Optional[str] = None
    answers: Dict[str, str] # e.g. {"P1Q1": "B", "P1Q2": "A"}
