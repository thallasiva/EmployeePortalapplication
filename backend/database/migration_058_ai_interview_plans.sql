-- =============================================================
-- Migration 058: HR-approved AI interview plans + recruiter decision.
--   ai_interview_plans            one question set per job; DRAFT → APPROVED (older ones ARCHIVED)
--   ai_interview_plan_questions   the questions with their scoring guide (expected points)
--   ai_interview_sessions         + plan_id (which approved plan the interview used)
--                                 + recruiter decision (Shortlisted / Rejected / On Hold), separate
--                                   from the AI recommendation
-- Run with: node src/database/runSql.js migration_058_ai_interview_plans.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS ai_interview_plans (
  plan_id           INT AUTO_INCREMENT PRIMARY KEY,
  job_req_id        INT NOT NULL,
  version           INT NOT NULL DEFAULT 1,
  status            ENUM('DRAFT', 'APPROVED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  duration_minutes  SMALLINT NOT NULL DEFAULT 30,
  generated_by      ENUM('ai', 'question_bank', 'manual') NOT NULL DEFAULT 'question_bank',
  notes             VARCHAR(500) DEFAULT NULL,
  created_by        INT DEFAULT NULL,
  approved_by       INT DEFAULT NULL,
  approved_at       DATETIME DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_plan_job (job_req_id, status),
  CONSTRAINT fk_plan_job FOREIGN KEY (job_req_id) REFERENCES rec_job_requests (job_req_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_interview_plan_questions (
  question_id        INT AUTO_INCREMENT PRIMARY KEY,
  plan_id            INT NOT NULL,
  sort_order         SMALLINT NOT NULL DEFAULT 0,
  stage              VARCHAR(30) NOT NULL DEFAULT 'technical',
  question_type      VARCHAR(30) NOT NULL DEFAULT 'technical',
  skill              VARCHAR(100) DEFAULT NULL,
  difficulty         VARCHAR(20) NOT NULL DEFAULT 'intermediate',
  question_text      TEXT NOT NULL,
  expected_points    JSON DEFAULT NULL COMMENT 'scoring guide: points a strong answer covers',
  time_limit_seconds SMALLINT NOT NULL DEFAULT 180,
  KEY idx_plan_q (plan_id, sort_order),
  CONSTRAINT fk_plan_q FOREIGN KEY (plan_id) REFERENCES ai_interview_plans (plan_id) ON DELETE CASCADE
);

DROP PROCEDURE IF EXISTS tmp_058_add_columns;
DELIMITER $$
CREATE PROCEDURE tmp_058_add_columns()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'ai_interview_sessions' AND COLUMN_NAME = 'plan_id') THEN
    ALTER TABLE ai_interview_sessions
      ADD COLUMN plan_id INT NULL AFTER job_req_id,
      ADD COLUMN recruiter_decision ENUM('SHORTLISTED', 'REJECTED', 'ON_HOLD') NULL,
      ADD COLUMN decision_notes VARCHAR(1000) NULL,
      ADD COLUMN decided_by INT NULL,
      ADD COLUMN decided_at DATETIME NULL;
  END IF;
END$$
DELIMITER ;
CALL tmp_058_add_columns();
DROP PROCEDURE IF EXISTS tmp_058_add_columns;

SELECT 'migration_058_ai_interview_plans done' AS status;
