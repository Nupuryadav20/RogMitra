# tests/test_live_http.py — Real HTTP integration tests against live uvicorn server
# Tests:
# 1. Demo doctor login -> GET OPD queue
# 2. Demo patient login -> start session & save answer
# 3. Doctor approve summary with physician assessment and plan
import os
import sys
import time
import socket
import subprocess
import httpx
import pytest

def get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def run_real_http_tests():
    port = get_free_port()
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
    python_exe = sys.executable

    print(f"\n[HTTP Test Runner] Starting live uvicorn server on port {port}...")
    proc = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "app.main:app", "--port", str(port), "--host", "127.0.0.1"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    base_url = f"http://127.0.0.1:{port}"
    client = httpx.Client(base_url=base_url, timeout=10.0)

    try:
        # Wait for server health check (max 15 seconds)
        server_ready = False
        for attempt in range(30):
            try:
                res = client.get("/health")
                if res.status_code == 200:
                    server_ready = True
                    print(f"[HTTP Test Runner] Server is healthy and responding at {base_url}/health.")
                    break
            except Exception:
                time.sleep(0.5)

        if not server_ready:
            raise RuntimeError(f"Server failed to start on port {port} within 15 seconds.")

        # =====================================================================
        # TEST 1: Demo Doctor Login -> GET OPD Queue
        # =====================================================================
        print("\n--- TEST 1: Demo Doctor Login -> GET OPD Queue ---")
        doc_login_res = client.post("/api/v1/auth/demo-login", json={
            "role": "doctor",
            "name": "Dr. R. Sharma"
        })
        assert doc_login_res.status_code == 200, f"Doctor login failed: {doc_login_res.text}"
        doc_data = doc_login_res.json()
        doc_token = doc_data["access_token"]
        assert doc_token, "No access token received for doctor"
        assert doc_data["role"] == "doctor"
        doc_name = doc_data.get("full_name") or doc_data.get("user", {}).get("name") or "Dr. R. Sharma"
        print(f"✓ Doctor login successful: {doc_name} (Role: {doc_data['role']})")

        queue_res = client.get("/api/v1/doctor/queue", headers={
            "Authorization": f"Bearer {doc_token}"
        })
        assert queue_res.status_code == 200, f"Get OPD queue failed: {queue_res.text}"
        queue = queue_res.json()
        assert isinstance(queue, list), "OPD queue response is not a list"
        assert len(queue) > 0, "OPD queue is empty"
        print(f"✓ OPD Queue loaded: {len(queue)} patients currently waiting in queue.")
        for p in queue[:2]:
            print(f"  • Token: {p.get('tokenNumber')} | Name: {p.get('name')} | Status: {p.get('status')}")

        # =====================================================================
        # TEST 2: Demo Patient Login -> Save Answer
        # =====================================================================
        print("\n--- TEST 2: Demo Patient Login -> Save Answer ---")
        test_patient_phone = f"9988{int(time.time()) % 1000000:06d}"
        pat_login_res = client.post("/api/v1/auth/demo-login", json={
            "role": "patient",
            "name": "Vikas Gupta",
            "phone": test_patient_phone
        })
        assert pat_login_res.status_code == 200, f"Patient login failed: {pat_login_res.text}"
        pat_data = pat_login_res.json()
        pat_token = pat_data["access_token"]
        patient_id = pat_data.get("user_id") or pat_data.get("user", {}).get("id")
        patient_name = pat_data.get("full_name") or pat_data.get("user", {}).get("name") or "Vikas Gupta"
        assert pat_token, "No access token received for patient"
        print(f"✓ Patient login successful: {patient_name} (ID: {patient_id})")

        # Start interview session
        session_res = client.post("/api/v1/session/start", params={
            "patientId": patient_id,
            "language": "en"
        }, headers={"Authorization": f"Bearer {pat_token}"})
        assert session_res.status_code == 200, f"Start session failed: {session_res.text}"
        session_id = session_res.json()["sessionId"]
        print(f"✓ Intake session started: {session_id}")

        # Save patient intake answer
        answer_payload = {
            "sessionId": session_id,
            "patientId": patient_id,
            "fieldName": "chief_complaint",
            "questionText": "What is your main complaint today?",
            "answerText": "Severe throbbing headache with photophobia for 2 days",
            "inputMode": "touch"
        }
        ans_res = client.post("/api/v1/session/answer", json=answer_payload, headers={
            "Authorization": f"Bearer {pat_token}"
        })
        assert ans_res.status_code == 200, f"Save answer failed: {ans_res.text}"
        assert ans_res.json()["success"] is True
        print(f"✓ Answer saved over HTTP: '{answer_payload['answerText']}' (Field: {answer_payload['fieldName']})")

        # Submit session
        sub_res = client.post(f"/api/v1/session/submit/{session_id}", headers={
            "Authorization": f"Bearer {pat_token}"
        })
        assert sub_res.status_code == 200, f"Submit session failed: {sub_res.text}"
        print(f"✓ Intake session submitted and ready for physician review.")

        # =====================================================================
        # TEST 3: Doctor Approve Summary with Assessment & Plan
        # =====================================================================
        print("\n--- TEST 3: Doctor Approve Summary with Physician Assessment & Plan ---")
        approve_payload = {
            "summaryId": f"sum-{patient_id}",
            "doctorName": "Dr. R. Sharma",
            "doctorAssessment": "Acute tension headache with mild photophobia; no neurological deficits.",
            "doctorPlan": "Tab Paracetamol 650mg SOS, hydration, dark room rest. Follow-up if symptoms persist after 48h.",
            "doctorNotes": "Physical exam normal. Pupils equal, round, and reactive to light (PERRLA)."
        }
        app_res = client.post(f"/api/v1/summary/{patient_id}/approve", json=approve_payload, headers={
            "Authorization": f"Bearer {doc_token}"
        })
        assert app_res.status_code == 200, f"Doctor approve summary failed: {app_res.text}"
        app_data = app_res.json()
        assert app_data["status"] == "approved"
        assert app_data["doctorAssessment"] == approve_payload["doctorAssessment"]
        assert app_data["doctorPlan"] == approve_payload["doctorPlan"]
        print(f"✓ Doctor approved clinical summary over HTTP: Status = {app_data['status']}")
        print(f"  • Doctor's Assessment: {app_data['doctorAssessment']}")
        print(f"  • Doctor's Plan: {app_data['doctorPlan']}")

        # Verify summary readback
        get_sum = client.get(f"/api/v1/summary/{patient_id}", headers={
            "Authorization": f"Bearer {doc_token}"
        })
        assert get_sum.status_code == 200
        sum_body = get_sum.json()
        assert sum_body["status"] == "approved"
        assert sum_body["doctorAssessment"] == approve_payload["doctorAssessment"]
        assert sum_body["doctorPlan"] == approve_payload["doctorPlan"]
        print(f"✓ Verified summary database reload: Approved by {sum_body['reviewedBy']} with physician evaluation recorded.")

        print("\n[HTTP Test Runner] ALL 3 REAL HTTP TESTS PASSED SUCCESSFULLY!")

    finally:
        client.close()
        print("[HTTP Test Runner] Stopping live uvicorn server...")
        try:
            proc.terminate()
            proc.wait(timeout=5)
            print("[HTTP Test Runner] Server stopped cleanly.")
        except Exception:
            proc.kill()
            print("[HTTP Test Runner] Server killed forcibly.")

def test_live_http_suite():
    run_real_http_tests()

if __name__ == "__main__":
    run_real_http_tests()
