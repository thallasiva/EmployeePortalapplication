-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 045: AI Interview Sessions
-- Run: node src/database/runSql.js migration_045_ai_interview.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Create table
CREATE TABLE IF NOT EXISTS ai_interview_sessions (
  session_id      INT AUTO_INCREMENT PRIMARY KEY,
  token           VARCHAR(64) NOT NULL UNIQUE,
  candidate_id    INT NOT NULL,
  job_req_id      INT NOT NULL,
  recruiter_id    INT NOT NULL,
  candidate_name  VARCHAR(255) NOT NULL,
  candidate_email VARCHAR(255) NOT NULL,
  job_title       VARCHAR(255) NOT NULL,
  questions_json  LONGTEXT NOT NULL COMMENT 'JSON array of question objects',
  answers_json    LONGTEXT NULL    COMMENT 'JSON array of answer objects set on submit',
  evaluation_json LONGTEXT NULL    COMMENT 'JSON evaluation report set on submit',
  overall_score   TINYINT UNSIGNED NULL COMMENT '0 to 100',
  recommendation  ENUM('Strong Hire','Hire','Maybe','No Hire') NULL,
  status          ENUM('pending','completed','expired') NOT NULL DEFAULT 'pending',
  expires_at      DATETIME NOT NULL,
  submitted_at    DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_token     (token),
  INDEX idx_candidate (candidate_id),
  INDEX idx_recruiter (recruiter_id),
  INDEX idx_job       (job_req_id),
  INDEX idx_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP PROCEDURE IF EXISTS sp_ai_interview_create_session;

DROP PROCEDURE IF EXISTS sp_ai_interview_get_session;

DROP PROCEDURE IF EXISTS sp_ai_interview_submit;

DROP PROCEDURE IF EXISTS sp_ai_interview_list_by_recruiter;

DROP PROCEDURE IF EXISTS sp_ai_interview_get_report;

DELIMITER $$

CREATE PROCEDURE sp_ai_interview_create_session(
  IN p_token           VARCHAR(64),
  IN p_candidate_id    INT,
  IN p_job_req_id      INT,
  IN p_recruiter_id    INT,
  IN p_candidate_name  VARCHAR(255),
  IN p_candidate_email VARCHAR(255),
  IN p_job_title       VARCHAR(255),
  IN p_questions_json  LONGTEXT,
  IN p_expires_at      DATETIME
)
BEGIN
  INSERT INTO ai_interview_sessions
    (token, candidate_id, job_req_id, recruiter_id, candidate_name, candidate_email, job_title, questions_json, expires_at)
  VALUES
    (p_token, p_candidate_id, p_job_req_id, p_recruiter_id, p_candidate_name, p_candidate_email, p_job_title, p_questions_json, p_expires_at);
  SELECT LAST_INSERT_ID() AS session_id;
END$$

CREATE PROCEDURE sp_ai_interview_get_session(IN p_token VARCHAR(64))
BEGIN
  UPDATE ai_interview_sessions
    SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
  SELECT * FROM ai_interview_sessions WHERE token = p_token LIMIT 1;
END$$

CREATE PROCEDURE sp_ai_interview_submit(
  IN p_token           VARCHAR(64),
  IN p_answers_json    LONGTEXT,
  IN p_evaluation_json LONGTEXT,
  IN p_overall_score   TINYINT UNSIGNED,
  IN p_recommendation  VARCHAR(20)
)
BEGIN
  UPDATE ai_interview_sessions
  SET
    answers_json    = p_answers_json,
    evaluation_json = p_evaluation_json,
    overall_score   = p_overall_score,
    recommendation  = p_recommendation,
    status          = 'completed',
    submitted_at    = NOW()
  WHERE token = p_token AND status = 'pending';
  SELECT ROW_COUNT() AS affected;
END$$

CREATE PROCEDURE sp_ai_interview_list_by_recruiter(
  IN p_recruiter_id INT,
  IN p_limit        INT,
  IN p_offset       INT
)
BEGIN
  SELECT
    s.session_id, s.token, s.candidate_name, s.candidate_email,
    s.job_title, s.status, s.overall_score, s.recommendation,
    s.expires_at, s.submitted_at, s.created_at
  FROM ai_interview_sessions s
  WHERE s.recruiter_id = p_recruiter_id
  ORDER BY s.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END$$

CREATE PROCEDURE sp_ai_interview_get_report(IN p_session_id INT)
BEGIN
  SELECT * FROM ai_interview_sessions WHERE session_id = p_session_id LIMIT 1;
END$$

DELIMITER ;
