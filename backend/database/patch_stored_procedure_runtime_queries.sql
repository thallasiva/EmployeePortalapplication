-- Patch: move remaining runtime backend SQL into stored procedures.
-- Run this file once in MySQL Workbench 8 before using the updated backend.

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_check_role_permission $$
CREATE PROCEDURE sp_check_role_permission(
  IN p_role_id INT,
  IN p_module VARCHAR(100),
  IN p_action VARCHAR(100)
)
BEGIN
  SELECT COALESCE(MAX(rp.allowed), 0) AS allowed
  FROM role_permissions rp
  JOIN permissions p ON p.permission_id = rp.permission_id
  WHERE rp.role_id = p_role_id
    AND p.module = p_module
    AND p.action = p_action;
END $$

DROP PROCEDURE IF EXISTS sp_insert_salary_audit_log $$
CREATE PROCEDURE sp_insert_salary_audit_log(
  IN p_user_id INT,
  IN p_employee_id INT,
  IN p_action VARCHAR(50),
  IN p_resource VARCHAR(100),
  IN p_ip_address VARCHAR(45),
  IN p_user_agent VARCHAR(255),
  IN p_status VARCHAR(20)
)
BEGIN
  INSERT INTO salary_audit_log
    (user_id, employee_id, action, resource, ip_address, user_agent, status)
  VALUES
    (p_user_id, p_employee_id, p_action, p_resource, p_ip_address, p_user_agent, p_status);
END $$

DROP PROCEDURE IF EXISTS sp_get_leave_email_pair $$
CREATE PROCEDURE sp_get_leave_email_pair(IN p_employee_id INT)
BEGIN
  SELECT
    e.email                                              AS emp_email,
    CONCAT(e.first_name, ' ', IFNULL(e.last_name, ''))   AS emp_name,
    mgr.email                                            AS mgr_email,
    CONCAT(mgr.first_name, ' ', IFNULL(mgr.last_name, '')) AS mgr_name
  FROM employees e
  LEFT JOIN employees mgr ON mgr.employee_id = e.reporting_to
  WHERE e.employee_id = p_employee_id
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_get_employee_display_name $$
CREATE PROCEDURE sp_get_employee_display_name(IN p_employee_id INT)
BEGIN
  SELECT CONCAT(first_name, ' ', IFNULL(last_name, '')) AS name
  FROM employees
  WHERE employee_id = p_employee_id
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_change_employee_role $$
CREATE PROCEDURE sp_change_employee_role(
  IN p_employee_id INT,
  IN p_role_id INT
)
BEGIN
  DECLARE v_user_id INT DEFAULT NULL;

  SELECT user_id INTO v_user_id
  FROM users
  WHERE employee_id = p_employee_id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No user account linked to this employee';
  END IF;

  UPDATE users
  SET role_id = p_role_id
  WHERE employee_id = p_employee_id;

  SELECT 1 AS changed;
END $$

DROP PROCEDURE IF EXISTS sp_list_roles_basic $$
CREATE PROCEDURE sp_list_roles_basic()
BEGIN
  SELECT role_id, role_name, description
  FROM roles
  ORDER BY role_id;
END $$

DROP PROCEDURE IF EXISTS sp_list_employees_with_roles $$
CREATE PROCEDURE sp_list_employees_with_roles()
BEGIN
  SELECT
    e.employee_id, e.emp_code, e.first_name, e.last_name, e.email,
    e.emp_job_title, ds.designation_name,
    u.role_id, r.role_name
  FROM employees e
  LEFT JOIN users u           ON u.employee_id = e.employee_id
  LEFT JOIN roles r           ON r.role_id = u.role_id
  LEFT JOIN designations ds   ON ds.designation_id = e.designation_id
  WHERE e.employee_status = 'Active'
  ORDER BY e.first_name, e.last_name;
END $$

DROP PROCEDURE IF EXISTS sp_rec_list_active_recruiters $$
CREATE PROCEDURE sp_rec_list_active_recruiters()
BEGIN
  SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    CONCAT(e.first_name, ' ', e.last_name) AS name,
    u.email
  FROM users u
  JOIN employees e ON e.employee_id = u.employee_id
  WHERE u.role_id = 5
    AND u.status = 'Active'
    AND e.employee_status = 'Active'
  ORDER BY e.first_name;
END $$

DROP PROCEDURE IF EXISTS sp_rec_get_recruiter_notification_targets $$
CREATE PROCEDURE sp_rec_get_recruiter_notification_targets(IN p_recruiter_ids JSON)
BEGIN
  SELECT
    e.email,
    CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS name
  FROM employees e
  JOIN JSON_TABLE(
    p_recruiter_ids,
    '$[*]' COLUMNS (employee_id INT PATH '$')
  ) ids ON ids.employee_id = e.employee_id
  WHERE e.employee_status = 'Active';
END $$

DROP PROCEDURE IF EXISTS sp_rec_set_interview_join_url $$
CREATE PROCEDURE sp_rec_set_interview_join_url(
  IN p_interview_id INT,
  IN p_join_url TEXT
)
BEGIN
  UPDATE rec_interviews
  SET teams_join_url = p_join_url
  WHERE interview_id = p_interview_id;

  SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS sp_rec_get_candidate_match_inputs $$
CREATE PROCEDURE sp_rec_get_candidate_match_inputs(IN p_candidate_id INT)
BEGIN
  SELECT skill_set, relevant_experience
  FROM rec_candidates
  WHERE candidate_id = p_candidate_id;
END $$

DROP PROCEDURE IF EXISTS sp_rec_get_job_match_inputs $$
CREATE PROCEDURE sp_rec_get_job_match_inputs(IN p_job_req_id INT)
BEGIN
  SELECT title, skill_set, experience_level
  FROM rec_job_requests
  WHERE job_req_id = p_job_req_id;
END $$

DROP PROCEDURE IF EXISTS sp_rec_get_recruiter_team_lead $$
CREATE PROCEDURE sp_rec_get_recruiter_team_lead(IN p_recruiter_id INT)
BEGIN
  SELECT
    tl.email AS tl_email,
    CONCAT(tl.first_name, ' ', IFNULL(tl.last_name, '')) AS tl_name,
    CONCAT(r.first_name, ' ', IFNULL(r.last_name, '')) AS recruiter_name
  FROM employees r
  LEFT JOIN employees tl ON tl.employee_id = r.reporting_to
  WHERE r.employee_id = p_recruiter_id
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_joining_update_formality_documents $$
CREATE PROCEDURE sp_joining_update_formality_documents(
  IN p_invitation_id INT,
  IN p_aadhar_doc_url TEXT,
  IN p_pan_doc_url TEXT
)
BEGIN
  UPDATE joining_formalities
  SET aadhar_doc_url = COALESCE(p_aadhar_doc_url, aadhar_doc_url),
      pan_doc_url = COALESCE(p_pan_doc_url, pan_doc_url)
  WHERE invitation_id = p_invitation_id;

  SELECT aadhar_doc_url, pan_doc_url
  FROM joining_formalities
  WHERE invitation_id = p_invitation_id
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_joining_get_employee_id_by_code $$
CREATE PROCEDURE sp_joining_get_employee_id_by_code(IN p_emp_code VARCHAR(100))
BEGIN
  SELECT employee_id
  FROM employees
  WHERE emp_code = p_emp_code
  LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_joining_sync_identity_documents $$
CREATE PROCEDURE sp_joining_sync_identity_documents(
  IN p_employee_id INT,
  IN p_uploaded_by INT,
  IN p_aadhar_doc_url TEXT,
  IN p_pan_doc_url TEXT
)
BEGIN
  DECLARE v_category_id INT DEFAULT NULL;

  SELECT category_id INTO v_category_id
  FROM document_categories
  WHERE category_name = 'Identity Documents'
  LIMIT 1;

  IF v_category_id IS NULL THEN
    INSERT INTO document_categories (category_name) VALUES ('Identity Documents');
    SET v_category_id = LAST_INSERT_ID();
  END IF;

  IF p_aadhar_doc_url IS NOT NULL AND p_aadhar_doc_url <> '' THEN
    INSERT INTO documents
      (title, category_id, file_type, file_size, file_url, visibility, employee_id, uploaded_by)
    VALUES
      ('Aadhaar Card', v_category_id, UPPER(SUBSTRING_INDEX(p_aadhar_doc_url, '.', -1)), '', p_aadhar_doc_url, 'employee', p_employee_id, p_uploaded_by)
    ON DUPLICATE KEY UPDATE file_url = VALUES(file_url);
  END IF;

  IF p_pan_doc_url IS NOT NULL AND p_pan_doc_url <> '' THEN
    INSERT INTO documents
      (title, category_id, file_type, file_size, file_url, visibility, employee_id, uploaded_by)
    VALUES
      ('PAN Card', v_category_id, UPPER(SUBSTRING_INDEX(p_pan_doc_url, '.', -1)), '', p_pan_doc_url, 'employee', p_employee_id, p_uploaded_by)
    ON DUPLICATE KEY UPDATE file_url = VALUES(file_url);
  END IF;

  SELECT v_category_id AS category_id;
END $$

DROP PROCEDURE IF EXISTS sp_joining_get_my_documents $$
CREATE PROCEDURE sp_joining_get_my_documents(IN p_employee_id INT)
BEGIN
  SELECT jf.aadhar_doc_url, jf.pan_doc_url,
         jf.handbook_acknowledged, jf.privacy_policy_accepted,
         jf.status, jf.reviewed_at,
         COALESCE(jf.full_name, ji.candidate_name) AS candidate_name
  FROM joining_formalities jf
  JOIN joining_invitations ji ON ji.id = jf.invitation_id
  JOIN employees e ON e.emp_code = jf.admin_employee_id
  WHERE e.employee_id = p_employee_id
  ORDER BY jf.updated_at DESC
  LIMIT 1;
END $$

DELIMITER ;
