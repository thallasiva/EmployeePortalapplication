-- =====================================================================
-- Migration 006: Full sample payroll data for ALL default employees
--
-- The on-screen "Earnings Breakdown" / "Deductions Breakdown" pie charts
-- on the employee Payslips page, and the downloaded/printed payslip PDF,
-- are driven by each employee's own:
--   - salary_structures.basic   (drives the whole earnings/deductions breakdown)
--   - employee_bank_details     (bank name, account number, IFSC, PAN, UAN)
--   - employees.pf_number / esi_number
--
-- Previously only EMP00003 had a salary structure (migration_005), and no
-- employee had bank details or a PF number, so the payslip's bank/PF
-- section showed "-" for everyone and the breakdown was 0 for everyone
-- else.
--
-- This migration gives every default employee (1-5) their own realistic
-- salary structure, bank account details, PAN, UAN and PF number, and
-- refreshes their current-month payslip so the Payslips page and the
-- downloaded PDF show real, employee-specific figures no matter which
-- account is logged in.
--
-- Safe to re-run: removes/overwrites existing rows for these employees
-- first, then inserts fresh ones.
-- =====================================================================

USE hrms_db;

-- ---------------------------------------------------------------------
-- 1. Salary structures (basic drives the earnings/deductions breakdown)
-- ---------------------------------------------------------------------
DELETE FROM salary_structures WHERE employee_id IN (1, 2, 3, 4, 5);

INSERT INTO salary_structures (
  employee_id, basic, hra, conveyance, medical_allowance, special_allowance,
  pf_employee, pf_employer, professional_tax, income_tax, ctc, effective_from
) VALUES
  -- EMP00001 - Admin / System Administrator        (Basic 50,000)
  (1, 50000.00, 25000.00, 1600.00, 1250.00, 22150.00, 1800.00, 1800.00, 200.00, 0.00, 1221600.00, '2026-04-01'),
  -- EMP00002 - Reporting Manager / Engineering Mgr  (Basic 60,000)
  (2, 60000.00, 30000.00, 1600.00, 1250.00, 27150.00, 1800.00, 1800.00, 200.00, 0.00, 1461600.00, '2026-04-01'),
  -- EMP00003 - General Shift Employee               (Basic 25,000)
  (3, 25000.00, 12500.00, 1600.00, 1250.00, 9650.00,  1800.00, 1800.00, 200.00, 0.00, 621600.00,  '2026-04-01'),
  -- EMP00004 - Mid Shift Employee                    (Basic 76,000)
  (4, 76000.00, 38000.00, 1600.00, 1250.00, 35150.00, 1800.00, 1800.00, 200.00, 0.00, 1845600.00, '2026-04-01'),
  -- EMP00005 - Night Shift Employee                  (Basic 30,000)
  (5, 30000.00, 15000.00, 1600.00, 1250.00, 12150.00, 1800.00, 1800.00, 200.00, 0.00, 741600.00,  '2026-04-01');

-- ---------------------------------------------------------------------
-- 2. Bank account details (shown on the payslip PDF)
-- ---------------------------------------------------------------------
INSERT INTO employee_bank_details (
  employee_id, bank_name, account_number, ifsc_code, pan_number, uan_number,
  account_type, bank_branch, account_holder_name, payment_type
) VALUES
  (1, 'HDFC Bank',          '50100123450001', 'HDFC0000123', 'ABCDE1234A', '101234567890', 'Savings', 'Hyderabad - Hitech City', 'Admin User',            'Bank Transfer'),
  (2, 'ICICI Bank',         '50200123450002', 'ICIC0000456', 'ABCDE2345B', '101234567891', 'Savings', 'Hyderabad - Madhapur',    'Reporting Manager',     'Bank Transfer'),
  (3, 'State Bank of India','50300123450003', 'SBIN0000789', 'ABCDE3456C', '101234567892', 'Savings', 'Hyderabad - Gachibowli',  'General Shift Employee','Bank Transfer'),
  (4, 'Axis Bank',          '50400123450004', 'UTIB0001012', 'ABCDE4567D', '101234567893', 'Savings', 'Hyderabad - Kondapur',    'Mid Shift Employee',    'Bank Transfer'),
  (5, 'Kotak Mahindra Bank','50500123450005', 'KKBK0001345', 'ABCDE5678E', '101234567894', 'Savings', 'Hyderabad - Kukatpally',  'Night Shift Employee',  'Bank Transfer')
ON DUPLICATE KEY UPDATE
  bank_name = VALUES(bank_name),
  account_number = VALUES(account_number),
  ifsc_code = VALUES(ifsc_code),
  pan_number = VALUES(pan_number),
  uan_number = VALUES(uan_number),
  account_type = VALUES(account_type),
  bank_branch = VALUES(bank_branch),
  account_holder_name = VALUES(account_holder_name),
  payment_type = VALUES(payment_type);

-- ---------------------------------------------------------------------
-- 3. PF / ESI numbers (shown on the payslip PDF)
-- ---------------------------------------------------------------------
UPDATE employees SET pf_number = 'PF/HYD/00123/001', esi_number = 'ESI100001001', pf_join_date = emp_joining_date WHERE employee_id = 1;
UPDATE employees SET pf_number = 'PF/HYD/00123/002', esi_number = 'ESI100001002', pf_join_date = emp_joining_date WHERE employee_id = 2;
UPDATE employees SET pf_number = 'PF/HYD/00123/003', esi_number = 'ESI100001003', pf_join_date = emp_joining_date WHERE employee_id = 3;
UPDATE employees SET pf_number = 'PF/HYD/00123/004', esi_number = 'ESI100001004', pf_join_date = emp_joining_date WHERE employee_id = 4;
UPDATE employees SET pf_number = 'PF/HYD/00123/005', esi_number = 'ESI100001005', pf_join_date = emp_joining_date WHERE employee_id = 5;

-- ---------------------------------------------------------------------
-- 4. Refresh this month's payslip for every employee so the new figures
--    show up immediately on the Payslips page and in the downloaded PDF.
-- ---------------------------------------------------------------------
CALL sp_generate_payslip(1, MONTH(CURDATE()), YEAR(CURDATE()), NULL, @payslip_id_1);
CALL sp_generate_payslip(2, MONTH(CURDATE()), YEAR(CURDATE()), NULL, @payslip_id_2);
CALL sp_generate_payslip(3, MONTH(CURDATE()), YEAR(CURDATE()), NULL, @payslip_id_3);
CALL sp_generate_payslip(4, MONTH(CURDATE()), YEAR(CURDATE()), NULL, @payslip_id_4);
CALL sp_generate_payslip(5, MONTH(CURDATE()), YEAR(CURDATE()), NULL, @payslip_id_5);

SELECT @payslip_id_1 AS admin_payslip_id, @payslip_id_2 AS manager_payslip_id,
       @payslip_id_3 AS general_shift_payslip_id, @payslip_id_4 AS mid_shift_payslip_id,
       @payslip_id_5 AS night_shift_payslip_id;
