USE hrms_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_managers_list $$
CREATE PROCEDURE sp_get_managers_list ()
BEGIN
  SELECT mgr.employee_id,
         CONCAT(mgr.first_name,' ',IFNULL(mgr.last_name,'')) AS full_name,
         d.designation_name, dp.department_name, dp.department_id,
         mgr.employee_status,
         (SELECT COUNT(*) FROM employees s WHERE s.reporting_to=mgr.employee_id AND s.employee_status='Active') AS team_count
    FROM employees mgr
    INNER JOIN users u ON u.employee_id = mgr.employee_id AND u.role_id = 3
    LEFT JOIN designations d  ON d.designation_id = mgr.designation_id
    LEFT JOIN departments  dp ON dp.department_id = mgr.department_id
   WHERE mgr.employee_status='Active'
   ORDER BY mgr.first_name;
END $$

DELIMITER ;
