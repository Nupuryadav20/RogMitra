# RogMitra Backend API Documentation (Phase 4)

Base URL: `http://localhost:8000/api/v1`  
Interactive OpenAPI / Swagger UI: `http://localhost:8000/docs`

---

## 1. Authentication (`/auth`)

### `POST /auth/request-otp`
Requests an OTP for patient mobile verification.
- **Request Body:**
  ```json
  { "phone": "9876543210" }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "OTP sent successfully.",
    "phone": "9876543210",
    "demo_mode": true,
    "demo_otp": "123456"
  }
  ```

### `POST /auth/verify-otp`
Verifies OTP and returns a JWT access token with role `patient`.
- **Request Body:**
  ```json
  { "phone": "9876543210", "otp": "123456" }
  ```
- **Response:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "role": "patient",
    "user_id": "uuid",
    "full_name": "Ananya Verma",
    "phone": "9876543210",
    "abha_id": "91-8765-4321-0987"
  }
  ```

### `POST /auth/login-doctor`
Doctor credential authentication.
- **Request Body:**
  ```json
  { "email": "dr.sharma@hospital.org", "password": "Doctor@123" }
  ```
- **Response:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "role": "doctor",
    "user_id": "uuid",
    "full_name": "Dr. R. Sharma",
    "email": "dr.sharma@hospital.org"
  }
  ```

### `POST /auth/mock-abha`
Authenticates with a simulated ABHA ID (Rule 7: Mock Sandbox).
- **Request Body:**
  ```json
  { "abhaId": "91-8765-4321-0987" }
  ```

---

## 2. DPDP Consent Management (`/consent`)

### `POST /consent/grant`
Records explicit revocable patient consent under DPDP Act 2023.
- **Request Body:**
  ```json
  { "userId": "uuid", "purpose": "Pre-consultation case-taking" }
  ```

### `POST /consent/revoke/{userId}`
Withdraws patient consent and halts pre-consultation processing.

### `GET /consent/status/{userId}`
Checks if active consent exists.

---

## 3. Case-Taking Session (`/session`)

### `POST /session/start`
Initializes a new case-taking intake session.
- **Query params:** `patientId`, `language` ('en' / 'hi')

### `POST /session/answer`
Saves an individual question turn (voice transcript or touch option).
- **Request Body:**
  ```json
  {
    "sessionId": "uuid",
    "fieldName": "chief_complaint",
    "questionText": "What brings you to the hospital?",
    "answerText": "Headache for 3 days with mild fever",
    "inputMode": "voice"
  }
  ```

### `POST /session/submit/{sessionId}`
Completes intake session and synthesizes initial draft clinical summary.

### `DELETE /session/delete/{sessionId}`
Rule 6: Scrubs temporary audio recordings and scratch buffers after submission.

---

## 4. Document Intelligence & OCR (`/documents`)

### `POST /documents/upload`
Uploads medical records (PDF, JPG, PNG; max 10MB) with safe storage in `uploads/`. Runs deterministic rule-based entity extractor.
- **Multipart Form:** `file`, `sessionId`, `patientId`
- **Response:**
  ```json
  {
    "id": "uuid",
    "originalFilename": "CBC_Report.pdf",
    "reportType": "Lab Report",
    "date": "12 Oct 2026",
    "tests": "CBC, ESR",
    "findings": [
      { "test": "Hemoglobin (Hb)", "value": "11.2", "unit": "g/dL", "status": "Low", "refRange": "12.0 - 15.5", "isAbnormal": true },
      { "test": "ESR", "value": "28", "unit": "mm/hr", "status": "High", "refRange": "0 - 20", "isAbnormal": true }
    ]
  }
  ```

### `GET /documents/timeline/{patientId}`
Returns chronological medical events extracted from records.

---

## 5. Ayurvedic Intake (`/ayurveda`)

### `GET /ayurveda/questions`
Returns Dashavidha Pariksha, Prakriti, Agni, Koshta question bank with prototype disclaimer.

### `POST /ayurveda/submit`
Saves constitutional answers and scores Prakriti without autonomous diagnosis.

---

## 6. Doctor Consultation & Summary Review (`/summary` & `/doctor`)

### `GET /doctor/queue`
Returns active OPD patient queue with token numbers and Red Flag alerts.

### `GET /summary/{patientId}`
Retrieves complete structured SOAP summary with 3-tier source tags and non-diagnostic observations.

### `POST /summary/{summaryId}/approve`
Doctor approves draft note and saves it to hospital records.
- **Request Body:**
  ```json
  {
    "summaryId": "uuid",
    "doctorNotes": "Patient examined. Correlated clinically."
  }
  ```

### `POST /summary/{summaryId}/reject`
Doctor rejects draft summary with explicit reason.
- **Request Body:**
  ```json
  {
    "summaryId": "uuid",
    "reason": "Mismatched patient identity"
  }
  ```
