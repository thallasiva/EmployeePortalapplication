/**
 * Small helper to execute the .sql files in backend/database against the
 * configured MySQL server. Usage:
 *
 *   node src/database/runSql.js schema.sql procedures.sql seed.sql
 *
 * or simply: npm run db:init
 *
 * Supports DELIMITER $$ syntax used in stored-procedure files — each
 * statement is sent as a separate query, bypassing mysql2's parser limits.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const files = process.argv.slice(2);
if (files.length === 0) {
  files.push('schema.sql', 'procedures.sql', 'seed.sql');
}

/**
 * Split a SQL file that may use DELIMITER $$ (stored-procedure style) into
 * individual statement strings that can each be sent as a single query.
 *
 * Rules:
 *  - Lines matching /^DELIMITER\s+\S+/i switch the active delimiter.
 *  - Everything else is accumulated; when the current line (trimmed) ends
 *    with the active delimiter the buffered text becomes one statement.
 *  - Comment-only lines and blank statements are skipped.
 */
function splitStatements(sql) {
  const statements = [];
  let delimiter = ';';
  let buf = '';

  for (const raw of sql.split('\n')) {
    const line = raw.trimEnd();
    const upper = line.trimStart().toUpperCase();

    // DELIMITER command — flush buffer and switch delimiter
    if (/^DELIMITER\s+\S+/i.test(line.trimStart())) {
      if (buf.trim()) {
        statements.push(buf.trim());
        buf = '';
      }
      delimiter = line.trimStart().replace(/^DELIMITER\s+/i, '').trim();
      continue;
    }

    buf += raw + '\n';

    // Check if the trimmed line ends with the current delimiter
    const trimmed = line.trim();
    if (trimmed.endsWith(delimiter)) {
      // Strip the trailing delimiter before storing
      const stmt = buf.slice(0, buf.lastIndexOf(delimiter)).trim();
      if (stmt && !stmt.startsWith('--') && !stmt.startsWith('/*')) {
        statements.push(stmt);
      }
      buf = '';
    }
  }

  // Anything remaining (no trailing delimiter)
  if (buf.trim()) {
    statements.push(buf.trim());
  }

  return statements.filter(s => s.replace(/--[^\n]*/g, '').trim().length > 0);
}

async function run() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || undefined,
    multipleStatements: false,   // execute one statement at a time
  });

  for (const file of files) {
    const filePath = path.resolve(__dirname, '..', '..', 'database', file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping missing file: ${filePath}`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const stmts = splitStatements(sql);

    console.log(`\nExecuting ${file} (${stmts.length} statements) ...`);
    let ok = 0, failed = 0;

    for (const stmt of stmts) {
      try {
        await connection.query(stmt);
        ok++;
      } catch (err) {
        // Print first line of statement for context
        const preview = stmt.split('\n')[0].slice(0, 80);
        console.error(`  ✗ ${preview}`);
        console.error(`    → ${err.message}`);
        failed++;
      }
    }

    console.log(`  ✓ ${ok} ok, ${failed > 0 ? `✗ ${failed} failed` : '0 failed'} — ${file}`);
  }

  await connection.end();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
