-- ── Migration 016: IT Declaration & Proof of Investment ─────────────────────
-- Run: mysql -u root -p hrms_db < migration_016_it_declaration.sql

USE hrms_db;

-- 1. Admin creates one cycle per financial year
CREATE TABLE IF NOT EXISTS it_declaration_cycles (
  cycle_id      INT AUTO_INCREMENT PRIMARY KEY,
  fy_label      VARCHAR(20)  NOT NULL,           -- e.g. '2025-2026'
  fy_start_year INT          NOT NULL,           -- e.g. 2025
  status        ENUM('inactive','active') DEFAULT 'inactive',
  start_date    DATE,
  end_date      DATE,                            -- submission deadline
  created_by    INT,
  created_at    DATETIME DEFAULT NOW(),
  FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE SET NULL
);

-- Seed current FY
INSERT IGNORE INTO it_declaration_cycles (fy_label, fy_start_year, status, start_date, end_date)
VALUES ('2025-2026', 2025, 'inactive', '2025-04-01', '2026-02-28');

-- 2. One declaration record per employee per cycle
CREATE TABLE IF NOT EXISTS it_declarations (
  declaration_id INT AUTO_INCREMENT PRIMARY KEY,
  cycle_id       INT NOT NULL,
  employee_id    INT NOT NULL,
  status         ENUM('draft','submitted','approved','rejected') DEFAULT 'draft',
  total_declared DECIMAL(12,2) DEFAULT 0,
  admin_remarks  TEXT,
  submitted_at   DATETIME,
  reviewed_at    DATETIME,
  reviewed_by    INT,
  created_at     DATETIME DEFAULT NOW(),
  updated_at     DATETIME DEFAULT NOW() ON UPDATE NOW(),
  UNIQUE KEY uq_cycle_emp (cycle_id, employee_id),
  FOREIGN KEY (cycle_id)     REFERENCES it_declaration_cycles(cycle_id),
  FOREIGN KEY (employee_id)  REFERENCES employees(employee_id),
  FOREIGN KEY (reviewed_by)  REFERENCES employees(employee_id) ON DELETE SET NULL
);

-- 3. Line items within each declaration
CREATE TABLE IF NOT EXISTS it_declaration_items (
  item_id        INT AUTO_INCREMENT PRIMARY KEY,
  declaration_id INT NOT NULL,
  section_key    VARCHAR(100) NOT NULL,   -- '80C', 'HRA', 'home_loan_interest', etc.
  section_label  VARCHAR(255) NOT NULL,
  sub_label      VARCHAR(255),            -- specific line within section
  declared_amount DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (declaration_id) REFERENCES it_declarations(declaration_id) ON DELETE CASCADE
);

-- 4. Proof of investment documents
CREATE TABLE IF NOT EXISTS it_proof_documents (
  proof_id       INT AUTO_INCREMENT PRIMARY KEY,
  declaration_id INT NOT NULL,
  employee_id    INT NOT NULL,
  investment_type VARCHAR(150) NOT NULL,
  section_key    VARCHAR(100),
  declared_amount DECIMAL(12,2) DEFAULT 0,
  actual_amount  DECIMAL(12,2) DEFAULT 0,
  file_name      VARCHAR(255),
  file_path      VARCHAR(500),
  status         ENUM('pending','verified','rejected') DEFAULT 'pending',
  admin_remarks  TEXT,
  uploaded_at    DATETIME DEFAULT NOW(),
  reviewed_at    DATETIME,
  reviewed_by    INT,
  FOREIGN KEY (declaration_id) REFERENCES it_declarations(declaration_id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id)    REFERENCES employees(employee_id),
  FOREIGN KEY (reviewed_by)    REFERENCES employees(employee_id) ON DELETE SET NULL
);
