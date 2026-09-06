DROP PROCEDURE IF EXISTS sp_generate_payslip;
DELIMITER $$
CREATE PROCEDURE sp_generate_payslip (
  IN p_employee_id INT,
  IN p_month TINYINT,
  IN p_year INT,
  IN p_payroll_run_id INT,
  OUT p_payslip_id INT
)
BEGIN
  DECLARE v_monthly_salary DECIMAL(12,2) DEFAULT 0;
  DECLARE v_basic DECIMAL(12,2) DEFAULT 0;
  DECLARE v_hra DECIMAL(12,2) DEFAULT 0;
  DECLARE v_allowances DECIMAL(12,2) DEFAULT 0;
  DECLARE v_deductions DECIMAL(12,2) DEFAULT 0;
  DECLARE v_gross DECIMAL(12,2) DEFAULT 0;
  DECLARE v_net DECIMAL(12,2) DEFAULT 0;
  DECLARE v_ctc DECIMAL(12,2) DEFAULT 0;
  DECLARE v_working_days DECIMAL(4,1) DEFAULT 0;
  DECLARE v_lop_days DECIMAL(4,1) DEFAULT 0;
  DECLARE v_paid_days DECIMAL(4,1) DEFAULT 0;
  DECLARE v_per_day DECIMAL(12,2) DEFAULT 0;

  SELECT COALESCE(
    (SELECT esa.ctc_annual / 12
       FROM employee_salary_assignments esa
      WHERE esa.employee_id = p_employee_id
        AND esa.is_active = 1
        AND esa.effective_from <= LAST_DAY(STR_TO_DATE(CONCAT(p_year, '-', p_month, '-01'), '%Y-%m-%d'))
      ORDER BY esa.effective_from DESC
      LIMIT 1),
    e.base_salary,
    0
  )
  INTO v_monthly_salary
  FROM employees e
  WHERE e.employee_id = p_employee_id;

  SET v_basic = ROUND(v_monthly_salary * 0.50, 2);
  SET v_hra = ROUND(v_monthly_salary * 0.20, 2);
  SET v_allowances = ROUND(v_monthly_salary * 0.30, 2);
  SET v_deductions = ROUND(LEAST(v_basic, 15000) * 0.12, 2);

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
      SELECT 1 FROM holidays h
      JOIN employees e ON e.employee_id = p_employee_id
      WHERE h.holiday_date = dates.work_date
        AND (h.holiday_calendar = e.holiday_calendar OR h.holiday_calendar IS NULL)
    );

  SELECT COALESCE(SUM(CASE WHEN a.status = 'half_day' THEN 0.5 ELSE 1 END), 0)
    INTO v_lop_days
    FROM attendance a
   WHERE a.employee_id = p_employee_id
     AND MONTH(a.attendance_date) = p_month
     AND YEAR(a.attendance_date) = p_year
     AND a.status IN ('absent', 'half_day')
     AND NOT EXISTS (
       SELECT 1 FROM leave_requests lr
        WHERE lr.employee_id = a.employee_id
          AND lr.status = 'Approved'
          AND a.attendance_date BETWEEN lr.from_date AND lr.to_date
     );

  SET v_paid_days = GREATEST(v_working_days - v_lop_days, 0);
  SET v_per_day = IF(v_working_days > 0, v_monthly_salary / v_working_days, 0);
  SET v_gross = ROUND(v_per_day * v_paid_days, 2);
  SET v_net = GREATEST(ROUND(v_gross - v_deductions, 2), 0);
  SET v_ctc = ROUND(v_monthly_salary * 12, 2);

  INSERT INTO payslips (
    payroll_run_id, employee_id, month, year, basic, hra, allowances,
    gross_earnings, ctc, deductions, net_pay, working_days, paid_days, lop_days, status
  ) VALUES (
    p_payroll_run_id, p_employee_id, p_month, p_year, v_basic, v_hra, v_allowances,
    v_gross, v_ctc, v_deductions, v_net, v_working_days, v_paid_days, v_lop_days, 'Generated'
  )
  ON DUPLICATE KEY UPDATE
    payroll_run_id = p_payroll_run_id,
    basic = v_basic,
    hra = v_hra,
    allowances = v_allowances,
    gross_earnings = v_gross,
    ctc = v_ctc,
    deductions = v_deductions,
    net_pay = v_net,
    working_days = v_working_days,
    paid_days = v_paid_days,
    lop_days = v_lop_days,
    status = 'Generated',
    generated_on = NOW();

  SELECT payslip_id INTO p_payslip_id
    FROM payslips
   WHERE employee_id = p_employee_id AND month = p_month AND year = p_year;
END $$
DELIMITER ;