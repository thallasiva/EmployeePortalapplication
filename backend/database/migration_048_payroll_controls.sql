-- Payroll controls: approved variable earnings, review lifecycle and bank export audit.
CREATE TABLE IF NOT EXISTS payroll_inputs (
  payroll_input_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  month TINYINT NOT NULL, year INT NOT NULL,
  input_type ENUM('OVERTIME','ARREARS') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  remarks VARCHAR(255) NULL,
  status ENUM('DRAFT','PENDING_REVIEW','APPROVED','REJECTED','CONSUMED') NOT NULL DEFAULT 'DRAFT',
  created_by INT NULL, reviewed_by INT NULL, reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payroll_input_period (month, year, status),
  INDEX idx_payroll_input_employee (employee_id),
  CONSTRAINT fk_payroll_input_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE payroll_runs
  ADD COLUMN review_status ENUM('DRAFT','PENDING_REVIEW','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN reviewed_by INT NULL,
  ADD COLUMN reviewed_at DATETIME NULL,
  ADD COLUMN approval_remarks VARCHAR(500) NULL,
  ADD COLUMN payment_exported_at DATETIME NULL;
