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

  // 1. Create attendance_punches table
  const tableSql = `CREATE TABLE IF NOT EXISTS attendance_punches (
    punch_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id     INT NOT NULL,
    attendance_date DATE NOT NULL,
    punch_time      TIME NOT NULL,
    punch_type      ENUM('CHECK_IN','CHECK_OUT','BREAK_START','BREAK_END') NOT NULL,
    source          VARCHAR(30) DEFAULT 'web',
    lat             DECIMAL(10,6) DEFAULT NULL,
    lng             DECIMAL(10,6) DEFAULT NULL,
    location        VARCHAR(200) DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_punch_emp_date (employee_id, attendance_date),
    CONSTRAINT fk_punch_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
  ) ENGINE=InnoDB`;

  // 2. Add break columns to attendance
  const alterCols = [
    ['break_minutes', 'INT DEFAULT 0'],
    ['total_punches', 'INT DEFAULT 0'],
    ['is_on_break',   'TINYINT(1) DEFAULT 0'],
  ];

  const procs = [
    [`DROP PROCEDURE IF EXISTS sp_break_start`, 'drop sp_break_start'],
    [`CREATE PROCEDURE sp_break_start(
  IN p_employee_id INT,
  IN p_date DATE,
  IN p_time TIME,
  IN p_lat  DECIMAL(10,6),
  IN p_lng  DECIMAL(10,6),
  IN p_loc  VARCHAR(200)
)
BEGIN
  DECLARE v_checkin TIME DEFAULT NULL;
  DECLARE v_on_break TINYINT DEFAULT 0;

  SELECT check_in, COALESCE(is_on_break,0) INTO v_checkin, v_on_break
  FROM attendance
  WHERE employee_id = p_employee_id AND attendance_date = p_date;

  IF v_checkin IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not checked in yet';
  END IF;
  IF v_on_break = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Already on break';
  END IF;

  INSERT INTO attendance_punches(employee_id, attendance_date, punch_time, punch_type, lat, lng, location)
  VALUES(p_employee_id, p_date, p_time, 'BREAK_START', p_lat, p_lng, p_loc);

  UPDATE attendance SET is_on_break = 1, total_punches = COALESCE(total_punches,0) + 1
  WHERE employee_id = p_employee_id AND attendance_date = p_date;
END`, 'create sp_break_start'],

    [`DROP PROCEDURE IF EXISTS sp_break_end`, 'drop sp_break_end'],
    [`CREATE PROCEDURE sp_break_end(
  IN p_employee_id INT,
  IN p_date DATE,
  IN p_time TIME,
  IN p_lat  DECIMAL(10,6),
  IN p_lng  DECIMAL(10,6),
  IN p_loc  VARCHAR(200)
)
BEGIN
  DECLARE v_on_break TINYINT DEFAULT 0;
  DECLARE v_last_break_start TIME DEFAULT NULL;
  DECLARE v_break_dur INT DEFAULT 0;

  SELECT COALESCE(is_on_break,0) INTO v_on_break
  FROM attendance
  WHERE employee_id = p_employee_id AND attendance_date = p_date;

  IF v_on_break = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not currently on break';
  END IF;

  SELECT punch_time INTO v_last_break_start
  FROM attendance_punches
  WHERE employee_id = p_employee_id AND attendance_date = p_date AND punch_type = 'BREAK_START'
  ORDER BY punch_time DESC LIMIT 1;

  IF v_last_break_start IS NOT NULL THEN
    SET v_break_dur = TIME_TO_SEC(TIMEDIFF(p_time, v_last_break_start)) / 60;
  END IF;

  INSERT INTO attendance_punches(employee_id, attendance_date, punch_time, punch_type, lat, lng, location)
  VALUES(p_employee_id, p_date, p_time, 'BREAK_END', p_lat, p_lng, p_loc);

  UPDATE attendance
  SET is_on_break   = 0,
      break_minutes = COALESCE(break_minutes,0) + v_break_dur,
      total_punches = COALESCE(total_punches,0) + 1
  WHERE employee_id = p_employee_id AND attendance_date = p_date;
END`, 'create sp_break_end'],

    [`DROP PROCEDURE IF EXISTS sp_get_today_attendance`, 'drop sp_get_today_attendance'],
    [`CREATE PROCEDURE sp_get_today_attendance(IN p_employee_id INT)
BEGIN
  SELECT a.attendance_id, a.employee_id, a.attendance_date,
         a.check_in, a.check_out, a.status,
         a.work_hours, a.break_minutes, a.late_by_minutes,
         a.is_on_break, a.total_punches, a.source,
         a.checkin_lat, a.checkin_lng, a.checkin_location,
         a.checkout_lat, a.checkout_lng, a.checkout_location
  FROM attendance a
  WHERE a.employee_id = p_employee_id AND a.attendance_date = CURDATE();

  SELECT punch_id, punch_type, DATE_FORMAT(punch_time,'%H:%i') AS punch_time, location
  FROM attendance_punches
  WHERE employee_id = p_employee_id AND attendance_date = CURDATE()
  ORDER BY punch_time ASC;
END`, 'create sp_get_today_attendance'],
  ];

  // Run table create
  try {
    await conn.query(tableSql);
    console.log('OK  create attendance_punches table');
  } catch(e) { console.error('ERR table: ' + e.message); }

  // Add columns
  for (const [col, def] of alterCols) {
    try {
      await conn.query(`ALTER TABLE attendance ADD COLUMN ${col} ${def}`);
      console.log(`OK  add column attendance.${col}`);
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log(`--  attendance.${col} already exists`);
      else console.error(`ERR ${col}: ${e.message}`);
    }
  }

  // Run procs
  for (const [sql, label] of procs) {
    try {
      await conn.query(sql);
      console.log('OK  ' + label);
    } catch(e) { console.error('ERR ' + label + ': ' + e.message); }
  }

  await conn.end();
  console.log('\nDone.');
}
run().catch(e => { console.error(e); process.exit(1); });
