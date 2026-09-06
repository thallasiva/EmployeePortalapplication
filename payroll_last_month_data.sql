-- ============================================================================
--  LAST MONTH — PAYROLL INPUT DATA (review before processing)
--  Database: hrms_db
--  Run in MySQL Workbench: open this file, then Execute All (⚡ / Ctrl+Shift+Enter)
--
--  It does NOT change any data. It only reads, so it is safe to run repeatedly.
--  Review the output, then process payroll in the app.
-- ============================================================================

-- --- Target period: defaults to the PREVIOUS calendar month -----------------
SET @month := MONTH(CURDATE() - INTERVAL 1 MONTH);
SET @year  := YEAR (CURDATE() - INTERVAL 1 MONTH);
-- To force a specific month instead (e.g. August 2026), uncomment:
-- SET @month := 8;  SET @year := 2026;

SET @period_start := STR_TO_DATE(CONCAT(@year,'-',@month,'-01'), '%Y-%m-%d');
SET @days_in_month := DAY(LAST_DAY(@period_start));

-- ============================================================================
-- 1) PER-EMPLOYEE PAYROLL INPUT
-- ============================================================================
SELECT
    e.emp_code,
    CONCAT(e.first_name, ' ', COALESCE(e.last_name, ''))          AS employee_name,
    d.department_name,
    ds.designation_name,
    e.employee_type,
    e.employee_status,
    e.emp_joining_date,
    e.emp_exit_date,
    @month                                                        AS pay_month,
    @year                                                         AS pay_year,
    @days_in_month                                                AS days_in_month,

    -- ---- Salary (active assignment if present, else employee CTC) ----
    COALESCE(sal.ctc_annual, e.ctc)                               AS ctc_annual,
    ROUND(COALESCE(sal.ctc_annual, e.ctc) / 12, 2)               AS monthly_ctc,
    sal.structure_name                                           AS salary_structure,

    -- ---- Attendance breakdown for the month ----
    COALESCE(att.present_days, 0)                                AS present_days,
    COALESCE(att.half_days,    0)                                AS half_days,
    COALESCE(att.leave_days,   0)                                AS leave_days,
    COALESCE(att.absent_days,  0)                                AS absent_days,
    COALESCE(att.weekend_days, 0)                                AS weekend_days,
    COALESCE(att.holiday_days, 0)                                AS holiday_days,
    COALESCE(att.marked_days,  0)                                AS total_marked_days,

    -- ---- Paid vs Loss-of-Pay (SIMPLE rule — adjust to your policy) ----
    --   Paid   = present + late + weekend + holiday + leave + 0.5*half_day
    --   LOP    = absent + 0.5*half_day
    COALESCE(att.paid_days, 0)                                   AS paid_days,
    COALESCE(att.lop_days,  0)                                   AS lop_days,

    -- Prorated monthly pay for the paid days (basic proration on calendar days)
    ROUND(COALESCE(sal.ctc_annual, e.ctc) / 12
          / @days_in_month * COALESCE(att.paid_days, 0), 2)     AS prorated_gross_est,

    -- ---- Approved leave days taken in the month ----
    COALESCE(lv.approved_leave_days, 0)                          AS approved_leave_days,

    -- ---- Bank details for disbursement ----
    bd.bank_name,
    bd.account_number,
    bd.ifsc_code,
    bd.account_holder_name,
    bd.pan_number,
    bd.uan_number
FROM employees e
LEFT JOIN departments  d  ON d.department_id   = e.department_id
LEFT JOIN designations ds ON ds.designation_id = e.designation_id

-- latest ACTIVE salary assignment per employee (avoids duplicate rows)
LEFT JOIN (
    SELECT s1.employee_id, s1.ctc_annual, ss.structure_name
    FROM employee_salary_assignments s1
    JOIN (
        SELECT employee_id, MAX(effective_from) AS mf
        FROM employee_salary_assignments
        WHERE is_active = 1
        GROUP BY employee_id
    ) s2 ON s2.employee_id = s1.employee_id
        AND s2.mf          = s1.effective_from
    LEFT JOIN salary_structures ss ON ss.structure_id = s1.structure_id
    WHERE s1.is_active = 1
) sal ON sal.employee_id = e.employee_id

-- attendance summary for the target month
LEFT JOIN (
    SELECT
        employee_id,
        SUM(status IN ('present','late'))                         AS present_days,
        SUM(status = 'half_day')                                  AS half_days,
        SUM(status = 'leave')                                     AS leave_days,
        SUM(status = 'absent')                                    AS absent_days,
        SUM(status = 'weekend')                                   AS weekend_days,
        SUM(status = 'holiday')                                   AS holiday_days,
        COUNT(*)                                                  AS marked_days,
        (SUM(status IN ('present','late','weekend','holiday','leave'))
             + SUM(status = 'half_day') * 0.5)                    AS paid_days,
        (SUM(status = 'absent')
             + SUM(status = 'half_day') * 0.5)                    AS lop_days
    FROM attendance
    WHERE MONTH(attendance_date) = @month
      AND YEAR (attendance_date) = @year
    GROUP BY employee_id
) att ON att.employee_id = e.employee_id

-- approved leave days taken in the month
LEFT JOIN (
    SELECT employee_id, SUM(days) AS approved_leave_days
    FROM leave_requests
    WHERE status = 'Approved'
      AND MONTH(from_date) = @month
      AND YEAR (from_date) = @year
    GROUP BY employee_id
) lv ON lv.employee_id = e.employee_id

LEFT JOIN employee_bank_details bd ON bd.employee_id = e.employee_id

WHERE (e.has_left_organization = 0 OR e.has_left_organization IS NULL)
  AND (e.emp_exit_date IS NULL OR e.emp_exit_date >= @period_start)
ORDER BY d.department_name, e.emp_code;

-- ============================================================================
-- 2) QUICK SUMMARY (headcount + total monthly cost)
-- ============================================================================
SELECT
    @month AS pay_month,
    @year  AS pay_year,
    COUNT(*)                                          AS active_employees,
    ROUND(SUM(COALESCE(sal.ctc_annual, e.ctc)) / 12, 2) AS total_monthly_ctc
FROM employees e
LEFT JOIN (
    SELECT employee_id, MAX(ctc_annual) AS ctc_annual
    FROM employee_salary_assignments
    WHERE is_active = 1
    GROUP BY employee_id
) sal ON sal.employee_id = e.employee_id
WHERE (e.has_left_organization = 0 OR e.has_left_organization IS NULL)
  AND (e.emp_exit_date IS NULL OR e.emp_exit_date >= @period_start);

-- ============================================================================
-- 3) HAS PAYROLL ALREADY BEEN RUN FOR THIS MONTH?
--    (check before you process again — avoids duplicate payslips)
-- ============================================================================
SELECT payroll_run_id, month, year, status, total_amount, processed_by, processed_on, is_locked
FROM payroll_runs
WHERE month = @month AND year = @year;
