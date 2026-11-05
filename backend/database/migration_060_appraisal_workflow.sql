USE hrms_db;

ALTER TABLE appraisal_cycles
  ADD COLUMN company_id INT DEFAULT NULL AFTER cycle_id,
  ADD COLUMN template_json JSON DEFAULT NULL,
  ADD KEY idx_appraisal_cycles_company_status (company_id, status),
  ADD CONSTRAINT fk_appraisal_cycles_company
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE;

ALTER TABLE self_appraisals
  MODIFY COLUMN status ENUM(
    'draft',
    'submitted',
    'manager_review',
    'hr_review',
    'changes_requested',
    'shared',
    'acknowledged',
    'closed'
  ) NOT NULL DEFAULT 'draft',
  ADD COLUMN manager_feedback TEXT DEFAULT NULL,
  ADD COLUMN hr_feedback TEXT DEFAULT NULL,
  ADD COLUMN manager_reviewed_at DATETIME DEFAULT NULL,
  ADD COLUMN hr_reviewed_at DATETIME DEFAULT NULL,
  ADD COLUMN shared_at DATETIME DEFAULT NULL,
  ADD COLUMN acknowledged_at DATETIME DEFAULT NULL,
  ADD COLUMN decision_type ENUM('development', 'promotion', 'increment', 'no_change') DEFAULT NULL,
  ADD COLUMN decision_notes TEXT DEFAULT NULL,
  ADD COLUMN decision_ctc_annual DECIMAL(14,2) DEFAULT NULL,
  ADD COLUMN decision_effective_date DATE DEFAULT NULL,
  ADD COLUMN decision_by INT DEFAULT NULL,
  ADD COLUMN closed_at DATETIME DEFAULT NULL;

ALTER TABLE self_appraisals
  ADD CONSTRAINT fk_self_appraisals_decision_by
    FOREIGN KEY (decision_by) REFERENCES employees(employee_id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS appraisal_goals (
  goal_id          INT AUTO_INCREMENT PRIMARY KEY,
  appraisal_id     INT NOT NULL,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  success_metrics  TEXT,
  self_progress    TEXT,
  evidence_url     VARCHAR(2048),
  manager_feedback TEXT,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appraisal_goals_appraisal
    FOREIGN KEY (appraisal_id) REFERENCES self_appraisals(appraisal_id) ON DELETE CASCADE,
  KEY idx_appraisal_goals_appraisal (appraisal_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS appraisal_workflow_events (
  event_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  appraisal_id      INT NOT NULL,
  actor_employee_id INT DEFAULT NULL,
  action            VARCHAR(40) NOT NULL,
  from_status       VARCHAR(30) DEFAULT NULL,
  to_status         VARCHAR(30) DEFAULT NULL,
  reason            TEXT,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appraisal_events_appraisal
    FOREIGN KEY (appraisal_id) REFERENCES self_appraisals(appraisal_id) ON DELETE CASCADE,
  CONSTRAINT fk_appraisal_events_actor
    FOREIGN KEY (actor_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
  KEY idx_appraisal_events_appraisal (appraisal_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_employee_salary_assignment $$
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
  JOIN salary_structures ss ON ss.structure_id = esa.structure_id
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
  JOIN salary_structure_lines l ON l.structure_id = esa.structure_id AND l.is_active = 1
  JOIN salary_components c ON c.component_id = l.component_id AND c.is_active = 1
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

DROP PROCEDURE IF EXISTS sp_list_employee_salary_assignments $$
CREATE PROCEDURE sp_list_employee_salary_assignments(
  IN p_department_id INT,
  IN p_search VARCHAR(100)
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
  LEFT JOIN salary_structures ss ON ss.structure_id = esa.structure_id
  WHERE e.employee_status = 'Active'
    AND (p_department_id IS NULL OR e.department_id = p_department_id)
    AND (
      p_search IS NULL OR p_search = '' OR
      CONCAT(e.first_name, ' ', e.last_name) LIKE CONCAT('%', p_search, '%') OR
      e.emp_code LIKE CONCAT('%', p_search, '%')
    )
  ORDER BY e.department_name, e.first_name;
END $$

DELIMITER ;
