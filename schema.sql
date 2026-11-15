-- SQLite Schema for Lakshya Mock & Marks Tracker

CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    default_total_marks REAL NOT NULL,
    default_total_q INTEGER NOT NULL,
    marks_per_correct REAL NOT NULL,
    penalty_per_wrong REAL NOT NULL,
    default_cutoff REAL NOT NULL,
    stage TEXT DEFAULT 'To Apply',
    kanboard_task_id INTEGER,
    source TEXT DEFAULT 'system',
    sections_json TEXT,
    is_active INTEGER DEFAULT 1,
    last_synced_at TIMESTAMP
);

INSERT OR IGNORE INTO exams (code, name, default_total_marks, default_total_q, marks_per_correct, penalty_per_wrong, default_cutoff) VALUES
('rrb-je', 'RRB JE (CBT-1)', 100.0, 100, 1.0, 0.3333, 68.0),
('rrb-alp', 'RRB ALP (CBT-1)', 75.0, 75, 1.0, 0.3333, 48.0),
('wbpsc-misc', 'WBPSC Miscellaneous Prelims', 200.0, 100, 2.0, 0.6667, 125.0),
('ssc-cgl', 'SSC CGL (Tier-1)', 200.0, 100, 2.0, 0.50, 138.0),
('ssc-chsl', 'SSC CHSL (Tier-1)', 200.0, 100, 2.0, 0.50, 142.0),
('upsc-pre', 'UPSC CSE Prelims (GS-1)', 200.0, 100, 2.0, 0.6667, 88.0),
('ibps-po', 'IBPS / SBI PO Prelims', 100.0, 100, 1.0, 0.25, 58.0),
('custom', 'Custom Competitive Exam', 100.0, 100, 1.0, 0.3333, 60.0);

CREATE TABLE IF NOT EXISTS mock_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_code TEXT NOT NULL,
    exam_name TEXT NOT NULL,
    test_title TEXT NOT NULL,
    provider TEXT DEFAULT 'Testbook',
    test_date TEXT NOT NULL,
    total_q INTEGER NOT NULL,
    attempted INTEGER NOT NULL,
    correct INTEGER NOT NULL,
    wrong INTEGER NOT NULL,
    unattempted INTEGER NOT NULL,
    total_marks REAL NOT NULL,
    net_score REAL NOT NULL,
    target_cutoff REAL NOT NULL,
    accuracy REAL NOT NULL,
    attempt_rate REAL NOT NULL,
    time_spent_min INTEGER DEFAULT 90,
    test_type TEXT DEFAULT 'full_mock',
    scorecard_image TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS section_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mock_id INTEGER NOT NULL,
    section_name TEXT NOT NULL,
    total_q INTEGER DEFAULT 0,
    attempted INTEGER DEFAULT 0,
    correct INTEGER DEFAULT 0,
    wrong INTEGER DEFAULT 0,
    marks REAL NOT NULL,
    accuracy REAL DEFAULT 0,
    strength_rating TEXT DEFAULT 'average', -- 'strong', 'average', 'weak'
    FOREIGN KEY(mock_id) REFERENCES mock_tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mistake_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mock_id INTEGER NOT NULL,
    question_no INTEGER,
    subject TEXT,
    topic TEXT,
    mistake_type TEXT NOT NULL, -- 'silly_error', 'formula_gap', 'concept_gap', 'misread', 'time_pressure', 'guess'
    notes TEXT,
    FOREIGN KEY(mock_id) REFERENCES mock_tests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mock_date ON mock_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_mock_exam ON mock_tests(exam_code);
CREATE INDEX IF NOT EXISTS idx_section_mock ON section_scores(mock_id);
CREATE INDEX IF NOT EXISTS idx_mistake_mock ON mistake_logs(mock_id);
