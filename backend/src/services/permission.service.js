const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Module names map to the tabs shown on the "Manage Permissions" screen
 * (All, Details, Salaries, TimeOff, ...). Each module/action combination
 * is a row in `permissions`; `role_permissions` flags which are granted
 * to a given role.
 */
async function listPermissions() {
  return query('SELECT * FROM permissions ORDER BY module, action');
}

async function getRolePermissions(roleId) {
  const role = await query('SELECT * FROM roles WHERE role_id = ?', [roleId]);
  if (!role.length) throw ApiError.notFound('Role not found');

  const rows = await query(
    `SELECT p.permission_id, p.module, p.action,
            IFNULL(rp.allowed, 0) AS allowed
       FROM permissions p
       LEFT JOIN role_permissions rp ON rp.permission_id = p.permission_id AND rp.role_id = ?
      ORDER BY p.module, p.action`,
    [roleId]
  );

  // group by module for the tabbed UI (All / Details / Salaries / TimeOff / ...)
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.module]) grouped[row.module] = {};
    grouped[row.module][row.action] = !!row.allowed;
  }

  return { roleId: Number(roleId), roleName: role[0].role_name, permissions: grouped, raw: rows };
}

/**
 * @param {number} roleId
 * @param {Array<{module: string, action: string, allowed: boolean}>} updates
 */
async function updateRolePermissions(roleId, updates) {
  const role = await query('SELECT role_id FROM roles WHERE role_id = ?', [roleId]);
  if (!role.length) throw ApiError.notFound('Role not found');

  await withTransaction(async (conn) => {
    for (const update of updates) {
      const [perm] = await conn.query(
        'SELECT permission_id FROM permissions WHERE module = ? AND action = ?',
        [update.module, update.action]
      );
      if (!perm.length) continue; // ignore unknown module/action combos

      await conn.query(
        `INSERT INTO role_permissions (role_id, permission_id, allowed)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE allowed = ?`,
        [roleId, perm[0].permission_id, update.allowed ? 1 : 0, update.allowed ? 1 : 0]
      );
    }
  });

  return getRolePermissions(roleId);
}

module.exports = { listPermissions, getRolePermissions, updateRolePermissions };
