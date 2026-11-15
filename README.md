# RogMitra – AI-Assisted Patient Case-Taking Software

> **Final Year B.Tech Project (Bennett University)**  
> **Team:** Anya Yadav, Sunidhi Srivastava, Nupur Yadav, Pragya Singh, Krati Budholiya, Ramesh Jangid, Vansh Kaushik  
> **Project Guide:** Dr. Kimmi Gupta

RogMitra is an AI-assisted pre-consultation case-taking and clinical documentation platform designed for outpatient departments (OPDs) in Indian hospitals. It shifts the burden of clinical history collection, medical report digitization (OCR), and Ayurvedic evaluation to the pre-consultation window, presenting the physician with a structured, editable **AI-Draft Clinical Summary** with deterministic **Red Flag alerts**.

---

## 📌 Non-Negotiable Project Rules
All development follows the 10 core constraints in [PROJECT_RULES.md](file:///c:/Users/hp/OneDrive/Desktop/RogMitra/PROJECT_RULES.md):
1. **NO autonomous diagnosis or prescribing.** Never output disease labels as AI conclusions.
2. Every summary is a **DRAFT**; the doctor can accept, edit, or reject.
3. Red flags use a **RULE-BASED bilingual (Hindi/English) engine**, never LLM-only.
4. No fake AI outputs, no fake accuracy figures, no invented dataset files.
5. All secrets in `.env`; never expose API keys in frontend.
6. Explicit consent screen, revocable consent, DPDP Act 2023 compliance.
7. Mock ABHA interface only; no live claim.
8. Ayurvedic question bank is a prototype pending practitioner validation.
9. Free & open-source, modular code.
10. Strict adherence to **Theme 3 (Patient Friendly)** UI specifications.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python:** 3.12+ (tested on Python 3.12.3)
- **Node.js:** v20+ (tested on Node v26.9.0, npm 11.19.1)
- **OS:** Windows / Linux / macOS

---

### 1. Backend Setup & Run

```powershell
# Navigate to workspace root
cd RogMitra

# Activate Python virtual environment (Windows PowerShell)
.\backend\venv\Scripts\Activate.ps1
# (or on Linux/macOS: source backend/venv/bin/activate)

# Run unit tests
pytest tests/ -v

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
- API Root: `http://localhost:8000/`
- API Health: `http://localhost:8000/health`
- Interactive Swagger Docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup & Run

```powershell
# In a separate terminal, navigate to frontend/
cd RogMitra/frontend

# Start Vite development server on port 5173
npm run dev
```
- Web App UI: `http://localhost:5173/`

---

### 3. Verify Datasets

```powershell
python scripts/verify_datasets.py
```
Verifies row counts and schemas for the Microsoft `clinical_visit_note_summarization_corpus` (MTS-Dialog and ACI-Bench).

---

## 📂 Project Structure

```
RogMitra/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (auth, dialogue, ocr, summary, etc.)
│   │   ├── core/            # Configuration & security settings
│   │   ├── db/              # SQLAlchemy models & database session
│   │   ├── services/        # Modular service engines
│   │   │   ├── asr/         # Speech recognition (faster-whisper + browser fallback)
│   │   │   ├── dialogue/    # SOCRATES-based adaptive dialogue manager
│   │   │   ├── redflags/    # Deterministic bilingual red-flag engine
│   │   │   ├── ocr/         # Tesseract OCR & image preprocessing
│   │   │   ├── extraction/  # Medical entity extractor & timeline
│   │   │   ├── summary/     # 3-tier SOAP note assembler
│   │   │   ├── ayurveda/    # Dashavidha Pariksha question bank
│   │   │   └── fhir/        # HL7 FHIR R4 resource mapper
│   │   └── main.py          # FastAPI application entrypoint
│   ├── requirements.txt     # Python dependencies
│   └── venv/                # Isolated virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # 6 core views (Login, Patient, Interview, OCR, Ayush, Doctor)
│   │   ├── layouts/         # Theme 3 sidebar layouts
│   │   ├── hooks/           # Voice & state hooks
│   │   ├── i18n/            # Hindi / English translations
│   │   ├── services/        # Axios / Fetch API clients
│   │   ├── styles/          # Theme 3 tokens & CSS
│   │   ├── App.jsx          # Root view with navigation
│   │   └── main.jsx         # React DOM entrypoint
│   ├── tailwind.config.js   # Theme 3 color tokens (greens, mint, shadows)
│   └── package.json         # Frontend dependencies (React, Vite, Tailwind, Lucide)
├── datasets/
│   ├── clinical_dialogues/  # Microsoft Clinical Visit Note Summarization Corpus
│   ├── aci_bench/           # ACI-Bench challenge splits
│   ├── synthea/             # Synthetic profiles
│   ├── synthetic_demo/      # Localized demo records
│   └── README.md            # Dataset documentation & CC BY 4.0 attribution
├── docs/
│   ├── PLAN.md              # Complete technical architecture & UI spec
│   └── reference/           # Proposal DOCX & Theme 3 Collage PNG
├── scripts/
│   └── verify_datasets.py   # Dataset validation script
├── tests/
│   └── test_health.py       # API health check tests
├── .env.example             # Environment template
├── .gitignore
├── PROJECT_RULES.md         # 10 Non-negotiable engineering rules
└── README.md                # Project documentation
```

---

## 🎨 Design System: Theme 3 (Patient Friendly)
- **Primary Brand Green:** `#0D7A46`
- **Soft Mint Canvas:** `#F4FBF7`
- **Card Background:** `#FFFFFF` with `#EDF8F1` Hero banner
- **Alert Triage:** `#FEF2F2` / `#DC2626`
- **Typography:** Plus Jakarta Sans / Inter

---
*Maintained under the RogMitra Project Governance Guidelines.*
