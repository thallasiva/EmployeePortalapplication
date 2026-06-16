/**
 * Small helper to execute the .sql files in backend/database against the
 * configured MySQL server. Usage:
 *
 *   node src/database/runSql.js schema.sql procedures.sql seed.sql
 *
 * or simply: npm run db:init
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const files = process.argv.slice(2);
if (files.length === 0) {
  files.push('schema.sql', 'procedures.sql', 'seed.sql');
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  for (const file of files) {
    const filePath = path.resolve(__dirname, '..', '..', 'database', file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping missing file: ${filePath}`);
      continue;
    }
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Executing ${file} ...`);
    await connection.query(sql);
    console.log(`Done: ${file}`);
  }

  await connection.end();
  console.log('Database initialization complete.');
}

run().catch((err) => {
  console.error('Database initialization failed:', err.message);
  process.exit(1);
});
