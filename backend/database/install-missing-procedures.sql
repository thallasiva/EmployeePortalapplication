-- =============================================================================
-- HRMS — INSTALL MISSING STORED PROCEDURES
-- Generated 2026-09-25 from the live hrms_db (336 procedures, all verified by end-to-end tests).
-- MySQL Workbench: open this file → Execute All, then restart the backend.
-- Safe to re-run: each procedure is dropped and re-created with its current definition.
-- =============================================================================
USE hrms_db;
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_list_attendance_regularization $$
CREATE PROCEDURE `sp_list_attendance_regularization`(
    IN p_employee_id INT,
    IN p_status VARCHAR(20),
    IN p_reporting_to INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        r.*,
        e.emp_code,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS employee_name,
        CONCAT(
            rv.first_name,
            ' ',
            IFNULL(rv.last_name, '')
        ) AS reviewer_name
    FROM attendance_regularization r
    INNER JOIN employees e
        ON e.employee_id = r.employee_id
    LEFT JOIN employees rv
        ON rv.employee_id = r.reviewed_by
    WHERE
        (p_employee_id IS NULL OR r.employee_id = p_employee_id)
        AND (p_status IS NULL OR r.status = p_status)
        AND (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to)
    ORDER BY r.created_at DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM attendance_regularization r
    INNER JOIN employees e
        ON e.employee_id = r.employee_id
    WHERE
        (p_employee_id IS NULL OR r.employee_id = p_employee_id)
        AND (p_status IS NULL OR r.status = p_status)
        AND (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to);
END $$
DROP PROCEDURE IF EXISTS sp_list_team_helpdesk $$
CREATE PROCEDURE `sp_list_team_helpdesk`(
    IN p_manager_id INT,
    IN p_status VARCHAR(30),
    IN p_priority VARCHAR(20),
    IN p_category VARCHAR(50),
    IN p_search VARCHAR(200),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        t.*,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS employee_name,
        e.emp_code,
        CONCAT(
            a.first_name,
            ' ',
            IFNULL(a.last_name, '')
        ) AS assigned_to_name
    FROM helpdesk_tickets t
    INNER JOIN employees e
        ON e.employee_id = t.employee_id
    LEFT JOIN employees a
        ON a.employee_id = t.assigned_to
    WHERE
        e.reporting_to = p_manager_id
        AND (p_status IS NULL OR t.status = p_status)
        AND (p_priority IS NULL OR t.priority = p_priority)
        AND (p_category IS NULL OR t.category = p_category)
        AND (
            p_search IS NULL
            OR p_search = ''
            OR t.subject LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY t.created_at DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM helpdesk_tickets t
    INNER JOIN employees e
        ON e.employee_id = t.employee_id
    WHERE
        e.reporting_to = p_manager_id
        AND (p_status IS NULL OR t.status = p_status)
        AND (p_priority IS NULL OR t.priority = p_priority)
        AND (p_category IS NULL OR t.category = p_category)
        AND (
            p_search IS NULL
            OR p_search = ''
            OR t.subject LIKE CONCAT('%', p_search, '%')
        );
END $$
DROP PROCEDURE IF EXISTS sp_manager_action_ticket $$
CREATE PROCEDURE `sp_manager_action_ticket`(
    IN p_manager_id INT,
    IN p_ticket_id INT,
    IN p_action VARCHAR(20),
    IN p_forward_team VARCHAR(50),
    IN p_comment TEXT,
    OUT p_ok TINYINT,
    OUT p_msg VARCHAR(200)
)
BEGIN
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_status VARCHAR(30);
    SET p_ok = 0;
    SET p_msg = '';
    SELECT COUNT(*)
    INTO v_cnt
    FROM helpdesk_tickets t
    INNER JOIN employees e
        ON e.employee_id = t.employee_id
    WHERE
        t.ticket_id = p_ticket_id
        AND e.reporting_to = p_manager_id;
    IF v_cnt = 0 THEN
        SET p_msg = 'Ticket does not belong to your team';
    ELSE
        SELECT status
        INTO v_status
        FROM helpdesk_tickets
        WHERE ticket_id = p_ticket_id
        LIMIT 1;
        IF v_status <> 'Open' THEN
            SET p_msg = 'Only Open tickets can be actioned by manager';
        ELSEIF LOWER(TRIM(p_action)) = 'approve' THEN
            IF p_forward_team IS NULL OR TRIM(p_forward_team) = '' THEN
                SET p_msg = 'Forward team is required';
            ELSE
                UPDATE helpdesk_tickets
                SET
                    status = 'Forwarded',
                    forwarded_to_team = p_forward_team
                WHERE ticket_id = p_ticket_id;
                INSERT INTO helpdesk_comments (
                    ticket_id,
                    commented_by,
                    comment
                )
                VALUES (
                    p_ticket_id,
                    p_manager_id,
                    COALESCE(p_comment, '')
                );
                SET p_ok = 1;
                SET p_msg = 'Ticket forwarded successfully';
            END IF;
        ELSEIF LOWER(TRIM(p_action)) = 'reject' THEN
            UPDATE helpdesk_tickets
            SET
                status = 'Rejected',
                resolved_at = NOW()
            WHERE ticket_id = p_ticket_id;
            INSERT INTO helpdesk_comments (
                ticket_id,
                commented_by,
                comment
            )
            VALUES (
                p_ticket_id,
                p_manager_id,
                COALESCE(p_comment, '')
            );
            SET p_ok = 1;
            SET p_msg = 'Ticket rejected successfully';
        ELSE
            SET p_msg = 'Invalid action. Use approve or reject';
        END IF;
    END IF;
END $$
DROP PROCEDURE IF EXISTS sp_list_jobs $$
CREATE PROCEDURE `sp_list_jobs`(
    IN p_status VARCHAR(20),
    IN p_department_id INT,
    IN p_search VARCHAR(200),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        j.*,
        d.department_name,
        CONCAT(
            c.first_name,
            ' ',
            IFNULL(c.last_name, '')
        ) AS created_by_name,
        (
            SELECT COUNT(*)
            FROM job_applications ja
            WHERE ja.job_id = j.job_id
        ) AS application_count
    FROM jobs j
    LEFT JOIN departments d
        ON d.department_id = j.department_id
    LEFT JOIN employees c
        ON c.employee_id = j.created_by
    WHERE
        (p_status IS NULL OR j.status = p_status)
        AND (
            p_department_id IS NULL
            OR j.department_id = p_department_id
        )
        AND (
            p_search IS NULL
            OR p_search = ''
            OR j.title LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY j.created_at DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM jobs j
    WHERE
        (p_status IS NULL OR j.status = p_status)
        AND (
            p_department_id IS NULL
            OR j.department_id = p_department_id
        )
        AND (
            p_search IS NULL
            OR p_search = ''
            OR j.title LIKE CONCAT('%', p_search, '%')
        );
END $$
DROP PROCEDURE IF EXISTS sp_list_job_applications $$
CREATE PROCEDURE `sp_list_job_applications`(
    IN p_job_id INT,
    IN p_status VARCHAR(30),
    IN p_search VARCHAR(200),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        ja.*,
        j.title AS job_title,
        j.department_id,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS applicant_employee_name
    FROM job_applications ja
    INNER JOIN jobs j
        ON j.job_id = ja.job_id
    LEFT JOIN employees e
        ON e.employee_id = ja.applicant_employee_id
    WHERE
        (p_job_id IS NULL OR ja.job_id = p_job_id)
        AND (p_status IS NULL OR ja.status = p_status)
        AND (
            p_search IS NULL
            OR p_search = ''
            OR ja.applicant_name LIKE CONCAT('%', p_search, '%')
            OR ja.email LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY ja.applied_on DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM job_applications ja
    WHERE
        (p_job_id IS NULL OR ja.job_id = p_job_id)
        AND (p_status IS NULL OR ja.status = p_status)
        AND (
            p_search IS NULL
            OR p_search = ''
            OR ja.applicant_name LIKE CONCAT('%', p_search, '%')
            OR ja.email LIKE CONCAT('%', p_search, '%')
        );
END $$
DROP PROCEDURE IF EXISTS sp_assign_manager $$
CREATE PROCEDURE `sp_assign_manager`(
    IN p_employee_id INT,
    IN p_new_manager_id INT,
    IN p_changed_by INT,
    IN p_reason TEXT
)
main_block: BEGIN
    DECLARE v_old_manager INT DEFAULT NULL;
    DECLARE v_employee_exists INT DEFAULT 0;
    SELECT COUNT(*)
    INTO v_employee_exists
    FROM employees
    WHERE employee_id = p_employee_id;
    IF v_employee_exists = 0 THEN
        LEAVE main_block;
    END IF;
    SELECT reporting_to
    INTO v_old_manager
    FROM employees
    WHERE employee_id = p_employee_id
    LIMIT 1;
    UPDATE employees
    SET reporting_to = p_new_manager_id
    WHERE employee_id = p_employee_id;
    INSERT INTO reporting_history (
        employee_id,
        old_manager_id,
        new_manager_id,
        changed_by,
        reason,
        change_type
    )
    VALUES (
        p_employee_id,
        v_old_manager,
        p_new_manager_id,
        p_changed_by,
        p_reason,
        'assign'
    );
END main_block $$
DROP PROCEDURE IF EXISTS sp_bulk_assign_manager $$
CREATE PROCEDURE `sp_bulk_assign_manager`(
    IN p_employee_id INT,
    IN p_new_manager_id INT,
    IN p_changed_by INT,
    IN p_reason TEXT
)
main_block: BEGIN
    DECLARE v_old_manager INT DEFAULT NULL;
    DECLARE v_employee_exists INT DEFAULT 0;
    SELECT COUNT(*)
    INTO v_employee_exists
    FROM employees
    WHERE employee_id = p_employee_id;
    IF v_employee_exists = 0 THEN
        LEAVE main_block;
    END IF;
    SELECT reporting_to
    INTO v_old_manager
    FROM employees
    WHERE employee_id = p_employee_id
    LIMIT 1;
    UPDATE employees
    SET reporting_to = p_new_manager_id
    WHERE employee_id = p_employee_id;
    INSERT INTO reporting_history (
        employee_id,
        old_manager_id,
        new_manager_id,
        changed_by,
        reason,
        change_type
    )
    VALUES (
        p_employee_id,
        v_old_manager,
        p_new_manager_id,
        p_changed_by,
        p_reason,
        'bulk_transfer'
    );
END main_block $$
DROP PROCEDURE IF EXISTS sp_list_referrals $$
CREATE PROCEDURE `sp_list_referrals`(
    IN p_referred_by INT,
    IN p_job_id INT,
    IN p_status VARCHAR(30),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        r.*,
        j.title AS job_title,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS referred_by_name
    FROM referrals r
    INNER JOIN jobs j
        ON j.job_id = r.job_id
    INNER JOIN employees e
        ON e.employee_id = r.referred_by
    WHERE
        (p_referred_by IS NULL OR r.referred_by = p_referred_by)
        AND (p_job_id IS NULL OR r.job_id = p_job_id)
        AND (p_status IS NULL OR r.status = p_status)
    ORDER BY r.referred_on DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM referrals r
    WHERE
        (p_referred_by IS NULL OR r.referred_by = p_referred_by)
        AND (p_job_id IS NULL OR r.job_id = p_job_id)
        AND (p_status IS NULL OR r.status = p_status);
END $$
DROP PROCEDURE IF EXISTS sp_list_request_hub $$
CREATE PROCEDURE `sp_list_request_hub`(
    IN p_employee_id INT,
    IN p_status VARCHAR(20),
    IN p_request_type VARCHAR(50),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        rh.*,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS employee_name,
        e.emp_code,
        CONCAT(
            rv.first_name,
            ' ',
            IFNULL(rv.last_name, '')
        ) AS reviewer_name
    FROM request_hub rh
    INNER JOIN employees e
        ON e.employee_id = rh.employee_id
    LEFT JOIN employees rv
        ON rv.employee_id = rh.reviewed_by
    WHERE
        (p_employee_id IS NULL OR rh.employee_id = p_employee_id)
        AND (p_status IS NULL OR rh.status = p_status)
        AND (
            p_request_type IS NULL
            OR rh.request_type = p_request_type
        )
    ORDER BY rh.created_at DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM request_hub rh
    WHERE
        (p_employee_id IS NULL OR rh.employee_id = p_employee_id)
        AND (p_status IS NULL OR rh.status = p_status)
        AND (
            p_request_type IS NULL
            OR rh.request_type = p_request_type
        );
END $$
DROP PROCEDURE IF EXISTS sp_list_reviews $$
CREATE PROCEDURE `sp_list_reviews`(
    IN p_employee_id INT,
    IN p_reviewer_id INT,
    IN p_status VARCHAR(30),
    IN p_review_type_id INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        r.*,
        rt.name AS review_type_name,
        rt.frequency,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS employee_name,
        e.emp_code,
        CONCAT(
            rv.first_name,
            ' ',
            IFNULL(rv.last_name, '')
        ) AS reviewer_name
    FROM reviews r
    INNER JOIN review_types rt
        ON rt.review_type_id = r.review_type_id
    INNER JOIN employees e
        ON e.employee_id = r.employee_id
    LEFT JOIN employees rv
        ON rv.employee_id = r.reviewer_id
    WHERE
        (p_employee_id IS NULL OR r.employee_id = p_employee_id)
        AND (p_reviewer_id IS NULL OR r.reviewer_id = p_reviewer_id)
        AND (p_status IS NULL OR r.status = p_status)
        AND (
            p_review_type_id IS NULL
            OR r.review_type_id = p_review_type_id
        )
    ORDER BY r.due_date DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM reviews r
    WHERE
        (p_employee_id IS NULL OR r.employee_id = p_employee_id)
        AND (p_reviewer_id IS NULL OR r.reviewer_id = p_reviewer_id)
        AND (p_status IS NULL OR r.status = p_status)
        AND (
            p_review_type_id IS NULL
            OR r.review_type_id = p_review_type_id
        );
END $$
DROP PROCEDURE IF EXISTS sp_list_teams $$
CREATE PROCEDURE `sp_list_teams`(
    IN p_department_id INT,
    IN p_search VARCHAR(100),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        t.*,
        d.department_name,
        CONCAT(
            le.first_name,
            ' ',
            IFNULL(le.last_name, '')
        ) AS lead_name,
        (
            SELECT COUNT(*)
            FROM team_members tm
            WHERE tm.team_id = t.team_id
        ) AS member_count
    FROM teams t
    LEFT JOIN departments d
        ON d.department_id = t.department_id
    LEFT JOIN employees le
        ON le.employee_id = t.lead_employee_id
    WHERE
        (
            p_department_id IS NULL
            OR t.department_id = p_department_id
        )
        AND (
            p_search IS NULL
            OR p_search = ''
            OR t.team_name LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY t.team_name ASC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM teams t
    WHERE
        (
            p_department_id IS NULL
            OR t.department_id = p_department_id
        )
        AND (
            p_search IS NULL
            OR p_search = ''
            OR t.team_name LIKE CONCAT('%', p_search, '%')
        );
END $$
DROP PROCEDURE IF EXISTS sp_admin_timesheet_counts $$
CREATE PROCEDURE `sp_admin_timesheet_counts`()
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
DROP PROCEDURE IF EXISTS sp_review_timesheet $$
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
DROP PROCEDURE IF EXISTS sp_list_workflow_delegates $$
CREATE PROCEDURE `sp_list_workflow_delegates`(
    IN p_employee_id INT,
    IN p_status VARCHAR(20),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        wd.*,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS employee_name,
        CONCAT(
            d.first_name,
            ' ',
            IFNULL(d.last_name, '')
        ) AS delegate_name
    FROM workflow_delegates wd
    INNER JOIN employees e
        ON e.employee_id = wd.employee_id
    INNER JOIN employees d
        ON d.employee_id = wd.delegate_employee_id
    WHERE
        (
            p_employee_id IS NULL
            OR wd.employee_id = p_employee_id
            OR wd.delegate_employee_id = p_employee_id
        )
        AND (p_status IS NULL OR wd.status = p_status)
    ORDER BY wd.created_at DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM workflow_delegates wd
    WHERE
        (
            p_employee_id IS NULL
            OR wd.employee_id = p_employee_id
            OR wd.delegate_employee_id = p_employee_id
        )
        AND (p_status IS NULL OR wd.status = p_status);
END $$
DROP PROCEDURE IF EXISTS sp_list_salary_structures $$
CREATE PROCEDURE `sp_list_salary_structures`()
BEGIN
  SELECT s.*,
         COUNT(l.line_id) AS component_count
    FROM salary_structures s
    LEFT JOIN salary_structure_lines l ON l.structure_id = s.structure_id AND l.is_active = 1
   WHERE s.is_active = 1
   GROUP BY s.structure_id
   ORDER BY s.is_default DESC, s.structure_name;
END $$
DROP PROCEDURE IF EXISTS sp_rec_get_recruiter_team_lead $$
CREATE PROCEDURE `sp_rec_get_recruiter_team_lead`(
    IN p_recruiter_id INT
)
BEGIN
    SELECT
        tl.email AS tl_email,
        CONCAT(
            tl.first_name,
            ' ',
            IFNULL(tl.last_name, '')
        ) AS tl_name,
        CONCAT(
            r.first_name,
            ' ',
            IFNULL(r.last_name, '')
        ) AS recruiter_name
    FROM employees r
    LEFT JOIN employees tl
        ON tl.employee_id = r.reporting_to
    WHERE r.employee_id = p_recruiter_id
    LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_get_employee_id_by_code $$
CREATE PROCEDURE `sp_joining_get_employee_id_by_code`(
    IN p_emp_code VARCHAR(100)
)
BEGIN
    SELECT employee_id
    FROM employees
    WHERE emp_code = p_emp_code
    LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_get_my_documents $$
CREATE PROCEDURE `sp_joining_get_my_documents`(
    IN p_employee_id INT
)
BEGIN
    SELECT
        jf.aadhar_doc_url,
        jf.pan_doc_url,
        jf.handbook_acknowledged,
        jf.privacy_policy_accepted,
        jf.status,
        jf.reviewed_at,
        COALESCE(
            jf.full_name,
            ji.candidate_name
        ) AS candidate_name
    FROM joining_formalities jf
    INNER JOIN joining_invitations ji
        ON ji.id = jf.invitation_id
    INNER JOIN employees e
        ON e.employee_id = jf.admin_employee_id
    WHERE e.employee_id = p_employee_id
    ORDER BY jf.updated_at DESC
    LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_sync_identity_documents $$
CREATE PROCEDURE `sp_joining_sync_identity_documents`(
    IN p_employee_id INT,
    IN p_uploaded_by INT,
    IN p_aadhar_doc_url TEXT,
    IN p_pan_doc_url TEXT
)
BEGIN
    DECLARE v_category_id INT DEFAULT NULL;
    SELECT category_id
    INTO v_category_id
    FROM document_categories
    WHERE category_name = 'Identity Documents'
    LIMIT 1;
    IF v_category_id IS NULL THEN
        INSERT INTO document_categories (
            category_name
        )
        VALUES (
            'Identity Documents'
        );
        SET v_category_id = LAST_INSERT_ID();
    END IF;
    IF p_aadhar_doc_url IS NOT NULL
       AND TRIM(p_aadhar_doc_url) <> '' THEN
        INSERT INTO documents (
            title,
            category_id,
            file_type,
            file_size,
            file_url,
            visibility,
            employee_id,
            uploaded_by
        )
        VALUES (
            'Aadhaar Card',
            v_category_id,
            UPPER(
                SUBSTRING_INDEX(
                    p_aadhar_doc_url,
                    '.',
                    -1
                )
            ),
            0,
            p_aadhar_doc_url,
            'employee',
            p_employee_id,
            p_uploaded_by
        )
        ON DUPLICATE KEY UPDATE
            file_url = VALUES(file_url);
    END IF;
    IF p_pan_doc_url IS NOT NULL
       AND TRIM(p_pan_doc_url) <> '' THEN
        INSERT INTO documents (
            title,
            category_id,
            file_type,
            file_size,
            file_url,
            visibility,
            employee_id,
            uploaded_by
        )
        VALUES (
            'PAN Card',
            v_category_id,
            UPPER(
                SUBSTRING_INDEX(
                    p_pan_doc_url,
                    '.',
                    -1
                )
            ),
            0,
            p_pan_doc_url,
            'employee',
            p_employee_id,
            p_uploaded_by
        )
        ON DUPLICATE KEY UPDATE
            file_url = VALUES(file_url);
    END IF;
    SELECT v_category_id AS category_id;
END $$
DROP PROCEDURE IF EXISTS sp_joining_update_formality_documents $$
CREATE PROCEDURE `sp_joining_update_formality_documents`(
    IN p_invitation_id INT,
    IN p_aadhar_doc_url TEXT,
    IN p_pan_doc_url TEXT
)
BEGIN
    UPDATE joining_formalities
    SET
        aadhar_doc_url = COALESCE(
            NULLIF(p_aadhar_doc_url, ''),
            aadhar_doc_url
        ),
        pan_doc_url = COALESCE(
            NULLIF(p_pan_doc_url, ''),
            pan_doc_url
        )
    WHERE invitation_id = p_invitation_id;
    SELECT
        aadhar_doc_url,
        pan_doc_url
    FROM joining_formalities
    WHERE invitation_id = p_invitation_id
    LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_employee_team $$
CREATE PROCEDURE `sp_get_employee_team`(
    IN p_employee_id INT
)
BEGIN
    SELECT
        e.*,
        d.department_name,
        ds.designation_name,
        CONCAT(
            m.first_name,
            ' ',
            IFNULL(m.last_name, '')
        ) AS reporting_to_name,
        m.emp_code AS reporting_to_code
    FROM employees e
    LEFT JOIN departments d
        ON d.department_id = e.department_id
    LEFT JOIN designations ds
        ON ds.designation_id = e.designation_id
    LEFT JOIN employees m
        ON m.employee_id = e.reporting_to
    WHERE e.employee_id = p_employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_break_start $$
CREATE PROCEDURE `sp_break_start`(
    IN p_employee_id INT,
    IN p_date DATE,
    IN p_time TIME,
    IN p_lat DECIMAL(10,6),
    IN p_lng DECIMAL(10,6),
    IN p_location VARCHAR(200)
)
BEGIN
    DECLARE v_check_in TIME DEFAULT NULL;
    DECLARE v_last_type VARCHAR(10) DEFAULT NULL;
    SELECT check_in
    INTO v_check_in
    FROM attendance
    WHERE
        employee_id = p_employee_id
        AND attendance_date = p_date
    LIMIT 1;
    IF v_check_in IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'You must check in before starting a break';
    END IF;
    SELECT punch_type
    INTO v_last_type
    FROM attendance_punches
    WHERE
        employee_id = p_employee_id
        AND attendance_date = p_date
    ORDER BY
        punch_time DESC,
        punch_id DESC
    LIMIT 1;
    IF v_last_type = 'OUT' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'You are already on a break';
    END IF;
    INSERT INTO attendance_punches (
        employee_id,
        attendance_date,
        punch_time,
        punch_type,
        source,
        lat,
        lng,
        location
    )
    VALUES (
        p_employee_id,
        p_date,
        p_time,
        'OUT',
        'web',
        p_lat,
        p_lng,
        p_location
    );
    UPDATE attendance
    SET total_punches = COALESCE(total_punches, 0) + 1
    WHERE
        employee_id = p_employee_id
        AND attendance_date = p_date;
END $$
DROP PROCEDURE IF EXISTS sp_break_end $$
CREATE PROCEDURE `sp_break_end`(
    IN p_employee_id INT,
    IN p_date DATE,
    IN p_time TIME,
    IN p_lat DECIMAL(10,6),
    IN p_lng DECIMAL(10,6),
    IN p_location VARCHAR(200)
)
BEGIN
    DECLARE v_last_type VARCHAR(10) DEFAULT NULL;
    DECLARE v_last_time TIME DEFAULT NULL;
    DECLARE v_break_minutes DECIMAL(10,2) DEFAULT 0;
    SELECT
        punch_type,
        punch_time
    INTO
        v_last_type,
        v_last_time
    FROM attendance_punches
    WHERE
        employee_id = p_employee_id
        AND attendance_date = p_date
    ORDER BY
        punch_time DESC,
        punch_id DESC
    LIMIT 1;
    IF v_last_type IS NULL
       OR v_last_type <> 'OUT' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'You are not currently on a break';
    END IF;
    SET v_break_minutes =
        GREATEST(
            0,
            TIME_TO_SEC(
                TIMEDIFF(p_time, v_last_time)
            ) / 60
        );
    INSERT INTO attendance_punches (
        employee_id,
        attendance_date,
        punch_time,
        punch_type,
        source,
        lat,
        lng,
        location
    )
    VALUES (
        p_employee_id,
        p_date,
        p_time,
        'IN',
        'web',
        p_lat,
        p_lng,
        p_location
    );
    UPDATE attendance
    SET
        total_punches =
            COALESCE(total_punches, 0) + 1,
        break_minutes =
            COALESCE(break_minutes, 0) + v_break_minutes
    WHERE
        employee_id = p_employee_id
        AND attendance_date = p_date;
END $$
DELIMITER ;
