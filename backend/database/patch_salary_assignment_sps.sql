-- ============================================================
-- Patch: Create employee salary assignment stored procedures
-- Run this in MySQL Workbench against hrms_db
-- Safe to re-run — uses DROP IF EXISTS before each CREATE
-- ============================================================
USE hrms_db;

DELIMITER $$

-- ── SP: Assign (or update) an employee's salary structure ─────

DROP PROCEDURE IF EXISTS sp_assign_salary_structure $$
CREATE PROCEDURE sp_assign_salary_structure(
  IN p_employee_id  INT,
  IN p_structure_id INT,
  IN p_ctc_annual   DECIMAL(14,2),
  IN p_effective_from DATE,
  IN p_assigned_by  INT
)
BEGIN
  -- Close previous active assignment
  UPDATE employee_salary_assignments
     SET effective_to = DATE_SUB(p_effective_from, INTERVAL 1 DAY),
         is_active    = 0
   WHERE employee_id = p_employee_id
     AND is_active   = 1;

  -- Insert new assignment
  INSERT INTO employee_salary_assignments
    (employee_id, structure_id, ctc_annual, effective_from, is_active)
  VALUES
    (p_employee_id, p_structure_id, p_ctc_annual, p_effective_from, 1);

  SELECT LAST_INSERT_ID() AS assignment_id;
END $$


-- ── SP: Get an employee's active salary assignment ────────────

DROP PROCEDURE IF EXISTS sp_get_employee_salary_assignment $$
CREATE PROCEDURE sp_get_employee_salary_assignment(
  IN p_employee_id INT
)
BEGIN
  -- Result set 1: assignment meta
  SELECT
    esa.assignment_id,
    esa.employee_id,
    esa.structure_id,
    ss.structure_name,
    ss.description  AS structure_description,
    esa.ctc_annual,
    ROUND(esa.ctc_annual / 12, 2) AS ctc_monthly,
    esa.effective_from,
    esa.effective_to,
    esa.is_active
  FROM employee_salary_assignments esa
  JOIN salary_structures ss ON ss.structure_id = esa.structure_id
  WHERE esa.employee_id = p_employee_id
    AND esa.is_active   = 1
  ORDER BY esa.effective_from DESC
  LIMIT 1;

  -- Result set 2: structure component lines (with effective calc values)
  SELECT
    l.line_id,
    l.structure_id,
    l.component_id,
    c.component_name,
    c.component_code,
    c.category,
    c.frequency,
    c.show_offer_letter,
    c.show_ctc_breakup,
    c.show_payslip,
    c.is_taxable,
    c.pf_applicable,
    c.esi_applicable,
    c.gratuity_applicable,
    COALESCE(l.calc_type_override,       c.calc_type)         AS effective_calc_type,
    COALESCE(l.percentage_override,      c.percentage_value)  AS effective_pct,
    COALESCE(l.percentage_of_override,   c.percentage_of)     AS effective_pct_of,
    COALESCE(l.formula_override,         c.formula_expr)      AS effective_formula,
    l.fixed_amount,
    l.sort_order,
    c.is_system,
    c.is_active
  FROM employee_salary_assignments esa
  JOIN salary_structure_lines l ON l.structure_id = esa.structure_id AND l.is_active = 1
  JOIN salary_components c      ON c.component_id  = l.component_id  AND c.is_active = 1
  WHERE esa.employee_id = p_employee_id
    AND esa.is_active   = 1
  ORDER BY l.sort_order, c.sort_order;
END $$


-- ── SP: List all employees with their current assignment ──────

DROP PROCEDURE IF EXISTS sp_list_employee_salary_assignments $$
CREATE PROCEDURE sp_list_employee_salary_assignments(
  IN p_department_id INT,
  IN p_search        VARCHAR(100)
)
BEGIN
  SELECT
    e.employee_id,
    e.emp_code,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    e.designation_name,
    e.department_name,
    e.employee_status,
    esa.assignment_id,
    esa.structure_id,
    ss.structure_name,
    esa.ctc_annual,
    ROUND(esa.ctc_annual / 12, 2) AS ctc_monthly,
    esa.effective_from
  FROM employees e
  LEFT JOIN employee_salary_assignments esa
         ON esa.employee_id = e.employee_id AND esa.is_active = 1
  LEFT JOIN salary_structures ss
         ON ss.structure_id = esa.structure_id
  WHERE e.employee_status = 'Active'
    AND (p_department_id IS NULL OR e.department_id = p_department_id)
    AND (p_search IS NULL OR p_search = '' OR
         CONCAT(e.first_name,' ',e.last_name) LIKE CONCAT('%',p_search,'%') OR
         e.emp_code LIKE CONCAT('%',p_search,'%'))
  ORDER BY e.department_name, e.first_name;
END $$


-- ── SP: Get assignment history for one employee ───────────────

DROP PROCEDURE IF EXISTS sp_get_salary_assignment_history $$
CREATE PROCEDURE sp_get_salary_assignment_history(IN p_employee_id INT)
BEGIN
  SELECT
    esa.*,
    ss.structure_name,
    ROUND(esa.ctc_annual / 12, 2) AS ctc_monthly
  FROM employee_salary_assignments esa
  JOIN salary_structures ss ON ss.structure_id = esa.structure_id
  WHERE esa.employee_id = p_employee_id
  ORDER BY esa.effective_from DESC;
END $$

DELIMITER ;

SELECT 'Patch complete — salary assignment stored procedures created' AS status;
