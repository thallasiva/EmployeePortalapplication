-- Patch: add emp_joining_date to sp_get_payslip_full
-- Required for gratuity eligibility check (>= 4 years 240 days)
-- Run once on existing DB

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_payslip_full $$
CREATE PROCEDURE sp_get_payslip_full (IN p_id INT)
BEGIN
  SELECT p.*,
         e.emp_code, e.first_name, e.last_name, e.emp_job_title, e.location,
         e.pf_number, e.employee_id AS emp_id,
         e.emp_joining_date,
         d.department_name, d.company_id,
         des.designation_name,
         c.company_name, c.address AS company_address,
         b.bank_name, b.account_number, b.pan_number, b.uan_number
    FROM payslips p
    JOIN employees e ON e.employee_id = p.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
    LEFT JOIN companies c ON c.company_id = d.company_id
    LEFT JOIN employee_bank_details b ON b.employee_id = e.employee_id
   WHERE p.payslip_id = p_id;
END $$

DELIMITER ;
