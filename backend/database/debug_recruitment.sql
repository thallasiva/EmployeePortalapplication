USE hrms_db;

-- What candidates exist?
SELECT candidate_id, name, job_req_id, recruiter_id, status FROM rec_candidates WHERE deleted_at IS NULL;

-- What jobs exist?
SELECT job_req_id, job_req_code, title FROM rec_job_requests WHERE deleted_at IS NULL;

-- What recruiter assignments exist?
SELECT * FROM rec_job_recruiters;

-- What recruiters (role 5) exist?
SELECT u.user_id, u.employee_id, e.first_name, e.last_name, u.email, u.role_id
FROM users u JOIN employees e ON e.employee_id = u.employee_id
WHERE u.role_id = 5;
