# schemas/session.py — Schemas for interview turns, answers, and consent
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ConsentGrantSchema(BaseModel):
    userId: str
    purpose: Optional[str] = None

class AnswerSubmitSchema(BaseModel):
    sessionId: str
    fieldName: str
    questionText: Optional[str] = None
    questionSource: Optional[str] = "rule-based" # 'rule-based' or 'llm-generated'
    answerText: str
    inputMode: str = "voice" # 'voice' or 'touch'
    language: Optional[str] = "en"

class DialogueTurnSchema(BaseModel):
    sessionId: str
    inputMode: str = "voice"
    transcript: str
    currentQuestionIndex: int

class RedFlagSchema(BaseModel):
    category: str
    severity: str # 'URGENT' or 'CRITICAL'
    keywordMatched: str
    alertMessage: str
