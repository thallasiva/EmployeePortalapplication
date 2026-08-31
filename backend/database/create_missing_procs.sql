-- =====================================================================
-- Missing Stored Procedures for HRMS Production
-- Run against hrms_db on RDS
-- =====================================================================

DROP PROCEDURE IF EXISTS sp_dashboard_stats;
DROP PROCEDURE IF EXISTS sp_attendance_dashboard;
DROP PROCEDURE IF EXISTS sp_rec_admin_dashboard;
DROP PROCEDURE IF EXISTS sp_joining_list_pending;

DELIMITER $$

CREATE PROCEDURE sp_dashboard_stats()
BEGIN
  SELECT
    (SELECT COUNT(*) FROM employees)                                                   AS total_employees,
    (SELECT COUNT(*) FROM employees WHERE employee_status = 'Active')                  AS active_employees,
    (SELECT COUNT(*) FROM employees WHERE employee_status != 'Active')                 AS inactive_employees,
    (SELECT COUNT(*) FROM leave_requests WHERE status = 'Pending')                     AS pending_leaves,
    (SELECT COUNT(*) FROM leave_requests WHERE status = 'Approved'
       AND MONTH(from_date) = MONTH(CURDATE()) AND YEAR(from_date) = YEAR(CURDATE())) AS approved_leaves_month,
    (SELECT COUNT(*) FROM jobs WHERE status = 'Open')                                  AS open_jobs,
    (SELECT COUNT(*) FROM employees
       WHERE MONTH(emp_joining_date) = MONTH(CURDATE())
         AND YEAR(emp_joining_date) = YEAR(CURDATE()))                                AS new_hires_month,
    (SELECT COUNT(*) FROM helpdesk_tickets WHERE status IN ('open','in_progress'))     AS open_tickets,
    (SELECT COUNT(*) FROM employees
       WHERE employee_status = 'Active'
         AND emp_exit_date IS NOT NULL
         AND emp_exit_date >= CURDATE())                                               AS upcoming_exits;
END$$

CREATE PROCEDURE sp_attendance_dashboard(IN p_date DATE)
BEGIN
  DECLARE v_date DATE;
  SET v_date = COALESCE(p_date, CURDATE());

  SELECT
    (SELECT COUNT(*) FROM attendance WHERE attendance_date = v_date AND status = 'present')  AS present_count,
    (SELECT COUNT(*) FROM attendance WHERE attendance_date = v_date AND status = 'absent')   AS absent_count,
    (SELECT COUNT(*) FROM attendance WHERE attendance_date = v_date AND status = 'late')     AS late_count,
    (SELECT COUNT(*) FROM attendance WHERE attendance_date = v_date AND status = 'leave')    AS leave_count,
    (SELECT COUNT(*) FROM attendance WHERE attendance_date = v_date AND status = 'half_day') AS half_day_count,
    (SELECT COUNT(*) FROM employees WHERE employee_status = 'Active')                        AS total_active,
    (SELECT COUNT(*) FROM attendance
       WHERE attendance_date = v_date AND status IN ('present','late','half_day'))            AS checked_in,
    v_date AS attendance_date;
END$$

CREATE PROCEDURE sp_rec_admin_dashboard()
BEGIN
  -- RS0: Stats
  SELECT
    (SELECT COUNT(*) FROM jobs WHERE status = 'Open')                 AS open_positions,
    (SELECT COUNT(*) FROM job_applications)                           AS total_applications,
    (SELECT COUNT(*) FROM job_applications WHERE status='Shortlisted') AS shortlisted,
    (SELECT COUNT(*) FROM job_applications WHERE status='Interview')   AS in_interview,
    (SELECT COUNT(*) FROM job_applications WHERE status='Offered')     AS offered,
    (SELECT COUNT(*) FROM job_applications WHERE status='Hired')       AS hired,
    (SELECT COUNT(*) FROM job_applications WHERE status='Rejected')    AS rejected,
    (SELECT COUNT(*) FROM job_applications
       WHERE MONTH(applied_on)=MONTH(CURDATE()) AND YEAR(applied_on)=YEAR(CURDATE())) AS applications_this_month;

  -- RS1: Pipeline by status
  SELECT status, COUNT(*) AS count
  FROM job_applications
  GROUP BY status
  ORDER BY FIELD(status,'Applied','Shortlisted','Interview','Offered','Hired','Rejected');

  -- RS2: Recruiter performance
  SELECT
    COALESCE(CONCAT(e.first_name,' ',e.last_name),'Unknown') AS recruiter_name,
    COUNT(DISTINCT j.job_id)    AS jobs_posted,
    COUNT(DISTINCT ja.application_id) AS applications_received
  FROM jobs j
  LEFT JOIN employees e  ON e.employee_id = j.created_by
  LEFT JOIN job_applications ja ON ja.job_id = j.job_id
  GROUP BY j.created_by, recruiter_name
  ORDER BY jobs_posted DESC
  LIMIT 10;

  -- RS3: Recent open jobs
  SELECT
    j.job_id, j.title,
    d.name AS department,
    j.location, j.employment_type, j.status, j.posted_on, j.closing_date,
    COUNT(ja.application_id) AS applicant_count
  FROM jobs j
  LEFT JOIN departments d ON d.department_id = j.department_id
  LEFT JOIN job_applications ja ON ja.job_id = j.job_id
  WHERE j.status = 'Open'
  GROUP BY j.job_id, j.title, d.name, j.location, j.employment_type, j.status, j.posted_on, j.closing_date
  ORDER BY j.posted_on DESC
  LIMIT 10;

  -- RS4: Recently shortlisted candidates
  SELECT
    ja.application_id, ja.applicant_name, ja.email, ja.status,
    j.title AS job_title, ja.applied_on
  FROM job_applications ja
  JOIN jobs j ON j.job_id = ja.job_id
  WHERE ja.status IN ('Shortlisted','Interview','Offered')
  ORDER BY ja.applied_on DESC
  LIMIT 10;
END$$

CREATE PROCEDURE sp_joining_list_pending(
  IN p_status  VARCHAR(50),
  IN p_search  VARCHAR(255),
  IN p_limit   INT,
  IN p_offset  INT
)
BEGIN
  DECLARE v_limit  INT DEFAULT 20;
  DECLARE v_offset INT DEFAULT 0;
  SET v_limit  = COALESCE(p_limit, 20);
  SET v_offset = COALESCE(p_offset, 0);

  SELECT
    ji.id             AS invitation_id,
    ji.candidate_id,
    ji.offer_id,
    ji.candidate_name,
    ji.candidate_email,
    ji.job_title,
    ji.status,
    ji.expires_at,
    ji.created_at,
    ji.updated_at,
    jf.id             AS formality_id,
    jf.full_name,
    jf.mobile,
    jf.submission_completed_at
  FROM joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE
    (p_status IS NULL OR ji.status = p_status)
    AND (p_search IS NULL OR p_search = ''
         OR ji.candidate_name  LIKE CONCAT('%', p_search, '%')
         OR ji.candidate_email LIKE CONCAT('%', p_search, '%')
         OR ji.job_title       LIKE CONCAT('%', p_search, '%'))
  ORDER BY ji.created_at DESC
  LIMIT v_limit OFFSET v_offset;

  SELECT COUNT(*) AS total
  FROM joining_invitations ji
  WHERE
    (p_status IS NULL OR ji.status = p_status)
    AND (p_search IS NULL OR p_search = ''
         OR ji.candidate_name  LIKE CONCAT('%', p_search, '%')
         OR ji.candidate_email LIKE CONCAT('%', p_search, '%')
         OR ji.job_title       LIKE CONCAT('%', p_search, '%'));
END$$

DELIMITER ;
