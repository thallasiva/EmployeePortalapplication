'use strict';
require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrms_db',
    multipleStatements: false,
  });

  // Add location columns safely (skip if already exists)
  const locationCols = [
    ['checkin_lat',       'DECIMAL(10,6) DEFAULT NULL'],
    ['checkin_lng',       'DECIMAL(10,6) DEFAULT NULL'],
    ['checkin_location',  'VARCHAR(200)  DEFAULT NULL'],
    ['checkout_lat',      'DECIMAL(10,6) DEFAULT NULL'],
    ['checkout_lng',      'DECIMAL(10,6) DEFAULT NULL'],
    ['checkout_location', 'VARCHAR(200)  DEFAULT NULL'],
  ];

  for (const [col, def] of locationCols) {
    try {
      await conn.query(`ALTER TABLE attendance ADD COLUMN ${col} ${def}`);
      console.log(`OK  add column attendance.${col}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`--  column attendance.${col} already exists, skipped`);
      } else {
        console.error(`ERR add column attendance.${col}: ${err.message}`);
      }
    }
  }

  const procs = [
    [`DROP PROCEDURE IF EXISTS sp_employee_checkin`, 'drop sp_employee_checkin'],
    [`CREATE PROCEDURE sp_employee_checkin (
  IN p_employee_id INT,
  IN p_date        DATE,
  IN p_time        TIME,
  IN p_shift_start TIME,
  IN p_lat         DECIMAL(10,6),
  IN p_lng         DECIMAL(10,6),
  IN p_location    VARCHAR(200)
)
BEGIN
  DECLARE v_late_minutes INT DEFAULT 0;
  DECLARE v_existing_checkin TIME DEFAULT NULL;

  SELECT check_in INTO v_existing_checkin
  FROM attendance
  WHERE employee_id = p_employee_id AND attendance_date = p_date;

  IF v_existing_checkin IS NOT NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Already checked in for today';
  END IF;

  IF p_shift_start IS NOT NULL AND p_time > p_shift_start THEN
    SET v_late_minutes = TIME_TO_SEC(TIMEDIFF(p_time, p_shift_start)) / 60;
  END IF;

  INSERT INTO attendance (
    employee_id, attendance_date, check_in, status, late_by_minutes,
    checkin_lat, checkin_lng, checkin_location, source
  )
  VALUES (
    p_employee_id, p_date, p_time,
    IF(v_late_minutes > 0, 'late', 'present'), v_late_minutes,
    p_lat, p_lng, p_location, 'web'
  )
  ON DUPLICATE KEY UPDATE
    check_in         = IF(check_in IS NULL, p_time, check_in),
    status           = IF(check_in IS NULL, IF(v_late_minutes > 0, 'late', 'present'), status),
    late_by_minutes  = IF(check_in IS NULL, v_late_minutes, late_by_minutes),
    checkin_lat      = IF(check_in IS NULL, p_lat, checkin_lat),
    checkin_lng      = IF(check_in IS NULL, p_lng, checkin_lng),
    checkin_location = IF(check_in IS NULL, p_location, checkin_location);
END`, 'create sp_employee_checkin (7 params)'],

    [`DROP PROCEDURE IF EXISTS sp_employee_checkout`, 'drop sp_employee_checkout'],
    [`CREATE PROCEDURE sp_employee_checkout (
  IN p_employee_id INT,
  IN p_date        DATE,
  IN p_time        TIME,
  IN p_lat         DECIMAL(10,6),
  IN p_lng         DECIMAL(10,6),
  IN p_location    VARCHAR(200)
)
BEGIN
  DECLARE v_checkin   TIME DEFAULT NULL;
  DECLARE v_work_secs INT  DEFAULT 0;

  SELECT check_in INTO v_checkin
  FROM attendance
  WHERE employee_id = p_employee_id AND attendance_date = p_date;

  IF v_checkin IS NOT NULL THEN
    SET v_work_secs = TIME_TO_SEC(TIMEDIFF(p_time, v_checkin));
  END IF;

  UPDATE attendance
  SET
    check_out         = p_time,
    work_hours        = IF(v_work_secs > 0, ROUND(v_work_secs / 3600, 2), 0),
    checkout_lat      = p_lat,
    checkout_lng      = p_lng,
    checkout_location = p_location
  WHERE employee_id = p_employee_id AND attendance_date = p_date;
END`, 'create sp_employee_checkout (6 params)'],
  ];

  for (const [sql, label] of procs) {
    try {
      await conn.query(sql);
      console.log('OK  ' + label);
    } catch (err) {
      console.error('ERR ' + label + ': ' + err.message);
    }
  }

  await conn.end();
  console.log('\nDone. Restart backend and test check-in again.');
}

run().catch(err => { console.error(err); process.exit(1); });
