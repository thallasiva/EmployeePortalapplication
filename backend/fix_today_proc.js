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

  const steps = [
    // Fix sp_get_today_attendance — simple, no JSON_ARRAYAGG ORDER BY
    [`DROP PROCEDURE IF EXISTS sp_get_today_attendance`, 'drop sp_get_today_attendance'],
    [`CREATE PROCEDURE sp_get_today_attendance(IN p_employee_id INT)
      BEGIN
        -- Result 0: attendance row
        SELECT a.* FROM attendance a
        WHERE a.employee_id = p_employee_id AND a.attendance_date = CURDATE();

        -- Result 1: today's punches ordered by time
        SELECT punch_id, punch_type, DATE_FORMAT(punch_time,'%H:%i') AS punch_time, location
          FROM attendance_punches
         WHERE employee_id = p_employee_id AND attendance_date = CURDATE()
         ORDER BY punch_time ASC;
      END`, 'create sp_get_today_attendance'],

    // Fix sp_get_monthly_attendance — simple, no complex JSON
    [`DROP PROCEDURE IF EXISTS sp_get_monthly_attendance`, 'drop sp_get_monthly_attendance'],
    [`CREATE PROCEDURE sp_get_monthly_attendance(IN p_employee_id INT, IN p_month INT, IN p_year INT)
      BEGIN
        SELECT a.*,
               COALESCE(pc.punch_count, 0) AS punch_count
          FROM attendance a
          LEFT JOIN (
            SELECT employee_id, attendance_date, COUNT(*) AS punch_count
              FROM attendance_punches
             WHERE employee_id = p_employee_id
               AND MONTH(attendance_date) = p_month
               AND YEAR(attendance_date) = p_year
             GROUP BY employee_id, attendance_date
          ) pc ON pc.employee_id = a.employee_id AND pc.attendance_date = a.attendance_date
        WHERE a.employee_id = p_employee_id
          AND MONTH(a.attendance_date) = p_month
          AND YEAR(a.attendance_date) = p_year
        ORDER BY a.attendance_date;
      END`, 'create sp_get_monthly_attendance'],

    // Fix sp_employee_checkin — check attendance table instead of punch log for "already in"
    [`DROP PROCEDURE IF EXISTS sp_employee_checkin`, 'drop sp_employee_checkin'],
    [`CREATE PROCEDURE sp_employee_checkin(
        IN p_employee_id INT, IN p_date DATE, IN p_time TIME, IN p_shift_start TIME,
        IN p_lat DECIMAL(10,6), IN p_lng DECIMAL(10,6), IN p_location VARCHAR(200)
      )
      BEGIN
        DECLARE v_check_in  TIME DEFAULT NULL;
        DECLARE v_check_out TIME DEFAULT NULL;
        DECLARE v_last_type ENUM('IN','OUT') DEFAULT NULL;

        SELECT check_in, check_out INTO v_check_in, v_check_out
          FROM attendance WHERE employee_id = p_employee_id AND attendance_date = p_date;

        -- Get last punch type from punch log
        SELECT punch_type INTO v_last_type
          FROM attendance_punches
         WHERE employee_id = p_employee_id AND attendance_date = p_date
         ORDER BY punch_time DESC LIMIT 1;

        -- Block if last punch was IN (not yet checked out for break)
        -- But allow if no punches yet (first check-in of the day)
        IF v_last_type = 'IN' THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Already checked in — please check out first';
        END IF;

        -- Log punch
        INSERT INTO attendance_punches (employee_id, attendance_date, punch_time, punch_type, lat, lng, location)
          VALUES (p_employee_id, p_date, p_time, 'IN', p_lat, p_lng, p_location);

        -- Upsert attendance
        INSERT INTO attendance (employee_id, attendance_date, check_in, status,
                                checkin_lat, checkin_lng, checkin_location)
          VALUES (p_employee_id, p_date, p_time, 'present', p_lat, p_lng, p_location)
          ON DUPLICATE KEY UPDATE
            check_in         = IF(check_in IS NULL, p_time, check_in),
            checkin_lat      = IF(check_in IS NULL, p_lat, checkin_lat),
            checkin_lng      = IF(check_in IS NULL, p_lng, checkin_lng),
            checkin_location = IF(check_in IS NULL, p_location, checkin_location),
            status           = 'present',
            updated_at       = NOW();

        SELECT * FROM attendance WHERE employee_id = p_employee_id AND attendance_date = p_date;
      END`, 'create sp_employee_checkin'],

    // Fix sp_employee_checkout
    [`DROP PROCEDURE IF EXISTS sp_employee_checkout`, 'drop sp_employee_checkout'],
    [`CREATE PROCEDURE sp_employee_checkout(
        IN p_employee_id INT, IN p_date DATE, IN p_time TIME,
        IN p_lat DECIMAL(10,6), IN p_lng DECIMAL(10,6), IN p_location VARCHAR(200)
      )
      BEGIN
        DECLARE v_check_in   TIME DEFAULT NULL;
        DECLARE v_last_type  ENUM('IN','OUT') DEFAULT NULL;
        DECLARE v_work_mins  INT DEFAULT 0;
        DECLARE v_elapsed    INT DEFAULT 0;
        DECLARE v_break_mins INT DEFAULT 0;

        SELECT check_in INTO v_check_in FROM attendance
         WHERE employee_id = p_employee_id AND attendance_date = p_date;

        IF v_check_in IS NULL THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No check-in found for today';
        END IF;

        SELECT punch_type INTO v_last_type FROM attendance_punches
         WHERE employee_id = p_employee_id AND attendance_date = p_date
         ORDER BY punch_time DESC LIMIT 1;

        IF v_last_type = 'OUT' THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Already checked out';
        END IF;

        INSERT INTO attendance_punches (employee_id, attendance_date, punch_time, punch_type, lat, lng, location)
          VALUES (p_employee_id, p_date, p_time, 'OUT', p_lat, p_lng, p_location);

        -- Calculate actual work from paired punches
        SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, i.punch_time, o.punch_time)), 0)
          INTO v_work_mins
          FROM (
            SELECT punch_time, ROW_NUMBER() OVER (ORDER BY punch_time) AS rn
              FROM attendance_punches
             WHERE employee_id = p_employee_id AND attendance_date = p_date AND punch_type = 'IN'
          ) i
          JOIN (
            SELECT punch_time, ROW_NUMBER() OVER (ORDER BY punch_time) AS rn
              FROM attendance_punches
             WHERE employee_id = p_employee_id AND attendance_date = p_date AND punch_type = 'OUT'
          ) o ON i.rn = o.rn
         WHERE o.punch_time > i.punch_time;

        SET v_elapsed    = TIMESTAMPDIFF(MINUTE, v_check_in, p_time);
        IF v_elapsed < 0 THEN SET v_elapsed = v_elapsed + 1440; END IF;
        SET v_break_mins = GREATEST(0, v_elapsed - v_work_mins);

        UPDATE attendance SET
          check_out         = p_time,
          work_hours        = ROUND(v_work_mins / 60.0, 2),
          break_minutes     = v_break_mins,
          checkout_lat      = p_lat,
          checkout_lng      = p_lng,
          checkout_location = p_location,
          status            = IF(v_work_mins >= 540, 'present', IF(v_work_mins >= 360, 'half_day', 'present')),
          updated_at        = NOW()
        WHERE employee_id = p_employee_id AND attendance_date = p_date;

        SELECT * FROM attendance WHERE employee_id = p_employee_id AND attendance_date = p_date;
      END`, 'create sp_employee_checkout'],
  ];

  for (const [sql, label] of steps) {
    try {
      await conn.query(sql);
      console.log(`  ✓ ${label}`);
    } catch (e) {
      console.error(`  ✗ ${label}: ${e.message}`);
    }
  }

  await conn.end();
  console.log('\n✅ Procedures fixed!');
}
run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
