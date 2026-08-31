const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Connected to', process.env.DB_NAME);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS ai_interview_sessions (
      session_id      INT AUTO_INCREMENT PRIMARY KEY,
      token           VARCHAR(64) NOT NULL UNIQUE,
      candidate_id    INT NOT NULL,
      job_req_id      INT NOT NULL,
      recruiter_id    INT NOT NULL,
      candidate_name  VARCHAR(255) NOT NULL,
      candidate_email VARCHAR(255) NOT NULL,
      job_title       VARCHAR(255) NOT NULL,
      questions_json  LONGTEXT NOT NULL,
      answers_json    LONGTEXT NULL,
      evaluation_json LONGTEXT NULL,
      overall_score   TINYINT UNSIGNED NULL,
      recommendation  ENUM('Strong Hire','Hire','Maybe','No Hire') NULL,
      status          ENUM('pending','completed','expired') NOT NULL DEFAULT 'pending',
      expires_at      DATETIME NOT NULL,
      submitted_at    DATETIME NULL,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_token     (token),
      INDEX idx_candidate (candidate_id),
      INDEX idx_recruiter (recruiter_id),
      INDEX idx_status    (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('✓ Table ai_interview_sessions created (or already exists)');
  await conn.end();
}

run().catch(err => { console.error('✗', err.message); process.exit(1); });
