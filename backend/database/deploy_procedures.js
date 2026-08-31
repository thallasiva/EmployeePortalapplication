/**
 * HRMS Stored Procedures Deployment Script (Node.js)
 * ====================================================
 * HOW TO RUN:
 *   npm install mysql2          (from project root)
 *   cd backend\database
 *   node deploy_procedures.js
 */

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const DB_CONFIG = {
  host:     'hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com',
  port:     4306,
  user:     'HRMSadmin',
  password: 'HwULGJ6gbxQIhzwNeZ9L',
  database: 'hrms_db',
  multipleStatements: false,
  connectTimeout: 30000,
};

const SQL_FILE = path.join(__dirname, 'all_procedures.sql');

function parseStatements(sqlContent) {
  // The file uses $$ as terminator (no DELIMITER declaration at top).
  // Split the whole file on $$ to get individual statements.
  const chunks = sqlContent.split('$$');
  const statements = [];

  for (const chunk of chunks) {
    const stmt = chunk.trim();
    if (!stmt || stmt.startsWith('--') || stmt.length < 10) continue;

    // Remove standalone USE statements (we're already on the right DB)
    if (/^\s*USE\s+\w+\s*;?\s*$/i.test(stmt)) continue;

    // Remove pure comment blocks
    const noComments = stmt.replace(/--[^\n]*/g, '').trim();
    if (!noComments) continue;

    statements.push(stmt);
  }

  return statements;
}

async function main() {
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`ERROR: ${SQL_FILE} not found.`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
  console.log(`Read all_procedures.sql (${sqlContent.length.toLocaleString()} bytes)`);

  const statements = parseStatements(sqlContent);
  console.log(`Found ${statements.length} statements to execute\n`);

  console.log(`Connecting to ${DB_CONFIG.host}:${DB_CONFIG.port} ...`);
  let conn;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('Connected!\n');
  } catch (err) {
    console.error(`Connection failed: ${err.message}`);
    process.exit(1);
  }

  let success = 0, errors = 0;
  const failed = [];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await conn.query(stmt);
      const m = stmt.match(/CREATE\s+PROCEDURE\s+(\w+)/i);
      if (m) {
        console.log(`  [${String(i+1).padStart(3)}] OK  ${m[1]}`);
        success++;
      }
    } catch (err) {
      const m = stmt.match(/CREATE\s+PROCEDURE\s+(\w+)/i) ||
                stmt.match(/DROP\s+PROCEDURE.*?(\w+)\s*$/i);
      const name = m ? m[1] : `stmt_${i+1}`;
      // Only log CREATE errors (DROP IF EXISTS errors are harmless)
      if (/CREATE\s+PROCEDURE/i.test(stmt)) {
        console.log(`  [${String(i+1).padStart(3)}] ERR ${name}: ${err.message}`);
        failed.push({ name, error: err.message });
        errors++;
      }
    }
  }

  // Verify count
  let dbCount = '?';
  try {
    const [rows] = await conn.execute(
      "SELECT COUNT(*) AS cnt FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'",
      [DB_CONFIG.database]
    );
    dbCount = rows[0].cnt;
  } catch (_) {}

  await conn.end();

  console.log('\n' + '='.repeat(60));
  console.log('DEPLOYMENT COMPLETE');
  console.log(`  Procedures created successfully : ${success}`);
  console.log(`  Errors                         : ${errors}`);
  console.log(`  Procedures in DB (verified)    : ${dbCount}`);
  console.log('='.repeat(60));

  if (failed.length) {
    console.log(`\nFailed (${failed.length}):`);
    failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
