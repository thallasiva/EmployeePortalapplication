-- =====================================================================
-- Migration 039: Resume Parser — New Tables & rec_candidates Extensions
-- =====================================================================
-- Run AFTER migration_034 (rec_candidates must exist).
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS column guards.
-- =====================================================================

USE hrms_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Extend rec_candidates with parser-enriched columns
-- ─────────────────────────────────────────────────────────────────────

-- location (free-text city/area from resume, distinct from city/state already present)
ALTER TABLE rec_candidates
  ADD COLUMN IF NOT EXISTS linkedin_url     VARCHAR(500)  NULL AFTER resume_path,
  ADD COLUMN IF NOT EXISTS github_url       VARCHAR(500)  NULL AFTER linkedin_url,
  ADD COLUMN IF NOT EXISTS notice_period    TINYINT       NULL COMMENT 'Notice period in days',
  ADD COLUMN IF NOT EXISTS resume_hash      CHAR(64)      NULL COMMENT 'SHA-256 of resume file for duplicate detection',
  ADD COLUMN IF NOT EXISTS parse_status     ENUM('pending','processing','done','failed') NOT NULL DEFAULT 'pending' COMMENT 'Resume parser job status',
  ADD COLUMN IF NOT EXISTS companies        TEXT          NULL COMMENT 'JSON array of company names extracted from resume',
  ADD COLUMN IF NOT EXISTS current_designation VARCHAR(200) NULL COMMENT 'Most recent job title from resume';

-- Index for duplicate-detection lookups
ALTER TABLE rec_candidates
  ADD INDEX IF NOT EXISTS idx_rec_cand_hash   (resume_hash),
  ADD INDEX IF NOT EXISTS idx_rec_cand_parse  (parse_status);

-- ─────────────────────────────────────────────────────────────────────
-- 2. rec_resume_parser_logs
--    One row per parse attempt (success or failure).
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rec_resume_parser_logs (
  log_id          INT           NOT NULL AUTO_INCREMENT,
  candidate_id    INT           NULL     COMMENT 'NULL before candidate is created (pre-check parse)',
  filename        VARCHAR(500)  NOT NULL,
  file_size_bytes INT           NOT NULL DEFAULT 0,
  mime_type       VARCHAR(100)  NOT NULL,
  parsed_by       ENUM('openai','regex','none') NOT NULL DEFAULT 'none',
  status          ENUM('success','failed','duplicate') NOT NULL DEFAULT 'success',
  error_message   TEXT          NULL,
  raw_text_length INT           NOT NULL DEFAULT 0  COMMENT 'Character length of extracted text',
  fields_found    JSON          NULL                COMMENT 'Object listing which fields were populated',
  duration_ms     INT           NOT NULL DEFAULT 0  COMMENT 'Time taken to parse in milliseconds',
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (log_id),
  KEY idx_rpl_candidate (candidate_id),
  KEY idx_rpl_status    (status),
  KEY idx_rpl_created   (created_at),
  CONSTRAINT fk_rpl_candidate FOREIGN KEY (candidate_id) REFERENCES rec_candidates(candidate_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- 3. rec_candidate_skills
--    Normalised skill rows per candidate (replaces skill_set text blob
--    for structured queries / search).
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rec_candidate_skills (
  skill_id      INT           NOT NULL AUTO_INCREMENT,
  candidate_id  INT           NOT NULL,
  skill_name    VARCHAR(200)  NOT NULL,
  source        ENUM('resume','manual') NOT NULL DEFAULT 'resume',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (skill_id),
  UNIQUE KEY uq_rec_cand_skill (candidate_id, skill_name),
  KEY idx_rcs_skill_name (skill_name),
  CONSTRAINT fk_rcs_candidate FOREIGN KEY (candidate_id) REFERENCES rec_candidates(candidate_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- 4. rec_candidate_education
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rec_candidate_education (
  edu_id        INT           NOT NULL AUTO_INCREMENT,
  candidate_id  INT           NOT NULL,
  degree        VARCHAR(300)  NOT NULL,
  institution   VARCHAR(300)  NULL,
  year_of_pass  SMALLINT      NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (edu_id),
  KEY idx_rce_candidate (candidate_id),
  CONSTRAINT fk_rce_candidate FOREIGN KEY (candidate_id) REFERENCES rec_candidates(candidate_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- 5. rec_candidate_experience
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rec_candidate_experience (
  exp_id        INT           NOT NULL AUTO_INCREMENT,
  candidate_id  INT           NOT NULL,
  company_name  VARCHAR(300)  NOT NULL,
  designation   VARCHAR(300)  NULL,
  start_month   TINYINT       NULL  COMMENT '1-12',
  start_year    SMALLINT      NULL,
  end_month     TINYINT       NULL  COMMENT '1-12; NULL = current',
  end_year      SMALLINT      NULL  COMMENT 'NULL = current',
  is_current    TINYINT(1)    NOT NULL DEFAULT 0,
  description   TEXT          NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (exp_id),
  KEY idx_rcex_candidate (candidate_id),
  CONSTRAINT fk_rcex_candidate FOREIGN KEY (candidate_id) REFERENCES rec_candidates(candidate_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
