# RogMitra: Non-Negotiable Project Rules & Governance

> **CRITICAL PROJECT CHARTER**  
> These 10 rules are non-negotiable architectural constraints for the RogMitra project.  
> They must be re-read and strictly adhered to before beginning every development phase.

---

### Rule 1: No Autonomous Diagnosis or Prescribing
- RogMitra is strictly an administrative and clinical pre-consultation intake documentation assistant.
- **Never** output disease labels or definitive diagnoses as AI conclusions.
- In the doctor summary, the panel originally labelled "AI Impression" in the UI mockups **must be strictly renamed**:
  **"AI Draft Observations (for physician review)"**
- This panel must contain only objectively reported facts, abnormal ranges, and symptom correlations for physician interpretation (e.g. *"Reported acute febrile symptoms with elevated inflammatory marker (ESR). Kindly correlate clinically."*). It must never say *"Diagnosis: Malaria"* or prescribe treatments.

### Rule 2: Every Summary is a Human-in-the-Loop DRAFT
- Every generated clinical summary is marked prominently as **"AI DRAFT (Unapproved)"**.
- The physician retains total medical autonomy to **Accept**, **Edit**, or **Reject** the note before saving to the medical record.
- The UI must visually distinguish the source of every data item:
  - 🟢 **(a) Patient-Reported** (from voice interview or touch intake)
  - 🔵 **(b) Extracted from Documents** (from OCR of uploaded lab reports/prescriptions)
  - 🟡 **(c) AI-Generated Draft** (synthesized observations and timeline)

### Rule 3: Deterministic Rule-Based Red Flag Engine
- Emergency symptoms (e.g., severe dyspnea, acute chest pain, altered consciousness, profuse bleeding, stroke signs) **must NEVER rely exclusively on an LLM or probabilistic generation**.
- Triage red flags must be driven by a deterministic, auditable, bilingual (Hindi + English) rule and keyword matching engine.
- When a red flag is detected, display immediate emergency alerts to the patient and elevate the priority on the doctor's queue.

### Rule 4: No Fabricated AI Outputs, Accuracy Figures, or Invented Data
- Do not fabricate accuracy metrics, benchmark percentages, or synthetic evaluation numbers.
- Do not invent non-existent dataset files.
- If an underlying model or local service (e.g., Tesseract OCR binary, faster-whisper, local Ollama) is not installed on the host system, provide a clearly labelled deterministic fallback mock and document the exact prerequisite steps required to activate the real service.

### Rule 5: Zero Frontend Exposure of Secrets
- Never commit or expose API keys, database credentials, or secret tokens in the frontend code.
- All configuration must flow through server-side environment variables via `.env` with a committed `.env.example` template.

### Rule 6: Explicit Consent & Privacy Safeguards
- Present a clear consent screen before any data collection begins.
- Support revocable consent in accordance with the Digital Personal Data Protection Act (DPDP Act 2023) and ABDM guidelines.
- Clearly display **"DEMO / SYNTHETIC DATA"** mode banners during prototype testing.
- Temporary session voice clips and scratch buffers must be scrubbed after submission.

### Rule 7: Mock ABHA Interface
- Provide an ABHA ID entry, authentication modal, and FHIR resource mapping interface.
- Clearly label this interface as a **Sandbox / Mock ABHA Gateway**. Do not claim live National Health Authority (NHA) production integration.

### Rule 8: Qualified Prototype Disclaimer for Ayurvedic Mode
- The Ayurvedic intake module (Dashavidha Pariksha, Prakriti, Vikriti, Agni, Koshta, Aahara-Vihara) is a structured prototype question bank.
- It must clearly state in the UI and documentation:
  *"Configurable JSON prototype – pending validation by a qualified Ayurvedic practitioner."*

### Rule 9: Free & Open-Source, Clean Modular Engineering
- Prefer free, open-source, easily installable tools and libraries.
- Keep codebase modular, well-commented, and readable.
- Avoid large unexplained TODO stubs or ghost code.
- Do not introduce unrelated or out-of-scope features.

### Rule 10: Adherence to Theme 3 UI System
- Adhere strictly to the "Theme 3: Patient Friendly" design system:
  - Color palette: Deep Forest Green (`#0D7A46`), Light Mint Card Background (`#EDF8F1`), Screen Canvas (`#F4FBF7`), Crisp White (`#FFFFFF`).
  - Spacing & Shapes: Soft rounded cards (`rounded-2xl`, `rounded-3xl`), pill navigation badges, gentle elevation shadows.
  - Sidebar layout and multi-step intake flows.
- Do not arbitrarily redesign screens away from the reference specification.
