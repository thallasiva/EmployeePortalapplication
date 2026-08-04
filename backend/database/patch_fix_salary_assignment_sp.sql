-- Fix: sp_list_employee_salary_assignments
-- employees table has department_id / designation_id (FKs), not name columns directly.
-- Join departments and designations tables instead.

DELIMITER $$

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
    dsg.designation_name,
    d.department_name,
    e.employee_status,
    esa.assignment_id,
    esa.structure_id,
    ss.structure_name,
    esa.ctc_annual,
    ROUND(esa.ctc_annual / 12, 2) AS ctc_monthly,
    esa.effective_from
  FROM employees e
  LEFT JOIN departments d
         ON d.department_id = e.department_id
  LEFT JOIN designations dsg
         ON dsg.designation_id = e.designation_id
  LEFT JOIN employee_salary_assignments esa
         ON esa.employee_id = e.employee_id AND esa.is_active = 1
  LEFT JOIN salary_structures ss
         ON ss.structure_id = esa.structure_id
  WHERE e.employee_status = 'Active'
    AND (p_department_id IS NULL OR e.department_id = p_department_id)
    AND (p_search IS NULL OR p_search = '' OR
         CONCAT(e.first_name,' ',e.last_name) LIKE CONCAT('%',p_search,'%') OR
         e.emp_code LIKE CONCAT('%',p_search,'%'))
  ORDER BY d.department_name, e.first_name;
END $$

DELIMITER ;
