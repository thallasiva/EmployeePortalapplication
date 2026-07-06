'use strict';
/**
 * encrypt_salary_backfill.js
 * ─────────────────────────────────────────────────────────────────────
 * Reads all salary_structures rows that have plaintext values,
 * encrypts them into salary_encrypted (AES-256-GCM), then NULLs out
 * every plaintext salary column so raw DB access reveals nothing.
 *
 * Also encrypts ctc / base_salary on the employees table.
 *
 * Run ONCE after seeding:
 *   node backend/scripts/encrypt_salary_backfill.js
 *
 * Safe to re-run — rows that already have salary_encrypted and no
 * plaintext values are skipped.
 * ─────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mysql  = require('mysql2/promise');
const crypto = require('crypto');

/* ── encryption constants (must match encryption.js) ─────────────────── */
const ALGORITHM  = 'aes-256-gcm';
const IV_LENGTH  = 12;
const TAG_LENGTH = 16;

const SALARY_STRUCTURE_FIELDS = [
  'basic', 'hra', 'conveyance', 'medical_allowance', 'special_allowance',
  'travel_allowance', 'lta', 'telephone_allowance',
  'pf_employee', 'pf_employer', 'professional_tax', 'income_tax', 'tds',
  'gross_salary', 'net_salary', 'ctc',
];

const EMPLOYEE_SALARY_FIELDS = ['ctc', 'base_salary'];

function getKey() {
  const hex = process.env.SALARY_ENCRYPTION_KEY;
  if (!hex || hex.length < 64) throw new Error('SALARY_ENCRYPTION_KEY not set properly in .env');
  return Buffer.from(hex.slice(0, 64), 'hex');
}

function encrypt(plaintext) {
  const key = getKey();
  const iv  = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
}

function encryptFields(data, fields) {
  const picked = {};
  for (const f of fields) {
    if (data[f] !== null && data[f] !== undefined) picked[f] = data[f];
  }
  if (!Object.keys(picked).length) return null;
  return encrypt(JSON.stringify(picked));
}

async function run() {
  const pool = mysql.createPool({
    host    : process.env.DB_HOST     || 'localhost',
    port    : Number(process.env.DB_PORT || 3306),
    user    : process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'hrms_db',
  });

  const conn = await pool.getConnection();

  try {
    /* ── 1. salary_structures ────────────────────────────────────────── */
    const [structs] = await conn.query('SELECT * FROM salary_structures');
    let ssUpdated = 0;

    for (const row of structs) {
      /* Skip rows already fully encrypted (no plaintext left) */
      const hasPlaintext = SALARY_STRUCTURE_FIELDS.some(f => row[f] !== null && row[f] !== undefined);
      if (!hasPlaintext && row.salary_encrypted) { continue; }

      const encrypted = encryptFields(row, SALARY_STRUCTURE_FIELDS);
      if (!encrypted) continue;

      /* Build NULL-out SET clause for all plaintext salary columns */
      const nullCols = SALARY_STRUCTURE_FIELDS.map(f => `\`${f}\` = NULL`).join(', ');

      await conn.query(
        `UPDATE salary_structures SET salary_encrypted = ?, ${nullCols} WHERE id = ?`,
        [encrypted, row.id]
      );
      ssUpdated++;
    }

    console.log(`✅ salary_structures: ${ssUpdated}/${structs.length} rows encrypted`);

    /* ── 2. employees ctc / base_salary ─────────────────────────────── */
    /* Check if employees table has a salary_encrypted column */
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'employees' AND COLUMN_NAME = 'salary_encrypted'`,
      [process.env.DB_NAME || 'hrms_db']
    );

    if (cols.length === 0) {
      /* Add the column if it doesn't exist */
      await conn.query(
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_encrypted LONGTEXT DEFAULT NULL
         COMMENT 'AES-256-GCM encrypted JSON of ctc and base_salary'`
      );
      console.log('   Added salary_encrypted column to employees table');
    }

    const [emps] = await conn.query('SELECT employee_id, ctc, base_salary FROM employees');
    let empUpdated = 0;

    for (const row of emps) {
      const hasPlaintext = EMPLOYEE_SALARY_FIELDS.some(f => row[f] !== null && row[f] !== undefined);
      if (!hasPlaintext) continue;

      const encrypted = encryptFields(row, EMPLOYEE_SALARY_FIELDS);
      if (!encrypted) continue;

      await conn.query(
        `UPDATE employees SET salary_encrypted = ?, ctc = NULL, base_salary = NULL WHERE employee_id = ?`,
        [encrypted, row.employee_id]
      );
      empUpdated++;
    }

    console.log(`✅ employees:         ${empUpdated}/${emps.length} rows encrypted`);

    /* ── 3. Verify ───────────────────────────────────────────────────── */
    const [[{ plain_ss }]] = await conn.query(
      `SELECT COUNT(*) AS plain_ss FROM salary_structures WHERE basic IS NOT NULL`
    );
    const [[{ plain_emp }]] = await conn.query(
      `SELECT COUNT(*) AS plain_emp FROM employees WHERE ctc IS NOT NULL`
    );

    if (plain_ss > 0 || plain_emp > 0) {
      console.warn(`⚠️  Still has plaintext: salary_structures=${plain_ss}, employees=${plain_emp}`);
    } else {
      console.log('✅ Verification passed — no plaintext salary values remain in DB');
    }

  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error('❌ Backfill failed:', err.message); process.exit(1); });
