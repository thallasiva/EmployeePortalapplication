-- ── Appraisal Cycles ──────────────────────────────────────────────────────────

USE hrms_db;

CREATE TABLE IF NOT EXISTS appraisal_cycles (
  cycle_id      INT AUTO_INCREMENT PRIMARY KEY,
  fy_label      VARCHAR(50)  NOT NULL DEFAULT 'FY 2025-2026',
  status        ENUM('inactive','active') NOT NULL DEFAULT 'inactive',
  deadline      DATE,
  rolled_out_at DATETIME,
  rolled_out_by INT,
  created_at    DATETIME DEFAULT NOW(),
  updated_at    DATETIME DEFAULT NOW() ON UPDATE NOW()
);

-- Seed one cycle (inactive by default)
INSERT IGNORE INTO appraisal_cycles (cycle_id, fy_label, status, deadline)
VALUES (1, 'FY 2025-2026', 'inactive', '2026-09-30');

-- ── Self Appraisals (one per employee per cycle) ──────────────────────────────
CREATE TABLE IF NOT EXISTS self_appraisals (
  appraisal_id      INT AUTO_INCREMENT PRIMARY KEY,
  cycle_id          INT NOT NULL,
  employee_id       INT NOT NULL,
  status            ENUM('draft','submitted') DEFAULT 'draft',
  overall_comments  TEXT,
  submitted_at      DATETIME,
  created_at        DATETIME DEFAULT NOW(),
  updated_at        DATETIME DEFAULT NOW() ON UPDATE NOW(),
  UNIQUE KEY uq_cycle_emp (cycle_id, employee_id),
  FOREIGN KEY (cycle_id)    REFERENCES appraisal_cycles(cycle_id),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

-- ── Per-parameter Ratings ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appraisal_ratings (
  rating_id         INT AUTO_INCREMENT PRIMARY KEY,
  appraisal_id      INT NOT NULL,
  parameter_key     VARCHAR(100) NOT NULL,
  parameter_label   VARCHAR(255),
  self_rating       TINYINT,
  manager_rating    TINYINT,
  self_comments     TEXT,
  manager_comments  TEXT,
  FOREIGN KEY (appraisal_id) REFERENCES self_appraisals(appraisal_id) ON DELETE CASCADE
);
