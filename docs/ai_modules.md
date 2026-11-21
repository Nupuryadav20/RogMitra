# RogMitra: AI Modules & Dialogue Management Architecture

## 1. Overview
RogMitra uses a **hybrid clinical dialogue architecture**:
* A **deterministic rule-based core** guarantees that every interview strictly adheres to clinical standards (SOCRATES), never hallucinates, and immediately catches red flag emergencies.
* An **optional LLM follow-up layer** (Gemini / Ollama) can adaptively phrase follow-up questions while strictly bounded by non-diagnostic clinical guardrails.

---

## 2. Interview Flow Architecture

```
[Patient Starts Intake]
       │
       ▼
[FIRST QUESTION: Chief Complaint (Non-negotiable)]
"What health problem are you facing today? Please describe it in your own words."
(Bilingual English + Hindi; voice, typing, or touch chips)
       │
       ▼
[Rule-Based Clinical Entity Extractor]
- Extracts symptom categories (headache, fever, cough, chest pain, etc.)
- Extracts duration via regex ("2 din se" -> "2 days", "since morning", etc.)
- Extracts details (severity, character, radiation, associates)
       │
       ▼
[Deterministic Red Flag Engine (Rule 3)]
- Runs on EVERY patient answer immediately.
- Never probabilistic; bilingual regex matching.
- Detects emergencies (e.g., "seene mein dard", "khoon aana").
       │
       ▼
[SOCRATES Follow-up Queue with Adaptive Skipping]
- Questions targeted specifically at the reported symptom:
  • Site
  • Onset (SKIPPED if duration was already stated, e.g. "2 din se")
  • Character
  • Radiation
  • Associations (SKIPPED if already mentioned, e.g. fever alongside headache)
  • Time course
  • Exacerbating / Relieving factors
  • Severity (1-10)
- Multi-symptom handling: handles primary symptom, then secondary symptom.
- Systemic History: HPI summary, past medical, surgical, medications, allergies, family, lifestyle.
       │
       ▼
[Optional LLM Follow-Up with Strict Guardrails]
- If LLM_PROVIDER is configured (gemini | ollama):
  Attempts single-question phrasing.
- Strict Guardrail Validation:
  ✓ Single question under 35 words ending with '?'
  ✗ NO diagnosis wording (migraine, infection, malaria, etc.)
  ✗ NO prescribing or medicine wording (paracetamol, tablet, take, etc.)
  ✗ NO advice or treatment suggestions.
- If validation fails or times out:
  Automatically falls back to rule-based SOCRATES questions.
  Shows badge: "AI follow-up off – using standard questions".
- If valid LLM question:
  Shows badge: "AI-generated question".
```

---

## 3. Configuration Variables (`backend/.env`)

To configure optional LLM integration, add the following variables in `backend/.env` (or project root `.env`):

| Variable Name | Allowed Values | Default | Description |
| :--- | :--- | :--- | :--- |
| `LLM_PROVIDER` | `none`, `gemini`, `ollama` | `none` | Active LLM engine for follow-ups. Defaults to `none` (100% deterministic rule-based SOCRATES). |
| `GEMINI_API_KEY` | String (API Key) | `""` | Google Gemini API Key (e.g. from Google AI Studio). Kept on backend only; **never exposed in frontend**. |
| `OLLAMA_BASE_URL` | URL string | `http://localhost:11434` | Local Ollama endpoint if running local models. |
| `OLLAMA_MODEL` | Model tag | `llama3` | Target model for Ollama (e.g. `llama3`, `mistral`). |

### Example `backend/.env` Snippet:
```ini
# To use Google Gemini:
LLM_PROVIDER="gemini"
GEMINI_API_KEY="AIzaSyYourSecretKeyHere"

# Or to use Local Ollama:
# LLM_PROVIDER="ollama"
# OLLAMA_BASE_URL="http://localhost:11434"
# OLLAMA_MODEL="llama3"

# Default (No LLM, 100% offline rule-based SOCRATES):
# LLM_PROVIDER="none"
```

---

## 4. Database Persistence
Every question and answer is recorded in the `interview_answers` SQLite table:
* `field_name`: Slot key (e.g., `chief_complaint`, `site`, `character`, `severity`, `past_medical`).
* `question_text`: Text of the question presented to the patient.
* `question_source`: Attribution tag (`"rule-based"` or `"llm-generated"`).
* `answer_text`: Verified patient answer.
* `input_mode`: `"voice"` or `"touch"`.
