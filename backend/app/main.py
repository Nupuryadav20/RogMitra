# main.py — FastAPI application entrypoint with all API routers
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.config import settings
from app.db.session import engine, Base
from app.db import models

from app.api.auth import router as auth_router
from app.api.consent import router as consent_router
from app.api.session import router as session_router
from app.api.documents import router as documents_router
from app.api.ayurveda import router as ayurveda_router
from app.api.summary import router as summary_router
from app.api.doctor import router as doctor_router

# Auto-create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="RogMitra AI-Assisted Patient Case-Taking Software API (Phase 4)",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers under API_V1_STR
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(consent_router, prefix=settings.API_V1_STR)
app.include_router(session_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(ayurveda_router, prefix=settings.API_V1_STR)
app.include_router(summary_router, prefix=settings.API_V1_STR)
app.include_router(doctor_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "project": "RogMitra",
        "description": "AI-Assisted Patient Case-Taking Software API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    """
    Health check returning system service status, demo mode flag,
    and verified dataset status without running heavy inferences.
    """
    mts_data_path = os.path.join(
        "datasets", "clinical_dialogues",
        "clinical_visit_note_summarization_corpus-main",
        "clinical_visit_note_summarization_corpus-main", "data", "mts-dialog"
    )
    dataset_detected = os.path.exists(mts_data_path)
    
    return {
        "status": "healthy",
        "project": "RogMitra",
        "version": "1.0.0",
        "demo_mode": settings.DEMO_MODE,
        "dataset_mts_dialog_present": dataset_detected,
        "services": {
            "api": "active",
            "database": "sqlite_ready",
            "dialogue_manager": "ready",
            "red_flags": "rule_based_ready",
            "ocr_extractor": "ready (regex/synthetic fallback)",
            "summary_assembler": "ready",
            "ayurveda_engine": "ready (prototype bank)"
        }
    }
