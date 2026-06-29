/**
 * backfill_encrypt_salaries.js
 * One-time script to encrypt all existing plaintext salary rows in MySQL.
 * Run AFTER migration_014_encrypt_salary_plaintext.sql.
 *
 * Usage:
 *   node backend/scripts/backfill_encrypt_salaries.js
 *
 * Requires SALARY_ENCRYPTION_KEY set in backend/.env
 */
'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { query }            = require('../src/config/db');
const { encryptSalaryFields } = require('../src/utils/encryption');

async function backfill(table, idCol, fields, nullCols) {
  const hasData = fields.map(f => `${f} IS NOT NULL`).join(' OR ');
  const rows = await query(
    `SELECT * FROM ${table} WHERE salary_encrypted IS NULL AND (${hasData})`
  );
  console.log(`\n[${table}] ${rows.length} rows need encryption`);

  let ok = 0;
  for (const row of rows) {
    const enc = encryptSalaryFields(row);
    if (!enc) continue;
    const nullAssign = nullCols.map(c => `${c} = NULL`).join(', ');
    await query(
      `UPDATE ${table} SET salary_encrypted = ?, ${nullAssign} WHERE ${idCol} = ?`,
      [enc, row[idCol]]
    );
    ok++;
  }
  console.log(`[${table}] Encrypted ${ok} rows`);
}

async function main() {
  console.log('=== Salary Backfill Encryption ===');

  await backfill(
    'salary_structures', 'id',
    ['basic','hra','conveyance','medical_allowance','special_allowance',
     'pf_employee','pf_employer','professional_tax','income_tax','ctc'],
    ['basic','hra','conveyance','medical_allowance','special_allowance',
     'pf_employee','pf_employer','professional_tax','income_tax','ctc']
  );

  await backfill(
    'payslips', 'payslip_id',
    ['basic','hra','allowances','gross_earnings','ctc','deductions','net_pay'],
    ['basic','hra','allowances','gross_earnings','ctc','deductions','net_pay']
  );

  console.log('\nDone — all salary values encrypted. Plaintext columns are now NULL.');
  process.exit(0);
}

main().catch(err => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
