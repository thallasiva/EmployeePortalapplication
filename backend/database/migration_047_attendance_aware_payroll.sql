-- Attendance-aware payroll calculation.
-- Run: node src/database/runSql.js migration_047_attendance_aware_payroll.sql

DROP PROCEDURE IF EXISTS sp_generate_payslip;
DELIMITER $$
CREATE PROCEDURE sp_generate_payslip (
  IN p_employee_id INT, IN p_month TINYINT, IN p_year INT,
  IN p_payroll_run_id INT, OUT p_payslip_id INT
)
BEGIN
  DECLARE v_basic DECIMAL(12,2); DECLARE v_hra DECIMAL(12,2);
  DECLARE v_allowances DECIMAL(12,2); DECLARE v_deductions DECIMAL(12,2);
  DECLARE v_gross DECIMAL(12,2); DECLARE v_net DECIMAL(12,2);
  DECLARE v_ctc DECIMAL(12,2); DECLARE v_ctc_struct DECIMAL(12,2);
  DECLARE v_employer_pf DECIMAL(12,2); DECLARE v_working_days DECIMAL(4,1);
  DECLARE v_lop_days DECIMAL(4,1); DECLARE v_paid_days DECIMAL(4,1);
  DECLARE v_per_day DECIMAL(12,2);

  SELECT basic, hra, (conveyance + medical_allowance + special_allowance),
         (pf_employee + professional_tax + income_tax), ctc
    INTO v_basic, v_hra, v_allowances, v_deductions, v_ctc_struct
    FROM salary_structures WHERE employee_id = p_employee_id
    ORDER BY effective_from DESC LIMIT 1;
  IF v_basic IS NULL THEN
    SELECT base_salary * .5, base_salary * .2, base_salary * .3, 0, ctc
      INTO v_basic, v_hra, v_allowances, v_deductions, v_ctc_struct
      FROM employees WHERE employee_id = p_employee_id;
  END IF;

  -- Sundays and holidays assigned to the employee's holiday calendar are excluded.
  SELECT COUNT(*) INTO v_working_days
  FROM (
    SELECT DATE_ADD(STR_TO_DATE(CONCAT(p_year, '-', p_month, '-01'), '%Y-%m-%d'), INTERVAL seq.n DAY) AS work_date
    FROM (
      SELECT ones.n + tens.n * 10 AS n
      FROM (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) ones
      CROSS JOIN (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) tens
    ) seq
  ) dates
  WHERE dates.work_date <= LAST_DAY(STR_TO_DATE(CONCAT(p_year, '-', p_month, '-01'), '%Y-%m-%d'))
    AND DAYOFWEEK(dates.work_date) <> 1
    AND NOT EXISTS (
      SELECT 1 FROM holidays h JOIN employees e ON e.employee_id = p_employee_id
       WHERE h.holiday_date = dates.work_date
         AND (h.holiday_calendar = e.holiday_calendar OR h.holiday_calendar IS NULL)
    );

  -- Approved leave is paid. Explicit absences are one LOP day; half-days are .5 LOP.
  SELECT COALESCE(SUM(CASE WHEN a.status = 'half_day' THEN .5 ELSE 1 END), 0) INTO v_lop_days
    FROM attendance a
   WHERE a.employee_id = p_employee_id AND MONTH(a.attendance_date) = p_month
     AND YEAR(a.attendance_date) = p_year AND a.status IN ('absent', 'half_day')
     AND NOT EXISTS (
       SELECT 1 FROM leave_requests lr WHERE lr.employee_id = a.employee_id
         AND lr.status = 'Approved' AND a.attendance_date BETWEEN lr.from_date AND lr.to_date
     );

  SET v_paid_days = GREATEST(0, v_working_days - v_lop_days);
  SET v_gross = v_basic + v_hra + v_allowances;
  SET v_per_day = IF(v_working_days > 0, v_gross / v_working_days, 0);
  SET v_gross = ROUND(v_per_day * v_paid_days, 2);
  SET v_net = ROUND(v_gross - v_deductions, 2);
  SET v_employer_pf = ROUND(LEAST(v_basic, 15000) * .12, 2);
  SET v_ctc = IF(v_ctc_struct IS NOT NULL AND v_ctc_struct > 0, v_ctc_struct, v_gross + v_employer_pf);

  INSERT INTO payslips (payroll_run_id, employee_id, month, year, basic, hra, allowances,
    gross_earnings, ctc, deductions, net_pay, working_days, paid_days, lop_days, status)
  VALUES (p_payroll_run_id, p_employee_id, p_month, p_year, v_basic, v_hra, v_allowances,
    v_gross, v_ctc, v_deductions, v_net, v_working_days, v_paid_days, v_lop_days, 'Generated')
  ON DUPLICATE KEY UPDATE payroll_run_id = p_payroll_run_id, basic = v_basic, hra = v_hra,
    allowances = v_allowances, gross_earnings = v_gross, ctc = v_ctc, deductions = v_deductions,
    net_pay = v_net, working_days = v_working_days, paid_days = v_paid_days,
    lop_days = v_lop_days, status = 'Generated', generated_on = NOW();
  SELECT payslip_id INTO p_payslip_id FROM payslips
   WHERE employee_id = p_employee_id AND month = p_month AND year = p_year;
END $$
DELIMITER ;
