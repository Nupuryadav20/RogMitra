# schemas/auth.py — Pydantic models for authentication and user profiles
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RequestOtpSchema(BaseModel):
    phone: str = Field(..., pattern=r'^\+?[0-9]{10,14}$')

class VerifyOtpSchema(BaseModel):
    phone: str
    otp: str

class LoginDoctorSchema(BaseModel):
    email: str
    password: str

class MockAbhaSchema(BaseModel):
    abhaId: str

class RegisterPatientSchema(BaseModel):
    fullName: str
    phone: str
    age: int
    gender: str
    abhaId: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    abha_id: Optional[str] = None
    demo_mode: bool = True
