-- =====================================================================
-- NAT IT — Project Team Seed
-- Adds 3 employees to existing NAT IT founders data (IDs 1-5 must exist)
--
-- Hierarchy added:
--   Tirumala Rao (employee_id=2, Reporting Manager)
--     └── Arjun Naidu (employee_id=6, Project Manager)
--           ├── Kavitha Reddy (employee_id=7, Senior Software Engineer)
--           └── Ravi Teja (employee_id=8, Software Engineer)
--
-- Salary summary:
--   Project Manager         : ₹65,000/mo  CTC ₹8,22,600/yr
--   Senior Software Engineer: ₹42,000/mo  CTC ₹5,26,800/yr
--   Software Engineer       : ₹25,000/mo  CTC ₹3,12,000/yr
--
-- Password for all 3 logins: Natit@2024
-- =====================================================================

USE hrms_db;

-- ─────────────────────────────────────────────────────────────────────
-- 0. Clean up if re-running (idempotent)
-- ─────────────────────────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM payslips              WHERE employee_id IN (6,7,8);
DELETE FROM salary_structures     WHERE employee_id IN (6,7,8);
DELETE FROM employee_bank_details WHERE employee_id IN (6,7,8);
DELETE FROM leave_balances        WHERE employee_id IN (6,7,8);
DELETE FROM users                 WHERE employee_id IN (6,7,8);
DELETE FROM employees             WHERE employee_id IN (6,7,8);
SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Employees
-- ─────────────────────────────────────────────────────────────────────

-- 6: Project Manager  (reports to Tirumala Rao, employee_id=2)
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id,
  reporting_to, employee_type, employee_status, shift,
  emp_joining_date, tax_regime, pf_number
) VALUES (
  6, 'NAT00006', 'Arjun', 'Naidu',
  'arjun.naidu@yopmail.com', '9100000006',
  'Project Manager', 7, 8,
  2,                  -- Tirumala Rao Cheedella
  'Full-Time', 'Active', 'general', '2020-06-01', 'new',
  'HY/HYD/NAT001/0006'
);

-- 7: Senior Software Engineer  (reports to Project Manager, employee_id=6)
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id,
  reporting_to, employee_type, employee_status, shift,
  emp_joining_date, tax_regime, pf_number
) VALUES (
  7, 'NAT00007', 'Kavitha', 'Reddy',
  'kavitha.reddy@yopmail.com', '9100000007',
  'Senior Software Engineer', 1, 6,
  6,                  -- Arjun Naidu (Project Manager)
  'Full-Time', 'Active', 'general', '2021-03-15', 'new',
  'HY/HYD/NAT001/0007'
);

-- 8: Software Engineer  (reports to Project Manager, employee_id=6)
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id,
  reporting_to, employee_type, employee_status, shift,
  emp_joining_date, tax_regime, pf_number
) VALUES (
  8, 'NAT00008', 'Ravi Teja', 'Mohan',
  'raviteja.mohan@yopmail.com', '9100000008',
  'Software Engineer', 1, 1,
  6,                  -- Arjun Naidu (Project Manager)
  'Full-Time', 'Active', 'general', '2022-08-01', 'new',
  'HY/HYD/NAT001/0008'
);

-- ─────────────────────────────────────────────────────────────────────
-- 2. User login accounts  (password: Natit@2024)
--    role_id: 2 = Employee  (PM is also Employee role here;
--    upgrade to Reporting Manager via Admin UI if needed)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO users (user_id, email, password_hash, role_id, employee_id, status) VALUES
  (6, 'arjun.naidu@yopmail.com',    '$2a$10$qqJZdvL7ZuS1m5ypmkPDcOaVIORNSFarEBpl9LP1yEGmKrTmY50DW', 2, 6, 'Active'),
  (7, 'kavitha.reddy@yopmail.com',  '$2a$10$qqJZdvL7ZuS1m5ypmkPDcOaVIORNSFarEBpl9LP1yEGmKrTmY50DW', 2, 7, 'Active'),
  (8, 'raviteja.mohan@yopmail.com', '$2a$10$qqJZdvL7ZuS1m5ypmkPDcOaVIORNSFarEBpl9LP1yEGmKrTmY50DW', 2, 8, 'Active');

-- ─────────────────────────────────────────────────────────────────────
-- 3. Salary Structures
--
-- Project Manager (emp 6) — ₹65,000 gross/mo
--   Basic: 32,500 | HRA: 13,000 | Conveyance: 1,600 | Medical: 1,625
--   Special Allowance: 16,275 | PF Employee: 1,800 | PF Employer: 1,800
--   Professional Tax: 200 | CTC annual: 8,22,600
--
-- Senior SE (emp 7) — ₹42,000 gross/mo
--   Basic: 21,000 | HRA: 8,400 | Conveyance: 1,600 | Medical: 1,050
--   Special Allowance: 9,950 | PF Employee: 1,800 | PF Employer: 1,800
--   Professional Tax: 200 | CTC annual: 5,26,800
--
-- Software Engineer (emp 8) — ₹25,000 gross/mo
--   Basic: 12,500 | HRA: 5,000 | Conveyance: 1,600 | Medical: 625
--   Special Allowance: 5,275 | PF Employee: 1,500 | PF Employer: 1,500
--   Professional Tax: 150 | CTC annual: 3,12,000
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO salary_structures (
  employee_id, basic, hra, conveyance, medical_allowance, special_allowance,
  pf_employee, pf_employer, professional_tax, income_tax, ctc, effective_from
) VALUES
-- Project Manager
(6,  32500.00, 13000.00, 1600.00, 1625.00, 16275.00, 1800.00, 1800.00, 200.00, 0.00, 822600.00, '2026-04-01'),
-- Senior Software Engineer
(7,  21000.00,  8400.00, 1600.00, 1050.00,  9950.00, 1800.00, 1800.00, 200.00, 0.00, 526800.00, '2026-04-01'),
-- Software Engineer
(8,  12500.00,  5000.00, 1600.00,  625.00,  5275.00, 1500.00, 1500.00, 150.00, 0.00, 312000.00, '2026-04-01');

-- ─────────────────────────────────────────────────────────────────────
-- 4. Payslips — Apr, May, Jun 2026
--
-- Gross = basic + hra + conveyance + medical + special_allowance
-- Deductions = pf_employee + professional_tax
-- Net Pay = Gross − Deductions
--
-- Project Manager  : Gross 65,000 | Deductions 2,000 | Net 63,000
-- Senior SE        : Gross 42,000 | Deductions 2,000 | Net 40,000
-- Software Engineer: Gross 25,000 | Deductions 1,650 | Net 23,350
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO payslips (
  employee_id, month, year,
  basic, hra, allowances, gross_earnings, ctc,
  deductions, net_pay,
  working_days, paid_days, lop_days, status
) VALUES
-- Arjun Naidu (Project Manager) — Apr / May / Jun 2026
(6, 4, 2026, 32500.00, 13000.00, 19500.00, 65000.00, 68550.00, 2000.00, 63000.00, 26.0, 26.0, 0.0, 'Paid'),
(6, 5, 2026, 32500.00, 13000.00, 19500.00, 65000.00, 68550.00, 2000.00, 63000.00, 26.0, 26.0, 0.0, 'Paid'),
(6, 6, 2026, 32500.00, 13000.00, 19500.00, 65000.00, 68550.00, 2000.00, 63000.00, 26.0, 26.0, 0.0, 'Paid'),

-- Kavitha Reddy (Senior Software Engineer) — Apr / May / Jun 2026
(7, 4, 2026, 21000.00,  8400.00, 12600.00, 42000.00, 43900.00, 2000.00, 40000.00, 26.0, 26.0, 0.0, 'Paid'),
(7, 5, 2026, 21000.00,  8400.00, 12600.00, 42000.00, 43900.00, 2000.00, 40000.00, 26.0, 26.0, 0.0, 'Paid'),
(7, 6, 2026, 21000.00,  8400.00, 12600.00, 42000.00, 43900.00, 2000.00, 40000.00, 26.0, 26.0, 0.0, 'Paid'),

-- Ravi Teja Mohan (Software Engineer) — Apr / May / Jun 2026
(8, 4, 2026, 12500.00,  5000.00,  7500.00, 25000.00, 26300.00, 1650.00, 23350.00, 26.0, 26.0, 0.0, 'Paid'),
(8, 5, 2026, 12500.00,  5000.00,  7500.00, 25000.00, 26300.00, 1650.00, 23350.00, 26.0, 26.0, 0.0, 'Paid'),
(8, 6, 2026, 12500.00,  5000.00,  7500.00, 25000.00, 26300.00, 1650.00, 23350.00, 26.0, 26.0, 0.0, 'Paid')

ON DUPLICATE KEY UPDATE net_pay=VALUES(net_pay), gross_earnings=VALUES(gross_earnings), status=VALUES(status);

-- ─────────────────────────────────────────────────────────────────────
-- 5. Bank Details
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO employee_bank_details (
  employee_id, bank_name, account_number, ifsc_code,
  pan_number, uan_number, account_type, bank_branch,
  account_holder_name, payment_type
) VALUES
(6, 'HDFC Bank',              '501NAT0000000006', 'HDFC0004521', 'ABCNA1234A', '101234500006', 'Savings', 'Hyderabad - Madhapur Branch',   'Arjun Naidu',    'Bank Transfer'),
(7, 'ICICI Bank',             '502NAT0000000007', 'ICIC0004522', 'ABCNA2345B', '101234500007', 'Savings', 'Hyderabad - Gachibowli Branch',  'Kavitha Reddy',  'Bank Transfer'),
(8, 'State Bank of India',    '503NAT0000000008', 'SBIN0004523', 'ABCNA3456C', '101234500008', 'Savings', 'Hyderabad - Hitech City Branch', 'Ravi Teja Mohan','Bank Transfer')
ON DUPLICATE KEY UPDATE bank_name=VALUES(bank_name), account_number=VALUES(account_number);

-- ─────────────────────────────────────────────────────────────────────
-- 6. Leave Balances (current year — all active leave types)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
SELECT e.employee_id, lt.leave_type_id, YEAR(CURDATE()), 0, lt.annual_quota, 0, lt.annual_quota
FROM employees e
CROSS JOIN leave_types lt
WHERE e.employee_id IN (6,7,8) AND lt.annual_quota > 0
ON DUPLICATE KEY UPDATE granted=VALUES(granted), balance=VALUES(balance);

-- ─────────────────────────────────────────────────────────────────────
-- Done ✓
--
-- Login credentials (password: Natit@2024):
--   Project Manager        : arjun.naidu@yopmail.com
--   Senior Software Eng.   : kavitha.reddy@yopmail.com
--   Software Engineer      : raviteja.mohan@yopmail.com
--
-- Full Salary Breakdown:
-- ┌──────────────────────────┬─────────────┬──────────────┬────────────┬──────────────┐
-- │ Employee                 │ Gross/Month │ Net Pay/Month│ CTC Annual │ Reporting To │
-- ├──────────────────────────┼─────────────┼──────────────┼────────────┼──────────────┤
-- │ Arjun Naidu (PM)         │  ₹65,000   │   ₹63,000   │ ₹8,22,600 │ Tirumala Rao │
-- │ Kavitha Reddy (Sr. SSE)  │  ₹42,000   │   ₹40,000   │ ₹5,26,800 │ Arjun Naidu  │
-- │ Ravi Teja Mohan (SE)     │  ₹25,000   │   ₹23,350   │ ₹3,12,000 │ Arjun Naidu  │
-- └──────────────────────────┴─────────────┴──────────────┴────────────┴──────────────┘
-- ─────────────────────────────────────────────────────────────────────
