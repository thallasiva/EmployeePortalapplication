-- ── Migration 022: Per-Employee Appraisal Enrollments ───────────────────────
-- Allows Admin to roll out appraisals to specific employees rather than all.
-- An employee can only see/submit a self-appraisal if they are enrolled in the cycle.
-- The employee's reporting manager can see enrolled direct reports automatically.
-- Run: mysql -u root -p hrms_db < migration_022_appraisal_enrollments.sql

USE hrms_db;

CREATE TABLE IF NOT EXISTS appraisal_enrollments (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  cycle_id      INT NOT NULL,
  employee_id   INT NOT NULL,
  enrolled_at   DATETIME DEFAULT NOW(),
  enrolled_by   INT DEFAULT NULL,

  UNIQUE KEY uq_enrollment (cycle_id, employee_id),
  CONSTRAINT fk_ae_cycle      FOREIGN KEY (cycle_id)    REFERENCES appraisal_cycles(cycle_id)  ON DELETE CASCADE,
  CONSTRAINT fk_ae_employee   FOREIGN KEY (employee_id) REFERENCES employees(employee_id)       ON DELETE CASCADE,
  CONSTRAINT fk_ae_enrolled_by FOREIGN KEY (enrolled_by) REFERENCES employees(employee_id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Back-fill: enroll all employees who already have a self-appraisal (existing data)
INSERT IGNORE INTO appraisal_enrollments (cycle_id, employee_id)
SELECT sa.cycle_id, sa.employee_id FROM self_appraisals sa;
