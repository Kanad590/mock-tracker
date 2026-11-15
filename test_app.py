#!/usr/bin/env python3
"""
Automated Integration Test for Lakshya Mock & Marks Tracker
"""
import os
import sys
import time
import json
import subprocess
import urllib.request
import urllib.error

PORT = 8899
BASE_URL = f"http://127.0.0.1:{PORT}"
TEST_DIR = os.path.dirname(os.path.abspath(__file__))

env = os.environ.copy()
env["PORT"] = str(PORT)
env["DATA_DIR"] = os.path.join(TEST_DIR, "test_data")

# Clean old test data
import shutil
if os.path.exists(env["DATA_DIR"]):
    shutil.rmtree(env["DATA_DIR"])

proc = subprocess.Popen([sys.executable, os.path.join(TEST_DIR, "app.py")], env=env)
time.sleep(1.5)

try:
    print("1. Testing /api/health...")
    req = urllib.request.urlopen(f"{BASE_URL}/api/health")
    assert req.status == 200
    res = json.loads(req.read().decode())
    assert res["status"] == "ok"
    print("   ✓ Health check passed!")

    print("2. Testing /api/exams...")
    req = urllib.request.urlopen(f"{BASE_URL}/api/exams")
    assert req.status == 200
    exams = json.loads(req.read().decode())
    assert len(exams) >= 5
    print(f"   ✓ Loaded {len(exams)} exam presets!")

    print("3. Testing POST /api/mocks (RRB JE Test with Negative Marking)...")
    mock_payload = {
        "exam_code": "rrb-je",
        "exam_name": "RRB JE (CBT-1)",
        "test_title": "RRB JE CBT-1 Full Mock #01",
        "provider": "Testbook",
        "test_date": "2026-11-13",
        "total_q": 100,
        "attempted": 85,
        "correct": 70,
        "wrong": 15,
        "total_marks": 100,
        "target_cutoff": 68.0,
        "marks_per_correct": 1.0,
        "penalty_per_wrong": 0.3333,
        "sections": [
            {"section_name": "Mathematics", "attempted": 30, "correct": 27, "wrong": 3},
            {"section_name": "General Intelligence & Reasoning", "attempted": 25, "correct": 23, "wrong": 2},
            {"section_name": "General Science", "attempted": 20, "correct": 14, "wrong": 6},
            {"section_name": "General Awareness", "attempted": 10, "correct": 6, "wrong": 4}
        ],
        "mistakes": [
            {"question_no": 12, "subject": "Mathematics", "mistake_type": "silly_error", "notes": "Calculation slip in SI/CI"},
            {"question_no": 35, "subject": "General Science", "mistake_type": "formula_gap", "notes": "Forgot Fleming's Left Hand Rule"},
            {"question_no": 78, "subject": "General Awareness", "mistake_type": "concept_gap", "notes": "Treaty of Yandabo year forgotten"}
        ]
    }

    req_data = json.dumps(mock_payload).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/mocks", data=req_data, headers={"Content-Type": "application/json"}, method="POST")
    res = urllib.request.urlopen(req)
    assert res.status == 201
    mock_res = json.loads(res.read().decode())
    assert mock_res["status"] == "success"
    # Net score: 70 * 1 - 15 * 0.3333 = 70 - 5.0 = 65.00
    assert abs(mock_res["net_score"] - 65.0) < 0.1
    assert abs(mock_res["accuracy"] - 82.4) < 0.2
    print(f"   ✓ Mock saved successfully! ID: {mock_res['id']}, Net Score: {mock_res['net_score']}, Accuracy: {mock_res['accuracy']}%")

    print("4. Testing GET /api/stats (Weak/Strong points & Charts data)...")
    req = urllib.request.urlopen(f"{BASE_URL}/api/stats")
    stats = json.loads(req.read().decode())
    assert stats["total_mocks"] == 1
    assert stats["avg_score"] == mock_res["net_score"]
    assert "General Intelligence & Reasoning" in [s["subject"] for s in stats["strong_areas"]]
    assert "General Awareness" in [w["subject"] for w in stats["weak_areas"]]
    print("   ✓ Strong areas correctly identified:", [s["subject"] for s in stats["strong_areas"]])
    print("   ✓ Weak areas correctly flagged:", [w["subject"] for w in stats["weak_areas"]])
    print("   ✓ Mistake distribution:", stats["mistake_stats"])

    print("5. Testing Scorecard Upload (Base64)...")
    dummy_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    upload_payload = json.dumps({"filename": "test_scorecard.png", "data": dummy_b64}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/upload", data=upload_payload, headers={"Content-Type": "application/json"}, method="POST")
    res = urllib.request.urlopen(req)
    assert res.status == 200
    upload_res = json.loads(res.read().decode())
    assert "url" in upload_res
    print(f"   ✓ Uploaded scorecard file accessible at: {upload_res['url']}")

    print("6. Testing Static & PWA Assets...")
    req = urllib.request.urlopen(f"{BASE_URL}/")
    assert req.status == 200
    html = req.read().decode()
    assert "Lakshya Marks Tracker" in html
    assert "i18n.js" in html

    req = urllib.request.urlopen(f"{BASE_URL}/manifest.json")
    assert req.status == 200
    manifest = json.loads(req.read().decode())
    assert manifest["short_name"] == "Lakshya"

    req = urllib.request.urlopen(f"{BASE_URL}/robots.txt")
    assert req.status == 200

    print("   ✓ Static, PWA & SEO assets served properly!")

    print("7. Testing POST /api/sync/kanboard...")
    req = urllib.request.Request(f"{BASE_URL}/api/sync/kanboard", data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
    res = urllib.request.urlopen(req)
    assert res.status == 200
    sync_res = json.loads(res.read().decode())
    assert "status" in sync_res
    print(f"   ✓ Kanboard sync response: status={sync_res['status']}, message={sync_res.get('message')}")

    print("8. Testing Manual Exam CRUD (POST /api/exams)...")
    manual_exam = {
        "name": "WB Gram Panchayat Nirman Sahayak 2026",
        "stage": "📝 Applied",
        "default_total_marks": 100,
        "default_total_q": 100,
        "marks_per_correct": 1.0,
        "penalty_per_wrong": 0.25,
        "default_cutoff": 74.0,
        "sections": ["Civil Engineering", "English", "General Knowledge"]
    }
    req = urllib.request.Request(f"{BASE_URL}/api/exams", data=json.dumps(manual_exam).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
    res = urllib.request.urlopen(req)
    assert res.status == 201
    created_exam = json.loads(res.read().decode())
    assert created_exam["name"] == manual_exam["name"]
    assert created_exam["source"] == "manual"
    assert created_exam["stage"] == "📝 Applied"
    exam_id = created_exam["id"]
    print(f"   ✓ Created manual exam successfully! ID: {exam_id}, source: {created_exam['source']}")

    print("9. Testing PUT /api/exams/<id>...")
    update_payload = {"stage": "⏳ Awaiting CBT 1 Result", "default_cutoff": 78.0}
    req = urllib.request.Request(f"{BASE_URL}/api/exams/{exam_id}", data=json.dumps(update_payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="PUT")
    res = urllib.request.urlopen(req)
    assert res.status == 200
    updated_exam = json.loads(res.read().decode())
    assert updated_exam["stage"] == "⏳ Awaiting CBT 1 Result"
    assert updated_exam["default_cutoff"] == 78.0
    print(f"   ✓ Updated exam stage to '{updated_exam['stage']}' and cutoff to {updated_exam['default_cutoff']}")

    print("10. Testing DELETE /api/exams/<id>...")
    req = urllib.request.Request(f"{BASE_URL}/api/exams/{exam_id}", method="DELETE")
    res = urllib.request.urlopen(req)
    assert res.status == 200
    del_res = json.loads(res.read().decode())
    assert del_res["status"] == "deleted"
    print(f"   ✓ Deleted manual exam successfully!")

    print("\n🎉 ALL 10 TESTS PASSED SUCCESSFULLY!")

finally:
    proc.terminate()
    proc.wait()
    if os.path.exists(env["DATA_DIR"]):
        shutil.rmtree(env["DATA_DIR"])
