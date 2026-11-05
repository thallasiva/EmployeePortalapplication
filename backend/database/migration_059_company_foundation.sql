+-- Migration 059: company configuration foundation for multi-company HRMS.
-- Apply before deploying code that reads the added company/office fields.
-- Existing employees and offices are assigned to their existing department company
-- where available, otherwise to the first company. A default company is created only
-- when the companies table is empty.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active';

INSERT INTO companies (company_name, timezone, currency, status)
SELECT 'Default Company', 'Asia/Kolkata', 'INR', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM companies);

ALTER TABLE offices
  ADD COLUMN IF NOT EXISTS company_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active';

UPDATE offices
   SET company_id = (SELECT MIN(company_id) FROM companies)
 WHERE company_id IS NULL;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS company_id INT DEFAULT NULL;

UPDATE employees e
LEFT JOIN departments d ON d.department_id = e.department_id
   SET e.company_id = COALESCE(e.company_id, d.company_id, (SELECT MIN(company_id) FROM companies))
 WHERE e.company_id IS NULL;

ALTER TABLE holidays
  ADD COLUMN IF NOT EXISTS company_id INT DEFAULT NULL;

UPDATE holidays
   SET company_id = (SELECT MIN(company_id) FROM companies)
 WHERE company_id IS NULL;

ALTER TABLE payroll_runs
  ADD COLUMN IF NOT EXISTS company_id INT DEFAULT NULL;

UPDATE payroll_runs pr
LEFT JOIN employees e ON e.employee_id = pr.processed_by
   SET pr.company_id = COALESCE(pr.company_id, e.company_id, (SELECT MIN(company_id) FROM companies))
 WHERE pr.company_id IS NULL;

ALTER TABLE payroll_runs
  DROP INDEX uq_payroll_period,
  ADD UNIQUE KEY uq_company_payroll_period (company_id, month, year);

ALTER TABLE salary_structures
  ADD COLUMN IF NOT EXISTS company_id INT DEFAULT NULL;

UPDATE salary_structures
   SET company_id = (SELECT MIN(company_id) FROM companies)
 WHERE company_id IS NULL;

ALTER TABLE salary_structures
  DROP INDEX uq_structure_name,
  ADD UNIQUE KEY uq_company_structure_name (company_id, structure_name);

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS company_id INT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees (company_id);
CREATE INDEX IF NOT EXISTS idx_offices_company_id ON offices (company_id);
CREATE INDEX IF NOT EXISTS idx_holidays_company_date ON holidays (company_id, holiday_date);
CREATE INDEX IF NOT EXISTS idx_salary_structures_company ON salary_structures (company_id, is_active);

CREATE TABLE IF NOT EXISTS company_modules (
  company_id INT NOT NULL,
  module_key VARCHAR(80) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  updated_by INT DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, module_key),
  CONSTRAINT fk_company_modules_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO company_modules (company_id, module_key, enabled)
SELECT c.company_id, m.module_key, 1
FROM companies c
CROSS JOIN (
  SELECT 'employees' module_key UNION ALL SELECT 'attendance' UNION ALL SELECT 'leave'
  UNION ALL SELECT 'payroll' UNION ALL SELECT 'recruitment' UNION ALL SELECT 'performance'
  UNION ALL SELECT 'timesheets' UNION ALL SELECT 'helpdesk' UNION ALL SELECT 'documents'
  UNION ALL SELECT 'reports' UNION ALL SELECT 'settings'
) m;

CREATE TABLE IF NOT EXISTS company_menu_permissions (
  company_id INT NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  permissions JSON NOT NULL,
  updated_by INT DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, role_name),
  CONSTRAINT fk_company_menu_permissions_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS company_settings (
  company_id INT NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSON NOT NULL,
  updated_by INT DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, setting_key),
  CONSTRAINT fk_company_settings_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shift_definitions (
  shift_id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  shift_key VARCHAR(40) NOT NULL,
  shift_name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  grace_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  crosses_midnight TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_company_shift_key (company_id, shift_key),
  CONSTRAINT fk_shift_definitions_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_shift_assignments (
  assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  employee_id INT NOT NULL,
  shift_id INT NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE DEFAULT NULL,
  assigned_by INT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_shift_assignment_employee_dates (employee_id, effective_from, effective_to),
  KEY idx_shift_assignment_company_dates (company_id, effective_from, effective_to),
  CONSTRAINT fk_shift_assignment_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  CONSTRAINT fk_shift_assignment_shift FOREIGN KEY (shift_id) REFERENCES shift_definitions(shift_id),
  CONSTRAINT fk_shift_assignment_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;
