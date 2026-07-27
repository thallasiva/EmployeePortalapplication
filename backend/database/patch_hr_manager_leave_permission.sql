-- ============================================================
-- Patch: Fix HR Manager (role 4) leave permission module name.
-- Routes use module = 'leave', but migration_036 granted
-- 'leave_requests'. Grant the correct module name.
-- ============================================================
USE hrms_db;

CALL sp_upsert_role_permission(4, 'leave', 'view',    1);
CALL sp_upsert_role_permission(4, 'leave', 'approve', 1);
CALL sp_upsert_role_permission(4, 'leave', 'edit',    1);

-- Verify role 4 permissions
SELECT p.module, p.action, rp.allowed
FROM   permissions p
JOIN   role_permissions rp ON rp.permission_id = p.permission_id
WHERE  rp.role_id = 4
ORDER  BY p.module, p.action;
