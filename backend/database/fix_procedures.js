/**
 * HRMS Procedure Fixer — fixes the 30 failed procedures and deploys them.
 *
 * HOW TO RUN:
 *   cd C:\TimeSheet\humanresourceshradmintemplate\backend\database
 *   node fix_procedures.js
 *
 * Fixes applied:
 *  1. IFNULL(p_limit,…) / IFNULL(p_offset,…) in LIMIT/OFFSET → DECLARE variables
 *  2. LEAVE proc_name; → RETURN;
 *  3. COLLATE utf8mb4_unicode_ci on IN parameters → removed (MySQL 8.4 incompatible)
 *  4. sp_delete_designation truncated body → rewritten
 *  5. sp_manager_action_ticket syntax → restructured
 */

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const DB_CONFIG = {
  host: 'hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com',
  port: 4306,
  user: 'HRMSadmin',
  password: 'HwULGJ6gbxQIhzwNeZ9L',
  database: 'hrms_db',
  multipleStatements: false,
  connectTimeout: 30000,
};

// ── Fix: IFNULL(p_limit,…) in LIMIT clause ───────────────────────────────────
function fixIfnullLimit(sql) {
  // Add DECLARE variables for limit/offset at top of BEGIN block
  // Replace LIMIT IFNULL(p_limit, MAX) OFFSET IFNULL(p_offset, 0)
  // with    LIMIT v_limit OFFSET v_offset

  if (!sql.match(/LIMIT\s+IFNULL\s*\(/i)) return sql;

  // Add declarations after BEGIN
  let fixed = sql.replace(
    /^(\s*BEGIN\s*\n)/im,
    '$1  DECLARE v_limit  BIGINT UNSIGNED DEFAULT 18446744073709551615;\n' +
    '  DECLARE v_offset BIGINT UNSIGNED DEFAULT 0;\n' +
    '  IF p_limit  IS NOT NULL THEN SET v_limit  = p_limit;  END IF;\n' +
    '  IF p_offset IS NOT NULL THEN SET v_offset = p_offset; END IF;\n'
  );

  // Replace all LIMIT IFNULL(p_limit, …) patterns
  fixed = fixed.replace(
    /LIMIT\s+IFNULL\s*\(\s*p_limit\s*,\s*[\d]+\s*\)/gi,
    'LIMIT v_limit'
  );
  // Replace OFFSET IFNULL(p_offset, …) patterns
  fixed = fixed.replace(
    /OFFSET\s+IFNULL\s*\(\s*p_offset\s*,\s*\d+\s*\)/gi,
    'OFFSET v_offset'
  );

  return fixed;
}

// ── Fix: LEAVE proc_name → RETURN ────────────────────────────────────────────
function fixLeaveLabel(sql) {
  // Replace LEAVE <procedure_name>; with RETURN;
  return sql.replace(/\bLEAVE\s+sp_\w+\s*;/g, 'RETURN;');
}

// ── Fix: COLLATE on IN params ─────────────────────────────────────────────────
function fixCollateParams(sql) {
  // Remove COLLATE utf8mb4_unicode_ci from parameter declarations only
  // Pattern: IN p_xxx TYPE COLLATE utf8mb4_unicode_ci,
  return sql.replace(
    /(\bIN\s+\w+\s+\w+(?:\(\d+\))?)\s+COLLATE\s+\w+/gi,
    '$1'
  );
}

// ── Hardcoded fixes for procedures that need manual rewriting ─────────────────
const MANUAL_FIXES = {

  sp_delete_designation: `
DROP PROCEDURE IF EXISTS sp_delete_designation;
CREATE PROCEDURE sp_delete_designation (IN p_id INT)
BEGIN
  DELETE FROM designations WHERE designation_id = p_id;
END`,

  sp_manager_action_ticket: `
DROP PROCEDURE IF EXISTS sp_manager_action_ticket;
CREATE PROCEDURE sp_manager_action_ticket (
  IN  p_manager_id   INT,
  IN  p_ticket_id    INT,
  IN  p_action       VARCHAR(20),
  IN  p_forward_team VARCHAR(50),
  IN  p_comment      TEXT,
  OUT p_ok           TINYINT,
  OUT p_msg          VARCHAR(200)
)
BEGIN
  DECLARE v_status VARCHAR(30);
  DECLARE v_cnt    INT DEFAULT 0;

  SELECT COUNT(*) INTO v_cnt
    FROM helpdesk_tickets t
    JOIN employees e ON e.employee_id = t.employee_id
   WHERE t.ticket_id = p_ticket_id AND e.reporting_to = p_manager_id;

  IF v_cnt = 0 THEN
    SET p_ok = 0;
    SET p_msg = 'Ticket does not belong to your team';
    RETURN;
  END IF;

  SELECT status INTO v_status
    FROM helpdesk_tickets
   WHERE ticket_id = p_ticket_id
   LIMIT 1;

  IF v_status != 'Open' THEN
    SET p_ok = 0;
    SET p_msg = 'Only Open tickets can be actioned by manager';
    RETURN;
  END IF;

  IF p_action = 'approve' THEN
    UPDATE helpdesk_tickets
       SET status = 'Forwarded', forwarded_to_team = p_forward_team
     WHERE ticket_id = p_ticket_id;
    INSERT INTO helpdesk_comments (ticket_id, commented_by, comment)
    VALUES (p_ticket_id, p_manager_id, p_comment);
  ELSE
    UPDATE helpdesk_tickets
       SET status = 'Rejected', resolved_at = NOW()
     WHERE ticket_id = p_ticket_id;
    INSERT INTO helpdesk_comments (ticket_id, commented_by, comment)
    VALUES (p_ticket_id, p_manager_id, p_comment);
  END IF;

  SET p_ok  = 1;
  SET p_msg = 'OK';
END`,
};

// ── List of failed procedure names ────────────────────────────────────────────
const FAILED = [
  'sp_list_employees','sp_list_leave_requests','sp_list_attendance',
  'sp_list_helpdesk_tickets','sp_list_team_helpdesk','sp_get_all_resignations',
  'sp_list_payslips','sp_list_salary_structures','sp_list_reviews',
  'sp_list_delegations','sp_manager_action_ticket','sp_list_workflow_delegates',
  'sp_list_payroll_runs','sp_list_teams','sp_review_timesheet',
  'sp_list_documents','sp_list_jobs','sp_list_job_applications',
  'sp_list_referrals','sp_list_request_hub','sp_list_attendance_regularization',
  'sp_search_employees_org','sp_assign_manager','sp_bulk_assign_manager',
  'sp_get_org_history','sp_recent_activities','sp_list_calendar_events',
  'sp_delete_designation',
];

function extractProc(allSql, procName) {
  // Match from DROP PROCEDURE IF EXISTS <name> $$ to next END $$
  const re = new RegExp(
    `DROP PROCEDURE IF EXISTS ${procName}\\s*\\$\\$[\\s\\S]*?END\\s*\\$\\$`,
    'i'
  );
  const m = allSql.match(re);
  return m ? m[0] : null;
}

function applyFixes(sql, name) {
  // Remove $$ delimiters to get plain SQL
  let fixed = sql
    .replace(/^DROP PROCEDURE IF EXISTS \w+\s*\$\$\s*/i, `DROP PROCEDURE IF EXISTS ${name};\n`)
    .replace(/\$\$\s*$/, '');

  fixed = fixIfnullLimit(fixed);
  fixed = fixLeaveLabel(fixed);
  fixed = fixCollateParams(fixed);

  return fixed;
}

async function main() {
  const sqlFile = path.join(__dirname, 'all_procedures.sql');
  const allSql  = fs.readFileSync(sqlFile, 'utf8');

  console.log('Connecting ...');
  let conn;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('Connected!\n');
  } catch (e) {
    console.error('Connection failed:', e.message);
    process.exit(1);
  }

  let ok = 0, err = 0;

  for (const name of FAILED) {
    // Use manual fix if available
    if (MANUAL_FIXES[name]) {
      const stmts = MANUAL_FIXES[name].trim().split(/;\s*\n(?=\s*(?:CREATE|DROP))/);
      let success = true;
      for (const s of stmts) {
        const trimmed = s.trim();
        if (!trimmed) continue;
        try { await conn.query(trimmed); } catch(e) {
          console.log(`  ERR ${name} (manual): ${e.message}`);
          err++;
          success = false;
          break;
        }
      }
      if (success) { console.log(`  OK  ${name} (manual fix)`); ok++; }
      continue;
    }

    // Extract from file and auto-fix
    const raw = extractProc(allSql, name);
    if (!raw) {
      console.log(`  SKIP ${name} — not found in SQL file`);
      continue;
    }

    const fixed = applyFixes(raw, name);

    // Split into DROP + CREATE
    const parts = fixed.split(/\n(?=CREATE PROCEDURE)/i);
    let success = true;
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      try { await conn.query(trimmed); } catch(e) {
        console.log(`  ERR ${name}: ${e.message}`);
        err++;
        success = false;
        break;
      }
    }
    if (success) { console.log(`  OK  ${name}`); ok++; }
  }

  // Verify
  let total = '?';
  try {
    const [rows] = await conn.execute(
      "SELECT COUNT(*) AS cnt FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA=? AND ROUTINE_TYPE='PROCEDURE'",
      [DB_CONFIG.database]
    );
    total = rows[0].cnt;
  } catch(_) {}

  await conn.end();

  console.log('\n' + '='.repeat(50));
  console.log(`Fixed: ${ok}  |  Still failing: ${err}`);
  console.log(`Total procedures in DB: ${total}`);
  console.log('='.repeat(50));
}

main().catch(e => { console.error(e); process.exit(1); });
