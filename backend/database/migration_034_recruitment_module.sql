-- =====================================================================
-- Migration 034: Recruitment Module — Tables, Indexes, Foreign Keys
-- =====================================================================
-- All recruitment tables are prefixed with rec_ to avoid collisions.
-- Run AFTER migration_033 (recruiter employees must exist).
-- Safe to re-run: each table uses IF NOT EXISTS.
-- =====================================================================

USE hrms_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────
-- 1. rec_job_requests
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rec_job_requests (
  job_req_id        INT            NOT NULL AUTO_INCREMENT,
  job_req_code      VARCHAR(20)    NOT NULL,
  title             VARCHAR(200)   NOT NULL,
  client            VARCHAR(200)   NOT NULL,
  company_dept      VARCHAR(200)   NOT NULL,
  bill_rate         DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  bill_currency     VARCHAR(10)    NOT NULL DEFAULT '$',
  pay_rate          DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  pay_currency      VARCHAR(10)    NOT NULL DEFAULT '$',
  position_type     ENUM('Contract','Contract to Hire','Direct Hire') NOT NULL DEFAULT 'Contract',
  vacancies         SMALLINT       NOT NULL DEFAULT 1,
  city              VARCHAR(100)   NULL,
  country           VARCHAR(100)   NULL,
  experience_level  VARCHAR(50)    NULL,
  job_status        ENUM('Active','In Active') NOT NULL DEFAULT 'Active',
  business_unit     VARCHAR(100)   NOT NULL,
  assignment_status ENUM('Open','Closed','Completed','Hold') NOT NULL DEFAULT 'Open',
  opportunity_phone VARCHAR(50)    NULL,
  skill_set         TEXT           NOT NULL,
  description       TEXT           NOT NULL,
  created_by        INT            NOT NULL,
  updated_by        INT            NULL,
  created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        TIMESTAMP      NULL,

  PRIMARY KEY (job_req_id),
  UNIQUE KEY uq_rec_job_code (job_req_code),
  KEY idx_rec_job_status    (assignment_status, job_status),
  KEY idx_rec_job_created   (created_by),
  KEY idx_rec_job_deleted   (deleted_at),
  KEY idx_rec_job_title     (title),
  CONSTRAINT fk_rec_job_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- 2. rec_job_recruiters  (many-to-many assignment)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rec_job_recruiters (
  id            INT       NOT NULL AUTO_INCREMENT,
  job_req_id    INT       NOT NULL,
  recruiter_id  INT       NOT NULL,
  assigned_by   INT       NOT NULL,
  assigned_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_rec_job_recruiter (job_req_id, recruiter_id),
  KEY idx_rec_jr_recruiter (recruiter_id),
  CONSTRAINT fk_rec_jr_job       FOREIGN KEY (job_req_id)   REFERENCES rec_job_requests(job_req_id) ON DELETE CASCADE,
  CONSTRAINT fk_rec_jr_recruiter FOREIGN KEY (recruiter_id) REFERENCES employees(employee_id),
  CONSTRAINT fk_rec_jr_assigned  FOREIGN KEY (assigned_by)  REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- 3. rec_candidates
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rec_candidates (
  candidate_id             INT             NOT NULL AUTO_INCREMENT,
  candidate_code           VARCHAR(20)     NOT NULL,
  job_req_id               INT             NOT NULL,
  name                     VARCHAR(200)    NOT NULL,
  email                    VARCHAR(200)    NOT NULL,
  mobile                   VARCHAR(20)     NOT NULL,
  gender                   ENUM('Male','Female','Other') NULL,
  total_experience         DECIMAL(5,1)    NOT NULL DEFAULT 0.0,
  relevant_experience      DECIMAL(5,1)    NOT NULL DEFAULT 0.0,
  current_ctc              DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
  expected_ctc             DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
  notice_period_serving    TINYINT(1)      NOT NULL DEFAULT 0,
  last_working_day         DATE            NULL,
  skill_set                TEXT            NOT NULL,
  source                   VARCHAR(100)    NULL,
  pin_code                 VARCHAR(10)     NULL,
  city                     VARCHAR(100)    NULL,
  state                    VARCHAR(100)    NULL,
  district                 VARCHAR(100)    NULL,
  status                   VARCHAR(50)     NOT NULL DEFAULT 'Work in Progress',
  recruiter_id             INT             NOT NULL,
  resume_path              VARCHAR(500)    NULL,
  notes                    TEXT            NULL,
  created_by               INT             NOT NULL,
  updated_by               INT             NULL,
  created_at               TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at               TIMESTAMP       NULL,

  PRIMARY KEY (candidate_id),
  UNIQUE KEY uq_rec_candidate_code (candidate_code),
  KEY idx_rec_cand_job       (job_req_id),
  KEY idx_rec_cand_recruiter (recruiter_id),
  KEY idx_rec_cand_status    (status),
  KEY idx_rec_cand_email     (email),
  KEY idx_rec_cand_deleted   (deleted_at),
  CONSTRAINT fk_rec_cand_job       FOREIGN KEY (job_req_id)   REFERENCES rec_job_requests(job_req_id),
  CONSTRAINT fk_rec_cand_recruiter FOREIGN KEY (recruiter_id) REFERENCES employees(employee_id),
  CONSTRAINT fk_rec_cand_created   FOREIGN KEY (created_by)   REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- 4. rec_interviews
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rec_interviews (
  interview_id       INT      NOT NULL AUTO_INCREMENT,
  interview_code     VARCHAR(20) NOT NULL,
  candidate_id       INT      NOT NULL,
  job_req_id         INT      NOT NULL,
  level              ENUM('Level 1','Level 2','Level 3','HR Round','Manager Round') NOT NULL DEFAULT 'Level 1',
  interview_type     ENUM('OnCall','Microsoft Teams','In Person') NOT NULL DEFAULT 'OnCall',
  interview_date     DATE     NOT NULL,
  interview_time     TIME     NOT NULL,
  interviewer        VARCHAR(200) NOT NULL,
  status             ENUM('Scheduled','Completed','Cancelled') NOT NULL DEFAULT 'Scheduled',
  teams_subject      VARCHAR(500) NULL,
  teams_participants TEXT         NULL,
  teams_start        DATETIME     NULL,
  teams_end          DATETIME     NULL,
  feedback_status    ENUM('Selected','Not Selected','Hold') NULL,
  feedback_comments  TEXT         NULL,
  shortlisted        TINYINT(1)   NOT NULL DEFAULT 0,
  scheduled_by       INT          NOT NULL,
  feedback_by        INT          NULL,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (interview_id),
  UNIQUE KEY uq_rec_interview_code (interview_code),
  KEY idx_rec_iv_candidate (candidate_id),
  KEY idx_rec_iv_job       (job_req_id),
  KEY idx_rec_iv_status    (status),
  KEY idx_rec_iv_date      (interview_date),
  KEY idx_rec_iv_scheduler (scheduled_by),
  CONSTRAINT fk_rec_iv_candidate FOREIGN KEY (candidate_id) REFERENCES rec_candidates(candidate_id),
  CONSTRAINT fk_rec_iv_job       FOREIGN KEY (job_req_id)   REFERENCES rec_job_requests(job_req_id),
  CONSTRAINT fk_rec_iv_scheduler FOREIGN KEY (scheduled_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- 5. rec_offers
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rec_offers (
  offer_id             INT           NOT NULL AUTO_INCREMENT,
  offer_code           VARCHAR(20)   NOT NULL,
  candidate_id         INT           NOT NULL,
  job_req_id           INT           NOT NULL,
  designation          VARCHAR(200)  NOT NULL,
  date_of_joining      DATE          NOT NULL,
  basic                DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  hra                  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  telephone_allowance  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  special_allowance    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  gross_salary         DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  pf_contribution      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  statutory_bonus      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  gratuity             DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  esi                  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  ctc                  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  ctc_in_words         VARCHAR(500)  NULL,
  status               ENUM('Draft','Released','Accepted','Rejected') NOT NULL DEFAULT 'Draft',
  created_by           INT           NOT NULL,
  released_at          TIMESTAMP     NULL,
  responded_at         TIMESTAMP     NULL,
  created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (offer_id),
  UNIQUE KEY uq_rec_offer_code     (offer_code),
  UNIQUE KEY uq_rec_offer_cand     (candidate_id),
  KEY idx_rec_offer_job            (job_req_id),
  KEY idx_rec_offer_status         (status),
  CONSTRAINT fk_rec_offer_cand     FOREIGN KEY (candidate_id) REFERENCES rec_candidates(candidate_id),
  CONSTRAINT fk_rec_offer_job      FOREIGN KEY (job_req_id)   REFERENCES rec_job_requests(job_req_id),
  CONSTRAINT fk_rec_offer_created  FOREIGN KEY (created_by)   REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- 6. rec_onboarding
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rec_onboarding (
  onboarding_id          INT         NOT NULL AUTO_INCREMENT,
  candidate_id           INT         NOT NULL,
  offer_id               INT         NOT NULL,
  effective_date         DATE        NOT NULL,
  current_status         VARCHAR(50) NOT NULL DEFAULT 'In Progress',
  employee_info_submitted TINYINT(1) NOT NULL DEFAULT 0,
  photo_uploaded          TINYINT(1) NOT NULL DEFAULT 0,
  joining_formalities     ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
  team_life_insurance     ENUM('Pending','Nominated','Confirmed')   NOT NULL DEFAULT 'Pending',
  gratuity_nomination     ENUM('Pending','Submitted','Approved')    NOT NULL DEFAULT 'Pending',
  insurance_nomination    ENUM('Pending','Submitted','Confirmed')   NOT NULL DEFAULT 'Pending',
  pf_declaration          ENUM('Pending','Submitted','Approved')    NOT NULL DEFAULT 'Pending',
  hr_verified             TINYINT(1) NOT NULL DEFAULT 0,
  finalized_at            TIMESTAMP  NULL,
  created_by              INT        NOT NULL,
  updated_by              INT        NULL,
  created_at              TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (onboarding_id),
  UNIQUE KEY uq_rec_onboard_cand (candidate_id),
  KEY idx_rec_onboard_offer  (offer_id),
  KEY idx_rec_onboard_status (current_status),
  CONSTRAINT fk_rec_onboard_cand    FOREIGN KEY (candidate_id) REFERENCES rec_candidates(candidate_id),
  CONSTRAINT fk_rec_onboard_offer   FOREIGN KEY (offer_id)     REFERENCES rec_offers(offer_id),
  CONSTRAINT fk_rec_onboard_created FOREIGN KEY (created_by)   REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- 7. rec_audit_log
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rec_audit_log (
  log_id        BIGINT      NOT NULL AUTO_INCREMENT,
  entity_type   VARCHAR(50) NOT NULL,
  entity_id     INT         NOT NULL,
  action        VARCHAR(50) NOT NULL,
  old_value     JSON        NULL,
  new_value     JSON        NULL,
  performed_by  INT         NOT NULL,
  performed_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address    VARCHAR(45) NULL,
  user_agent    VARCHAR(500) NULL,

  PRIMARY KEY (log_id),
  KEY idx_rec_audit_entity  (entity_type, entity_id),
  KEY idx_rec_audit_user    (performed_by),
  KEY idx_rec_audit_action  (action),
  KEY idx_rec_audit_time    (performed_at),
  CONSTRAINT fk_rec_audit_user FOREIGN KEY (performed_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 034 — recruitment tables created.' AS status;
