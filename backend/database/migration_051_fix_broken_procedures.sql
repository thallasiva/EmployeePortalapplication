-- =============================================================
-- Migration 051: repair procedures that reference columns missing from the live schema,
-- and give Reporting Managers the team-level leave/attendance permissions their pages need.
-- Run with: node src/database/runSql.js migration_051_fix_broken_procedures.sql
-- =============================================================

-- 1. Reporting Managers approve their team's leave and regularizations.
--    Routes limit them to direct reports (see middleware/rbac.js assertManagesEmployee).
INSERT IGNORE INTO role_permissions (role_id, permission_id, allowed)
SELECT r.role_id, p.permission_id, 1
  FROM roles r
  JOIN permissions p ON p.module IN ('leave', 'attendance') AND p.action IN ('view', 'edit')
 WHERE r.role_name = 'Reporting Manager';

-- 2. Salary structures: restore the migration-041 definition. salary_structures holds named
--    structures (no employee_id); a later 3-argument version queried the dropped legacy table.
DROP PROCEDURE IF EXISTS sp_list_salary_structures;
DELIMITER $$
CREATE PROCEDURE sp_list_salary_structures()
BEGIN
  SELECT s.*,
         COUNT(l.line_id) AS component_count
    FROM salary_structures s
    LEFT JOIN salary_structure_lines l ON l.structure_id = s.structure_id AND l.is_active = 1
   WHERE s.is_active = 1
   GROUP BY s.structure_id
   ORDER BY s.is_default DESC, s.structure_name;
END $$
DELIMITER ;

-- 3. jobs has no designation_id.
DROP PROCEDURE IF EXISTS sp_get_job;
DELIMITER $$
CREATE PROCEDURE sp_get_job(IN p_id INT)
BEGIN
  SELECT j.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS created_by_name,
         d.department_name, NULL AS designation_name
    FROM jobs j
    LEFT JOIN employees e   ON e.employee_id   = j.created_by
    LEFT JOIN departments d ON d.department_id = j.department_id
   WHERE j.job_id = p_id;
END $$
DELIMITER ;

-- 4. job_applications has no referred_by.
DROP PROCEDURE IF EXISTS sp_get_job_application;
DELIMITER $$
CREATE PROCEDURE sp_get_job_application(IN p_id INT)
BEGIN
  SELECT ja.*, j.title AS job_title, j.department_id,
         NULL AS referred_by_name,
         d.department_name
    FROM job_applications ja
    JOIN jobs j ON j.job_id = ja.job_id
    LEFT JOIN departments d ON d.department_id = j.department_id
   WHERE ja.application_id = p_id;
END $$
DELIMITER ;

-- 5. request_hub records the approver in reviewed_by (not approved_by).
DROP PROCEDURE IF EXISTS sp_get_request_hub;
DELIMITER $$
CREATE PROCEDURE sp_get_request_hub(IN p_id INT)
BEGIN
  SELECT rh.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS approved_by_name,
         d.department_name
    FROM request_hub rh
    JOIN employees e ON e.employee_id = rh.employee_id
    LEFT JOIN employees a ON a.employee_id = rh.reviewed_by
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE rh.request_id = p_id;
END $$
DELIMITER ;

-- 6. leave_balances.balance (not balance_days); one row per year, so report the current year only.
DROP PROCEDURE IF EXISTS sp_report_leave_balance;
DELIMITER $$
CREATE PROCEDURE sp_report_leave_balance()
BEGIN
  SELECT e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS emp_name,
         m.emp_code AS mgr_code,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS mgr_name,
         d.department_name,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Comp%' THEN lb.balance ELSE 0 END) AS comp_off,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Earned%' OR lt.leave_type_name = 'EL' THEN lb.balance ELSE 0 END) AS earned_leave,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Paternity%' THEN lb.balance ELSE 0 END) AS paternity,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Restricted%' OR lt.leave_type_name = 'RH' THEN lb.balance ELSE 0 END) AS restricted_holiday,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Sick%' OR lt.leave_type_name = 'SL' THEN lb.balance ELSE 0 END) AS sick_leave
    FROM leave_balances lb
    JOIN employees e ON e.employee_id = lb.employee_id
    JOIN leave_types lt ON lt.leave_type_id = lb.leave_type_id
    LEFT JOIN employees m ON m.employee_id = e.reporting_to
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE e.employee_status = 'Active'
     AND lb.year = YEAR(CURDATE())
   GROUP BY e.employee_id
   ORDER BY e.emp_code;
END $$
DELIMITER ;

-- 7. employees has no confirmation date and leave_types has no short_code; keep the
--    result columns (as NULL) so the report generator's shape is unchanged.
DROP PROCEDURE IF EXISTS sp_report_leave_summary_data;
DELIMITER $$
CREATE PROCEDURE sp_report_leave_summary_data(IN p_from DATE, IN p_to DATE)
BEGIN
  SELECT e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS emp_name,
         e.employee_status, NULL AS date_of_confirmation, e.emp_joining_date, e.employee_id,
         d.department_name, ds.designation_name
    FROM employees e
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN designations ds ON ds.designation_id = e.designation_id
   WHERE e.employee_status = 'Active'
   ORDER BY e.emp_code;

  SELECT leave_type_id, leave_type_name, NULL AS short_code FROM leave_types ORDER BY leave_type_id;

  SELECT lr.employee_id, lr.leave_type_id, IFNULL(SUM(lr.days), 0) AS days_availed
    FROM leave_requests lr
   WHERE lr.status = 'approved' AND lr.from_date >= p_from AND lr.to_date <= p_to
   GROUP BY lr.employee_id, lr.leave_type_id;

  SELECT lb.employee_id, lb.leave_type_id, lb.balance AS balance_days
    FROM leave_balances lb
   WHERE lb.year = YEAR(p_to);
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_leave_summary;
DELIMITER $$
CREATE PROCEDURE sp_get_leave_summary(IN p_year INT, IN p_department_id INT, IN p_status VARCHAR(30))
BEGIN
  SELECT e.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         e.employee_status, e.emp_joining_date, NULL AS confirmation_date,
         d.department_name, des.designation_name
    FROM employees e
    LEFT JOIN departments  d   ON d.department_id   = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
   WHERE e.employee_status != 'Deleted'
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (p_status        IS NULL OR e.employee_status = p_status)
   ORDER BY e.emp_code;

  SELECT leave_type_id, leave_type_name FROM leave_types ORDER BY leave_type_name;

  SELECT lb.employee_id, lb.leave_type_id, lb.opening_balance, lb.granted, lb.availed,
         GREATEST(0, lb.opening_balance + lb.granted - lb.availed) AS closing_balance
    FROM leave_balances lb WHERE lb.year = p_year;

  SELECT lr.employee_id, lr.leave_type_id, MONTH(lr.from_date) AS month, SUM(lr.days) AS days_taken
    FROM leave_requests lr
   WHERE lr.status = 'Approved' AND YEAR(lr.from_date) = p_year
   GROUP BY lr.employee_id, lr.leave_type_id, MONTH(lr.from_date);
END $$
DELIMITER ;

-- 8. Roles live on users, not employees.
DROP PROCEDURE IF EXISTS sp_admin_timesheet_counts;
DELIMITER $$
CREATE PROCEDURE sp_admin_timesheet_counts()
BEGIN
  SELECT COALESCE(SUM(status = 'pending'), 0)   AS pending,
         COALESCE(SUM(status = 'approved'), 0)  AS approved,
         COALESCE(SUM(status = 'rejected'), 0)  AS rejected
    FROM weekly_timesheets;

  SELECT COUNT(*) AS cnt
    FROM users u JOIN roles r ON r.role_id = u.role_id
   WHERE r.role_name = 'Employee' AND u.status = 'Active';

  SELECT COUNT(*) AS cnt
    FROM users u JOIN roles r ON r.role_id = u.role_id
   WHERE r.role_name = 'Reporting Manager' AND u.status = 'Active';
END $$
DELIMITER ;

-- 9. calendar_events is (event_id, title, description, event_date, event_type, created_by):
--    events are company-wide, so p_employee_id / p_visibility are accepted but not filtered on.
DROP PROCEDURE IF EXISTS sp_list_calendar_events;
DELIMITER $$
CREATE PROCEDURE sp_list_calendar_events(
  IN p_employee_id INT, IN p_visibility VARCHAR(20), IN p_type VARCHAR(50),
  IN p_from DATE, IN p_to DATE, IN p_limit INT, IN p_offset INT
)
BEGIN
  DECLARE v_limit INT DEFAULT 50;
  DECLARE v_offset INT DEFAULT 0;
  SET v_limit = COALESCE(p_limit, 50);
  SET v_offset = COALESCE(p_offset, 0);

  SELECT ce.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS created_by_name
    FROM calendar_events ce
    LEFT JOIN employees e ON e.employee_id = ce.created_by
   WHERE (p_type IS NULL OR ce.event_type = p_type)
     AND (p_from IS NULL OR ce.event_date >= p_from)
     AND (p_to   IS NULL OR ce.event_date <= p_to)
   ORDER BY ce.event_date ASC
   LIMIT v_offset, v_limit;

  SELECT COUNT(*) AS total FROM calendar_events ce
   WHERE (p_type IS NULL OR ce.event_type = p_type)
     AND (p_from IS NULL OR ce.event_date >= p_from)
     AND (p_to   IS NULL OR ce.event_date <= p_to);
END $$
DELIMITER ;

-- 10. weekly_timesheets.status is enum(draft,pending,approved,rejected): sp_submit_timesheet sets
--     'pending', but review and every dashboard counter looked for 'submitted' (unstorable), so
--     timesheets could never be approved and pending counts were always 0.

DROP PROCEDURE IF EXISTS sp_review_timesheet;
DELIMITER $$
CREATE PROCEDURE `sp_review_timesheet`(
    IN p_timesheet_id INT,
    IN p_decision VARCHAR(20),
    IN p_reviewed_by INT,
    IN p_comments TEXT,
    OUT p_ok TINYINT,
    OUT p_msg VARCHAR(200)
)
BEGIN

    DECLARE v_status VARCHAR(20);

    SET p_ok = 0;
    SET p_msg = '';

    SELECT status
    INTO v_status
    FROM weekly_timesheets
    WHERE timesheet_id = p_timesheet_id
    LIMIT 1;

    IF v_status IS NULL THEN

        SET p_msg = 'Timesheet not found';

    ELSEIF LOWER(TRIM(p_decision)) NOT IN ('approved', 'rejected') THEN

        SET p_msg = 'Invalid decision. Use approved or rejected';

    ELSEIF LOWER(v_status) <> 'pending' THEN

        SET p_msg = 'Timesheet is not awaiting review';

    ELSE

        UPDATE weekly_timesheets
        SET
            status = LOWER(TRIM(p_decision)),
            reviewed_by = p_reviewed_by,
            reviewed_at = NOW(),
            comments = p_comments
        WHERE timesheet_id = p_timesheet_id;

        IF LOWER(TRIM(p_decision)) = 'approved' THEN

            UPDATE employee_tasks
            SET status = 'in_timesheet'
            WHERE task_id IN (
                SELECT DISTINCT task_id
                FROM timesheet_entries
                WHERE
                    timesheet_id = p_timesheet_id
                    AND task_id IS NOT NULL
            );

        END IF;

        SET p_ok = 1;
        SET p_msg = CONCAT(
            'Timesheet ',
            LOWER(TRIM(p_decision)),
            ' successfully'
        );

    END IF;

END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_manager_timesheet_counts;
DELIMITER $$
CREATE PROCEDURE `sp_manager_timesheet_counts`(IN p_manager_id INT)
BEGIN
  SELECT SUM(wt.status='pending') AS pending,
         SUM(wt.status='approved')  AS approved,
         SUM(wt.status='rejected')  AS rejected
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id = wt.employee_id
   WHERE e.reporting_to = p_manager_id;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_employee_timesheet_counts;
DELIMITER $$
CREATE PROCEDURE `sp_employee_timesheet_counts`(IN p_employee_id INT)
BEGIN
  SELECT SUM(status='draft') AS draft, SUM(status='pending') AS pending,
         SUM(status='approved') AS approved, SUM(status='rejected') AS rejected
    FROM weekly_timesheets WHERE employee_id = p_employee_id;

  SELECT COUNT(*) AS cnt FROM timesheet_entries WHERE employee_id = p_employee_id;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_employee_dashboard;
DELIMITER $$
CREATE PROCEDURE `sp_employee_dashboard`(IN p_employee_id INT)
BEGIN
  SELECT SUM(status='approved') AS approved, SUM(status='pending') AS pending,
         SUM(status='rejected') AS rejected, SUM(status='draft') AS draft
    FROM weekly_timesheets WHERE employee_id = p_employee_id;

  SELECT COUNT(*) AS open_tasks FROM employee_tasks
   WHERE employee_id = p_employee_id AND status NOT IN ('completed','in_timesheet');

  SELECT COUNT(*) AS pending_leaves FROM leave_requests
   WHERE employee_id = p_employee_id AND status = 'Pending';

  SELECT lt.leave_type_name, IFNULL(lb.balance, lt.annual_quota) AS balance
    FROM leave_types lt
    LEFT JOIN leave_balances lb
           ON lb.leave_type_id = lt.leave_type_id
          AND lb.employee_id   = p_employee_id
          AND lb.year          = YEAR(CURDATE())
   ORDER BY lt.leave_type_name;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_admin_dashboard;
DELIMITER $$
CREATE PROCEDURE `sp_admin_dashboard`()
BEGIN
  SELECT SUM(status='pending') AS pending_timesheets,
         SUM(status='approved')  AS approved_timesheets,
         COUNT(*)                AS total_timesheets
    FROM weekly_timesheets;

  SELECT (SELECT COUNT(*) FROM employees WHERE employee_status='Active') AS active_employees,
         (SELECT COUNT(*) FROM leave_requests WHERE status='Pending')    AS pending_leaves,
         (SELECT COUNT(*) FROM helpdesk_tickets WHERE status='Open')     AS open_tickets;
END $$
DELIMITER ;

SELECT 'migration_051_fix_broken_procedures done' AS status;
