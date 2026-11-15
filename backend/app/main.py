from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="RogMitra AI-Assisted Patient Case-Taking Software API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            "dialogue_manager": "ready",
            "red_flags": "rule_based_ready",
            "ocr_extractor": "ready (regex/synthetic fallback)",
            "summary_assembler": "ready"
        }
    }
