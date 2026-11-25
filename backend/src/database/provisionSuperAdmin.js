const readline = require('readline');
const { pool } = require('../config/db');

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: npm run rbac:provision-super-admin -- user@example.com');
  }
  if (!process.stdin.isTTY) {
    throw new Error('Super Admin provisioning must be confirmed from an interactive terminal');
  }
  const input = readline.createInterface({ input: process.stdin, output: process.stdout });
  const confirmation = await new Promise((resolve) => {
    input.question(`Type ${email} to grant Super Admin access: `, resolve);
  });
  input.close();
  if (confirmation.trim().toLowerCase() !== email) {
    throw new Error('Confirmation did not match; no access was changed');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.query(
      "SELECT user_id FROM users WHERE LOWER(email) = ? AND LOWER(status) = 'active' LIMIT 1",
      [email]
    );
    if (!users.length) throw new Error('An active user account with that email is required');
    const [roles] = await connection.query(
      "SELECT role_id FROM roles WHERE role_key = 'SUPER_ADMIN' LIMIT 1"
    );
    if (!roles.length) throw new Error('Run migration 073 before provisioning a Super Admin');
    const userId = users[0].user_id;
    const roleId = roles[0].role_id;
    await connection.query(
      `INSERT INTO user_roles (user_id, role_id, is_active)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE is_active = 1, updated_at = CURRENT_TIMESTAMP`,
      [userId, roleId]
    );
    const [assignments] = await connection.query(
      'SELECT user_role_id FROM user_roles WHERE user_id = ? AND role_id = ? LIMIT 1',
      [userId, roleId]
    );
    await connection.query(
      `INSERT INTO user_role_scopes (user_role_id, scope_type)
       SELECT ?, 'GLOBAL'
        WHERE NOT EXISTS (
          SELECT 1 FROM user_role_scopes WHERE user_role_id = ? AND scope_type = 'GLOBAL'
        )`,
      [assignments[0].user_role_id, assignments[0].user_role_id]
    );
    await connection.query(
      `INSERT INTO access_audit_logs
        (target_user_id, role_id, action, scope_type, details)
       VALUES (?, ?, 'SUPER_ADMIN_PROVISIONED', 'GLOBAL', JSON_OBJECT('method', 'interactive_cli'))`,
      [userId, roleId]
    );
    await connection.commit();
    console.log(`Super Admin access provisioned for ${email}. No password was created or changed.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Provisioning failed: ${error.message}`);
  process.exitCode = 1;
});
