-- Migration 044: Expand joining_formalities table with all new fields

ALTER TABLE joining_formalities
  ADD COLUMN IF NOT EXISTS actual_dob                        DATE         NULL,
  ADD COLUMN IF NOT EXISTS pan_no                            VARCHAR(20)  NULL,
  ADD COLUMN IF NOT EXISTS father_name                       VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS marital_status                    VARCHAR(30)  NULL,
  ADD COLUMN IF NOT EXISTS spouse_name                       VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS present_address                   TEXT         NULL,
  ADD COLUMN IF NOT EXISTS joining_date_text                 DATE         NULL,
  ADD COLUMN IF NOT EXISTS designation_text                  VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS photo_url                         LONGTEXT     NULL,
  ADD COLUMN IF NOT EXISTS signature_url                     LONGTEXT     NULL,
  ADD COLUMN IF NOT EXISTS education_json                    LONGTEXT     NULL,
  ADD COLUMN IF NOT EXISTS references_json                   LONGTEXT     NULL,
  ADD COLUMN IF NOT EXISTS branch_details                    VARCHAR(255) NULL,
  -- Term Life
  ADD COLUMN IF NOT EXISTS tl_employee_name                  VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS tl_father_or_husband_name         VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS tl_date_of_birth                  DATE         NULL,
  ADD COLUMN IF NOT EXISTS tl_sex                            VARCHAR(10)  NULL,
  ADD COLUMN IF NOT EXISTS tl_employee_id                    VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS tl_address                        TEXT         NULL,
  ADD COLUMN IF NOT EXISTS term_life_nominees_json           LONGTEXT     NULL,
  ADD COLUMN IF NOT EXISTS tl_declaration_employee_name      VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS tl_declaration_date               DATE         NULL,
  ADD COLUMN IF NOT EXISTS tl_place                          VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS tl_signature                      VARCHAR(255) NULL,
  -- Gratuity
  ADD COLUMN IF NOT EXISTS gratuity_employee_intro_name      TEXT         NULL,
  ADD COLUMN IF NOT EXISTS gratuity_sex                      VARCHAR(10)  NULL,
  ADD COLUMN IF NOT EXISTS gratuity_religion                 VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS gratuity_marital_status           VARCHAR(30)  NULL,
  ADD COLUMN IF NOT EXISTS gratuity_department_branch_section VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS gratuity_employee_id              VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS gratuity_date_of_joining          DATE         NULL,
  ADD COLUMN IF NOT EXISTS gratuity_permanent_address        TEXT         NULL,
  ADD COLUMN IF NOT EXISTS gratuity_nominees_json            LONGTEXT     NULL,
  ADD COLUMN IF NOT EXISTS gratuity_witnesses_json           LONGTEXT     NULL,
  ADD COLUMN IF NOT EXISTS gratuity_place                    VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS gratuity_date                     DATE         NULL,
  ADD COLUMN IF NOT EXISTS gratuity_employee_signature       VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS gratuity_employee_statement_name  TEXT         NULL,
  -- Insurance
  ADD COLUMN IF NOT EXISTS ins_employee_name                 VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS ins_father_or_husband_name        VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS ins_date_of_birth                 DATE         NULL,
  ADD COLUMN IF NOT EXISTS ins_sex                           VARCHAR(10)  NULL,
  ADD COLUMN IF NOT EXISTS ins_employee_id                   VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS ins_address                       TEXT         NULL,
  ADD COLUMN IF NOT EXISTS ins_nominees_json                 LONGTEXT     NULL,
  ADD COLUMN IF NOT EXISTS ins_declaration_employee_name     VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS ins_declaration_date              DATE         NULL,
  ADD COLUMN IF NOT EXISTS ins_signature                     VARCHAR(255) NULL,
  -- PF
  ADD COLUMN IF NOT EXISTS pf_employee_name                  VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS pf_date_of_birth                  DATE         NULL,
  ADD COLUMN IF NOT EXISTS pf_father_or_spouse_name          VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS pf_relation_type                  VARCHAR(20)  NULL,
  ADD COLUMN IF NOT EXISTS pf_gender                         VARCHAR(10)  NULL,
  ADD COLUMN IF NOT EXISTS pf_marital_status                 VARCHAR(30)  NULL,
  ADD COLUMN IF NOT EXISTS pf_email                          VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS pf_mobile_no                      VARCHAR(20)  NULL,
  ADD COLUMN IF NOT EXISTS pf_epf_1952                       VARCHAR(5)   NULL,
  ADD COLUMN IF NOT EXISTS pf_eps_1995                       VARCHAR(5)   NULL,
  ADD COLUMN IF NOT EXISTS pf_uan                            VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS pf_previous_pf                    VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS pf_exit_previous_employment       DATE         NULL,
  ADD COLUMN IF NOT EXISTS pf_scheme_certificate_no          VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS pf_ppo                            VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS pf_international_worker           VARCHAR(5)   NULL,
  ADD COLUMN IF NOT EXISTS pf_country_origin                 VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS pf_passport_no                    VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS pf_passport_validity              DATE         NULL,
  ADD COLUMN IF NOT EXISTS pf_educational_qualification      VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS pf_specially_abled                VARCHAR(5)   NULL,
  ADD COLUMN IF NOT EXISTS pf_disability_category            VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS pf_bank_acc_no                    VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS pf_ifsc_code                      VARCHAR(20)  NULL,
  ADD COLUMN IF NOT EXISTS pf_aadhar_no                      VARCHAR(20)  NULL,
  ADD COLUMN IF NOT EXISTS pf_do_have_pan                    VARCHAR(5)   NULL,
  ADD COLUMN IF NOT EXISTS pf_pan                            VARCHAR(20)  NULL,
  ADD COLUMN IF NOT EXISTS pf_place                          VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS pf_declaration_accepted           TINYINT(1)   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pf_employee_signature             VARCHAR(255) NULL,
  -- Admin fields
  ADD COLUMN IF NOT EXISTS admin_employee_id                 VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS admin_designation                 VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS admin_reporting_to                VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS admin_department                  VARCHAR(255) NULL;

-- ── Recreate sp_joining_save_formalities ──────────────────────────────────
DROP PROCEDURE IF EXISTS sp_joining_save_formalities;

DELIMITER $$
CREATE PROCEDURE sp_joining_save_formalities(
  IN p_invitation_id  INT,
  IN p_candidate_id   INT,
  IN p_status         VARCHAR(30),
  IN p_handbook_ack   TINYINT,
  IN p_hr_policy_ack  TINYINT,
  -- Personal
  IN p_full_name           VARCHAR(255),
  IN p_dob                 DATE,
  IN p_actual_dob          DATE,
  IN p_pan_no              VARCHAR(20),
  IN p_father_name         VARCHAR(255),
  IN p_marital_status      VARCHAR(30),
  IN p_spouse_name         VARCHAR(255),
  IN p_present_address     TEXT,
  IN p_permanent_address   TEXT,
  IN p_photo_url           LONGTEXT,
  IN p_signature_url       LONGTEXT,
  IN p_education_json      LONGTEXT,
  IN p_references_json     LONGTEXT,
  IN p_joining_date_text   DATE,
  IN p_designation_text    VARCHAR(255),
  -- Bank
  IN p_bank_name           VARCHAR(100),
  IN p_account_holder_name VARCHAR(255),
  IN p_account_number      VARCHAR(50),
  IN p_ifsc_code           VARCHAR(20),
  IN p_branch_details      VARCHAR(255),
  -- Term Life
  IN p_tl_employee_name              VARCHAR(255),
  IN p_tl_father_or_husband_name     VARCHAR(255),
  IN p_tl_date_of_birth              DATE,
  IN p_tl_sex                        VARCHAR(10),
  IN p_tl_employee_id                VARCHAR(50),
  IN p_tl_address                    TEXT,
  IN p_term_life_nominees_json       LONGTEXT,
  IN p_tl_declaration_employee_name  VARCHAR(255),
  IN p_tl_declaration_date           DATE,
  IN p_tl_place                      VARCHAR(255),
  IN p_tl_signature                  VARCHAR(255),
  -- Gratuity
  IN p_gratuity_employee_intro_name       TEXT,
  IN p_gratuity_sex                       VARCHAR(10),
  IN p_gratuity_religion                  VARCHAR(100),
  IN p_gratuity_marital_status            VARCHAR(30),
  IN p_gratuity_department_branch_section VARCHAR(255),
  IN p_gratuity_employee_id              VARCHAR(50),
  IN p_gratuity_date_of_joining          DATE,
  IN p_gratuity_permanent_address        TEXT,
  IN p_gratuity_nominees_json            LONGTEXT,
  IN p_gratuity_witnesses_json           LONGTEXT,
  IN p_gratuity_place                    VARCHAR(255),
  IN p_gratuity_date                     DATE,
  IN p_gratuity_employee_signature       VARCHAR(255),
  IN p_gratuity_employee_statement_name  TEXT,
  -- Insurance
  IN p_ins_employee_name             VARCHAR(255),
  IN p_ins_father_or_husband_name    VARCHAR(255),
  IN p_ins_date_of_birth             DATE,
  IN p_ins_sex                       VARCHAR(10),
  IN p_ins_employee_id               VARCHAR(50),
  IN p_ins_address                   TEXT,
  IN p_ins_nominees_json             LONGTEXT,
  IN p_ins_declaration_employee_name VARCHAR(255),
  IN p_ins_declaration_date          DATE,
  IN p_ins_signature                 VARCHAR(255),
  -- PF
  IN p_pf_employee_name              VARCHAR(255),
  IN p_pf_date_of_birth              DATE,
  IN p_pf_father_or_spouse_name      VARCHAR(255),
  IN p_pf_relation_type              VARCHAR(20),
  IN p_pf_gender                     VARCHAR(10),
  IN p_pf_marital_status             VARCHAR(30),
  IN p_pf_email                      VARCHAR(255),
  IN p_pf_mobile_no                  VARCHAR(20),
  IN p_pf_epf_1952                   VARCHAR(5),
  IN p_pf_eps_1995                   VARCHAR(5),
  IN p_pf_uan                        VARCHAR(50),
  IN p_pf_previous_pf                VARCHAR(50),
  IN p_pf_international_worker       VARCHAR(5),
  IN p_pf_educational_qualification  VARCHAR(100),
  IN p_pf_specially_abled            VARCHAR(5),
  IN p_pf_disability_category        VARCHAR(100),
  IN p_pf_bank_acc_no                VARCHAR(50),
  IN p_pf_ifsc_code                  VARCHAR(20),
  IN p_pf_aadhar_no                  VARCHAR(20),
  IN p_pf_do_have_pan                VARCHAR(5),
  IN p_pf_pan                        VARCHAR(20),
  IN p_pf_place                      VARCHAR(255),
  IN p_pf_declaration_accepted       TINYINT,
  IN p_pf_employee_signature         VARCHAR(255)
)
BEGIN
  IF EXISTS (SELECT 1 FROM joining_formalities WHERE invitation_id = p_invitation_id) THEN
    UPDATE joining_formalities SET
      status = p_status, handbook_acknowledged = p_handbook_ack, privacy_policy_accepted = p_hr_policy_ack,
      full_name = p_full_name, dob = p_dob, actual_dob = p_actual_dob, pan_no = p_pan_no,
      father_name = p_father_name, marital_status = p_marital_status, spouse_name = p_spouse_name,
      present_address = p_present_address, permanent_address = p_permanent_address,
      photo_url = p_photo_url, signature_url = p_signature_url,
      education_json = p_education_json, references_json = p_references_json,
      joining_date_text = p_joining_date_text, designation_text = p_designation_text,
      bank_name = p_bank_name, account_holder_name = p_account_holder_name,
      account_number = p_account_number, ifsc_code = p_ifsc_code, branch_details = p_branch_details,
      tl_employee_name = p_tl_employee_name, tl_father_or_husband_name = p_tl_father_or_husband_name,
      tl_date_of_birth = p_tl_date_of_birth, tl_sex = p_tl_sex, tl_employee_id = p_tl_employee_id,
      tl_address = p_tl_address, term_life_nominees_json = p_term_life_nominees_json,
      tl_declaration_employee_name = p_tl_declaration_employee_name, tl_declaration_date = p_tl_declaration_date,
      tl_place = p_tl_place, tl_signature = p_tl_signature,
      gratuity_employee_intro_name = p_gratuity_employee_intro_name, gratuity_sex = p_gratuity_sex,
      gratuity_religion = p_gratuity_religion, gratuity_marital_status = p_gratuity_marital_status,
      gratuity_department_branch_section = p_gratuity_department_branch_section,
      gratuity_employee_id = p_gratuity_employee_id, gratuity_date_of_joining = p_gratuity_date_of_joining,
      gratuity_permanent_address = p_gratuity_permanent_address, gratuity_nominees_json = p_gratuity_nominees_json,
      gratuity_witnesses_json = p_gratuity_witnesses_json, gratuity_place = p_gratuity_place,
      gratuity_date = p_gratuity_date, gratuity_employee_signature = p_gratuity_employee_signature,
      gratuity_employee_statement_name = p_gratuity_employee_statement_name,
      ins_employee_name = p_ins_employee_name, ins_father_or_husband_name = p_ins_father_or_husband_name,
      ins_date_of_birth = p_ins_date_of_birth, ins_sex = p_ins_sex, ins_employee_id = p_ins_employee_id,
      ins_address = p_ins_address, ins_nominees_json = p_ins_nominees_json,
      ins_declaration_employee_name = p_ins_declaration_employee_name, ins_declaration_date = p_ins_declaration_date,
      ins_signature = p_ins_signature,
      pf_employee_name = p_pf_employee_name, pf_date_of_birth = p_pf_date_of_birth,
      pf_father_or_spouse_name = p_pf_father_or_spouse_name, pf_relation_type = p_pf_relation_type,
      pf_gender = p_pf_gender, pf_marital_status = p_pf_marital_status,
      pf_email = p_pf_email, pf_mobile_no = p_pf_mobile_no,
      pf_epf_1952 = p_pf_epf_1952, pf_eps_1995 = p_pf_eps_1995, pf_uan = p_pf_uan,
      pf_previous_pf = p_pf_previous_pf, pf_international_worker = p_pf_international_worker,
      pf_educational_qualification = p_pf_educational_qualification, pf_specially_abled = p_pf_specially_abled,
      pf_disability_category = p_pf_disability_category, pf_bank_acc_no = p_pf_bank_acc_no,
      pf_ifsc_code = p_pf_ifsc_code, pf_aadhar_no = p_pf_aadhar_no,
      pf_do_have_pan = p_pf_do_have_pan, pf_pan = p_pf_pan, pf_place = p_pf_place,
      pf_declaration_accepted = p_pf_declaration_accepted, pf_employee_signature = p_pf_employee_signature,
      submitted_at = IF(p_status='submitted' AND submitted_at IS NULL, NOW(), submitted_at),
      updated_at = NOW()
    WHERE invitation_id = p_invitation_id;
  ELSE
    INSERT INTO joining_formalities (
      invitation_id, candidate_id, status, handbook_acknowledged, privacy_policy_accepted,
      full_name, dob, actual_dob, pan_no, father_name, marital_status, spouse_name,
      present_address, permanent_address, photo_url, signature_url, education_json, references_json,
      joining_date_text, designation_text,
      bank_name, account_holder_name, account_number, ifsc_code, branch_details,
      tl_employee_name, tl_father_or_husband_name, tl_date_of_birth, tl_sex, tl_employee_id, tl_address,
      term_life_nominees_json, tl_declaration_employee_name, tl_declaration_date, tl_place, tl_signature,
      gratuity_employee_intro_name, gratuity_sex, gratuity_religion, gratuity_marital_status,
      gratuity_department_branch_section, gratuity_employee_id, gratuity_date_of_joining,
      gratuity_permanent_address, gratuity_nominees_json, gratuity_witnesses_json,
      gratuity_place, gratuity_date, gratuity_employee_signature, gratuity_employee_statement_name,
      ins_employee_name, ins_father_or_husband_name, ins_date_of_birth, ins_sex, ins_employee_id, ins_address,
      ins_nominees_json, ins_declaration_employee_name, ins_declaration_date, ins_signature,
      pf_employee_name, pf_date_of_birth, pf_father_or_spouse_name, pf_relation_type, pf_gender,
      pf_marital_status, pf_email, pf_mobile_no, pf_epf_1952, pf_eps_1995, pf_uan, pf_previous_pf,
      pf_international_worker, pf_educational_qualification, pf_specially_abled, pf_disability_category,
      pf_bank_acc_no, pf_ifsc_code, pf_aadhar_no, pf_do_have_pan, pf_pan, pf_place,
      pf_declaration_accepted, pf_employee_signature,
      submitted_at, created_at, updated_at
    ) VALUES (
      p_invitation_id, p_candidate_id, p_status, p_handbook_ack, p_hr_policy_ack,
      p_full_name, p_dob, p_actual_dob, p_pan_no, p_father_name, p_marital_status, p_spouse_name,
      p_present_address, p_permanent_address, p_photo_url, p_signature_url, p_education_json, p_references_json,
      p_joining_date_text, p_designation_text,
      p_bank_name, p_account_holder_name, p_account_number, p_ifsc_code, p_branch_details,
      p_tl_employee_name, p_tl_father_or_husband_name, p_tl_date_of_birth, p_tl_sex, p_tl_employee_id, p_tl_address,
      p_term_life_nominees_json, p_tl_declaration_employee_name, p_tl_declaration_date, p_tl_place, p_tl_signature,
      p_gratuity_employee_intro_name, p_gratuity_sex, p_gratuity_religion, p_gratuity_marital_status,
      p_gratuity_department_branch_section, p_gratuity_employee_id, p_gratuity_date_of_joining,
      p_gratuity_permanent_address, p_gratuity_nominees_json, p_gratuity_witnesses_json,
      p_gratuity_place, p_gratuity_date, p_gratuity_employee_signature, p_gratuity_employee_statement_name,
      p_ins_employee_name, p_ins_father_or_husband_name, p_ins_date_of_birth, p_ins_sex, p_ins_employee_id, p_ins_address,
      p_ins_nominees_json, p_ins_declaration_employee_name, p_ins_declaration_date, p_ins_signature,
      p_pf_employee_name, p_pf_date_of_birth, p_pf_father_or_spouse_name, p_pf_relation_type, p_pf_gender,
      p_pf_marital_status, p_pf_email, p_pf_mobile_no, p_pf_epf_1952, p_pf_eps_1995, p_pf_uan, p_pf_previous_pf,
      p_pf_international_worker, p_pf_educational_qualification, p_pf_specially_abled, p_pf_disability_category,
      p_pf_bank_acc_no, p_pf_ifsc_code, p_pf_aadhar_no, p_pf_do_have_pan, p_pf_pan, p_pf_place,
      p_pf_declaration_accepted, p_pf_employee_signature,
      IF(p_status='submitted', NOW(), NULL), NOW(), NOW()
    );
  END IF;
  SELECT * FROM joining_formalities WHERE invitation_id = p_invitation_id LIMIT 1;
END$$
DELIMITER ;

-- ── Recreate sp_joining_get_formality ────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_joining_get_formality;

DELIMITER $$
CREATE PROCEDURE sp_joining_get_formality(IN p_invitation_id INT)
BEGIN
  SELECT
    ji.id AS invitation_id, ji.candidate_id, ji.candidate_name, ji.candidate_email,
    ji.job_title, ji.expires_at, ji.status AS invitation_status,
    jf.*,
    jf.status AS formality_status
  FROM joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE ji.id = p_invitation_id
  LIMIT 1;
END$$
DELIMITER ;

-- ── sp_joining_review extended with admin fields ──────────────────────────────
DROP PROCEDURE IF EXISTS sp_joining_review;

DELIMITER $$
CREATE PROCEDURE sp_joining_review(
  IN p_invitation_id   INT,
  IN p_decision        VARCHAR(30),
  IN p_reviewed_by     INT,
  IN p_remarks         TEXT,
  IN p_changes_fields  TEXT,
  IN p_employee_id     VARCHAR(50),
  IN p_designation     VARCHAR(255),
  IN p_reporting_to    VARCHAR(255),
  IN p_department      VARCHAR(255)
)
BEGIN
  DECLARE v_jf_status VARCHAR(30);
  SET v_jf_status = CASE p_decision
    WHEN 'approve'          THEN 'approved'
    WHEN 'request_changes'  THEN 'changes_requested'
    WHEN 'reject'           THEN 'rejected'
    ELSE p_decision
  END;

  UPDATE joining_invitations SET
    status     = CASE p_decision
                   WHEN 'approve'         THEN 'approved'
                   WHEN 'request_changes' THEN 'pending_verification'
                   WHEN 'reject'          THEN 'rejected'
                   ELSE status
                 END,
    updated_at = NOW()
  WHERE id = p_invitation_id;

  UPDATE joining_formalities SET
    status               = v_jf_status,
    hr_remarks           = p_remarks,
    reviewed_by          = p_reviewed_by,
    reviewed_at          = NOW(),
    admin_employee_id    = COALESCE(p_employee_id,   admin_employee_id),
    admin_designation    = COALESCE(p_designation,   admin_designation),
    admin_reporting_to   = COALESCE(p_reporting_to,  admin_reporting_to),
    admin_department     = COALESCE(p_department,    admin_department),
    updated_at           = NOW()
  WHERE invitation_id = p_invitation_id;

  SELECT ji.*, jf.status AS formality_status, jf.hr_remarks AS review_remarks,
         jf.reviewed_at, jf.admin_employee_id, jf.admin_designation,
         jf.admin_reporting_to, jf.admin_department
  FROM joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE ji.id = p_invitation_id LIMIT 1;
END$$
DELIMITER ;

-- ── sp_joining_get_form_by_token ──────────────────────────────────────────────
-- Employee-facing: returns all saved formality columns so the UI can pre-fill
-- the form when the employee reopens after a "changes_requested" decision.
DROP PROCEDURE IF EXISTS sp_joining_get_form_by_token;

DELIMITER $$
CREATE PROCEDURE sp_joining_get_form_by_token(
  IN p_token VARCHAR(64) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT
    jf.*,
    ji.candidate_name, ji.candidate_email, ji.job_title,
    ji.expires_at, ji.status AS invitation_status,
    jf.hr_remarks
  FROM joining_invitations ji
  INNER JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE ji.token     = p_token
    AND ji.expires_at > NOW()
    AND ji.status NOT IN ('approved','rejected')
  LIMIT 1;
END$$
DELIMITER ;

-- ── Patch sp_joining_review to reset expires_at on request_changes ────────────
-- (Re-create with the fix — adds 5-day window so the new token never blocks reopen)
DROP PROCEDURE IF EXISTS sp_joining_review;

DELIMITER $$
CREATE PROCEDURE sp_joining_review(
  IN p_invitation_id   INT,
  IN p_decision        VARCHAR(30),
  IN p_reviewed_by     INT,
  IN p_remarks         TEXT,
  IN p_changes_fields  TEXT,
  IN p_employee_id     VARCHAR(50),
  IN p_designation     VARCHAR(255),
  IN p_reporting_to    VARCHAR(255),
  IN p_department      VARCHAR(255)
)
BEGIN
  DECLARE v_jf_status VARCHAR(30);
  SET v_jf_status = CASE p_decision
    WHEN 'approve'          THEN 'approved'
    WHEN 'request_changes'  THEN 'changes_requested'
    WHEN 'reject'           THEN 'rejected'
    ELSE p_decision
  END;

  UPDATE joining_invitations SET
    status = CASE p_decision
               WHEN 'approve'         THEN 'approved'
               WHEN 'request_changes' THEN 'pending_verification'
               WHEN 'reject'          THEN 'rejected'
               ELSE status
             END,
    -- Give employee a fresh 5-day window to make corrections
    expires_at = CASE p_decision
                   WHEN 'request_changes' THEN DATE_ADD(NOW(), INTERVAL 5 DAY)
                   ELSE expires_at
                 END,
    updated_at = NOW()
  WHERE id = p_invitation_id;

  UPDATE joining_formalities SET
    status               = v_jf_status,
    hr_remarks           = p_remarks,
    reviewed_by          = p_reviewed_by,
    reviewed_at          = NOW(),
    admin_employee_id    = COALESCE(p_employee_id,   admin_employee_id),
    admin_designation    = COALESCE(p_designation,   admin_designation),
    admin_reporting_to   = COALESCE(p_reporting_to,  admin_reporting_to),
    admin_department     = COALESCE(p_department,    admin_department),
    updated_at           = NOW()
  WHERE invitation_id = p_invitation_id;

  SELECT ji.*, jf.status AS formality_status, jf.hr_remarks AS review_remarks,
         jf.reviewed_at, jf.admin_employee_id, jf.admin_designation,
         jf.admin_reporting_to, jf.admin_department
  FROM joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE ji.id = p_invitation_id LIMIT 1;
END$$
DELIMITER ;

-- ── Patch sp_joining_verify_token to return hr_remarks (for changes_requested banner) ──
DROP PROCEDURE IF EXISTS sp_joining_verify_token;

DELIMITER $$
CREATE PROCEDURE sp_joining_verify_token(IN p_token VARCHAR(64) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  SELECT ji.*,
         jf.id                   AS formality_id,
         jf.status               AS formality_status,
         jf.full_name,
         jf.handbook_acknowledged,
         jf.privacy_policy_accepted,
         jf.hr_remarks
  FROM   joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE  ji.token = p_token
    AND  ji.expires_at > NOW()
    AND  ji.status NOT IN ('approved','rejected')
  LIMIT 1;
END$$
DELIMITER ;
