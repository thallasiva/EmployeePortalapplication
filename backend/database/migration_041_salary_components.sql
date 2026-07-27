-- ============================================================
-- Migration 041: Dynamic Salary Components System
-- Enterprise-grade configurable salary module
-- ============================================================
USE hrms_db;

-- Drop in reverse dependency order so FK constraints don't block
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS employee_salary_assignments;
DROP TABLE IF EXISTS salary_structure_lines;
DROP TABLE IF EXISTS salary_structures;
DROP TABLE IF EXISTS salary_components;
SET FOREIGN_KEY_CHECKS = 1;

-- ── 1. Salary Component Master ───────────────────────────────
CREATE TABLE salary_components (
  component_id      INT AUTO_INCREMENT PRIMARY KEY,
  component_name    VARCHAR(100)  NOT NULL,
  component_code    VARCHAR(30)   NOT NULL,           -- e.g. BASIC, HRA, EMP_PF
  category          ENUM('Earning','Deduction','Employer Contribution') NOT NULL,
  calc_type         ENUM('Fixed','Percentage','Formula') NOT NULL DEFAULT 'Fixed',
  percentage_value  DECIMAL(8,4)  DEFAULT NULL,       -- e.g. 40.0000 for 40% of base
  percentage_of     VARCHAR(30)   DEFAULT NULL,       -- component_code of base, e.g. 'BASIC'
  formula_expr      TEXT          DEFAULT NULL,       -- e.g. MIN(BASIC*0.12, 1800)
  frequency         ENUM('Monthly','Quarterly','Half-Yearly','Annual','One-Time') NOT NULL DEFAULT 'Monthly',
  is_taxable        TINYINT(1)    NOT NULL DEFAULT 1,
  pf_applicable     TINYINT(1)    NOT NULL DEFAULT 0,
  esi_applicable    TINYINT(1)    NOT NULL DEFAULT 0,
  gratuity_applicable TINYINT(1) NOT NULL DEFAULT 0,
  show_offer_letter TINYINT(1)    NOT NULL DEFAULT 1,
  show_ctc_breakup  TINYINT(1)    NOT NULL DEFAULT 1,
  show_payslip      TINYINT(1)    NOT NULL DEFAULT 1,
  is_active         TINYINT(1)    NOT NULL DEFAULT 1,
  is_system         TINYINT(1)    NOT NULL DEFAULT 0, -- system components can't be deleted
  sort_order        INT           NOT NULL DEFAULT 100,
  description       VARCHAR(255)  DEFAULT NULL,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_component_code (component_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 2. Salary Structures (named templates) ────────────────────
CREATE TABLE salary_structures (
  structure_id      INT AUTO_INCREMENT PRIMARY KEY,
  structure_name    VARCHAR(100)  NOT NULL,
  description       VARCHAR(255)  DEFAULT NULL,
  is_default        TINYINT(1)    NOT NULL DEFAULT 0,
  is_active         TINYINT(1)    NOT NULL DEFAULT 1,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_structure_name (structure_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. Structure → Component mapping (with overrides) ─────────
CREATE TABLE salary_structure_lines (
  line_id           INT AUTO_INCREMENT PRIMARY KEY,
  structure_id      INT           NOT NULL,
  component_id      INT           NOT NULL,
  calc_type_override ENUM('Fixed','Percentage','Formula') DEFAULT NULL, -- overrides master
  percentage_override DECIMAL(8,4) DEFAULT NULL,
  percentage_of_override VARCHAR(30) DEFAULT NULL,
  formula_override  TEXT          DEFAULT NULL,
  fixed_amount      DECIMAL(12,2) DEFAULT NULL,       -- used when calc_type=Fixed
  sort_order        INT           NOT NULL DEFAULT 100,
  is_active         TINYINT(1)    NOT NULL DEFAULT 1,
  UNIQUE KEY uq_structure_component (structure_id, component_id),
  FOREIGN KEY (structure_id) REFERENCES salary_structures(structure_id) ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES salary_components(component_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 4. Employee Salary Assignments ───────────────────────────
CREATE TABLE employee_salary_assignments (
  assignment_id     INT AUTO_INCREMENT PRIMARY KEY,
  employee_id       INT           NOT NULL,
  structure_id      INT           NOT NULL,
  ctc_annual        DECIMAL(14,2) NOT NULL,
  effective_from    DATE          NOT NULL,
  effective_to      DATE          DEFAULT NULL,
  is_active         TINYINT(1)    NOT NULL DEFAULT 1,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (structure_id) REFERENCES salary_structures(structure_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ════════════════════════════════════════════════════════════
-- STORED PROCEDURES
-- ════════════════════════════════════════════════════════════
DELIMITER $$

-- ── Component CRUD ───────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_list_salary_components $$
CREATE PROCEDURE sp_list_salary_components(IN p_active_only TINYINT(1))
BEGIN
  SELECT * FROM salary_components
   WHERE (p_active_only IS NULL OR is_active = p_active_only)
   ORDER BY category, sort_order, component_name;
END $$

DROP PROCEDURE IF EXISTS sp_get_salary_component $$
CREATE PROCEDURE sp_get_salary_component(IN p_id INT)
BEGIN
  SELECT * FROM salary_components WHERE component_id = p_id;
END $$

DROP PROCEDURE IF EXISTS sp_upsert_salary_component $$
CREATE PROCEDURE sp_upsert_salary_component(
  IN p_id               INT,
  IN p_name             VARCHAR(100),
  IN p_code             VARCHAR(30),
  IN p_category         VARCHAR(30),
  IN p_calc_type        VARCHAR(20),
  IN p_pct_value        DECIMAL(8,4),
  IN p_pct_of           VARCHAR(30),
  IN p_formula          TEXT,
  IN p_frequency        VARCHAR(20),
  IN p_taxable          TINYINT(1),
  IN p_pf               TINYINT(1),
  IN p_esi              TINYINT(1),
  IN p_gratuity         TINYINT(1),
  IN p_show_offer       TINYINT(1),
  IN p_show_ctc         TINYINT(1),
  IN p_show_payslip     TINYINT(1),
  IN p_sort_order       INT,
  IN p_description      VARCHAR(255)
)
BEGIN
  IF p_id IS NULL OR p_id = 0 THEN
    INSERT INTO salary_components (
      component_name, component_code, category, calc_type,
      percentage_value, percentage_of, formula_expr, frequency,
      is_taxable, pf_applicable, esi_applicable, gratuity_applicable,
      show_offer_letter, show_ctc_breakup, show_payslip,
      sort_order, description
    ) VALUES (
      p_name, p_code, p_category, p_calc_type,
      p_pct_value, p_pct_of, p_formula, p_frequency,
      p_taxable, p_pf, p_esi, p_gratuity,
      p_show_offer, p_show_ctc, p_show_payslip,
      p_sort_order, p_description
    );
    SELECT LAST_INSERT_ID() AS component_id;
  ELSE
    UPDATE salary_components SET
      component_name    = p_name,
      component_code    = p_code,
      category          = p_category,
      calc_type         = p_calc_type,
      percentage_value  = p_pct_value,
      percentage_of     = p_pct_of,
      formula_expr      = p_formula,
      frequency         = p_frequency,
      is_taxable        = p_taxable,
      pf_applicable     = p_pf,
      esi_applicable    = p_esi,
      gratuity_applicable = p_gratuity,
      show_offer_letter = p_show_offer,
      show_ctc_breakup  = p_show_ctc,
      show_payslip      = p_show_payslip,
      sort_order        = p_sort_order,
      description       = p_description
    WHERE component_id = p_id;
    SELECT p_id AS component_id;
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_toggle_salary_component $$
CREATE PROCEDURE sp_toggle_salary_component(IN p_id INT, IN p_active TINYINT(1))
BEGIN
  UPDATE salary_components SET is_active = p_active WHERE component_id = p_id AND is_system = 0;
  SELECT ROW_COUNT() AS affected;
END $$

-- ── Structure CRUD ────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_list_salary_structures $$
CREATE PROCEDURE sp_list_salary_structures()
BEGIN
  SELECT s.*,
         COUNT(l.line_id) AS component_count
    FROM salary_structures s
    LEFT JOIN salary_structure_lines l ON l.structure_id = s.structure_id AND l.is_active = 1
   WHERE s.is_active = 1
   GROUP BY s.structure_id
   ORDER BY s.is_default DESC, s.structure_name;
END $$

DROP PROCEDURE IF EXISTS sp_get_salary_structure $$
CREATE PROCEDURE sp_get_salary_structure(IN p_id INT)
BEGIN
  SELECT s.*, COUNT(l.line_id) AS component_count
    FROM salary_structures s
    LEFT JOIN salary_structure_lines l ON l.structure_id = s.structure_id AND l.is_active = 1
   WHERE s.structure_id = p_id
   GROUP BY s.structure_id;

  SELECT l.*, c.component_name, c.component_code, c.category,
         c.calc_type AS master_calc_type,
         c.percentage_value AS master_pct_value,
         c.percentage_of AS master_pct_of,
         c.formula_expr AS master_formula,
         c.frequency, c.show_offer_letter, c.show_ctc_breakup, c.show_payslip,
         COALESCE(l.calc_type_override, c.calc_type)       AS effective_calc_type,
         COALESCE(l.percentage_override, c.percentage_value) AS effective_pct,
         COALESCE(l.percentage_of_override, c.percentage_of) AS effective_pct_of,
         COALESCE(l.formula_override, c.formula_expr)       AS effective_formula
    FROM salary_structure_lines l
    JOIN salary_components c ON c.component_id = l.component_id
   WHERE l.structure_id = p_id AND l.is_active = 1
   ORDER BY l.sort_order, c.sort_order;
END $$

DROP PROCEDURE IF EXISTS sp_upsert_salary_structure $$
CREATE PROCEDURE sp_upsert_salary_structure(
  IN p_id          INT,
  IN p_name        VARCHAR(100),
  IN p_description VARCHAR(255),
  IN p_is_default  TINYINT(1)
)
BEGIN
  IF p_is_default = 1 THEN
    UPDATE salary_structures SET is_default = 0;
  END IF;
  IF p_id IS NULL OR p_id = 0 THEN
    INSERT INTO salary_structures (structure_name, description, is_default)
    VALUES (p_name, p_description, p_is_default);
    SELECT LAST_INSERT_ID() AS structure_id;
  ELSE
    UPDATE salary_structures SET
      structure_name = p_name,
      description    = p_description,
      is_default     = p_is_default
    WHERE structure_id = p_id;
    SELECT p_id AS structure_id;
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_save_structure_lines $$
CREATE PROCEDURE sp_save_structure_lines(
  IN p_structure_id  INT,
  IN p_component_id  INT,
  IN p_calc_override VARCHAR(20),
  IN p_pct_override  DECIMAL(8,4),
  IN p_pct_of_override VARCHAR(30),
  IN p_formula_override TEXT,
  IN p_fixed_amount  DECIMAL(12,2),
  IN p_sort_order    INT
)
BEGIN
  INSERT INTO salary_structure_lines
    (structure_id, component_id, calc_type_override, percentage_override,
     percentage_of_override, formula_override, fixed_amount, sort_order)
  VALUES
    (p_structure_id, p_component_id, p_calc_override, p_pct_override,
     p_pct_of_override, p_formula_override, p_fixed_amount, p_sort_order)
  ON DUPLICATE KEY UPDATE
    calc_type_override     = p_calc_override,
    percentage_override    = p_pct_override,
    percentage_of_override = p_pct_of_override,
    formula_override       = p_formula_override,
    fixed_amount           = p_fixed_amount,
    sort_order             = p_sort_order,
    is_active              = 1;
END $$

DROP PROCEDURE IF EXISTS sp_remove_structure_line $$
CREATE PROCEDURE sp_remove_structure_line(IN p_structure_id INT, IN p_component_id INT)
BEGIN
  UPDATE salary_structure_lines SET is_active = 0
   WHERE structure_id = p_structure_id AND component_id = p_component_id;
END $$

DELIMITER ;

-- ════════════════════════════════════════════════════════════
-- SEED: System salary components
-- ════════════════════════════════════════════════════════════
INSERT INTO salary_components (
  component_name, component_code, category, calc_type,
  percentage_value, percentage_of, formula_expr, frequency,
  is_taxable, pf_applicable, esi_applicable, gratuity_applicable,
  show_offer_letter, show_ctc_breakup, show_payslip,
  is_system, sort_order, description
) VALUES
-- ── Earnings ────────────────────────────────────────────────
('Basic Salary',             'BASIC',        'Earning', 'Percentage', 50.0000, 'CTC_MONTHLY', NULL,                        'Monthly',  1,1,1,1, 1,1,1, 1, 10,  '50% of monthly CTC'),
('House Rent Allowance',     'HRA',          'Earning', 'Percentage', 40.0000, 'BASIC',       NULL,                        'Monthly',  1,0,1,0, 1,1,1, 1, 20,  '40% of Basic'),
('Special Allowance',        'SPL',          'Earning', 'Formula',    NULL,    NULL,          'GROSS - BASIC - HRA - TEL - LTA', 'Monthly', 1,0,1,0, 1,1,1, 1, 30, 'Balancing component'),
('Telephone/Internet Allow', 'TEL',          'Earning', 'Fixed',      NULL,    NULL,          NULL,                        'Monthly',  0,0,0,0, 1,1,1, 1, 40,  'Fixed telephone allowance'),
('Leave Travel Allowance',   'LTA',          'Earning', 'Fixed',      NULL,    NULL,          NULL,                        'Annual',   0,0,0,0, 1,1,1, 1, 50,  'Annual LTA'),
('Conveyance Allowance',     'CONV',         'Earning', 'Fixed',      NULL,    NULL,          NULL,                        'Monthly',  0,0,0,0, 1,1,0, 0, 60,  'Conveyance reimbursement'),
('Medical Allowance',        'MED',          'Earning', 'Fixed',      NULL,    NULL,          NULL,                        'Monthly',  1,0,0,0, 1,1,1, 0, 70,  'Medical allowance'),
('Shift Allowance',          'SHIFT',        'Earning', 'Fixed',      NULL,    NULL,          NULL,                        'Monthly',  1,0,1,0, 1,1,1, 0, 80,  'For shift workers'),
('Performance Bonus',        'PERF_BONUS',   'Earning', 'Fixed',      NULL,    NULL,          NULL,                        'Quarterly',1,0,0,0, 0,1,1, 0, 90,  'Performance-linked bonus'),
('Variable Pay',             'VARIABLE',     'Earning', 'Percentage', 0.0000,  'CTC_ANNUAL',  NULL,                        'Annual',   1,0,0,0, 1,1,1, 0, 95,  '% of annual CTC paid as variable'),
('Joining Bonus',            'JOIN_BONUS',   'Earning', 'Fixed',      NULL,    NULL,          NULL,                        'One-Time', 1,0,0,0, 1,0,0, 0, 96,  'One-time joining bonus'),
('Retention Bonus',          'RETAIN_BONUS', 'Earning', 'Fixed',      NULL,    NULL,          NULL,                        'One-Time', 1,0,0,0, 0,0,0, 0, 97,  'Retention bonus'),
('Overtime',                 'OT',           'Earning', 'Fixed',      NULL,    NULL,          NULL,                        'Monthly',  1,1,1,0, 0,0,1, 0,100,  'Overtime pay'),
('Arrears',                  'ARREARS',      'Earning', 'Fixed',      NULL,    NULL,          NULL,                        'One-Time', 1,1,1,0, 0,0,1, 0,110,  'Salary arrears'),
-- ── Deductions ──────────────────────────────────────────────
('Employee PF',              'EMP_PF',       'Deduction','Formula',   NULL,    NULL,          'MIN(BASIC*0.12,1800)',       'Monthly',  0,0,0,0, 0,1,1, 1, 10,  'Employee PF @ 12% of Basic, capped ₹1800'),
('Employee ESI',             'EMP_ESI',      'Deduction','Formula',   NULL,    NULL,          'GROSS*0.0075',              'Monthly',  0,0,0,0, 0,1,1, 1, 20,  'Employee ESI @ 0.75% of Gross (if Gross≤21000)'),
('Professional Tax',         'PROF_TAX',     'Deduction','Fixed',     NULL,    NULL,          NULL,                        'Monthly',  0,0,0,0, 0,1,1, 0, 30,  'State professional tax'),
('Income Tax (TDS)',         'TDS',          'Deduction','Fixed',     NULL,    NULL,          NULL,                        'Monthly',  0,0,0,0, 0,1,1, 0, 40,  'Monthly TDS deduction'),
('Loan Recovery',            'LOAN',         'Deduction','Fixed',     NULL,    NULL,          NULL,                        'Monthly',  0,0,0,0, 0,0,1, 0, 50,  'EMI for company loan'),
('Salary Advance Recovery',  'ADV_RECOV',    'Deduction','Fixed',     NULL,    NULL,          NULL,                        'Monthly',  0,0,0,0, 0,0,1, 0, 60,  'Recovery of advance paid'),
('Notice Period Recovery',   'NOTICE_RECOV', 'Deduction','Fixed',     NULL,    NULL,          NULL,                        'One-Time', 0,0,0,0, 0,0,1, 0, 70,  'Notice period shortfall'),
-- ── Employer Contributions ───────────────────────────────────
('Employer PF',              'EMP_ER_PF',    'Employer Contribution','Formula',NULL,NULL,     'MIN(BASIC*0.12,1800)',       'Monthly',  0,0,0,0, 1,1,0, 1, 10,  'Employer PF @ 12% of Basic, capped ₹1800'),
('Employer ESI',             'EMP_ER_ESI',   'Employer Contribution','Formula',NULL,NULL,     'GROSS*0.0325',              'Monthly',  0,0,0,0, 1,1,0, 1, 20,  'Employer ESI @ 3.25% of Gross (if Gross≤21000)'),
('Gratuity',                 'GRATUITY',     'Employer Contribution','Formula',NULL,NULL,     'BASIC*0.0481',              'Monthly',  0,0,0,0, 1,1,0, 1, 30,  'Gratuity @ 4.81% of Basic'),
('Insurance Contribution',   'INSURANCE',    'Employer Contribution','Fixed',  NULL,NULL,     NULL,                        'Annual',   0,0,0,0, 1,1,0, 0, 40,  'Group insurance (GMC/GPA/Term)'),
('NPS Contribution',         'NPS',          'Employer Contribution','Percentage',10.0000,'BASIC',NULL,                   'Monthly',  0,0,0,0, 1,1,0, 0, 50,  'Employer NPS @ 10% of Basic'),
('Statutory Bonus',          'STAT_BONUS',   'Employer Contribution','Formula',NULL,NULL,     'IF(BASIC<=21000,1400,0)',   'Monthly',  1,0,0,0, 1,1,1, 1, 60,  'Statutory bonus if Basic ≤ ₹21,000')
ON DUPLICATE KEY UPDATE component_name = VALUES(component_name), description = VALUES(description);

-- ── Seed: Standard structure ──────────────────────────────────
INSERT INTO salary_structures (structure_name, description, is_default)
VALUES ('Standard', 'Default structure: Basic 50%, HRA 40%, PF capped, Statutory Bonus', 1)
ON DUPLICATE KEY UPDATE structure_name = VALUES(structure_name);

SET @std_id = (SELECT structure_id FROM salary_structures WHERE structure_name = 'Standard' LIMIT 1);

INSERT INTO salary_structure_lines (structure_id, component_id, fixed_amount, sort_order)
SELECT @std_id, component_id,
  CASE component_code
    WHEN 'TEL'     THEN 1500
    WHEN 'LTA'     THEN 39996
    WHEN 'PROF_TAX' THEN 200
    ELSE NULL
  END,
  sort_order
FROM salary_components
WHERE component_code IN ('BASIC','HRA','TEL','LTA','SPL','EMP_PF','EMP_ER_PF','STAT_BONUS','GRATUITY')
  AND is_active = 1
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);

SELECT 'Migration 041 complete — Dynamic Salary Components system ready' AS status;
