const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, multipleStatements: false,
  });
  console.log('Connected to', process.env.DB_NAME);

  // Add columns if missing
  const [cols] = await conn.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rec_interviews'
    AND COLUMN_NAME IN ('duration_minutes','candidate_type')`, [process.env.DB_NAME]);
  const existing = cols.map(c => c.COLUMN_NAME);

  if (!existing.includes('duration_minutes')) {
    await conn.query(`ALTER TABLE rec_interviews ADD COLUMN duration_minutes INT NULL DEFAULT NULL AFTER interview_time`);
    console.log('✓ Added duration_minutes column');
  } else { console.log('- duration_minutes already exists'); }

  if (!existing.includes('candidate_type')) {
    await conn.query(`ALTER TABLE rec_interviews ADD COLUMN candidate_type ENUM('Internal','External') NOT NULL DEFAULT 'External' AFTER interviewer`);
    console.log('✓ Added candidate_type column');
  } else { console.log('- candidate_type already exists'); }

  // Drop and recreate procedure
  await conn.query(`DROP PROCEDURE IF EXISTS sp_rec_schedule_interview`);
  console.log('✓ Dropped old procedure');

  await conn.query(`
CREATE PROCEDURE sp_rec_schedule_interview(
  IN  p_candidate_id      INT,
  IN  p_job_req_id        INT,
  IN  p_level             VARCHAR(30),
  IN  p_interview_type    VARCHAR(30),
  IN  p_interview_date    DATE,
  IN  p_interview_time    TIME,
  IN  p_duration_minutes  INT,
  IN  p_interviewer       VARCHAR(200),
  IN  p_candidate_type    VARCHAR(20),
  IN  p_teams_subject     VARCHAR(500),
  IN  p_teams_participants TEXT,
  IN  p_teams_start       DATETIME,
  IN  p_teams_end         DATETIME,
  IN  p_scheduled_by      INT,
  IN  p_ip                VARCHAR(45),
  OUT p_interview_id      INT,
  OUT p_interview_code    VARCHAR(20)
)
BEGIN
  DECLARE v_code VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF NOT EXISTS (SELECT 1 FROM rec_candidates WHERE candidate_id = p_candidate_id AND deleted_at IS NULL) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Candidate not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM rec_interviews
    WHERE candidate_id = p_candidate_id AND level = p_level AND status = 'Scheduled'
  ) THEN
    SIGNAL SQLSTATE '45003' SET MESSAGE_TEXT = 'An active interview already exists for this candidate at this level';
  END IF;

  START TRANSACTION;
    CALL sp_rec_next_code('INT', 'rec_interviews', 'interview_code', v_code);

    INSERT INTO rec_interviews (
      interview_code, candidate_id, job_req_id, level, interview_type,
      interview_date, interview_time, duration_minutes, interviewer, candidate_type,
      teams_subject, teams_participants, teams_start, teams_end,
      status, scheduled_by
    ) VALUES (
      v_code, p_candidate_id, p_job_req_id, p_level, p_interview_type,
      p_interview_date, p_interview_time, p_duration_minutes, p_interviewer,
      COALESCE(p_candidate_type, 'External'),
      p_teams_subject, p_teams_participants, p_teams_start, p_teams_end,
      'Scheduled', p_scheduled_by
    );

    SET p_interview_id   = LAST_INSERT_ID();
    SET p_interview_code = v_code;

    UPDATE rec_candidates
    SET status = 'Interview Scheduled', updated_by = p_scheduled_by
    WHERE candidate_id = p_candidate_id;

    CALL sp_rec_audit('interview', p_interview_id, 'scheduled',
      NULL, JSON_OBJECT('level', p_level, 'interview_type', p_interview_type,
                        'interview_date', p_interview_date, 'candidate_type', p_candidate_type),
      p_scheduled_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_interview(p_interview_id);
END`);

  console.log('✓ Recreated sp_rec_schedule_interview with 15 IN + 2 OUT params');
  await conn.end();
  console.log('Done.');
}

run().catch(err => { console.error('✗', err.message); process.exit(1); });
