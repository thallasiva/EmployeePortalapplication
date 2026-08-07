/**
 * Run this script from the backend/ directory to reset the admin password.
 * Usage: node reset-admin-password.js
 */
'use strict';
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hrms_db',
};

const ACCOUNTS = [
  { email: 'admin@yopmail.com',            password: 'Admin@123' },
  { email: 'manager@yopmail.com',          password: 'Manager@123' },
  { email: 'employee.general@yopmail.com', password: 'Employee@123' },
  { email: 'employee.mid@yopmail.com',     password: 'Employee@123' },
  { email: 'employee.night@yopmail.com',   password: 'Employee@123' },
];

async function main() {
  console.log('Connecting to', DB.host, DB.database, '...');
  const conn = await mysql.createConnection(DB);
  console.log('Connected.\n');

  for (const { email, password } of ACCOUNTS) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await conn.execute(
      "UPDATE users SET password_hash = ?, status = 'Active', failed_login_attempts = 0, locked_until = NULL WHERE email = ?",
      [hash, email]
    );
    if (result.affectedRows) {
      console.log(`✓ Reset  ${email}  →  ${password}`);
    } else {
      console.log(`✗ Not found: ${email}`);
    }
  }

  await conn.end();
  console.log('\nDone. You can now log in with the credentials above.');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
