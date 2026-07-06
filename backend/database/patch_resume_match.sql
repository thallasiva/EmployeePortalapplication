-- ═══════════════════════════════════════════════════════════════════
-- PATCH: Resume Match / AI Resume Screening
-- Run once in MySQL Workbench / CLI
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rec_resume_matches (
  match_id        INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id    INT NOT NULL,
  job_req_id      INT NOT NULL,
  match_score     DECIMAL(5,2) NOT NULL DEFAULT 0,
  skill_score     DECIMAL(5,2) NOT NULL DEFAULT 0,
  exp_score       DECIMAL(5,2) NOT NULL DEFAULT 0,
  matched_skills  JSON,
  missing_skills  JSON,
  recommendation  VARCHAR(50),
  computed_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_match (candidate_id, job_req_id),
  FOREIGN KEY (candidate_id) REFERENCES rec_candidates(candidate_id)    ON DELETE CASCADE,
  FOREIGN KEY (job_req_id)   REFERENCES rec_job_requests(job_req_id)   ON DELETE CASCADE
);

DELIMITER $$

-- Upsert a match result (called from Node.js after computing)
DROP PROCEDURE IF EXISTS sp_rec_upsert_match $$
CREATE PROCEDURE sp_rec_upsert_match(
  IN p_candidate_id   INT,
  IN p_job_req_id     INT,
  IN p_match_score    DECIMAL(5,2),
  IN p_skill_score    DECIMAL(5,2),
  IN p_exp_score      DECIMAL(5,2),
  IN p_matched_skills JSON,
  IN p_missing_skills JSON,
  IN p_recommendation VARCHAR(50)
)
BEGIN
  INSERT INTO rec_resume_matches
    (candidate_id, job_req_id, match_score, skill_score, exp_score,
     matched_skills, missing_skills, recommendation, computed_at)
  VALUES
    (p_candidate_id, p_job_req_id, p_match_score, p_skill_score, p_exp_score,
     p_matched_skills, p_missing_skills, p_recommendation, NOW())
  ON DUPLICATE KEY UPDATE
    match_score    = p_match_score,
    skill_score    = p_skill_score,
    exp_score      = p_exp_score,
    matched_skills = p_matched_skills,
    missing_skills = p_missing_skills,
    recommendation = p_recommendation,
    computed_at    = NOW();

  SELECT m.*, c.name AS candidate_name, j.title AS job_title
  FROM   rec_resume_matches m
  JOIN   rec_candidates   c ON c.candidate_id = m.candidate_id
  JOIN   rec_job_requests j ON j.job_req_id   = m.job_req_id
  WHERE  m.candidate_id = p_candidate_id AND m.job_req_id = p_job_req_id;
END $$

-- Get single match
DROP PROCEDURE IF EXISTS sp_rec_get_match $$
CREATE PROCEDURE sp_rec_get_match(
  IN p_candidate_id INT,
  IN p_job_req_id   INT
)
BEGIN
  SELECT m.*, c.name AS candidate_name, j.title AS job_title
  FROM   rec_resume_matches m
  JOIN   rec_candidates   c ON c.candidate_id = m.candidate_id
  JOIN   rec_job_requests j ON j.job_req_id   = m.job_req_id
  WHERE  m.candidate_id = p_candidate_id AND m.job_req_id = p_job_req_id;
END $$

-- List all matches for a job, ranked by score
DROP PROCEDURE IF EXISTS sp_rec_list_matches_by_job $$
CREATE PROCEDURE sp_rec_list_matches_by_job(IN p_job_req_id INT)
BEGIN
  SELECT
    m.*,
    c.name               AS candidate_name,
    c.email              AS candidate_email,
    c.candidate_code,
    c.total_experience,
    c.relevant_experience,
    c.skill_set          AS candidate_skills,
    c.status             AS candidate_status,
    j.title              AS job_title
  FROM   rec_resume_matches m
  JOIN   rec_candidates   c ON c.candidate_id = m.candidate_id
  JOIN   rec_job_requests j ON j.job_req_id   = m.job_req_id
  WHERE  m.job_req_id = p_job_req_id
  ORDER  BY m.match_score DESC;
END $$

DELIMITER ;
