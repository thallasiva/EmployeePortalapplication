-- ============================================================
-- Patch: Dual feedback for interview rounds
--   External candidates: HR Manager + Recruiter both must give feedback
--   Internal candidates: HR Manager only
-- Run in MySQL Workbench against hrms_db
-- ============================================================

USE hrms_db;

-- 1. Add recruiter feedback columns to rec_interviews
ALTER TABLE rec_interviews
  ADD COLUMN recruiter_feedback_status   VARCHAR(50) NULL DEFAULT NULL,
  ADD COLUMN recruiter_feedback_comments TEXT        NULL DEFAULT NULL;

DELIMITER $$

-- 2. SP: Recruiter submits their own feedback
--    Does NOT change interview status or trigger candidate progression
DROP PROCEDURE IF EXISTS sp_rec_submit_recruiter_feedback $$
CREATE PROCEDURE sp_rec_submit_recruiter_feedback(
  IN p_interview_id         INT,
  IN p_feedback_status      VARCHAR(50),
  IN p_feedback_comments    TEXT,
  IN p_submitted_by         INT,
  IN p_ip                   VARCHAR(45)
)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rec_interviews WHERE interview_id = p_interview_id) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Interview not found';
  END IF;

  UPDATE rec_interviews
     SET recruiter_feedback_status   = p_feedback_status,
         recruiter_feedback_comments = p_feedback_comments,
         updated_at                  = NOW()
   WHERE interview_id = p_interview_id;

  CALL sp_rec_get_interview(p_interview_id);
END $$

-- 3. Update sp_rec_list_interviews to include all missing + new columns
DROP PROCEDURE IF EXISTS sp_rec_list_interviews $$
CREATE PROCEDURE sp_rec_list_interviews(
  IN p_candidate_id INT,
  IN p_job_req_id   INT,
  IN p_level        VARCHAR(30),
  IN p_status       VARCHAR(20),
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
         iv.interview_id, iv.interview_code, iv.candidate_id, iv.job_req_id,
         iv.level, iv.interview_type, iv.interview_date, iv.interview_time,
         iv.duration_minutes, iv.interviewer, iv.candidate_type,
         iv.status,
         iv.feedback_status, iv.feedback_comments, iv.shortlisted,
         iv.recruiter_feedback_status, iv.recruiter_feedback_comments,
         iv.teams_subject, iv.teams_join_url, iv.scheduled_by, iv.created_at,
         iv.teams_participants AS to_addresses,
         c.name AS candidate_name, c.email AS candidate_email,
         c.candidate_code, c.recruiter_id,
         j.title AS job_title, j.job_req_code
  FROM   rec_interviews iv
  JOIN   rec_candidates c ON c.candidate_id = iv.candidate_id
  JOIN   rec_job_requests j ON j.job_req_id = iv.job_req_id
  WHERE  (p_candidate_id IS NULL OR iv.candidate_id = p_candidate_id)
    AND  (p_job_req_id   IS NULL OR iv.job_req_id   = p_job_req_id)
    AND  (p_level        IS NULL OR iv.level         = p_level)
    AND  (p_status       IS NULL OR iv.status        = p_status)
    AND  (p_search IS NULL OR c.name LIKE CONCAT('%',p_search,'%')
                           OR iv.interview_code LIKE CONCAT('%',p_search,'%'))
    AND  (p_role_id != 5 OR c.recruiter_id = p_rec_emp_id)
  ORDER BY iv.interview_date DESC, iv.interview_time DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT FOUND_ROWS() AS total;
END $$

DELIMITER ;
