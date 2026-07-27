-- migration_044_joining_mysql.sql
-- MySQL-compatible version of migration_044 (no ADD COLUMN IF NOT EXISTS).
-- Uses information_schema checks inside a stored procedure.
-- Run AFTER patch_joining_review_fix_mysql.sql.

DROP PROCEDURE IF EXISTS _tmp_044;

DELIMITER $$
CREATE PROCEDURE _tmp_044()
BEGIN
  -- Helper macro: each block checks information_schema before altering

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='actual_dob') THEN
    ALTER TABLE joining_formalities ADD COLUMN actual_dob DATE NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pan_no') THEN
    ALTER TABLE joining_formalities ADD COLUMN pan_no VARCHAR(20) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='father_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN father_name VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='marital_status') THEN
    ALTER TABLE joining_formalities ADD COLUMN marital_status VARCHAR(30) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='spouse_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN spouse_name VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='present_address') THEN
    ALTER TABLE joining_formalities ADD COLUMN present_address TEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='joining_date_text') THEN
    ALTER TABLE joining_formalities ADD COLUMN joining_date_text DATE NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='designation_text') THEN
    ALTER TABLE joining_formalities ADD COLUMN designation_text VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='photo_url') THEN
    ALTER TABLE joining_formalities ADD COLUMN photo_url LONGTEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='signature_url') THEN
    ALTER TABLE joining_formalities ADD COLUMN signature_url LONGTEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='education_json') THEN
    ALTER TABLE joining_formalities ADD COLUMN education_json LONGTEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='references_json') THEN
    ALTER TABLE joining_formalities ADD COLUMN references_json LONGTEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='branch_details') THEN
    ALTER TABLE joining_formalities ADD COLUMN branch_details VARCHAR(255) NULL; END IF;

  -- Term Life
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='tl_employee_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN tl_employee_name VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='tl_father_or_husband_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN tl_father_or_husband_name VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='tl_date_of_birth') THEN
    ALTER TABLE joining_formalities ADD COLUMN tl_date_of_birth DATE NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='tl_sex') THEN
    ALTER TABLE joining_formalities ADD COLUMN tl_sex VARCHAR(10) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='tl_employee_id') THEN
    ALTER TABLE joining_formalities ADD COLUMN tl_employee_id VARCHAR(50) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='tl_address') THEN
    ALTER TABLE joining_formalities ADD COLUMN tl_address TEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='term_life_nominees_json') THEN
    ALTER TABLE joining_formalities ADD COLUMN term_life_nominees_json LONGTEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='tl_declaration_employee_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN tl_declaration_employee_name VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='tl_declaration_date') THEN
    ALTER TABLE joining_formalities ADD COLUMN tl_declaration_date DATE NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='tl_place') THEN
    ALTER TABLE joining_formalities ADD COLUMN tl_place VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='tl_signature') THEN
    ALTER TABLE joining_formalities ADD COLUMN tl_signature VARCHAR(255) NULL; END IF;

  -- Gratuity
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_employee_intro_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_employee_intro_name TEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_sex') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_sex VARCHAR(10) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_religion') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_religion VARCHAR(100) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_marital_status') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_marital_status VARCHAR(30) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_department_branch_section') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_department_branch_section VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_employee_id') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_employee_id VARCHAR(50) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_date_of_joining') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_date_of_joining DATE NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_permanent_address') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_permanent_address TEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_nominees_json') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_nominees_json LONGTEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_witnesses_json') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_witnesses_json LONGTEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_place') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_place VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_date') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_date DATE NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_employee_signature') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_employee_signature VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='gratuity_employee_statement_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN gratuity_employee_statement_name TEXT NULL; END IF;

  -- Insurance
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='ins_employee_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN ins_employee_name VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='ins_father_or_husband_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN ins_father_or_husband_name VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='ins_date_of_birth') THEN
    ALTER TABLE joining_formalities ADD COLUMN ins_date_of_birth DATE NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='ins_sex') THEN
    ALTER TABLE joining_formalities ADD COLUMN ins_sex VARCHAR(10) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='ins_employee_id') THEN
    ALTER TABLE joining_formalities ADD COLUMN ins_employee_id VARCHAR(50) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='ins_address') THEN
    ALTER TABLE joining_formalities ADD COLUMN ins_address TEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='ins_nominees_json') THEN
    ALTER TABLE joining_formalities ADD COLUMN ins_nominees_json LONGTEXT NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='ins_declaration_employee_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN ins_declaration_employee_name VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='ins_declaration_date') THEN
    ALTER TABLE joining_formalities ADD COLUMN ins_declaration_date DATE NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='ins_signature') THEN
    ALTER TABLE joining_formalities ADD COLUMN ins_signature VARCHAR(255) NULL; END IF;

  -- PF
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_employee_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_employee_name VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_date_of_birth') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_date_of_birth DATE NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_father_or_spouse_name') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_father_or_spouse_name VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_relation_type') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_relation_type VARCHAR(20) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_gender') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_gender VARCHAR(10) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_marital_status') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_marital_status VARCHAR(30) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_email') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_email VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_mobile_no') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_mobile_no VARCHAR(20) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_epf_1952') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_epf_1952 VARCHAR(5) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_eps_1995') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_eps_1995 VARCHAR(5) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_uan') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_uan VARCHAR(50) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_previous_pf') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_previous_pf VARCHAR(50) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_exit_previous_employment') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_exit_previous_employment DATE NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_scheme_certificate_no') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_scheme_certificate_no VARCHAR(100) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_ppo') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_ppo VARCHAR(100) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_international_worker') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_international_worker VARCHAR(5) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_country_origin') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_country_origin VARCHAR(100) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_passport_no') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_passport_no VARCHAR(50) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_passport_validity') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_passport_validity DATE NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_educational_qualification') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_educational_qualification VARCHAR(100) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_specially_abled') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_specially_abled VARCHAR(5) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_disability_category') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_disability_category VARCHAR(100) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_bank_acc_no') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_bank_acc_no VARCHAR(50) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_ifsc_code') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_ifsc_code VARCHAR(20) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_aadhar_no') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_aadhar_no VARCHAR(20) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_do_have_pan') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_do_have_pan VARCHAR(5) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_pan') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_pan VARCHAR(20) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_place') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_place VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_declaration_accepted') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_declaration_accepted TINYINT(1) DEFAULT 0; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='pf_employee_signature') THEN
    ALTER TABLE joining_formalities ADD COLUMN pf_employee_signature VARCHAR(255) NULL; END IF;

  -- Admin fields (may already exist from patch_joining_review_fix_mysql.sql — safe to skip)
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='admin_employee_id') THEN
    ALTER TABLE joining_formalities ADD COLUMN admin_employee_id VARCHAR(50) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='admin_designation') THEN
    ALTER TABLE joining_formalities ADD COLUMN admin_designation VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='admin_reporting_to') THEN
    ALTER TABLE joining_formalities ADD COLUMN admin_reporting_to VARCHAR(255) NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='joining_formalities' AND COLUMN_NAME='admin_department') THEN
    ALTER TABLE joining_formalities ADD COLUMN admin_department VARCHAR(255) NULL; END IF;

END$$
DELIMITER ;

CALL _tmp_044();
DROP PROCEDURE IF EXISTS _tmp_044;

-- ─────────────────────────────────────────────────────────────────────────────
-- Recreate stored procedures (same as migration_044 — included here for completeness)
-- ─────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_joining_save_formalities;

DELIMITER $$
CREATE PROCEDURE sp_joining_save_formalities(
  IN p_invitation_id  INT,
  IN p_candidate_id   INT,
  IN p_status         VARCHAR(30),
  IN p_handbook_ack   TINYINT,
  IN p_hr_policy_ack  TINYINT,
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
  IN p_bank_name           VARCHAR(100),
  IN p_account_holder_name VARCHAR(255),
  IN p_account_number      VARCHAR(50),
  IN p_ifsc_code           VARCHAR(20),
  IN p_branch_details      VARCHAR(255),
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

SELECT 'migration_044_joining_mysql.sql applied successfully' AS result;
