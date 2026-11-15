# RogMitra: Technical Architecture, UI Specification & Execution Plan

> **Project:** RogMitra – AI-Assisted Patient Case-Taking Software  
> **Status:** Phase 1 Complete (Analysis & Planning)  
> **Target:** Final Year B.Tech Project (Bennett University)  
> **Reference Specs:** `docs/reference/RogMitra.docx` & `docs/reference/RogMitra Healthcare App Dashboard Collage.png` (Theme 3: Patient Friendly)

---

## 1. Executive Summary & Architecture Overview

RogMitra is an AI-assisted pre-consultation case-taking and clinical documentation platform designed for outpatient departments (OPDs) in Indian hospitals. By shifting the initial medical history collection, document ingestion, and Ayurvedic assessment to the pre-consultation window, RogMitra saves valuable doctor consultation time, overcomes patient recall and literacy barriers through bilingual voice/touch interaction, and provides the clinician with a structured, editable **AI-Draft Clinical Summary** with automated **rule-based red-flag alerts**.

### Five-Layer Architectural Model
```
┌────────────────────────────────────────────────────────────────────────┐
│                   1. INTERACTION LAYER (Frontend)                      │
│  React + Vite + Tailwind (Theme 3) | Bilingual UI (EN / HI)            │
│  Touchscreen Kiosk / Mobile Web | Web Speech API & Browser TTS         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API / WebSocket
┌───────────────────────────────────▼────────────────────────────────────┐
│                    2. BACKEND & INTEGRATION LAYER                      │
│  FastAPI (Python 3.12) | SQLAlchemy + SQLite (Local Dev)               │
│  Role-Based Auth (Patient/Doctor) | Demo-OTP & Mock ABHA Service       │
│  Consent & Privacy Manager (DPDP Act 2023 compliance)                  │
└──────┬────────────────────────────┬─────────────────────────────┬──────┘
       │                            │                             │
┌──────▼─────────────────────┐ ┌────▼──────────────────────┐ ┌───▼──────┐
│  3. CONVERSATION ENGINE    │ │ 4. DOCUMENT INTELLIGENCE  │ │ 5. FHIR  │
│  Ontology Dialogue Manager │ │ Tesseract OCR (Hin+Eng)   │ │ ABDM-    │
│  SOCRATES Symptom Flow     │ │ PyMuPDF Document Parser   │ │ Ready    │
│  faster-whisper (CPU/GPU)  │ │ Regex + LLM Extraction    │ │ Resource │
│  Bilingual Rule Red-Flags  │ │ Timeline & Lab Flagging   │ │ Mapping  │
└──────┬─────────────────────┘ └────┬──────────────────────┘ └───┬──────┘
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                      6. CLINICAL SUMMARY ENGINE                        │
│  Rule-based SOAP / History Assembler (Zero-Hallucination Baseline)     │
│  Source Attribution: Patient-Reported vs OCR-Extracted vs AI-Draft     │
│  Optional Flan-T5 / LoRA LLM Synthesizer (Evaluated on MTS/ACI-Bench)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Final Technology Stack & Rationales

| Layer | Selected Tech | Justification / Machine Fit |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + Vite** | High performance, instant HMR, mature ecosystem, standard for modern interactive SPAs. |
| **Styling** | **Tailwind CSS v3** | Rapid implementation of custom design tokens matching Theme 3 (greens, mint, rounded corners, shadows). |
| **Routing & State** | **React Router v6 + Zustand** | Clean navigation across 6 distinct dashboard flows; lightweight reactive state management without Redux boilerplate. |
| **Frontend i18n** | **i18next + react-i18next** | First-class Hindi (`hi`) and English (`en`) localization with key fallback support. |
| **Audio / Speech (Client)** | **Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)** | Native zero-dependency client-side voice transcription and speech synthesis in browser. Works offline/local in Chromium. |
| **Backend Framework** | **FastAPI (Python 3.12)** | Asynchronous, auto-generates OpenAPI docs, native Pydantic validation, rapid integration with AI/ML Python modules. |
| **Database & ORM** | **SQLite + SQLAlchemy 2.0** | Zero-configuration, file-based persistence for development; easily portable; smooth migration to PostgreSQL if needed. |
| **Authentication** | **JWT (python-jose) + Passlib / Bcrypt** | Secure stateless tokens with `patient` and `doctor` role gates; includes bypass demo-OTP mode. |
| **ASR (Server-side)** | **`faster-whisper` (CTranslate2)** | Highly optimized Whisper inference on CPU/GPU. Client Web Speech API serves as instant fallback if model is uninstalled. |
| **OCR Pipeline** | **Tesseract OCR (`pytesseract`) + PyMuPDF (`fitz`)** | Standard open-source multilingual OCR for scanned PDFs and prescription images. Fallback synthetic extractor included if Tesseract binary is uninstalled. |
| **Information Extraction** | **Rule/Regex Engine + Optional Gemini / Ollama API** | Deterministic extraction for dates, vitals, lab ranges (Hb, ESR, BP); optional LLM refinement with fixed JSON schema. |
| **Red Flag Engine** | **Deterministic Bilingual Rule Engine** | **Non-negotiable rule:** Critical triage MUST NOT rely on stochastic LLM generation. Uses dual Hindi/English medical lexicons. |
| **Ayurvedic Engine** | **Configurable JSON Question Bank** | Classical Dashavidha Pariksha, Prakriti, Vikriti, Agni, Koshta, Aahara-Vihara; strictly tagged as prototype. |
| **Interoperability** | **`fhir.resources`** | Standard HL7 FHIR R4 mapping (`Patient`, `Condition`, `Observation`, `MedicationStatement`, `AllergyIntolerance`). |

---

## 3. Detailed Architecture for the 8 Core Modules

### Module 1: Login & Authentication
- **Roles:** `patient` and `doctor`.
- **Modes:** 
  1. Mobile Phone + OTP (mock/demo mode with fixed OTP `123456` in development).
  2. Mock ABHA ID Login (e.g., `91-XXXX-XXXX-XXXX` or `patient@abdm`).
  3. Doctor Login (credential-based: `dr.sharma@hospital.org` / demo password).
- **Consent Gate:** Mandatory consent modal presented on first patient login explaining data collection under DPDP Act 2023 with audio prompt option.

### Module 2: Patient Dashboard
- **Greeting & Navigation:** Displays patient name, avatar, and navigation drawer.
- **Hero Intake Card:** Highlights "Start Your AI Case-Taking" with an interactive mascot graphic and progress indicator.
- **Quick Action Grid:**
  - Voice Interview (Green card)
  - Scan Documents (Blue card)
  - Ayurvedic History (Yellow card)
  - View Summary (Purple card)
- **Status Badges:** Shows which modules have been completed for the current OPD token.

### Module 3: AI Voice Interview (Adaptive Case-Taking)
- **Framework:** SOCRATES model (Site, Onset, Character, Radiation, Associations, Time course, Exacerbating/relieving factors, Severity).
- **Dialogue Engine:** State machine tracking filled history slots (`chief_complaint`, `hpi`, `past_medical`, `medications`, `allergies`, `family_history`, `lifestyle`).
- **Interactive UI:** Central pulsating audio orb/rings, real-time waveform visualizer, example hint chips ("I have a headache since 3 days"), pause/mic toggles, and step progression (Symptoms → History → Lifestyle → Review).

### Module 4: Medical Document Scanner (OCR & Entity Extraction)
- **Ingestion:** File upload (JPG, PNG, PDF) and camera capture trigger.
- **Processing:** Multi-step pipeline:
  1. Image preprocessing (contrast normalization).
  2. Text extraction via Tesseract (or rule-based fallback).
  3. Medical entity recognizer targeting: Test names, numerical values, unit strings, reference ranges, and report date.
- **UI:** Two-panel view — Left: Dropzone & document preview; Right: Structured key-value cards with status tags (`Low`, `Normal`, `High`, `Critical`).

### Module 5: Ayurvedic History Mode (AYUSH Mode)
- **Design Philosophy:** Optional modular track for traditional medicine consultations.
- **5 Clinical Pillars:**
  1. *Prakriti* (Body constitution: Vata, Pitta, Kapha)
  2. *Vikriti* (Current doshic imbalance)
  3. *Agni* (Digestive fire: Mandagni, Tikshnagni, Vishamagni, Samagni)
  4. *Koshta* (Bowel habits: Krura, Madhyama, Mridu)
  5. *Aahara-Vihara* (Dietary and lifestyle habits)
- **Validation Notice:** UI and exports clearly display: *"Ayurvedic question bank prototype – pending validation by a qualified Ayurvedic practitioner."*

### Module 6: AI Clinical Summary Generator
- **Deterministic Core:** Assembles verified patient statements, abnormal lab findings, and medications into a structured clinical note (SOAP structure).
- **Visual Three-Tier Attribution:**
  - 🟢 **Patient-Reported:** Facts spoken or selected by the patient.
  - 🔵 **Document-Extracted:** Data pulled from scanned lab/prescription records.
  - 🟡 **AI Draft:** Synthesized temporal summary and observations.
- **Strict Compliance:** Never states a definitive diagnosis.

### Module 7: Red Flag System (Rule-Based Triage Engine)
- **Trigger Lexicon:** Bilingual dictionary (Hindi + English) covering:
  - Chest pain / Angina / छाती में दर्द
  - Breathlessness / Dyspnea / सांस लेने में तकलीफ
  - Altered sensorium / Loss of consciousness / बेहोशी
  - Hemoptysis / Severe bleeding / खून की उल्टी / ज्यादा खून बहना
  - High persistent fever / severe sudden headache
- **Behavior:** Immediate visual banner, audio warning, high-priority flag attached to the doctor summary with triage urgency indicator (`CRITICAL` vs `URGENT`).

### Module 8: Doctor Dashboard
- **Consultation View:** Overview of OPD queue, active patient demographics (`Ananya Verma, 28Y/F, Case Taken: 23 Oct 2026`).
- **Clinical Review:**
  - Tab 1: Clinical History Note (editable fields).
  - Tab 2: Uploaded Reports & OCR timeline.
  - Tab 3: Ayurvedic Assessment.
- **Observation Panel:** Renamed to **"AI Draft Observations (for physician review)"** per Rule #1.
- **Doctor Actions:** Full inline editing, "Add Notes", "Reject Draft", and "Approve & Save".

---

## 4. Screen-by-Screen UI Specification (Theme 3: Patient Friendly)

### Design Tokens
- **Primary Brand Green:** `#0D7A46` (Buttons, active icons, primary highlights)
- **Dark Green Hover/Active:** `#085A33`
- **Soft Mint Background:** `#EDF8F1` (Hero banners, active nav pills)
- **App Background Canvas:** `#F4FBF7`
- **Card Background:** `#FFFFFF` (Pure white with subtle border `#E2EFE7`)
- **Text Headings:** `#111827` (Deep dark slate)
- **Text Body / Muted:** `#4B5563` / `#52705E`
- **Red Flag Red:** Background `#FEF2F2`, Border `#F87171`, Text `#DC2626`
- **Card Radius:** `16px` (`rounded-2xl`) and `24px` (`rounded-3xl`)
- **Button Radius:** `12px` (`rounded-xl`) and `9999px` (`rounded-full` for chips)
- **Elevation:** `box-shadow: 0 4px 20px -2px rgba(13, 122, 70, 0.06)`

### Screen 1: Login / Welcome Screen
- **Layout:** Two-column split layout (Left Hero + Right Auth Card) on `#F4FBF7` background.
- **Left Hero:**
  - Doctor illustration in white coat with stethoscope holding a tablet.
  - Heading: "Your Health Story, Made Simple."
  - Subtext: "Share your medical history with the help of AI, before your doctor's consultation."
  - 4 Feature Pills: Voice Based Interaction, Scan Medical Reports, Ayurvedic History, AI Clinical Summary.
- **Right Card:**
  - Title: "Welcome to RogMitra".
  - Segmented Switcher: `[Patient | Doctor]`.
  - Inputs: Mobile Number (phone icon), OTP (lock icon + inline "Get OTP" button).
  - Primary CTA: "Login" (dark green `#0D7A46`, full width).
  - Divider: "or"
  - Outline Button: "Continue with ABHA ID" with official ABHA logo.
  - Footer link: "New User? Register Here".

### Screen 2: Patient Dashboard
- **Sidebar Nav:** Fixed left rail (`Dashboard`, `Start Case-Taking`, `My Reports`, `Ayurvedic History`, `Past Records`, `Profile`, `Help & Support`). Active item rendered with solid green pill `#0D7A46` and white text.
- **Top Header:** RogMitra Logo (leaf-cross), user greeting "Hello, Ananya 👋", notification bell, profile circle.
- **Hero Card:** Mint background `#EDF8F1`, rounded-3xl. Left side: Title "Start Your AI Case-Taking", subtext, "Start Now ->" green button. Right side: Friendly healthcare robot mascot with medical cross and stethoscope.
- **Quick Actions (4 Cards):**
  - Voice Interview: Green badge `#E8F8EE`, mic icon.
  - Scan Documents: Blue badge `#EBF5FF`, doc icon.
  - Ayurvedic History: Amber badge `#FEF8E7`, leaf icon.
  - View Summary: Purple badge `#F3EFFC`, report icon.

### Screen 3: AI Voice Interview (Case-Taking)
- **Top Bar:** Back button, RogMitra logo, user profile avatar.
- **Horizontal Stepper:** 4 nodes: `Symptoms` (Green Active) ── `History` ── `Lifestyle` ── `Review`.
- **Center Stage:** Glowing concentric green sound rings (`#0D7A46` center mic circle with radiating mint rings).
- **Prompt:** Big typography: "Tell me about your current health problem."
- **Hint Chips:** "You can say, for example:" → `["I have a headache since 3 days.", "I feel fever and body pain.", "I have cough at night."]`.
- **Bottom Control Bar:** Circular Pause button (`||`), dynamic animated audio wave bars, central primary Mic button with "Listening..." indicator, and right "Next ->" button.

### Screen 4: Medical Document Scan (OCR)
- **Header:** "Scan Medical Documents".
- **Left Dropzone Card:** Border dashed 2px `#A3E3BE`, cloud upload icon with upward arrow, text "Prescription, Lab Reports, Discharge Summary, X-ray, etc.", "Choose File" button + Camera icon button.
- **Right Extracted Card:** Title "Extracted Information (AI OCR)" with green check circle. Key-value table:
  - Report Type: `Lab Report`
  - Date: `12 Oct 2026`
  - Test(s): `CBC, ESR`
  - Key Findings: `Hb: 11.2 g/dL (Low) | ESR: 28 mm/hr (High)` with red/yellow badge highlights.

### Screen 5: Ayurvedic History (Ayush Mode)
- **Header:** "Ayurvedic History (Ayush Mode)" with decorative botanical herbal leaf motif.
- **Stepper:** 5 nodes: `Prakriti` ── `Vikriti` ── `Agni` ── `Koshta` ── `Aahara-Vihara`.
- **Card Content:** "Prakriti Assessment - Which of these best describes your body type?".
- **Option Cards:**
  - Card 1: `Vata` (Wind icon, "Thin, Active, Quick Thinking").
  - Card 2: `Pitta` (Flame icon, "Medium Build, Warm, Intense") - Selected state (green outline `#0D7A46`, checkmark badge).
  - Card 3: `Kapha` (Leaf icon, "Heavy Build, Calm, Steady").
- **Navigation Controls:** Left "<- Back" outline button, Right "Next ->" solid green button.

### Screen 6: Doctor Dashboard – AI Clinical Summary
- **Left Sidebar:** `Doctor Dashboard` (Active green pill), `OPD Queue`, `Patient Summaries`, `Reports`, `Settings`.
- **Header Bar:** Doctor profile "Dr. Sharma", notification icon.
- **Patient Banner:** Name "Ananya Verma", Age "28 Y | Female", Case Taken timestamp "23 Oct 2026, 10:24 AM", right "Edit" button with pencil icon.
- **Section Tabs:** `[Clinical History]`, `[Uploaded Reports]`, `[Ayurvedic History]`.
- **Two-Column Note Grid:**
  - Left: Structured SOAP / History Sections (Presenting Complaint, HPI, Past History, Medications) with bullet points.
  - Right Top: **Red Flag Alerts** box (`#FEF2F2` bg, red border, red warning icon): "Persistent headache (> 3 days)", "Elevated ESR (from report)".
  - Right Bottom: **"AI Draft Observations (for physician review)"** (strictly renamed per Rule #1): "Reported acute febrile symptoms with elevated inflammatory marker (ESR). Kindly correlate clinically."
- **Bottom Bar:** "View Full Summary" (outline), "Add Notes" (outline), "Approve & Save" (solid green `#0D7A46` with checkmark).

---

## 5. Database Schema Draft (SQLAlchemy / SQLite)

```sql
-- Patients
CREATE TABLE patients (
    id VARCHAR(36) PRIMARY KEY,
    abha_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (Doctors / Hospital Staff)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'doctor',
    department VARCHAR(50) DEFAULT 'General Medicine',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consult Sessions (Case-Taking Encounters)
CREATE TABLE consult_sessions (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) REFERENCES patients(id),
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, reviewed, approved, rejected
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dialogue History Entries
CREATE TABLE dialogue_turns (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES consult_sessions(id),
    turn_index INTEGER NOT NULL,
    speaker VARCHAR(10) NOT NULL, -- 'bot' or 'patient'
    text_content TEXT NOT NULL,
    slot_name VARCHAR(50), -- e.g., 'chief_complaint', 'duration', 'fever'
    input_mode VARCHAR(20) DEFAULT 'voice', -- 'voice' or 'touch'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical Documents & Extracted OCR Entities
CREATE TABLE medical_documents (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES consult_sessions(id),
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    raw_ocr_text TEXT,
    report_type VARCHAR(50), -- 'Lab Report', 'Prescription', 'Discharge Summary'
    report_date VARCHAR(20),
    extracted_data_json TEXT, -- JSON blob of key findings
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ayurvedic Assessment Records
CREATE TABLE ayurvedic_records (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES consult_sessions(id),
    prakriti VARCHAR(20), -- Vata, Pitta, Kapha, or combinations
    vikriti VARCHAR(20),
    agni VARCHAR(20),
    koshta VARCHAR(20),
    aahara_vihara_json TEXT,
    practitioner_validated BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinical Summaries
CREATE TABLE clinical_summaries (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES consult_sessions(id),
    structured_note_json TEXT NOT NULL, -- SOAP sections with attribution
    red_flags_json TEXT NOT NULL, -- Detected critical red flags
    ai_draft_observations TEXT, -- Draft non-diagnostic observations
    doctor_edits_json TEXT, -- Any changes made by doctor
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'approved', 'rejected'
    reviewed_by VARCHAR(36) REFERENCES users(id),
    reviewed_at TIMESTAMP
);
```

---

## 6. Backend API Route Specification

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/health` | Healthcheck returning service & model availability status |
| **Auth** | `POST` | `/api/v1/auth/request-otp` | Request OTP for mobile number |
| **Auth** | `POST` | `/api/v1/auth/verify-otp` | Verify OTP and issue JWT (Patient role) |
| **Auth** | `POST` | `/api/v1/auth/login-doctor` | Doctor login with email/password |
| **Auth** | `POST` | `/api/v1/auth/mock-abha` | Mock ABHA ID authentication |
| **Session** | `POST` | `/api/v1/session/start` | Initialize pre-consultation session + log consent |
| **Dialogue** | `POST` | `/api/v1/dialogue/turn` | Submit patient speech/text input; get next adaptive question |
| **Speech** | `POST` | `/api/v1/speech/transcribe` | Transcribe voice recording via `faster-whisper` (or fallback) |
| **Documents** | `POST` | `/api/v1/documents/upload` | Upload document image/PDF, run OCR, extract entities |
| **Ayurveda** | `GET` | `/api/v1/ayurveda/questions`| Get configured Ayurvedic question bank |
| **Ayurveda** | `POST` | `/api/v1/ayurveda/submit` | Store Ayurvedic assessment responses |
| **Summary** | `GET` | `/api/v1/summary/:sessionId`| Get structured draft summary with red flags & attribution |
| **Summary** | `POST` | `/api/v1/summary/:id/review`| Doctor action: approve, edit, or reject summary |
| **FHIR** | `GET` | `/api/v1/fhir/bundle/:sessionId`| Export consultation record as FHIR R4 Bundle |

---

## 7. Operational Feasibility: Self-Contained vs External Setup Matrix

| Component | Works With Zero External Resources (Built-In Fallback) | Needs Manual Setup (When Adding Real Model/Software) |
| :--- | :--- | :--- |
| **UI & Navigation** | ✅ 100% works locally (Vite + React + Tailwind) | None |
| **Bilingual Voice Input** | ✅ Native browser Web Speech API (`webkitSpeechRecognition`) | Server-side Whisper: needs `faster-whisper` Python package & model download |
| **Voice Output (TTS)** | ✅ Native browser SpeechSynthesis (`speechSynthesis.speak`) | High-res neural TTS (e.g. AI4Bharat Indic-TTS) |
| **Document OCR** | ✅ Regex & rule parser on pre-loaded synthetic samples | Real physical scans: needs Tesseract OCR binary installed on Windows |
| **Red Flag Alerts** | ✅ 100% works locally (Deterministic bilingual rule engine) | None (Rules are self-contained and auditable) |
| **Adaptive Dialogue** | ✅ 100% works locally (SOCRATES slot-filler engine) | None |
| **Ayurvedic Mode** | ✅ 100% works locally (Configurable JSON question bank) | Professional Ayurvedic practitioner domain validation |
| **Summary Generation** | ✅ Rule-based SOAP Assembler with exact source tags | LoRA-tuned Flan-T5 / LLM checkpoint for comparative evaluation |
| **FHIR Mapping** | ✅ Pure Python `fhir.resources` JSON generation | Hospital Information System (HIS) API endpoint for live ingest |
| **Authentication** | ✅ Local JWT + Mock OTP + Mock ABHA service | Official NHA ABDM Gateway integration (sandbox credentials) |

---
*Created per RogMitra Phase 1 engineering guidelines.*
