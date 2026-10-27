-- =============================================================
-- Migration 057: attendance-based salary processing.
--   * leave_types.is_paid  — unpaid leave counts as loss of pay (LOP); adds a
--     "Loss of Pay" leave type.
--   * payroll_attendance_adjustments — the admin's per-employee LOP correction and
--     salary hold for a month, with a reason (audit trail).
--   * payslips.breakdown_json — the exact components and attendance used for a payslip.
-- Run with: node src/database/runSql.js migration_057_attendance_payroll.sql
-- =============================================================

DROP PROCEDURE IF EXISTS tmp_057_add_columns;
DELIMITER $$
CREATE PROCEDURE tmp_057_add_columns()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leave_types' AND COLUMN_NAME = 'is_paid') THEN
    ALTER TABLE leave_types ADD COLUMN is_paid TINYINT(1) NOT NULL DEFAULT 1 AFTER requires_proof;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payslips' AND COLUMN_NAME = 'breakdown_json') THEN
    ALTER TABLE payslips ADD COLUMN breakdown_json JSON NULL;
  END IF;
END$$
DELIMITER ;
CALL tmp_057_add_columns();
DROP PROCEDURE IF EXISTS tmp_057_add_columns;

INSERT INTO leave_types (leave_type_name, annual_quota, carry_forward_limit, requires_proof, is_paid, description)
SELECT 'Loss of Pay', 0, 0, 0, 0, 'Unpaid leave — deducted from salary for each day taken'
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE leave_type_name = 'Loss of Pay');

CREATE TABLE IF NOT EXISTS payroll_attendance_adjustments (
  adjustment_id   INT AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT NOT NULL,
  month           TINYINT NOT NULL,
  year            SMALLINT NOT NULL,
  lop_adjustment  DECIMAL(4,1) NOT NULL DEFAULT 0 COMMENT '+ adds LOP days, - removes LOP days',
  hold_salary     TINYINT(1) NOT NULL DEFAULT 0,
  reason          VARCHAR(255) NOT NULL,
  updated_by      INT DEFAULT NULL,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payroll_adj (employee_id, year, month),
  CONSTRAINT fk_payroll_adj_emp FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON DELETE CASCADE
);

SELECT 'migration_057_attendance_payroll done' AS status;
