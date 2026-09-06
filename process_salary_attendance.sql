-- ============================================================================
--  ATTENDANCE-BASED SALARY PROCESSING  (21 working days)
--  Database: hrms_db     |  READ ONLY — changes no data, safe to re-run.
--  Run in MySQL Workbench: open, then Execute All (Ctrl+Shift+Enter).
--
--  Rule:  per_day  = monthly_gross / working_days
--         payable  = per_day * paid_days      (days actually worked/paid)
--         lop_deduct = monthly_gross - payable
-- ============================================================================

SET @working_days := 21;                                   -- fixed working days
SET @month := MONTH(CURDATE() - INTERVAL 1 MONTH);         -- previous month
SET @year  := YEAR (CURDATE() - INTERVAL 1 MONTH);
-- To pin a specific month, uncomment: SET @month := 8; SET @year := 2026;

SELECT
    e.emp_code,
    CONCAT(e.first_name,' ',COALESCE(e.last_name,''))        AS employee_name,
    d.department_name,

    ROUND(COALESCE(sal.ctc_annual, e.ctc)/12, 2)             AS monthly_gross,
    @working_days                                            AS working_days,

    -- paid days from attendance (present/late/weekend/holiday/leave + 0.5*half)
    COALESCE(att.paid_days, 0)                               AS days_worked,
    (@working_days - COALESCE(att.paid_days, 0))             AS lop_days,

    ROUND(COALESCE(sal.ctc_annual, e.ctc)/12/@working_days, 2)               AS per_day_rate,

    -- processed (prorated) pay
    ROUND(COALESCE(sal.ctc_annual, e.ctc)/12/@working_days
          * COALESCE(att.paid_days, 0), 0)                   AS payable_salary,

    -- loss-of-pay deduction
    ROUND(COALESCE(sal.ctc_annual, e.ctc)/12
          - COALESCE(sal.ctc_annual, e.ctc)/12/@working_days
            * COALESCE(att.paid_days, 0), 0)                 AS lop_deduction
FROM employees e
LEFT JOIN departments d ON d.department_id = e.department_id
LEFT JOIN (
    SELECT s1.employee_id, s1.ctc_annual
    FROM employee_salary_assignments s1
    JOIN (SELECT employee_id, MAX(effective_from) mf
          FROM employee_salary_assignments WHERE is_active=1 GROUP BY employee_id) s2
      ON s2.employee_id=s1.employee_id AND s2.mf=s1.effective_from
    WHERE s1.is_active=1
) sal ON sal.employee_id = e.employee_id
LEFT JOIN (
    SELECT employee_id,
      (SUM(status IN ('present','late','weekend','holiday','leave'))
        + SUM(status='half_day')*0.5) AS paid_days
    FROM attendance
    WHERE MONTH(attendance_date)=@month AND YEAR(attendance_date)=@year
    GROUP BY employee_id
) att ON att.employee_id = e.employee_id
WHERE (e.has_left_organization = 0 OR e.has_left_organization IS NULL)
ORDER BY d.department_name, e.emp_code;
