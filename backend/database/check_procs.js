const mysql = require('mysql2/promise');
if (!process.env.PROD_DB_PASSWORD) {
  console.error('Set PROD_DB_PASSWORD (the production DB password is no longer stored in this file).');
  process.exit(1);
}
async function main() {
  const conn = await mysql.createConnection({
    host: 'hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com',
    port: 4306,
    user: 'HRMSadmin',
    password: process.env.PROD_DB_PASSWORD,
    database: 'hrms_db'
  });
  const [rows] = await conn.query("SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='hrms_db' AND ROUTINE_TYPE='PROCEDURE' ORDER BY ROUTINE_NAME");
  console.log("Existing procedures:");
  rows.forEach(r => console.log(' ', r.ROUTINE_NAME));
  await conn.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
