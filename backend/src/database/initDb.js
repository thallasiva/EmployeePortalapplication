/**
 * Railway DB initialiser — run once after provisioning MySQL on Railway.
 *
 *   node src/database/initDb.js
 *
 * Executes all SQL files in order: schema → migrations → seeds.
 * Uses DATABASE_URL (Railway format) or individual DB_* env vars.
 */
'use strict';

require('dotenv').config();
const fs      = require('fs');
const path    = require('path');
const mysql   = require('mysql2/promise');
const { db }  = require('../config/env');

const DB_DIR = path.join(__dirname, '../../database');

const SQL_FILES = [
  'schema.sql',
  'procedures.sql',
  'migration_002_employee_extended_fields.sql',
  'migration_003_fix_leave_balance_init.sql',
  'migration_004_default_users_and_balances.sql',
  'migration_005_sample_salary_structure.sql',
  'migration_006_salary_structures_all_employees.sql',
  'migration_007_payslips_ctc.sql',
  'migration_008_timesheet.sql',
  'migration_009_salary_encryption.sql',
  'migration_010_auth_hardening.sql',
  'migration_011_new_employees_with_regime.sql',
  'migration_012_salary_structure_lta_telephone.sql',
  'migration_013_performance_indexes.sql',
  'migration_014_encrypt_salary_plaintext.sql',
  'migration_015_appraisal.sql',
  'migration_016_it_declaration.sql',
  'migration_017_resignations.sql',
  'migration_018_resignation_review.sql',
  'migration_019_fix_resignation_columns.sql',
  'migration_020_recreate_resignations.sql',
  'migration_021_employee_work_schedules.sql',
  'migration_022_appraisal_enrollments.sql',
  'migration_023_extra_work_nullable_timesheet.sql',
  'migration_024_helpdesk_status_approved_rejected.sql',
  'migration_025_helpdesk_reopened.sql',
  'migration_026_task_timesheet_status.sql',
  'migration_027_appraisal_cycle_rollout.sql',
  'migration_028_appraisal_cycle_type.sql',
  'migration_029_appraisal_disable_cols.sql',
  'migration_030_holidays_shift_location.sql',
  // Workflow delegation migrations
  'migration_031_workflow_delegations.sql',
  // Seeds
  'seed.sql',
  'seed_natit_founders.sql',
  'seed_project_team.sql',
  'seed_documents.sql',
  'fix_all_hierarchy.sql',
];

async function runFile(conn, file) {
  const filePath = path.join(DB_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠  Skipping (not found): ${file}`);
    return;
  }
  let sql = fs.readFileSync(filePath, 'utf8');

  // Strip single-line comments FIRST so they don't swallow adjacent SQL
  // when we split on semicolons (a comment before CREATE TABLE would
  // cause the whole chunk to be treated as a comment and filtered out).
  sql = sql.replace(/--[^\n]*/g, '');

  // MySQL 8.0 doesn't support "ADD COLUMN IF NOT EXISTS" (that's MariaDB only).
  // Normalise to plain "ADD COLUMN" and let error-code 1060 silently skip dupes.
  sql = sql.replace(/\bADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+/gi, 'ADD COLUMN ');
  // Similarly, "DROP INDEX IF EXISTS" isn't standard MySQL — normalise it.
  sql = sql.replace(/\bDROP\s+INDEX\s+IF\s+EXISTS\s+/gi, 'DROP INDEX ');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    // Railway provides its own database — skip DB-switching statements
    .filter(s => !/^(USE\s|CREATE\s+DATABASE)/i.test(s));

  for (const stmt of statements) {
    try {
      await conn.query(stmt);
    } catch (err) {
      // Ignore "already exists" / "duplicate" / "doesn't exist" errors from re-runs
      const ignored = new Set([
        'ER_TABLE_EXISTS_ERROR',  // 1050 – CREATE TABLE on existing table
        'ER_DUP_ENTRY',           // 1062 – INSERT duplicate key
        'ER_DUP_FIELDNAME',       // 1060 – ADD COLUMN on existing column
        'ER_CANT_DROP_FIELD_OR_KEY', // 1091 – DROP column/key that doesn't exist
      ]);
      const ignoredNums = new Set([1050, 1062, 1060, 1091]);
      if (ignored.has(err.code) || ignoredNums.has(err.errno)) {
        // silently skip
      } else {
        console.warn(`  ⚠  ${file}: ${err.message.slice(0, 120)}`);
      }
    }
  }
}

async function main() {
  console.log('🚀  HRMS DB Init');
  console.log(`    Host: ${db.host}:${db.port}  DB: ${db.database}`);

  const conn = await mysql.createConnection({
    host:     db.host,
    port:     db.port,
    user:     db.user,
    password: db.password,
    database: db.database,
    multipleStatements: true,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  console.log('✅  Connected to MySQL');

  for (const file of SQL_FILES) {
    process.stdout.write(`  → ${file} … `);
    await runFile(conn, file);
    console.log('done');
  }

  await conn.end();
  console.log('\n✅  DB initialisation complete');
}

main().catch(err => {
  console.error('❌  DB init failed:', err.message);
  process.exit(1);
});
