-- ============================================================
-- Migration 036: Grant HR Manager (role 4) team-overview
--                permissions for employees, attendance,
--                leave_requests, and appraisal modules.
-- Run once in MySQL Workbench or CLI.
-- ============================================================

-- employees: view
CALL sp_upsert_role_permission(4, 'employees',      'view',    1);

-- attendance: view
CALL sp_upsert_role_permission(4, 'attendance',     'view',    1);

-- leave_requests: view + approve (inline approve/reject on team overview)
CALL sp_upsert_role_permission(4, 'leave_requests', 'view',    1);
CALL sp_upsert_role_permission(4, 'leave_requests', 'approve', 1);

-- appraisal: view
CALL sp_upsert_role_permission(4, 'appraisal',      'view',    1);

-- timesheets: view (for manager timesheets page)
CALL sp_upsert_role_permission(4, 'timesheets',     'view',    1);

-- resignations: view (for team resignations page)
CALL sp_upsert_role_permission(4, 'resignations',   'view',    1);

-- Verify what role 4 now has
SELECT p.module, p.action, rp.allowed
FROM   permissions p
JOIN   role_permissions rp ON rp.permission_id = p.permission_id
WHERE  rp.role_id = 4
ORDER  BY p.module, p.action;
