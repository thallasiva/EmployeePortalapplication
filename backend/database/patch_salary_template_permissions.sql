USE hrms_db;
-- Grant Admin (role 1) full access — already bypasses RBAC
-- Grant HR Manager (role 4) view access to salary templates
CALL sp_upsert_role_permission(4, 'salary_templates', 'view', 1);

-- Ensure permissions exist for all actions (admin bypasses, but rows needed for sp_check)
INSERT IGNORE INTO permissions (module, action) VALUES
  ('salary_templates', 'view'),
  ('salary_templates', 'add'),
  ('salary_templates', 'edit'),
  ('salary_templates', 'delete');

SELECT 'Salary template permissions seeded' AS status;
