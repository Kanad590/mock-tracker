#!/usr/bin/env python3
"""
Lakshya Mock & Marks Tracker (লক্ষ্য ট্র্যাকার)
Ultra-lightweight self-hosted backend powered by Python 3 & SQLite3.
Consumes < 30 MB RAM. Designed for Raspberry Pi 3B+ & Linux systems.
"""

import os
import sys
import re
import json
import sqlite3
import base64
import mimetypes
import urllib.parse
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler, ThreadingHTTPServer
from datetime import datetime

PORT = int(os.environ.get("PORT", 8856))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR", os.path.join(BASE_DIR, "data"))
STATIC_DIR = os.path.join(BASE_DIR, "static")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
DB_PATH = os.path.join(DATA_DIR, "marks_tracker.db")

KANBOARD_URL = os.environ.get("KANBOARD_URL", "").strip()
KANBOARD_USER = os.environ.get("KANBOARD_USER", "ai").strip()
KANBOARD_TOKEN = os.environ.get("KANBOARD_TOKEN", "").strip()
KANBOARD_PROJECT_ID = int(os.environ.get("KANBOARD_PROJECT_ID", 4))

os.makedirs(DATA_DIR, exist_ok=True)
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    schema_path = os.path.join(BASE_DIR, "schema.sql")
    if os.path.exists(schema_path):
        with open(schema_path, "r", encoding="utf-8") as f:
            conn.executescript(f.read())

    # Migration for exams table
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(exams);")
    existing_cols = {row[1] for row in cursor.fetchall()}

    migrations = [
        ("stage", "TEXT DEFAULT 'To Apply'"),
        ("kanboard_task_id", "INTEGER"),
        ("source", "TEXT DEFAULT 'system'"),
        ("sections_json", "TEXT"),
        ("is_active", "INTEGER DEFAULT 1"),
        ("last_synced_at", "TIMESTAMP")
    ]
    for col_name, col_def in migrations:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE exams ADD COLUMN {col_name} {col_def};")

    # Migration for mock_tests table (strictly track full_mock by default)
    cursor.execute("PRAGMA table_info(mock_tests);")
    existing_mock_cols = {row[1] for row in cursor.fetchall()}
    if "test_type" not in existing_mock_cols:
        cursor.execute("ALTER TABLE mock_tests ADD COLUMN test_type TEXT DEFAULT 'full_mock';")

    # Seed comprehensive competitive exam presets if not already present
    default_exams = [
        ('rrb-je', 'RRB JE (CBT-1)', 100.0, 100, 1.0, 0.3333, 68.0),
        ('rrb-je-cbt2-mech', 'RRB JE (CBT-2 Mechanical)', 150.0, 150, 1.0, 0.3333, 108.0),
        ('rrb-alp', 'RRB ALP (CBT-1)', 75.0, 75, 1.0, 0.3333, 48.0),
        ('rrb-ntpc', 'RRB NTPC (CBT-1)', 100.0, 100, 1.0, 0.3333, 74.0),
        ('rrb-group-d', 'RRB Group D (CBT)', 100.0, 100, 1.0, 0.3333, 68.0),
        ('ssc-cgl', 'SSC CGL (Tier-1)', 200.0, 100, 2.0, 0.50, 138.0),
        ('ssc-chsl', 'SSC CHSL (Tier-1)', 200.0, 100, 2.0, 0.50, 142.0),
        ('ssc-je', 'SSC JE Paper-1 (Mechanical/Tech)', 200.0, 200, 1.0, 0.25, 132.0),
        ('ssc-mts', 'SSC MTS (CBT)', 270.0, 90, 3.0, 1.0, 115.0),
        ('ibps-po', 'IBPS / SBI PO Prelims', 100.0, 100, 1.0, 0.25, 58.0),
        ('sbi-clerk', 'SBI Clerk Prelims', 100.0, 100, 1.0, 0.25, 75.0),
        ('upsc-pre', 'UPSC CSE Prelims (GS-1)', 200.0, 100, 2.0, 0.6667, 88.0),
        ('wbpsc-misc', 'WBPSC Miscellaneous Prelims', 200.0, 100, 2.0, 0.6667, 125.0),
        ('wbcs-pre', 'WBCS Executive Prelims', 200.0, 200, 1.0, 0.3333, 128.0),
        ('gate-eng', 'GATE Engineering', 100.0, 65, 1.0, 0.3333, 35.0),
        ('custom', 'Custom Competitive Exam', 100.0, 100, 1.0, 0.3333, 60.0)
    ]
    cursor.executemany(
        """INSERT OR IGNORE INTO exams 
        (code, name, default_total_marks, default_total_q, marks_per_correct, penalty_per_wrong, default_cutoff) 
        VALUES (?, ?, ?, ?, ?, ?, ?)""",
        default_exams
    )

    conn.commit()
    conn.close()


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def call_kanboard_rpc(method, params=None):
    """Call Kanboard JSON-RPC with optional environment-based configuration."""
    if not KANBOARD_URL or not KANBOARD_TOKEN:
        return None

    auth_header = "Basic " + base64.b64encode(f"{KANBOARD_USER}:{KANBOARD_TOKEN}".encode("utf-8")).decode("utf-8")
    payload = json.dumps({
        "jsonrpc": "2.0",
        "method": method,
        "id": 1,
        "params": params or {}
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            KANBOARD_URL,
            data=payload,
            headers={"Content-Type": "application/json", "Authorization": auth_header}
        )
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                if "error" not in data:
                    return data.get("result")
    except Exception:
        pass
    return None


def detect_exam_preset(title):
    """Smart heuristic to detect marking scheme, target cutoff, and sections from exam title."""
    t_lower = title.lower()

    # Railway / RRB
    if any(k in t_lower for k in ["rrb", "railway", "alp", "ntpc", "station master", "section controller", "level-1", "group d"]):
        if ("alp" in t_lower and "cbt-1" in t_lower) or "assistant loco" in t_lower:
            return {
                "default_total_marks": 75.0,
                "default_total_q": 75,
                "marks_per_correct": 1.0,
                "penalty_per_wrong": 0.3333,
                "default_cutoff": 48.0,
                "sections": ["Mathematics", "General Intelligence & Reasoning", "General Science", "General Awareness"]
            }
        elif "ntpc" in t_lower and "cbt-2" in t_lower:
            return {
                "default_total_marks": 120.0,
                "default_total_q": 120,
                "marks_per_correct": 1.0,
                "penalty_per_wrong": 0.3333,
                "default_cutoff": 85.0,
                "sections": ["General Awareness", "Mathematics", "General Intelligence & Reasoning"]
            }
        else:
            return {
                "default_total_marks": 100.0,
                "default_total_q": 100,
                "marks_per_correct": 1.0,
                "penalty_per_wrong": 0.3333,
                "default_cutoff": 68.0,
                "sections": ["Mathematics", "General Intelligence & Reasoning", "General Science", "General Awareness"]
            }

    # SSC Exams
    if "ssc" in t_lower:
        if "je" in t_lower:
            tech_sec = "General Engineering (Mechanical)" if "mech" in t_lower else "General Engineering (Technical)"
            return {
                "default_total_marks": 200.0,
                "default_total_q": 200,
                "marks_per_correct": 1.0,
                "penalty_per_wrong": 0.25,
                "default_cutoff": 132.0,
                "sections": ["General Intelligence & Reasoning", "General Awareness", tech_sec]
            }
        elif "cgl" in t_lower or "chsl" in t_lower:
            return {
                "default_total_marks": 200.0,
                "default_total_q": 100,
                "marks_per_correct": 2.0,
                "penalty_per_wrong": 0.50,
                "default_cutoff": 138.0,
                "sections": ["General Intelligence & Reasoning", "General Awareness", "Quantitative Aptitude", "English Comprehension"]
            }
        elif "mts" in t_lower:
            return {
                "default_total_marks": 270.0,
                "default_total_q": 90,
                "marks_per_correct": 3.0,
                "penalty_per_wrong": 1.0,
                "default_cutoff": 115.0,
                "sections": ["Numerical & Mathematical Ability", "Reasoning Ability", "General Awareness", "English Language"]
            }

    # WBPSC / West Bengal Exams
    if any(k in t_lower for k in ["wbpsc", "wbcs", "clerkship", "misc", "food si", "gram panchayat", "kmc", "wbsetcl", "wbpdcl", "wb police", "ido"]):
        if "clerkship" in t_lower:
            return {
                "default_total_marks": 100.0,
                "default_total_q": 100,
                "marks_per_correct": 1.0,
                "penalty_per_wrong": 0.25,
                "default_cutoff": 68.0,
                "sections": ["English", "General Studies", "Arithmetic"]
            }
        elif "food si" in t_lower:
            return {
                "default_total_marks": 100.0,
                "default_total_q": 100,
                "marks_per_correct": 1.0,
                "penalty_per_wrong": 0.3333,
                "default_cutoff": 78.0,
                "sections": ["General Studies", "Arithmetic"]
            }
        elif "wbcs" in t_lower:
            return {
                "default_total_marks": 200.0,
                "default_total_q": 200,
                "marks_per_correct": 1.0,
                "penalty_per_wrong": 0.3333,
                "default_cutoff": 128.0,
                "sections": ["English Composition", "General Science", "History of India", "Geography of India", "Indian Polity & Economy", "Indian National Movement", "General Mental Ability"]
            }
        elif "misc" in t_lower:
            return {
                "default_total_marks": 200.0,
                "default_total_q": 100,
                "marks_per_correct": 2.0,
                "penalty_per_wrong": 0.6667,
                "default_cutoff": 122.0,
                "sections": ["General Studies", "Arithmetic"]
            }
        elif "panchayat" in t_lower:
            return {
                "default_total_marks": 85.0,
                "default_total_q": 85,
                "marks_per_correct": 1.0,
                "penalty_per_wrong": 0.25,
                "default_cutoff": 62.0,
                "sections": ["English", "Bengali", "Mathematics", "General Knowledge"]
            }
        elif "ido" in t_lower:
            return {
                "default_total_marks": 100.0,
                "default_total_q": 100,
                "marks_per_correct": 1.0,
                "penalty_per_wrong": 0.3333,
                "default_cutoff": 66.0,
                "sections": ["General Studies", "Industrial & Commercial Economy", "Mental Ability"]
            }
        else:
            return {
                "default_total_marks": 100.0,
                "default_total_q": 100,
                "marks_per_correct": 1.0,
                "penalty_per_wrong": 0.25,
                "default_cutoff": 65.0,
                "sections": ["Domain Technical", "General Awareness", "Reasoning & Aptitude"]
            }

    # UPSC / EPFO
    if any(k in t_lower for k in ["upsc", "epfo", "apfc"]):
        return {
            "default_total_marks": 200.0,
            "default_total_q": 100,
            "marks_per_correct": 2.0,
            "penalty_per_wrong": 0.6667,
            "default_cutoff": 105.0,
            "sections": ["General English", "Indian Freedom Struggle & Polity", "General Accounting & IR", "General Science & Elementary Math"]
        }

    # Banking / Insurance
    if any(k in t_lower for k in ["ibps", "sbi", "nabard", "rbi", "lic"]):
        return {
            "default_total_marks": 100.0,
            "default_total_q": 100,
            "marks_per_correct": 1.0,
            "penalty_per_wrong": 0.25,
            "default_cutoff": 62.0,
            "sections": ["Reasoning Ability", "Quantitative Aptitude", "English Language"]
        }

    # General Fallback
    return {
        "default_total_marks": 100.0,
        "default_total_q": 100,
        "marks_per_correct": 1.0,
        "penalty_per_wrong": 0.25,
        "default_cutoff": 65.0,
        "sections": ["Section A", "Section B", "Section C", "Section D"]
    }


def sync_kanboard_exams():
    """Sync active exams being pursued from Kanboard Project #4 (Optional Integration)."""
    if not KANBOARD_URL or not KANBOARD_TOKEN:
        return {
            "success": False,
            "status": "unconfigured",
            "message": "Kanboard is optional and currently unconfigured. Set KANBOARD_URL and KANBOARD_TOKEN in your environment or .env file to enable automatic sync, or manage exams manually anytime!"
        }

    cols = call_kanboard_rpc("getColumns", {"project_id": KANBOARD_PROJECT_ID})
    if not cols:
        return {"success": False, "status": "offline", "message": "Kanboard is currently unreachable. You can continue managing exams manually."}

    tasks = call_kanboard_rpc("getAllTasks", {"project_id": KANBOARD_PROJECT_ID, "status_id": 1})
    if tasks is None:
        return {"success": False, "status": "offline", "message": "Kanboard is currently unreachable. You can continue managing exams manually."}

    col_map = {c["id"]: c["title"] for c in cols}
    active_tasks = [
        t for t in tasks 
        if col_map.get(t["column_id"]) not in ["❌ Not Selected", "🚫 Cancelled/Postponed"]
    ]

    synced_count = 0
    with get_db() as conn:
        for t in active_tasks:
            t_id = t["id"]
            title = t["title"].strip()
            stage = col_map.get(t["column_id"], "To Apply")

            slug_base = re.sub(r"[^\w\s-]", "", title).strip().lower()
            slug = re.sub(r"[-\s]+", "-", slug_base)[:35] or f"exam-{t_id}"
            code = f"kb-{t_id}-{slug}"[:45]

            preset = detect_exam_preset(title)
            sections_json = json.dumps(preset["sections"], ensure_ascii=False)

            existing = conn.execute("SELECT id FROM exams WHERE kanboard_task_id = ?", (t_id,)).fetchone()
            if existing:
                conn.execute(
                    """UPDATE exams 
                    SET name = ?, stage = ?, last_synced_at = CURRENT_TIMESTAMP, is_active = 1
                    WHERE id = ?""",
                    (title, stage, existing["id"])
                )
            else:
                existing_code = conn.execute("SELECT id FROM exams WHERE code = ?", (code,)).fetchone()
                if existing_code:
                    conn.execute(
                        """UPDATE exams 
                        SET name = ?, stage = ?, kanboard_task_id = ?, source = 'kanboard', 
                            last_synced_at = CURRENT_TIMESTAMP, is_active = 1
                        WHERE id = ?""",
                        (title, stage, t_id, existing_code["id"])
                    )
                else:
                    conn.execute(
                        """INSERT INTO exams 
                        (code, name, default_total_marks, default_total_q, marks_per_correct, penalty_per_wrong, 
                         default_cutoff, stage, kanboard_task_id, source, sections_json, is_active, last_synced_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'kanboard', ?, 1, CURRENT_TIMESTAMP)""",
                        (code, title, preset["default_total_marks"], preset["default_total_q"], 
                         preset["marks_per_correct"], preset["penalty_per_wrong"], preset["default_cutoff"], 
                         stage, t_id, sections_json)
                    )
            synced_count += 1
        conn.commit()

    return {
        "success": True, 
        "status": "synced", 
        "count": synced_count, 
        "message": f"Successfully synced {synced_count} active exams from Kanboard!"
    }


class MockTrackerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def log_message(self, format, *args):
        try:
            msg = format % args
            sys.stdout.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
            sys.stdout.flush()
        except Exception:
            pass

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Health Check
        if path == "/api/health":
            return self.send_json({"status": "ok", "app": "Lakshya Marks Tracker", "time": datetime.now().isoformat()})

        # Static Assets & PWA
        if path == "/" or path == "/index.html":
            return self.serve_file(os.path.join(STATIC_DIR, "index.html"), "text/html; charset=utf-8")
        elif path == "/manifest.json":
            return self.serve_file(os.path.join(STATIC_DIR, "manifest.json"), "application/manifest+json")
        elif path == "/sw.js":
            return self.serve_file(os.path.join(STATIC_DIR, "sw.js"), "application/javascript; charset=utf-8")
        elif path in ("/favicon.ico", "/favicon.svg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/og_banner.png"):
            fname = path.lstrip("/")
            fpath = os.path.join(STATIC_DIR, fname)
            mime, _ = mimetypes.guess_type(fpath)
            return self.serve_file(fpath, mime or "application/octet-stream")
        elif path == "/robots.txt":
            return self.serve_file(os.path.join(STATIC_DIR, "robots.txt"), "text/plain")
        elif path == "/sitemap.xml":
            return self.serve_file(os.path.join(STATIC_DIR, "sitemap.xml"), "application/xml")
        elif path == "/llms.txt":
            return self.serve_file(os.path.join(STATIC_DIR, "llms.txt"), "text/plain; charset=utf-8")
        elif path.startswith("/static/"):
            rel = path[len("/static/"):]
            fpath = os.path.join(STATIC_DIR, rel)
            if os.path.exists(fpath) and os.path.isfile(fpath):
                mime, _ = mimetypes.guess_type(fpath)
                if fpath.endswith(".js"):
                    mime = "application/javascript; charset=utf-8"
                elif fpath.endswith(".css"):
                    mime = "text/css; charset=utf-8"
                return self.serve_file(fpath, mime or "application/octet-stream")
            else:
                self.send_error(404, f"File not found: {rel}")
                return
        elif path.startswith("/uploads/"):
            filename = os.path.basename(path)
            filepath = os.path.join(UPLOADS_DIR, filename)
            if os.path.exists(filepath):
                mime, _ = mimetypes.guess_type(filepath)
                return self.serve_file(filepath, mime or "application/octet-stream")
            else:
                self.send_error(404, "File not found")
                return

        # API: Exams List
        if path == "/api/exams":
            with get_db() as conn:
                rows = conn.execute("SELECT * FROM exams ORDER BY is_active DESC, stage ASC, id ASC").fetchall()
                exams = []
                for r in rows:
                    d = dict(r)
                    if d.get("sections_json"):
                        try:
                            d["sections"] = json.loads(d["sections_json"])
                        except Exception:
                            d["sections"] = []
                    else:
                        d["sections"] = []
                    exams.append(d)
            return self.send_json(exams)

        # API: Mock Tests List
        if path == "/api/mocks":
            exam_filter = query.get("exam", [None])[0]
            with get_db() as conn:
                sql = "SELECT * FROM mock_tests"
                params = []
                if exam_filter:
                    sql += " WHERE exam_code = ?"
                    params.append(exam_filter)
                sql += " ORDER BY test_date DESC, id DESC"
                mocks = [dict(r) for r in conn.execute(sql, params).fetchall()]

                # Fetch sections & mistakes for each mock
                for m in mocks:
                    sec_rows = conn.execute("SELECT * FROM section_scores WHERE mock_id = ?", (m["id"],)).fetchall()
                    m["sections"] = [dict(s) for s in sec_rows]
                    mis_rows = conn.execute("SELECT * FROM mistake_logs WHERE mock_id = ?", (m["id"],)).fetchall()
                    m["mistakes"] = [dict(mis) for mis in mis_rows]
            return self.send_json(mocks)

        # API: Stats & Analytics Breakdown
        if path == "/api/stats":
            exam_filter = query.get("exam", [None])[0]
            with get_db() as conn:
                sql = "SELECT * FROM mock_tests"
                params = []
                if exam_filter:
                    sql += " WHERE exam_code = ?"
                    params.append(exam_filter)
                sql += " ORDER BY test_date ASC, id ASC"
                mocks = [dict(r) for r in conn.execute(sql, params).fetchall()]

                total_mocks = len(mocks)
                if total_mocks == 0:
                    return self.send_json({
                        "total_mocks": 0,
                        "avg_score": 0,
                        "highest_score": 0,
                        "avg_accuracy": 0,
                        "score_trend": [],
                        "subject_stats": {},
                        "mistake_stats": {},
                        "weak_areas": [],
                        "strong_areas": []
                    })

                scores = [m["net_score"] for m in mocks]
                accuracies = [m["accuracy"] for m in mocks]
                avg_score = round(sum(scores) / total_mocks, 2)
                highest_score = round(max(scores), 2)
                avg_accuracy = round(sum(accuracies) / total_mocks, 1)

                # Trend data
                score_trend = [{
                    "id": m["id"],
                    "date": m["test_date"],
                    "title": m["test_title"],
                    "exam": m["exam_name"],
                    "net_score": m["net_score"],
                    "total_marks": m["total_marks"],
                    "target_cutoff": m["target_cutoff"],
                    "accuracy": m["accuracy"]
                } for m in mocks]

                # Subject-wise aggregation
                mock_ids = [str(m["id"]) for m in mocks]
                placeholders = ",".join(["?"] * len(mock_ids))
                sec_rows = conn.execute(
                    f"SELECT section_name, SUM(attempted) as total_attempted, SUM(correct) as total_correct, "
                    f"SUM(wrong) as total_wrong, SUM(marks) as total_marks, COUNT(*) as count "
                    f"FROM section_scores WHERE mock_id IN ({placeholders}) GROUP BY section_name",
                    mock_ids
                ).fetchall()

                subject_stats = {}
                weak_areas = []
                strong_areas = []

                for s in sec_rows:
                    sec_name = s["section_name"]
                    att = s["total_attempted"] or 0
                    cor = s["total_correct"] or 0
                    wrg = s["total_wrong"] or 0
                    marks = s["total_marks"] or 0
                    cnt = s["count"] or 1
                    acc = round((cor / att * 100), 1) if att > 0 else 0
                    avg_m = round(marks / cnt, 2)

                    if acc < 60.0 or (att > 5 and wrg > cor * 0.45):
                        rating = "weak"
                        weak_areas.append({
                            "subject": sec_name,
                            "accuracy": acc,
                            "avg_marks": avg_m,
                            "total_wrong": wrg,
                            "total_correct": cor,
                            "reason": "Low accuracy / High negative penalty loss"
                        })
                    elif acc >= 80.0:
                        rating = "strong"
                        strong_areas.append({
                            "subject": sec_name,
                            "accuracy": acc,
                            "avg_marks": avg_m,
                            "total_wrong": wrg,
                            "total_correct": cor,
                            "reason": "Consistently high accuracy (≥80%)"
                        })
                    else:
                        rating = "average"

                    subject_stats[sec_name] = {
                        "accuracy": acc,
                        "avg_marks": avg_m,
                        "total_attempted": att,
                        "total_correct": cor,
                        "total_wrong": wrg,
                        "rating": rating
                    }

                # Mistake breakdown
                mis_rows = conn.execute(
                    f"SELECT mistake_type, COUNT(*) as count FROM mistake_logs "
                    f"WHERE mock_id IN ({placeholders}) GROUP BY mistake_type",
                    mock_ids
                ).fetchall()
                mistake_stats = {r["mistake_type"]: r["count"] for r in mis_rows}

            return self.send_json({
                "total_mocks": total_mocks,
                "avg_score": avg_score,
                "highest_score": highest_score,
                "avg_accuracy": avg_accuracy,
                "score_trend": score_trend,
                "subject_stats": subject_stats,
                "mistake_stats": mistake_stats,
                "weak_areas": weak_areas,
                "strong_areas": strong_areas
            })

        # API: Export JSON
        if path == "/api/export":
            with get_db() as conn:
                mocks = [dict(r) for r in conn.execute("SELECT * FROM mock_tests").fetchall()]
                for m in mocks:
                    m["sections"] = [dict(s) for s in conn.execute("SELECT * FROM section_scores WHERE mock_id = ?", (m["id"],)).fetchall()]
                    m["mistakes"] = [dict(mis) for mis in conn.execute("SELECT * FROM mistake_logs WHERE mock_id = ?", (m["id"],)).fetchall()]
            return self.send_json({"version": "1.0", "exported_at": datetime.now().isoformat(), "mocks": mocks})

        # Fallback to standard static file serving
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length) if length > 0 else b""

        # API: Sync Exams from Kanboard Project #4
        if path == "/api/sync/kanboard":
            res = sync_kanboard_exams()
            return self.send_json(res)

        # API: Create Exam Manually (Full Offline Support)
        if path == "/api/exams":
            try:
                data = json.loads(raw_body.decode("utf-8"))
                name = data.get("name", "").strip()
                if not name:
                    return self.send_json({"error": "Exam name is required"}, 400)

                code = data.get("code", "").strip()
                if not code:
                    slug_base = re.sub(r"[^\w\s-]", "", name).strip().lower()
                    code = re.sub(r"[-\s]+", "-", slug_base)[:35] or f"custom-{int(datetime.now().timestamp())}"

                stage = data.get("stage", "To Apply")
                default_total_marks = float(data.get("default_total_marks", 100.0))
                default_total_q = int(data.get("default_total_q", 100))
                marks_per_correct = float(data.get("marks_per_correct", 1.0))
                penalty_per_wrong = float(data.get("penalty_per_wrong", 0.25))
                default_cutoff = float(data.get("default_cutoff", 60.0))

                sections = data.get("sections", [])
                if isinstance(sections, list):
                    sections_json = json.dumps(sections, ensure_ascii=False)
                else:
                    sections_json = "[]"

                with get_db() as conn:
                    existing = conn.execute("SELECT id FROM exams WHERE code = ?", (code,)).fetchone()
                    if existing:
                        code = f"{code}-{int(datetime.now().timestamp())}"[:50]

                    cur = conn.cursor()
                    cur.execute(
                        """INSERT INTO exams 
                        (code, name, default_total_marks, default_total_q, marks_per_correct, penalty_per_wrong, 
                         default_cutoff, stage, source, sections_json, is_active, last_synced_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, 1, CURRENT_TIMESTAMP)""",
                        (code, name, default_total_marks, default_total_q, marks_per_correct, penalty_per_wrong, 
                         default_cutoff, stage, sections_json)
                    )
                    new_id = cur.lastrowid
                    conn.commit()
                    row = conn.execute("SELECT * FROM exams WHERE id = ?", (new_id,)).fetchone()
                    exam_dict = dict(row)
                    try:
                        exam_dict["sections"] = json.loads(exam_dict.get("sections_json") or "[]")
                    except Exception:
                        exam_dict["sections"] = []
                return self.send_json(exam_dict, 201)
            except Exception as e:
                return self.send_json({"error": str(e)}, 400)

        # API: Upload Scorecard Image (Base64 or Raw Binary)
        if path == "/api/upload":
            try:
                payload = json.loads(raw_body.decode("utf-8"))
                filename = payload.get("filename", f"scorecard_{int(datetime.now().timestamp())}.png")
                b64_data = payload.get("data", "")
                if "," in b64_data:
                    b64_data = b64_data.split(",", 1)[1]
                import base64
                file_bytes = base64.b64decode(b64_data)
                clean_name = f"{int(datetime.now().timestamp())}_{os.path.basename(filename)}"
                save_path = os.path.join(UPLOADS_DIR, clean_name)
                with open(save_path, "wb") as f:
                    f.write(file_bytes)
                return self.send_json({"url": f"/uploads/{clean_name}", "filename": clean_name})
            except Exception as e:
                return self.send_json({"error": str(e)}, 400)

        # API: Create Mock Test
        if path == "/api/mocks":
            try:
                data = json.loads(raw_body.decode("utf-8"))
                exam_code = data.get("exam_code", "custom")
                exam_name = data.get("exam_name", "Custom Exam")
                test_title = data.get("test_title", "Mock Test")
                provider = data.get("provider", "Testbook")
                test_date = data.get("test_date", datetime.now().strftime("%Y-%m-%d"))
                test_type = data.get("test_type", "full_mock")
                total_q = int(data.get("total_q", 100))
                attempted = int(data.get("attempted", 0))
                correct = int(data.get("correct", 0))
                wrong = int(data.get("wrong", 0))
                unattempted = max(0, total_q - attempted)
                total_marks = float(data.get("total_marks", 100.0))
                target_cutoff = float(data.get("target_cutoff", 60.0))
                time_spent_min = int(data.get("time_spent_min", 90))
                scorecard_image = data.get("scorecard_image", "")
                notes = data.get("notes", "")

                marks_per_q = float(data.get("marks_per_correct", 1.0))
                penalty_per_q = float(data.get("penalty_per_wrong", 0.3333))

                net_score = round((correct * marks_per_q) - (wrong * penalty_per_q), 2)
                accuracy = round((correct / attempted * 100), 1) if attempted > 0 else 0.0
                attempt_rate = round((attempted / total_q * 100), 1) if total_q > 0 else 0.0

                with get_db() as conn:
                    cur = conn.cursor()
                    cur.execute(
                        """INSERT INTO mock_tests 
                        (exam_code, exam_name, test_title, provider, test_date, test_type, total_q, attempted, 
                         correct, wrong, unattempted, total_marks, net_score, target_cutoff, 
                         accuracy, attempt_rate, time_spent_min, scorecard_image, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (exam_code, exam_name, test_title, provider, test_date, test_type, total_q, attempted,
                         correct, wrong, unattempted, total_marks, net_score, target_cutoff,
                         accuracy, attempt_rate, time_spent_min, scorecard_image, notes)
                    )
                    mock_id = cur.lastrowid

                    # Save Section Scores
                    sections = data.get("sections", [])
                    for sec in sections:
                        sec_name = sec.get("section_name", "General")
                        sec_att = int(sec.get("attempted", 0))
                        sec_cor = int(sec.get("correct", 0))
                        sec_wrg = int(sec.get("wrong", 0))
                        sec_marks = float(sec.get("marks", round((sec_cor * marks_per_q) - (sec_wrg * penalty_per_q), 2)))
                        sec_acc = round((sec_cor / sec_att * 100), 1) if sec_att > 0 else 0.0
                        rating = "strong" if sec_acc >= 80 else ("weak" if sec_acc < 60 else "average")
                        cur.execute(
                            """INSERT INTO section_scores 
                            (mock_id, section_name, total_q, attempted, correct, wrong, marks, accuracy, strength_rating)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                            (mock_id, sec_name, int(sec.get("total_q", 0)), sec_att, sec_cor, sec_wrg, sec_marks, sec_acc, rating)
                        )

                    # Save Mistake Logs
                    mistakes = data.get("mistakes", [])
                    for mis in mistakes:
                        cur.execute(
                            """INSERT INTO mistake_logs 
                            (mock_id, question_no, subject, topic, mistake_type, notes)
                            VALUES (?, ?, ?, ?, ?, ?)""",
                            (mock_id, mis.get("question_no"), mis.get("subject"), mis.get("topic"),
                             mis.get("mistake_type", "silly_error"), mis.get("notes", ""))
                        )
                    conn.commit()

                return self.send_json({"status": "success", "id": mock_id, "net_score": net_score, "accuracy": accuracy}, 201)
            except Exception as e:
                return self.send_json({"error": str(e)}, 400)

        # API: Import / Restore JSON
        if path == "/api/import":
            try:
                data = json.loads(raw_body.decode("utf-8"))
                mocks = data.get("mocks", [])
                imported_count = 0
                with get_db() as conn:
                    cur = conn.cursor()
                    for m in mocks:
                        cur.execute(
                            """INSERT INTO mock_tests 
                            (exam_code, exam_name, test_title, provider, test_date, total_q, attempted, 
                             correct, wrong, unattempted, total_marks, net_score, target_cutoff, 
                             accuracy, attempt_rate, time_spent_min, scorecard_image, notes)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                            (m["exam_code"], m["exam_name"], m["test_title"], m.get("provider", "Testbook"),
                             m["test_date"], m["total_q"], m["attempted"], m["correct"], m["wrong"],
                             m["unattempted"], m["total_marks"], m["net_score"], m["target_cutoff"],
                             m["accuracy"], m["attempt_rate"], m.get("time_spent_min", 90),
                             m.get("scorecard_image", ""), m.get("notes", ""))
                        )
                        new_id = cur.lastrowid
                        for sec in m.get("sections", []):
                            cur.execute(
                                """INSERT INTO section_scores 
                                (mock_id, section_name, total_q, attempted, correct, wrong, marks, accuracy, strength_rating)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                                (new_id, sec["section_name"], sec.get("total_q", 0), sec.get("attempted", 0),
                                 sec.get("correct", 0), sec.get("wrong", 0), sec["marks"], sec.get("accuracy", 0), sec.get("strength_rating", "average"))
                            )
                        for mis in m.get("mistakes", []):
                            cur.execute(
                                """INSERT INTO mistake_logs 
                                (mock_id, question_no, subject, topic, mistake_type, notes)
                                VALUES (?, ?, ?, ?, ?, ?)""",
                                (new_id, mis.get("question_no"), mis.get("subject"), mis.get("topic"),
                                 mis.get("mistake_type", "silly_error"), mis.get("notes", ""))
                            )
                        imported_count += 1
                    conn.commit()
                return self.send_json({"status": "success", "imported": imported_count})
            except Exception as e:
                return self.send_json({"error": str(e)}, 400)

        self.send_error(404, "Endpoint not found")

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length) if length > 0 else b""

        # API: Update Exam Details
        if path.startswith("/api/exams/"):
            try:
                exam_id = int(path.split("/")[-1])
                data = json.loads(raw_body.decode("utf-8"))
                with get_db() as conn:
                    existing = conn.execute("SELECT * FROM exams WHERE id = ?", (exam_id,)).fetchone()
                    if not existing:
                        return self.send_json({"error": "Exam not found"}, 404)

                    new_name = data.get("name") if data.get("name") is not None else existing["name"]
                    new_stage = data.get("stage") if data.get("stage") is not None else existing["stage"]
                    new_tm = float(data.get("default_total_marks")) if data.get("default_total_marks") is not None else existing["default_total_marks"]
                    new_tq = int(data.get("default_total_q")) if data.get("default_total_q") is not None else existing["default_total_q"]
                    new_mpc = float(data.get("marks_per_correct")) if data.get("marks_per_correct") is not None else existing["marks_per_correct"]
                    new_ppw = float(data.get("penalty_per_wrong")) if data.get("penalty_per_wrong") is not None else existing["penalty_per_wrong"]
                    new_cut = float(data.get("default_cutoff")) if data.get("default_cutoff") is not None else existing["default_cutoff"]
                    new_act = int(data.get("is_active")) if data.get("is_active") is not None else existing["is_active"]

                    if "sections" in data:
                        new_sec_json = json.dumps(data["sections"], ensure_ascii=False) if isinstance(data["sections"], list) else str(data["sections"])
                    else:
                        new_sec_json = existing["sections_json"]

                    conn.execute(
                        """UPDATE exams 
                        SET name = ?, stage = ?, default_total_marks = ?, default_total_q = ?, 
                            marks_per_correct = ?, penalty_per_wrong = ?, default_cutoff = ?, 
                            is_active = ?, sections_json = ?
                        WHERE id = ?""",
                        (new_name, new_stage, new_tm, new_tq, new_mpc, new_ppw, new_cut, new_act, new_sec_json, exam_id)
                    )
                    conn.commit()
                    updated = conn.execute("SELECT * FROM exams WHERE id = ?", (exam_id,)).fetchone()
                    d = dict(updated)
                    try:
                        d["sections"] = json.loads(d.get("sections_json") or "[]")
                    except Exception:
                        d["sections"] = []
                return self.send_json(d)
            except Exception as e:
                return self.send_json({"error": str(e)}, 400)

        self.send_error(404, "Endpoint not found")

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith("/api/mocks/"):
            try:
                mock_id = int(path.split("/")[-1])
                with get_db() as conn:
                    row = conn.execute("SELECT scorecard_image FROM mock_tests WHERE id = ?", (mock_id,)).fetchone()
                    if row and row["scorecard_image"]:
                        img_path = os.path.join(UPLOADS_DIR, os.path.basename(row["scorecard_image"]))
                        if os.path.exists(img_path):
                            try:
                                os.remove(img_path)
                            except OSError:
                                pass
                    conn.execute("DELETE FROM mock_tests WHERE id = ?", (mock_id,))
                    conn.commit()
                return self.send_json({"status": "deleted", "id": mock_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 400)

        if path.startswith("/api/exams/"):
            try:
                exam_id = int(path.split("/")[-1])
                with get_db() as conn:
                    conn.execute("DELETE FROM exams WHERE id = ?", (exam_id,))
                    conn.commit()
                return self.send_json({"status": "deleted", "id": exam_id})
            except Exception as e:
                return self.send_json({"error": str(e)}, 400)

        self.send_error(404, "Endpoint not found")

    def serve_file(self, filepath, content_type):
        try:
            with open(filepath, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(content)
        except Exception:
            self.send_error(500, "Error reading file")


def run_server():
    init_db()
    server_address = ("0.0.0.0", PORT)
    httpd = ThreadingHTTPServer(server_address, MockTrackerHandler)
    print(f"🎯 Lakshya Mock & Marks Tracker is running on port {PORT}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server gracefully...")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
