-- =====================================================================
-- Migration 011: 15 new employees with realistic salary structures,
--                bank details, payslips (Apr-Jun 2026), and tax regime
-- =====================================================================
USE hrms_db;

-- 1. Add tax_regime column to employees if not present
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS tax_regime ENUM('new','old') NOT NULL DEFAULT 'new';

-- 2. Add new designations
INSERT INTO designations (designation_id, designation_name, department_id) VALUES
  (6,  'Senior Software Engineer', 1),
  (7,  'Team Lead',                1),
  (8,  'Project Manager',          7),
  (9,  'Technical Architect',      1),
  (10, 'Engineering Manager',      1),
  (11, 'Delivery Manager',         7),
  (12, 'HR Manager',               2),
  (13, 'QA Lead',                  1),
  (14, 'Business Analyst',         7),
  (15, 'DevOps Engineer',          1),
  (16, 'Product Owner',            1),
  (17, 'Database Administrator',   1)
ON DUPLICATE KEY UPDATE designation_name = VALUES(designation_name);

-- 3. Delete existing records for these employee IDs (idempotent)
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM payslips           WHERE employee_id BETWEEN 6 AND 20;
DELETE FROM salary_structures  WHERE employee_id BETWEEN 6 AND 20;
DELETE FROM employee_bank_details WHERE employee_id BETWEEN 6 AND 20;
DELETE FROM users              WHERE employee_id BETWEEN 6 AND 20;
DELETE FROM employees          WHERE employee_id BETWEEN 6 AND 20;
SET FOREIGN_KEY_CHECKS = 1;

-- 4. Insert employees

INSERT INTO employees (employee_id, emp_code, first_name, last_name, email, mobile, emp_job_title, department_id, designation_id, employee_type, employee_status, shift, emp_joining_date, tax_regime) VALUES
  (6, 'EMP00006', 'John', 'Doe', 'john.doe@company.com', '9876543216', 'Software Engineer', 1, 1, 'Full-Time', 'Active', 'general', '2020-01-15', 'new'),
  (7, 'EMP00007', 'Jane', 'Smith', 'jane.smith@company.com', '9876543217', 'Senior Software Engineer', 1, 6, 'Full-Time', 'Active', 'general', '2019-06-01', 'new'),
  (8, 'EMP00008', 'Michael', 'Johnson', 'michael.j@company.com', '9876543218', 'Team Lead', 1, 7, 'Full-Time', 'Active', 'general', '2018-03-20', 'new'),
  (9, 'EMP00009', 'Sarah', 'Williams', 'sarah.w@company.com', '9876543219', 'Project Manager', 7, 8, 'Full-Time', 'Active', 'general', '2017-09-10', 'old'),
  (10, 'EMP00010', 'David', 'Brown', 'david.brown@company.com', '9876543220', 'Technical Architect', 1, 9, 'Full-Time', 'Active', 'general', '2016-04-05', 'old'),
  (11, 'EMP00011', 'Emily', 'Davis', 'emily.davis@company.com', '9876543221', 'Engineering Manager', 1, 10, 'Full-Time', 'Active', 'general', '2015-11-30', 'new'),
  (12, 'EMP00012', 'Robert', 'Wilson', 'robert.w@company.com', '9876543222', 'Delivery Manager', 7, 11, 'Full-Time', 'Active', 'general', '2014-07-22', 'old'),
  (13, 'EMP00013', 'Priya', 'Sharma', 'priya.sharma@company.com', '9876543223', 'HR Manager', 2, 12, 'Full-Time', 'Active', 'general', '2021-02-14', 'new'),
  (14, 'EMP00014', 'Arjun', 'Reddy', 'arjun.reddy@company.com', '9876543224', 'QA Lead', 1, 13, 'Full-Time', 'Active', 'general', '2020-08-11', 'old'),
  (15, 'EMP00015', 'Sneha', 'Patel', 'sneha.patel@company.com', '9876543225', 'Business Analyst', 7, 14, 'Full-Time', 'Active', 'general', '2021-05-03', 'new'),
  (16, 'EMP00016', 'Rahul', 'Kumar', 'rahul.kumar@company.com', '9876543226', 'DevOps Engineer', 1, 15, 'Full-Time', 'Active', 'general', '2019-12-01', 'old'),
  (17, 'EMP00017', 'Anjali', 'Gupta', 'anjali.gupta@company.com', '9876543227', 'Product Owner', 1, 16, 'Full-Time', 'Active', 'general', '2018-06-18', 'new'),
  (18, 'EMP00018', 'Kiran', 'Verma', 'kiran.verma@company.com', '9876543228', 'UI/UX Designer', 4, 4, 'Full-Time', 'Active', 'general', '2022-03-07', 'old'),
  (19, 'EMP00019', 'Vikram', 'Singh', 'vikram.singh@company.com', '9876543229', 'Database Administrator', 1, 17, 'Full-Time', 'Active', 'general', '2017-01-25', 'old'),
  (20, 'EMP00020', 'Pooja', 'Nair', 'pooja.nair@company.com', '9876543230', 'HR Executive', 2, 3, 'Full-Time', 'Active', 'general', '2022-11-14', 'new');

-- 5. User accounts (password: Employee@123)
INSERT INTO users (user_id, email, password_hash, role_id, employee_id, status) VALUES
  (6, 'john.doe@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 6, 'Active'),
  (7, 'jane.smith@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 7, 'Active'),
  (8, 'michael.j@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 8, 'Active'),
  (9, 'sarah.w@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 9, 'Active'),
  (10, 'david.brown@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 10, 'Active'),
  (11, 'emily.davis@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 11, 'Active'),
  (12, 'robert.w@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 12, 'Active'),
  (13, 'priya.sharma@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 13, 'Active'),
  (14, 'arjun.reddy@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 14, 'Active'),
  (15, 'sneha.patel@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 15, 'Active'),
  (16, 'rahul.kumar@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 16, 'Active'),
  (17, 'anjali.gupta@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 17, 'Active'),
  (18, 'kiran.verma@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 18, 'Active'),
  (19, 'vikram.singh@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 19, 'Active'),
  (20, 'pooja.nair@company.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 20, 'Active');

-- 6. Salary structures
INSERT INTO salary_structures (employee_id, basic, hra, conveyance, medical_allowance, special_allowance, pf_employee, pf_employer, professional_tax, income_tax, ctc, effective_from) VALUES
  (6, 10000.00, 4000.00, 300.00, 500.00, 2500.00, 1200.00, 1200.00, 150.00, 0.00, 252000.00, '2026-04-01'),
  (7, 20000.00, 8000.00, 600.00, 1000.00, 5000.00, 1800.00, 1800.00, 200.00, 0.00, 496800.00, '2026-04-01'),
  (8, 33333.00, 13333.00, 1000.00, 1667.00, 8333.00, 1800.00, 1800.00, 200.00, 0.00, 813600.00, '2026-04-01'),
  (9, 40000.00, 16000.00, 1200.00, 2000.00, 10000.00, 1800.00, 1800.00, 200.00, 0.00, 972000.00, '2026-04-01'),
  (10, 60000.00, 24000.00, 1800.00, 3000.00, 15000.00, 1800.00, 1800.00, 200.00, 0.00, 1447200.00, '2026-04-01'),
  (11, 80000.00, 32000.00, 2400.00, 4000.00, 20000.00, 1800.00, 1800.00, 200.00, 0.00, 1922400.00, '2026-04-01'),
  (12, 100000.00, 40000.00, 3000.00, 5000.00, 25000.00, 1800.00, 1800.00, 200.00, 0.00, 2397600.00, '2026-04-01'),
  (13, 26667.00, 10667.00, 800.00, 1333.00, 6667.00, 1800.00, 1800.00, 200.00, 0.00, 655200.00, '2026-04-01'),
  (14, 24000.00, 9600.00, 720.00, 1200.00, 6000.00, 1800.00, 1800.00, 200.00, 0.00, 591840.00, '2026-04-01'),
  (15, 30000.00, 12000.00, 900.00, 1500.00, 7500.00, 1800.00, 1800.00, 200.00, 0.00, 734400.00, '2026-04-01'),
  (16, 46667.00, 18667.00, 1400.00, 2333.00, 11667.00, 1800.00, 1800.00, 200.00, 0.00, 1130400.00, '2026-04-01'),
  (17, 66667.00, 26667.00, 2000.00, 3333.00, 16667.00, 1800.00, 1800.00, 200.00, 0.00, 1605600.00, '2026-04-01'),
  (18, 18000.00, 7200.00, 540.00, 900.00, 4500.00, 1800.00, 1800.00, 200.00, 0.00, 449280.00, '2026-04-01'),
  (19, 53333.00, 21333.00, 1600.00, 2667.00, 13333.00, 1800.00, 1800.00, 200.00, 0.00, 1288800.00, '2026-04-01'),
  (20, 14000.00, 5600.00, 420.00, 700.00, 3500.00, 1680.00, 1680.00, 200.00, 0.00, 352800.00, '2026-04-01');

-- 7. Bank details
INSERT INTO employee_bank_details (employee_id, bank_name, account_number, ifsc_code, pan_number, uan_number, account_type, bank_branch, account_holder_name, payment_type) VALUES
  (6, 'HDFC Bank', '501001234560006', 'HDFC0001006', 'ABCPQ1234F', '201234560006', 'Savings', 'Hyderabad - Main Branch', 'John Doe', 'Bank Transfer'),
  (7, 'ICICI Bank', '502001234560007', 'ICIC0001007', 'ABCPQ2345G', '201234560007', 'Savings', 'Hyderabad - Main Branch', 'Jane Smith', 'Bank Transfer'),
  (8, 'State Bank of India', '503001234560008', 'SBIN0001008', 'ABCPQ3456H', '201234560008', 'Savings', 'Hyderabad - Main Branch', 'Michael Johnson', 'Bank Transfer'),
  (9, 'Axis Bank', '504001234560009', 'UTIB0001009', 'ABCPQ4567I', '201234560009', 'Savings', 'Hyderabad - Main Branch', 'Sarah Williams', 'Bank Transfer'),
  (10, 'Kotak Mahindra Bank', '505001234560010', 'KKBK0001010', 'ABCPQ5678J', '201234560010', 'Savings', 'Hyderabad - Main Branch', 'David Brown', 'Bank Transfer'),
  (11, 'HDFC Bank', '501001234560011', 'HDFC0001011', 'ABCPQ6789K', '201234560011', 'Savings', 'Hyderabad - Main Branch', 'Emily Davis', 'Bank Transfer'),
  (12, 'Yes Bank', '506001234560012', 'YESB0001012', 'ABCPQ7890L', '201234560012', 'Savings', 'Hyderabad - Main Branch', 'Robert Wilson', 'Bank Transfer'),
  (13, 'Punjab National Bank', '507001234560013', 'PUNB0001013', 'ABCPQ8901M', '201234560013', 'Savings', 'Hyderabad - Main Branch', 'Priya Sharma', 'Bank Transfer'),
  (14, 'Bank of Baroda', '508001234560014', 'BARB0001014', 'ABCPQ9012N', '201234560014', 'Savings', 'Hyderabad - Main Branch', 'Arjun Reddy', 'Bank Transfer'),
  (15, 'Canara Bank', '509001234560015', 'CNRB0001015', 'ABCPQ0123O', '201234560015', 'Savings', 'Hyderabad - Main Branch', 'Sneha Patel', 'Bank Transfer'),
  (16, 'Union Bank of India', '510001234560016', 'UBIN0001016', 'ABCPQ1234P', '201234560016', 'Savings', 'Hyderabad - Main Branch', 'Rahul Kumar', 'Bank Transfer'),
  (17, 'ICICI Bank', '502001234560017', 'ICIC0001017', 'ABCPQ2345Q', '201234560017', 'Savings', 'Hyderabad - Main Branch', 'Anjali Gupta', 'Bank Transfer'),
  (18, 'HDFC Bank', '501001234560018', 'HDFC0001018', 'ABCPQ3456R', '201234560018', 'Savings', 'Hyderabad - Main Branch', 'Kiran Verma', 'Bank Transfer'),
  (19, 'State Bank of India', '503001234560019', 'SBIN0001019', 'ABCPQ4567S', '201234560019', 'Savings', 'Hyderabad - Main Branch', 'Vikram Singh', 'Bank Transfer'),
  (20, 'Axis Bank', '504001234560020', 'UTIB0001020', 'ABCPQ5678T', '201234560020', 'Savings', 'Hyderabad - Main Branch', 'Pooja Nair', 'Bank Transfer')
ON DUPLICATE KEY UPDATE bank_name=VALUES(bank_name), account_number=VALUES(account_number);

-- 8. PF numbers
UPDATE employees SET pf_number = CASE employee_id
  WHEN 6 THEN 'HY/HYD/0123456/0006'
  WHEN 7 THEN 'HY/HYD/0123456/0007'
  WHEN 8 THEN 'HY/HYD/0123456/0008'
  WHEN 9 THEN 'HY/HYD/0123456/0009'
  WHEN 10 THEN 'HY/HYD/0123456/0010'
  WHEN 11 THEN 'HY/HYD/0123456/0011'
  WHEN 12 THEN 'HY/HYD/0123456/0012'
  WHEN 13 THEN 'HY/HYD/0123456/0013'
  WHEN 14 THEN 'HY/HYD/0123456/0014'
  WHEN 15 THEN 'HY/HYD/0123456/0015'
  WHEN 16 THEN 'HY/HYD/0123456/0016'
  WHEN 17 THEN 'HY/HYD/0123456/0017'
  WHEN 18 THEN 'HY/HYD/0123456/0018'
  WHEN 19 THEN 'HY/HYD/0123456/0019'
  WHEN 20 THEN 'HY/HYD/0123456/0020'
END WHERE employee_id BETWEEN 6 AND 20;

-- 9. Sample payslips Apr-Jun 2026
INSERT INTO payslips (employee_id, month, year, basic, hra, allowances, gross_earnings, ctc, deductions, net_pay, working_days, paid_days, lop_days, status) VALUES
  (6,4,2026,10000.00,4000.00,3950.00,19800.00,21000.00,1350.00,18450.00,26.0,26.0,0.0,'Paid'),
  (6,5,2026,10000.00,4000.00,3950.00,19800.00,21000.00,1350.00,18450.00,26.0,26.0,0.0,'Paid'),
  (6,6,2026,10000.00,4000.00,3950.00,19800.00,21000.00,1350.00,18450.00,26.0,26.0,0.0,'Paid'),
  (7,4,2026,20000.00,8000.00,7900.00,39600.00,41400.00,2000.00,37600.00,26.0,26.0,0.0,'Paid'),
  (7,5,2026,20000.00,8000.00,7900.00,39600.00,41400.00,2000.00,37600.00,26.0,26.0,0.0,'Paid'),
  (7,6,2026,20000.00,8000.00,7900.00,39600.00,41400.00,2000.00,37600.00,26.0,26.0,0.0,'Paid'),
  (8,4,2026,33333.00,13333.00,13167.00,66000.00,67800.00,2000.00,64000.00,26.0,26.0,0.0,'Paid'),
  (8,5,2026,33333.00,13333.00,13167.00,66000.00,67800.00,2000.00,64000.00,26.0,26.0,0.0,'Paid'),
  (8,6,2026,33333.00,13333.00,13167.00,66000.00,67800.00,2000.00,64000.00,26.0,26.0,0.0,'Paid'),
  (9,4,2026,40000.00,16000.00,15800.00,79200.00,81000.00,2000.00,77200.00,26.0,26.0,0.0,'Paid'),
  (9,5,2026,40000.00,16000.00,15800.00,79200.00,81000.00,2000.00,77200.00,26.0,26.0,0.0,'Paid'),
  (9,6,2026,40000.00,16000.00,15800.00,79200.00,81000.00,2000.00,77200.00,26.0,26.0,0.0,'Paid'),
  (10,4,2026,60000.00,24000.00,23700.00,118800.00,120600.00,2000.00,116800.00,26.0,26.0,0.0,'Paid'),
  (10,5,2026,60000.00,24000.00,23700.00,118800.00,120600.00,2000.00,116800.00,26.0,26.0,0.0,'Paid'),
  (10,6,2026,60000.00,24000.00,23700.00,118800.00,120600.00,2000.00,116800.00,26.0,26.0,0.0,'Paid'),
  (11,4,2026,80000.00,32000.00,31600.00,158400.00,160200.00,2000.00,156400.00,26.0,26.0,0.0,'Paid'),
  (11,5,2026,80000.00,32000.00,31600.00,158400.00,160200.00,2000.00,156400.00,26.0,26.0,0.0,'Paid'),
  (11,6,2026,80000.00,32000.00,31600.00,158400.00,160200.00,2000.00,156400.00,26.0,26.0,0.0,'Paid'),
  (12,4,2026,100000.00,40000.00,39500.00,198000.00,199800.00,2000.00,196000.00,26.0,26.0,0.0,'Paid'),
  (12,5,2026,100000.00,40000.00,39500.00,198000.00,199800.00,2000.00,196000.00,26.0,26.0,0.0,'Paid'),
  (12,6,2026,100000.00,40000.00,39500.00,198000.00,199800.00,2000.00,196000.00,26.0,26.0,0.0,'Paid'),
  (13,4,2026,26667.00,10667.00,10533.00,52800.00,54600.00,2000.00,50800.00,26.0,26.0,0.0,'Paid'),
  (13,5,2026,26667.00,10667.00,10533.00,52800.00,54600.00,2000.00,50800.00,26.0,26.0,0.0,'Paid'),
  (13,6,2026,26667.00,10667.00,10533.00,52800.00,54600.00,2000.00,50800.00,26.0,26.0,0.0,'Paid'),
  (14,4,2026,24000.00,9600.00,9480.00,47520.00,49320.00,2000.00,45520.00,26.0,26.0,0.0,'Paid'),
  (14,5,2026,24000.00,9600.00,9480.00,47520.00,49320.00,2000.00,45520.00,26.0,26.0,0.0,'Paid'),
  (14,6,2026,24000.00,9600.00,9480.00,47520.00,49320.00,2000.00,45520.00,26.0,26.0,0.0,'Paid'),
  (15,4,2026,30000.00,12000.00,11850.00,59400.00,61200.00,2000.00,57400.00,26.0,26.0,0.0,'Paid'),
  (15,5,2026,30000.00,12000.00,11850.00,59400.00,61200.00,2000.00,57400.00,26.0,26.0,0.0,'Paid'),
  (15,6,2026,30000.00,12000.00,11850.00,59400.00,61200.00,2000.00,57400.00,26.0,26.0,0.0,'Paid'),
  (16,4,2026,46667.00,18667.00,18433.00,92400.00,94200.00,2000.00,90400.00,26.0,26.0,0.0,'Paid'),
  (16,5,2026,46667.00,18667.00,18433.00,92400.00,94200.00,2000.00,90400.00,26.0,26.0,0.0,'Paid'),
  (16,6,2026,46667.00,18667.00,18433.00,92400.00,94200.00,2000.00,90400.00,26.0,26.0,0.0,'Paid'),
  (17,4,2026,66667.00,26667.00,26333.00,132000.00,133800.00,2000.00,130000.00,26.0,26.0,0.0,'Paid'),
  (17,5,2026,66667.00,26667.00,26333.00,132000.00,133800.00,2000.00,130000.00,26.0,26.0,0.0,'Paid'),
  (17,6,2026,66667.00,26667.00,26333.00,132000.00,133800.00,2000.00,130000.00,26.0,26.0,0.0,'Paid'),
  (18,4,2026,18000.00,7200.00,7110.00,35640.00,37440.00,2000.00,33640.00,26.0,26.0,0.0,'Paid'),
  (18,5,2026,18000.00,7200.00,7110.00,35640.00,37440.00,2000.00,33640.00,26.0,26.0,0.0,'Paid'),
  (18,6,2026,18000.00,7200.00,7110.00,35640.00,37440.00,2000.00,33640.00,26.0,26.0,0.0,'Paid'),
  (19,4,2026,53333.00,21333.00,21067.00,105600.00,107400.00,2000.00,103600.00,26.0,26.0,0.0,'Paid'),
  (19,5,2026,53333.00,21333.00,21067.00,105600.00,107400.00,2000.00,103600.00,26.0,26.0,0.0,'Paid'),
  (19,6,2026,53333.00,21333.00,21067.00,105600.00,107400.00,2000.00,103600.00,26.0,26.0,0.0,'Paid'),
  (20,4,2026,14000.00,5600.00,5530.00,27720.00,29400.00,1880.00,25840.00,26.0,26.0,0.0,'Paid'),
  (20,5,2026,14000.00,5600.00,5530.00,27720.00,29400.00,1880.00,25840.00,26.0,26.0,0.0,'Paid'),
  (20,6,2026,14000.00,5600.00,5530.00,27720.00,29400.00,1880.00,25840.00,26.0,26.0,0.0,'Paid')
ON DUPLICATE KEY UPDATE net_pay=VALUES(net_pay), gross_earnings=VALUES(gross_earnings);
