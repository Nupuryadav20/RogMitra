# schemas/auth.py — Pydantic models for authentication and user profiles
from pydantic import BaseModel
from typing import Optional

class RequestOtpSchema(BaseModel):
    phone: Optional[str] = ""

class VerifyOtpSchema(BaseModel):
    phone: Optional[str] = ""
    otp: Optional[str] = ""
    name: Optional[str] = None
    role: Optional[str] = "patient"

class LoginDoctorSchema(BaseModel):
    email: Optional[str] = ""
    password: Optional[str] = ""
    name: Optional[str] = None

class MockAbhaSchema(BaseModel):
    abhaId: Optional[str] = ""
    name: Optional[str] = None

class RegisterPatientSchema(BaseModel):
    fullName: str
    phone: str
    age: int = 28
    gender: str = "Other"
    abhaId: Optional[str] = None

class DemoLoginSchema(BaseModel):
    role: str = "patient"
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

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
