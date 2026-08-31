/**
 * deploy_all_procs.js
 * Deploys ALL stored procedures to RDS from all SQL migration files.
 * Run: node deploy_all_procs.js
 */
// Support running from /tmp or from the database/ directory
// Load path/fs first so we can resolve BACKEND_DIR node_modules
const path  = require('path');
const fs    = require('fs');
const BACKEND_DIR = process.env.BACKEND_DIR || '/var/EmployeePortalapplication/backend';
// Load dotenv and mysql2 from backend node_modules (not from /tmp which has none)
require(path.join(BACKEND_DIR, 'node_modules', 'dotenv')).config({ path: path.join(BACKEND_DIR, '.env') });
const mysql = require(path.join(BACKEND_DIR, 'node_modules', 'mysql2', 'promise'));

const DB_DIR = path.join(BACKEND_DIR, 'database');

// Order matters - patches must come after the base procedures they patch
const SQL_FILES = [
  'all_procedures.sql',
  'migration_034_recruitment_procedures.sql',
  'patch_auth_procedures.sql',
  'patch_sp_list_candidates.sql',
  'patch_rec_admin_dashboard_shortlisted.sql',
  'patch_rec_list_candidates_interview_feedback.sql',
  'patch_rec_interviews_candidate_type.sql',
  'patch_rec_interviews_duration.sql',
  'patch_rec_interviews_enum.sql',
  'patch_interview_recruiter_feedback.sql',
  'patch_sp_feedback_progression.sql',
  'patch_resume_match.sql',
  'patch_resume_parser_procedures.sql',
  'patch_ALL_run_once.sql',
  'patch_stored_procedure_runtime_queries.sql',
  'patch_salary_assignment_sps.sql',
  'patch_managers_list.sql',
  'patch_joining_get_invitation.sql',
  'patch_joining_review_fix_mysql.sql',
  'patch_joining_doc_uploads.sql',
  'patch_joining_verify_token_mobile.sql',
  'patch_joining_token_expiry_fix.sql',
  'create_missing_procs.sql',
];

function parseProcedures(sql) {
  // Normalize line endings
  sql = sql.replace(/\r\n/g, '\n');
  
  const blocks = [];
  
  // Split on DELIMITER changes
  const delimiterPattern = /^DELIMITER\s+(\S+)\s*$/gim;
  let currentDelimiter = ';';
  let pos = 0;
  let match;
  
  const segments = [];
  let lastPos = 0;
  
  // Find all DELIMITER lines and split content between them
  const delimLines = [];
  const lines = sql.split('\n');
  let lineStart = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.toUpperCase().startsWith('DELIMITER')) {
      const parts = trimmed.split(/\s+/);
      if (parts[1]) {
        delimLines.push({ lineIdx: i, delimiter: parts[1] });
      }
    }
  }
  
  if (delimLines.length === 0) {
    // No DELIMITER directives - split on semicolons
    return sql.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
  }
  
  // Process with delimiter changes
  let curDelim = ';';
  let curBlock = [];
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    
    // Check if this is a DELIMITER line
    const delimMatch = trimmed.match(/^DELIMITER\s+(\S+)\s*$/i);
    if (delimMatch) {
      const newDelim = delimMatch[1];
      if (curBlock.length > 0) {
        const blockText = curBlock.join('\n').trim();
        if (blockText) {
          // Split current block by old delimiter
          const parts = blockText.split(curDelim === '$$' ? /\$\$/ : curDelim);
          parts.forEach(p => {
            const pt = p.trim();
            if (pt && !pt.startsWith('--')) blocks.push(pt);
          });
        }
        curBlock = [];
      }
      curDelim = newDelim;
      continue;
    }
    
    curBlock.push(lines[i]);
  }
  
  // Handle remaining content
  if (curBlock.length > 0) {
    const blockText = curBlock.join('\n');
    const parts = blockText.split(curDelim === '$$' ? /\$\$/ : curDelim);
    parts.forEach(p => {
      const pt = p.trim();
      if (pt && !pt.startsWith('--')) blocks.push(pt);
    });
  }
  
  return blocks;
}

async function deployFile(conn, filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP (not found): ${path.basename(filePath)}`);
    return { ok: 0, fail: 0, skip: 1 };
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  const blocks = parseProcedures(sql);
  
  let ok = 0, fail = 0;
  
  for (const block of blocks) {
    const upper = block.toUpperCase().trim();
    
    // Only execute meaningful statements
    if (!upper || upper.length < 5) continue;
    if (upper.startsWith('--') || upper.startsWith('#')) continue;
    
    // Skip pure SET statements that aren't important
    if (upper === 'SET GLOBAL LOG_BIN_TRUST_FUNCTION_CREATORS = 1' ||
        upper === 'SET NAMES UTF8MB4' ||
        upper.match(/^SET\s+@/)) {
      // Try to execute anyway but don't count failures
      try { await conn.query(block); } catch(e) {}
      continue;
    }
    
    try {
      await conn.query(block);
      ok++;
      if (upper.includes('PROCEDURE') || upper.includes('FUNCTION')) {
        const nameMatch = block.match(/PROCEDURE\s+`?(\w+)`?\s*\(/i) || 
                          block.match(/FUNCTION\s+`?(\w+)`?\s*\(/i);
        if (nameMatch) process.stdout.write(`  ✓ ${nameMatch[1]}\n`);
      }
    } catch(e) {
      // Ignore common non-errors
      if (e.code === 'ER_EMPTY_QUERY') continue;
      if (e.message.includes("doesn't exist") && upper.startsWith('DROP')) continue;
      
      if (upper.startsWith('CREATE') && upper.includes('PROCEDURE')) {
        const nameMatch = block.match(/PROCEDURE\s+`?(\w+)`?\s*\(/i);
        console.log(`  ✗ ${nameMatch?.[1] || 'unknown'}: ${e.message.substring(0, 100)}`);
        fail++;
      }
    }
  }
  
  return { ok, fail, skip: 0 };
}

async function main() {
  console.log('='.repeat(60));
  console.log('HRMS Stored Procedure Deployment');
  console.log('Host:', process.env.DB_HOST);
  console.log('DB:  ', process.env.DB_NAME);
  console.log('='.repeat(60));
  
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false,
  });
  
  // Allow stored procedures
  try { await conn.query('SET GLOBAL log_bin_trust_function_creators = 1'); } catch(e) {}
  
  let totalOk = 0, totalFail = 0;
  
  for (const file of SQL_FILES) {
    const filePath = path.join(DB_DIR, file);
    console.log(`\n[FILE] ${file}`);
    const result = await deployFile(conn, filePath);
    totalOk   += result.ok;
    totalFail += result.fail;
    if (result.skip) console.log('  (skipped)');
  }
  
  await conn.end();
  
  console.log('\n' + '='.repeat(60));
  console.log(`DONE — ${totalOk} executed, ${totalFail} failed`);
  console.log('='.repeat(60));
  
  // Verify key procedures exist
  const verify = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  const [rows] = await verify.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA=? AND ROUTINE_TYPE='PROCEDURE'",
    [process.env.DB_NAME]
  );
  console.log(`\nTotal procedures now in ${process.env.DB_NAME}: ${rows[0].cnt}`);
  
  const keyProcs = ['sp_dashboard_stats','sp_attendance_dashboard','sp_rec_admin_dashboard',
                    'sp_joining_list_pending','sp_rec_list_active_recruiters','sp_recent_activities',
                    'sp_list_leave_requests','sp_get_user_for_login'];
  const [existing] = await verify.query(
    `SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA=? AND ROUTINE_NAME IN (${keyProcs.map(()=>'?').join(',')})`,
    [process.env.DB_NAME, ...keyProcs]
  );
  const existSet = new Set(existing.map(r => r.ROUTINE_NAME));
  console.log('\nKey procedure check:');
  keyProcs.forEach(p => console.log(`  ${existSet.has(p) ? '✓' : '✗'} ${p}`));
  
  await verify.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
