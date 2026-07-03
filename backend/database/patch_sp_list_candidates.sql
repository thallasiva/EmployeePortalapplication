USE hrms_db;

DROP PROCEDURE IF EXISTS sp_rec_list_candidates;

DELIMITER $$

CREATE PROCEDURE sp_rec_list_candidates(
  IN p_job_req_id   INT,
  IN p_status       VARCHAR(50),
  IN p_recruiter_id INT,
  IN p_search       VARCHAR(200),
  IN p_role_id      INT,
  IN p_rec_emp_id   INT,
  IN p_limit        INT,
  IN p_offset       INT
)
BEGIN
  SET p_limit  = COALESCE(p_limit, 20);
  SET p_offset = COALESCE(p_offset, 0);

  SELECT SQL_CALC_FOUND_ROWS
         c.candidate_id, c.candidate_code, c.job_req_id, c.name, c.email,
         c.mobile, c.gender, c.total_experience, c.relevant_experience,
         c.current_ctc, c.expected_ctc, c.notice_period_serving,
         c.last_working_day, c.skill_set, c.source, c.city, c.state,
         c.status, c.recruiter_id, c.resume_path, c.created_at, c.updated_at,
         j.title AS job_title, j.client AS job_client, j.job_req_code,
         CONCAT(re.first_name,' ',re.last_name) AS recruiter_name
  FROM   rec_candidates c
  JOIN   rec_job_requests j  ON j.job_req_id  = c.job_req_id
  JOIN   employees re        ON re.employee_id = c.recruiter_id
  WHERE  c.deleted_at IS NULL
    AND  (p_job_req_id   IS NULL OR c.job_req_id   = p_job_req_id)
    AND  (p_status       IS NULL OR c.status        = p_status)
    AND  (p_recruiter_id IS NULL OR c.recruiter_id  = p_recruiter_id)
    AND  (p_search IS NULL OR c.name  LIKE CONCAT('%',p_search,'%')
                           OR c.email LIKE CONCAT('%',p_search,'%')
                           OR c.candidate_code LIKE CONCAT('%',p_search,'%'))
    -- Recruiter sees candidates for any job they are assigned to
    AND  (
      p_role_id != 5
      OR c.recruiter_id = p_rec_emp_id
      OR EXISTS (
           SELECT 1 FROM rec_job_recruiters jr
           WHERE  jr.job_req_id = c.job_req_id
             AND  jr.recruiter_id = p_rec_emp_id
         )
    )
  ORDER BY c.created_at DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT FOUND_ROWS() AS total;
END $$

DELIMITER ;

SELECT 'sp_rec_list_candidates updated — recruiter sees all candidates for their assigned jobs' AS status;
