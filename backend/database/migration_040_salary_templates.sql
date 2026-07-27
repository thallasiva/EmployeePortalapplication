-- ============================================================
-- Migration 040: Salary Templates
-- Configurable salary structure templates for offer creation
-- ============================================================
USE hrms_db;

CREATE TABLE IF NOT EXISTS salary_templates (
  template_id        INT AUTO_INCREMENT PRIMARY KEY,
  template_name      VARCHAR(100)   NOT NULL,
  description        VARCHAR(255)   DEFAULT NULL,

  -- Percentage-based components
  basic_pct          DECIMAL(5,2)   NOT NULL DEFAULT 50.00,   -- % of CTC monthly
  hra_pct            DECIMAL(5,2)   NOT NULL DEFAULT 40.00,   -- % of Basic
  variable_pct       DECIMAL(5,2)   NOT NULL DEFAULT 0.00,    -- % of CTC (variable pay)

  -- Fixed allowances (monthly amounts)
  telephone_monthly  DECIMAL(10,2)  NOT NULL DEFAULT 1500.00,
  lta_annual         DECIMAL(10,2)  NOT NULL DEFAULT 0.00,

  -- PF settings
  pf_applicable      TINYINT(1)     NOT NULL DEFAULT 1,
  pf_cap             TINYINT(1)     NOT NULL DEFAULT 1,        -- cap at 15000 basic

  -- Other components
  gratuity_applicable TINYINT(1)   NOT NULL DEFAULT 0,
  bonus_applicable   TINYINT(1)    NOT NULL DEFAULT 1,         -- statutory bonus
  insurance_cost     DECIMAL(10,2) NOT NULL DEFAULT 0.00,      -- annual insurance
  other_allowances   DECIMAL(10,2) NOT NULL DEFAULT 0.00,      -- annual other
  professional_tax   DECIMAL(10,2) NOT NULL DEFAULT 0.00,      -- annual PT

  is_default         TINYINT(1)    NOT NULL DEFAULT 0,
  is_active          TINYINT(1)    NOT NULL DEFAULT 1,
  created_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_template_name (template_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Stored Procedures ──────────────────────────────────────

DELIMITER $$

-- List all active templates
DROP PROCEDURE IF EXISTS sp_list_salary_templates $$
CREATE PROCEDURE sp_list_salary_templates()
BEGIN
  SELECT * FROM salary_templates WHERE is_active = 1 ORDER BY is_default DESC, template_name ASC;
END $$

-- Get single template
DROP PROCEDURE IF EXISTS sp_get_salary_template $$
CREATE PROCEDURE sp_get_salary_template(IN p_id INT)
BEGIN
  SELECT * FROM salary_templates WHERE template_id = p_id;
END $$

-- Create template
DROP PROCEDURE IF EXISTS sp_create_salary_template $$
CREATE PROCEDURE sp_create_salary_template(
  IN p_name            VARCHAR(100),
  IN p_description     VARCHAR(255),
  IN p_basic_pct       DECIMAL(5,2),
  IN p_hra_pct         DECIMAL(5,2),
  IN p_variable_pct    DECIMAL(5,2),
  IN p_telephone       DECIMAL(10,2),
  IN p_lta_annual      DECIMAL(10,2),
  IN p_pf_applicable   TINYINT(1),
  IN p_pf_cap          TINYINT(1),
  IN p_gratuity        TINYINT(1),
  IN p_bonus           TINYINT(1),
  IN p_insurance       DECIMAL(10,2),
  IN p_other           DECIMAL(10,2),
  IN p_pt              DECIMAL(10,2),
  IN p_is_default      TINYINT(1)
)
BEGIN
  IF p_is_default = 1 THEN
    UPDATE salary_templates SET is_default = 0;
  END IF;

  INSERT INTO salary_templates (
    template_name, description, basic_pct, hra_pct, variable_pct,
    telephone_monthly, lta_annual, pf_applicable, pf_cap,
    gratuity_applicable, bonus_applicable, insurance_cost,
    other_allowances, professional_tax, is_default
  ) VALUES (
    p_name, p_description, p_basic_pct, p_hra_pct, p_variable_pct,
    p_telephone, p_lta_annual, p_pf_applicable, p_pf_cap,
    p_gratuity, p_bonus, p_insurance,
    p_other, p_pt, p_is_default
  );

  SELECT LAST_INSERT_ID() AS template_id;
END $$

-- Update template
DROP PROCEDURE IF EXISTS sp_update_salary_template $$
CREATE PROCEDURE sp_update_salary_template(
  IN p_id              INT,
  IN p_name            VARCHAR(100),
  IN p_description     VARCHAR(255),
  IN p_basic_pct       DECIMAL(5,2),
  IN p_hra_pct         DECIMAL(5,2),
  IN p_variable_pct    DECIMAL(5,2),
  IN p_telephone       DECIMAL(10,2),
  IN p_lta_annual      DECIMAL(10,2),
  IN p_pf_applicable   TINYINT(1),
  IN p_pf_cap          TINYINT(1),
  IN p_gratuity        TINYINT(1),
  IN p_bonus           TINYINT(1),
  IN p_insurance       DECIMAL(10,2),
  IN p_other           DECIMAL(10,2),
  IN p_pt              DECIMAL(10,2),
  IN p_is_default      TINYINT(1)
)
BEGIN
  IF p_is_default = 1 THEN
    UPDATE salary_templates SET is_default = 0 WHERE template_id != p_id;
  END IF;

  UPDATE salary_templates SET
    template_name       = p_name,
    description         = p_description,
    basic_pct           = p_basic_pct,
    hra_pct             = p_hra_pct,
    variable_pct        = p_variable_pct,
    telephone_monthly   = p_telephone,
    lta_annual          = p_lta_annual,
    pf_applicable       = p_pf_applicable,
    pf_cap              = p_pf_cap,
    gratuity_applicable = p_gratuity,
    bonus_applicable    = p_bonus,
    insurance_cost      = p_insurance,
    other_allowances    = p_other,
    professional_tax    = p_pt,
    is_default          = p_is_default
  WHERE template_id = p_id;

  SELECT ROW_COUNT() AS updated;
END $$

-- Delete (soft)
DROP PROCEDURE IF EXISTS sp_delete_salary_template $$
CREATE PROCEDURE sp_delete_salary_template(IN p_id INT)
BEGIN
  UPDATE salary_templates SET is_active = 0 WHERE template_id = p_id;
  SELECT ROW_COUNT() AS deleted;
END $$

DELIMITER ;

-- Seed: two default templates
INSERT INTO salary_templates (
  template_name, description, basic_pct, hra_pct, variable_pct,
  telephone_monthly, lta_annual, pf_applicable, pf_cap,
  gratuity_applicable, bonus_applicable, insurance_cost, other_allowances, professional_tax, is_default
) VALUES
(
  'Standard',
  'Default template: 50% Basic, 40% HRA, PF capped at 15k basic, Statutory Bonus',
  50.00, 40.00, 0.00,
  1500.00, 39996.00, 1, 1,
  0, 1, 0.00, 0.00, 0.00, 1
),
(
  'Senior / Leadership',
  'For senior roles: 50% Basic, 40% HRA, PF capped, no statutory bonus, with gratuity',
  50.00, 40.00, 10.00,
  1500.00, 39996.00, 1, 1,
  1, 0, 0.00, 0.00, 0.00, 0
)
ON DUPLICATE KEY UPDATE template_name = VALUES(template_name);

SELECT 'Migration 040 complete — salary_templates created' AS status;
