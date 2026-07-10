-- ============================================================
-- Patch: sp_rec_list_candidates — add last_interview_feedback
-- Adds feedback_status of the most recent completed interview
-- so the frontend can show "Next Round" inline in the list.
-- Run: SOURCE patch_rec_list_candidates_interview_feedback.sql
-- ============================================================

DROP PROCEDURE IF EXISTS sp_rec_list_candidates $$

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
         CONCAT(re.first_name,' ',re.last_name) AS recruiter_name,
         -- feedback_status of the latest completed interview round
         (
           SELECT iv.feedback_status
           FROM   rec_interviews iv
           WHERE  iv.candidate_id = c.candidate_id
             AND  iv.status = 'Completed'
           ORDER  BY iv.interview_date DESC, iv.interview_id DESC
           LIMIT  1
         ) AS last_interview_feedback
  FROM   rec_candidates c
  JOIN   rec_job_requests j ON j.job_req_id = c.job_req_id
  JOIN   employees re ON re.employee_id = c.recruiter_id
  WHERE  c.deleted_at IS NULL
    AND  (p_job_req_id   IS NULL OR c.job_req_id   = p_job_req_id)
    AND  (p_status       IS NULL OR c.status        = p_status)
    AND  (p_recruiter_id IS NULL OR c.recruiter_id  = p_recruiter_id)
    AND  (p_search IS NULL OR c.name  LIKE CONCAT('%',p_search,'%')
                           OR c.email LIKE CONCAT('%',p_search,'%')
                           OR c.candidate_code LIKE CONCAT('%',p_search,'%'))
    -- Recruiter sees only their own candidates
    AND  (p_role_id != 5 OR c.recruiter_id = p_rec_emp_id)
  ORDER BY c.created_at DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT FOUND_ROWS() AS total;
END $$
