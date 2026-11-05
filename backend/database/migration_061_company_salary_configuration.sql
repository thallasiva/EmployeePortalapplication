-- Migration 061: scope salary components and templates to their owning company.
-- Apply after migration 059 and migration 060.
USE hrms_db;

ALTER TABLE salary_components
  ADD COLUMN company_id INT DEFAULT NULL AFTER component_id;

UPDATE salary_components
   SET company_id = (SELECT MIN(company_id) FROM companies)
 WHERE company_id IS NULL;

ALTER TABLE salary_components
  DROP INDEX uq_component_code,
  ADD UNIQUE KEY uq_company_component_code (company_id, component_code),
  ADD KEY idx_salary_components_company_active (company_id, is_active);

INSERT INTO salary_components (
  company_id, component_name, component_code, category, calc_type,
  percentage_value, percentage_of, formula_expr, frequency, is_taxable,
  pf_applicable, esi_applicable, gratuity_applicable, show_offer_letter,
  show_ctc_breakup, show_payslip, is_active, is_system, sort_order,
  description, created_at, updated_at
)
SELECT c.company_id, sc.component_name, sc.component_code, sc.category, sc.calc_type,
       sc.percentage_value, sc.percentage_of, sc.formula_expr, sc.frequency, sc.is_taxable,
       sc.pf_applicable, sc.esi_applicable, sc.gratuity_applicable, sc.show_offer_letter,
       sc.show_ctc_breakup, sc.show_payslip, sc.is_active, sc.is_system, sc.sort_order,
       sc.description, sc.created_at, sc.updated_at
  FROM companies c
  JOIN salary_components sc
    ON sc.company_id = (SELECT MIN(company_id) FROM companies)
   AND sc.is_system = 1
 WHERE c.company_id <> (SELECT MIN(company_id) FROM companies)
   AND NOT EXISTS (
     SELECT 1 FROM salary_components existing
      WHERE existing.company_id = c.company_id
        AND existing.component_code = sc.component_code
   );

ALTER TABLE salary_components
  MODIFY company_id INT NOT NULL,
  ADD CONSTRAINT fk_salary_components_company
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE;

ALTER TABLE salary_templates
  ADD COLUMN company_id INT DEFAULT NULL AFTER template_id;

UPDATE salary_templates
   SET company_id = (SELECT MIN(company_id) FROM companies)
 WHERE company_id IS NULL;

ALTER TABLE salary_templates
  DROP INDEX uq_template_name,
  ADD UNIQUE KEY uq_company_template_name (company_id, template_name),
  ADD KEY idx_salary_templates_company_active (company_id, is_active);

INSERT INTO salary_templates (
  company_id, template_name, description, basic_pct, hra_pct, variable_pct,
  telephone_monthly, lta_annual, pf_applicable, pf_cap, gratuity_applicable,
  bonus_applicable, insurance_cost, other_allowances, professional_tax,
  is_default, is_active, created_at, updated_at
)
SELECT c.company_id, st.template_name, st.description, st.basic_pct, st.hra_pct, st.variable_pct,
       st.telephone_monthly, st.lta_annual, st.pf_applicable, st.pf_cap, st.gratuity_applicable,
       st.bonus_applicable, st.insurance_cost, st.other_allowances, st.professional_tax,
       st.is_default, st.is_active, st.created_at, st.updated_at
  FROM companies c
  JOIN salary_templates st
    ON st.company_id = (SELECT MIN(company_id) FROM companies)
 WHERE c.company_id <> (SELECT MIN(company_id) FROM companies)
   AND NOT EXISTS (
     SELECT 1 FROM salary_templates existing
      WHERE existing.company_id = c.company_id
        AND existing.template_name = st.template_name
   );

ALTER TABLE salary_templates
  MODIFY company_id INT NOT NULL,
  ADD CONSTRAINT fk_salary_templates_company
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE;

DROP PROCEDURE IF EXISTS sp_get_employee_salary_assignment;
DELIMITER $$
CREATE PROCEDURE sp_get_employee_salary_assignment(IN p_employee_id INT)
BEGIN
 SELECT
   esa.assignment_id,
   esa.employee_id,
   esa.structure_id,
   ss.structure_name,
   ss.description AS structure_description,
   esa.ctc_annual,
   ROUND(esa.ctc_annual / 12, 2) AS ctc_monthly,
   esa.effective_from,
   esa.effective_to,
   esa.is_active
 FROM employee_salary_assignments esa
 JOIN employees e ON e.employee_id = esa.employee_id
 JOIN salary_structures ss
   ON ss.structure_id = esa.structure_id AND ss.company_id = e.company_id
 WHERE esa.employee_id = p_employee_id
   AND esa.is_active = 1
   AND esa.effective_from <= CURDATE()
 ORDER BY esa.effective_from DESC, esa.assignment_id DESC
 LIMIT 1;

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
   COALESCE(l.calc_type_override, c.calc_type) AS effective_calc_type,
   COALESCE(l.percentage_override, c.percentage_value) AS effective_pct,
   COALESCE(l.percentage_of_override, c.percentage_of) AS effective_pct_of,
   COALESCE(l.formula_override, c.formula_expr) AS effective_formula,
   l.fixed_amount,
   l.sort_order,
   c.is_system,
   c.is_active
 FROM employee_salary_assignments esa
 JOIN employees e ON e.employee_id = esa.employee_id
 JOIN salary_structures ss
   ON ss.structure_id = esa.structure_id AND ss.company_id = e.company_id
 JOIN salary_structure_lines l ON l.structure_id = esa.structure_id AND l.is_active = 1
 JOIN salary_components c
   ON c.component_id = l.component_id AND c.company_id = e.company_id AND c.is_active = 1
 WHERE esa.employee_id = p_employee_id
   AND esa.is_active = 1
   AND esa.effective_from <= CURDATE()
   AND esa.assignment_id = (
     SELECT current_assignment.assignment_id
       FROM employee_salary_assignments current_assignment
      WHERE current_assignment.employee_id = p_employee_id
        AND current_assignment.is_active = 1
        AND current_assignment.effective_from <= CURDATE()
      ORDER BY current_assignment.effective_from DESC, current_assignment.assignment_id DESC
      LIMIT 1
   )
 ORDER BY l.sort_order, c.sort_order;
END $$

DROP PROCEDURE IF EXISTS sp_get_salary_assignment_history $$
CREATE PROCEDURE sp_get_salary_assignment_history(
 IN p_employee_id INT,
 IN p_company_id INT
)
BEGIN
 SELECT esa.*, ss.structure_name, ROUND(esa.ctc_annual / 12, 2) AS ctc_monthly
   FROM employee_salary_assignments esa
   JOIN employees e ON e.employee_id = esa.employee_id AND e.company_id = p_company_id
   JOIN salary_structures ss ON ss.structure_id = esa.structure_id AND ss.company_id = p_company_id
  WHERE esa.employee_id = p_employee_id
  ORDER BY esa.effective_from DESC;
END $$

DROP PROCEDURE IF EXISTS sp_list_employee_salary_assignments $$
CREATE PROCEDURE sp_list_employee_salary_assignments(
 IN p_department_id INT,
 IN p_search VARCHAR(100),
 IN p_company_id INT
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
   ON esa.assignment_id = (
     SELECT current_assignment.assignment_id
       FROM employee_salary_assignments current_assignment
      WHERE current_assignment.employee_id = e.employee_id
        AND current_assignment.is_active = 1
        AND current_assignment.effective_from <= CURDATE()
      ORDER BY current_assignment.effective_from DESC, current_assignment.assignment_id DESC
      LIMIT 1
   )
 LEFT JOIN salary_structures ss
   ON ss.structure_id = esa.structure_id AND ss.company_id = e.company_id
 WHERE e.company_id = p_company_id
   AND e.employee_status = 'Active'
   AND (p_department_id IS NULL OR e.department_id = p_department_id)
   AND (
     p_search IS NULL OR p_search = '' OR
     CONCAT(e.first_name, ' ', e.last_name) LIKE CONCAT('%', p_search, '%') OR
     e.emp_code LIKE CONCAT('%', p_search, '%')
   )
 ORDER BY e.department_name, e.first_name;
END $$
DELIMITER ;
