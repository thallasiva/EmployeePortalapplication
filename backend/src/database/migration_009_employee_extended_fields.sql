-- Migration 009: Add missing employee columns from EMP Data template
-- Run: node src/database/runSql.js migration_009_employee_extended_fields.sql

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS biometric_id           VARCHAR(50)    DEFAULT NULL AFTER emp_code,
  ADD COLUMN IF NOT EXISTS actual_dob             DATE           DEFAULT NULL AFTER dob,
  ADD COLUMN IF NOT EXISTS pan_number             VARCHAR(20)    DEFAULT NULL AFTER aadhaar_enrolment_number,
  ADD COLUMN IF NOT EXISTS project_cost_centre    VARCHAR(100)   DEFAULT NULL AFTER department_id,
  ADD COLUMN IF NOT EXISTS contract_end_date      DATE           DEFAULT NULL AFTER emp_exit_date,
  ADD COLUMN IF NOT EXISTS date_of_confirmation   DATE           DEFAULT NULL AFTER emp_joining_date,
  ADD COLUMN IF NOT EXISTS educational_qualification VARCHAR(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS total_exp_before_joining DECIMAL(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS previous_employer      VARCHAR(200)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bgv_status             VARCHAR(50)    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS previous_designation   VARCHAR(100)   DEFAULT NULL;
