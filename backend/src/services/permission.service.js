const { callProcedure, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listPermissions() {
  const results = await callProcedure('sp_list_permissions()');
  return results[0] ?? [];
}

async function getRolePermissions(roleId) {
  const roleResults = await callProcedure('sp_get_role(?)', [roleId]);
  const role = (roleResults[0] ?? [])[0];
  if (!role) throw ApiError.notFound('Role not found');

  const permResults = await callProcedure('sp_get_role_permissions(?)', [roleId]);
  const rows = permResults[0] ?? [];

  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.module]) grouped[row.module] = {};
    grouped[row.module][row.action] = !!row.allowed;
  }

  return { roleId: Number(roleId), roleName: role.role_name, permissions: grouped, raw: rows };
}

async function updateRolePermissions(roleId, updates) {
  const roleResults = await callProcedure('sp_get_role(?)', [roleId]);
  if (!(roleResults[0] ?? []).length) throw ApiError.notFound('Role not found');

  await withTransaction(async (conn) => {
    for (const update of updates) {
      await conn.query('CALL sp_upsert_role_permission(?, ?, ?, ?)', [
        roleId, update.module, update.action, update.allowed ? 1 : 0,
      ]);
    }
  });

  return getRolePermissions(roleId);
}

module.exports = { listPermissions, getRolePermissions, updateRolePermissions };
