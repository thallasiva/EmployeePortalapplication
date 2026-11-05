-- Migration 062: persist immutable company payroll calculation configuration snapshots.
-- Apply after migration 061_company_salary_configuration.sql.
USE hrms_db;

CREATE TABLE payroll_rule_versions (
  rule_version_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  version_number INT NOT NULL,
  effective_from DATE NOT NULL,
  snapshot_json JSON NOT NULL,
  created_by INT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payroll_rule_company_version (company_id, version_number),
  KEY idx_payroll_rule_company_effective (company_id, effective_from),
  CONSTRAINT fk_payroll_rule_versions_company
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  CONSTRAINT fk_payroll_rule_versions_created_by
    FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE payroll_runs
  ADD COLUMN rule_version_id BIGINT DEFAULT NULL AFTER company_id,
  ADD KEY idx_payroll_runs_rule_version (rule_version_id),
  ADD CONSTRAINT fk_payroll_runs_rule_version
    FOREIGN KEY (rule_version_id) REFERENCES payroll_rule_versions(rule_version_id) ON DELETE SET NULL;
