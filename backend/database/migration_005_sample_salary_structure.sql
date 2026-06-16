-- =====================================================================
-- Migration 005: Sample salary structure for the General Shift employee
--
-- The "General Shift Employee" (employee_id = 3, EMP00003) has no
-- salary_structures row and no employees.base_salary value, so
-- sp_generate_payslip() has nothing to calculate from and every payslip
-- generated for this employee shows Rs. 0 across the board.
--
-- This migration adds a realistic monthly salary structure for that
-- employee so generated/downloaded payslips show real figures.
--
-- Safe to re-run: removes any existing salary_structures rows for this
-- employee first, then inserts the new one.
-- =====================================================================

USE hrms_db;

DELETE FROM salary_structures WHERE employee_id = 3;

INSERT INTO salary_structures (
  employee_id, basic, hra, conveyance, medical_allowance, special_allowance,
  pf_employee, pf_employer, professional_tax, income_tax, ctc, effective_from
) VALUES (
  3,        -- EMP00003 - General Shift Employee
  25000.00, -- basic
  12500.00, -- hra
  1600.00,  -- conveyance
  1250.00,  -- medical_allowance
  9650.00,  -- special_allowance  (gross = 50,000 / month)
  1800.00,  -- pf_employee (12% of basic, capped)
  1800.00,  -- pf_employer
  200.00,   -- professional_tax
  0.00,     -- income_tax (computed per-payslip from the tax calculator)
  621600.00,-- ctc (annual)
  '2026-04-01'
);

-- Refresh this month's payslip so the new figures show up immediately.
CALL sp_generate_payslip(3, MONTH(CURDATE()), YEAR(CURDATE()), NULL, @payslip_id);
SELECT @payslip_id AS payslip_id;
