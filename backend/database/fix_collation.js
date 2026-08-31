/**
 * fix_collation.js
 * Converts all tables in hrms_db to utf8mb4_0900_ai_ci (MySQL 8 default)
 * Uses query() not execute() — DDL requires text protocol, not prepared statements.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
};

const TARGET_CHARSET   = 'utf8mb4';
const TARGET_COLLATION = 'utf8mb4_0900_ai_ci';

async function main() {
  console.log(`Connecting to ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}...`);
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connected.\n');

  try {
    // Step 1: alter the database default (use query(), not execute() — DDL doesn't support prepared stmts)
    console.log(`[1] ALTER DATABASE hrms_db -> ${TARGET_COLLATION}`);
    await conn.query(
      `ALTER DATABASE \`${DB_CONFIG.database}\` CHARACTER SET ${TARGET_CHARSET} COLLATE ${TARGET_COLLATION}`
    );
    console.log('    Done.\n');

    // Step 2: get all tables
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '${DB_CONFIG.database}' AND TABLE_TYPE = 'BASE TABLE'`
    );

    console.log(`[2] Converting ${tables.length} tables...`);
    let ok = 0, failed = 0;
    for (const row of tables) {
      const tbl = row.TABLE_NAME;
      try {
        await conn.query(
          `ALTER TABLE \`${tbl}\` CONVERT TO CHARACTER SET ${TARGET_CHARSET} COLLATE ${TARGET_COLLATION}`
        );
        console.log(`    OK: ${tbl}`);
        ok++;
      } catch (e) {
        console.error(`    FAIL ${tbl}: ${e.message}`);
        failed++;
      }
    }
    console.log(`\n    ${ok} tables converted, ${failed} failed.`);

    // Step 3: verify users.email
    console.log('\n[3] Verifying users.email...');
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = '${DB_CONFIG.database}' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email'`
    );
    if (cols.length) {
      const c = cols[0];
      console.log(`    ${c.COLUMN_NAME}: charset=${c.CHARACTER_SET_NAME}, collation=${c.COLLATION_NAME}`);
      if (c.COLLATION_NAME === TARGET_COLLATION) {
        console.log('    Collation is CORRECT!');
      } else {
        console.log(`    WARNING: still ${c.COLLATION_NAME}`);
      }
    }

    console.log('\nCollation fix complete. Restart the backend and test login.');

  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
