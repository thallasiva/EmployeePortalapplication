/**
 * run-migration-030.js
 * Runs sp_migrate_holidays_shift_location() to safely add
 * shift + location columns to the holidays table.
 *
 * Prerequisites: procedures.sql must already be loaded into MySQL.
 *
 * Run from the backend folder:
 *   node run-migration-030.js
 */

const { callProcedure } = require('./src/config/db');

async function run() {
  console.log('Calling sp_migrate_holidays_shift_location()...');
  await callProcedure('sp_migrate_holidays_shift_location()', []);
  console.log('Migration 030 complete ✅  — shift + location columns are ready.');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
