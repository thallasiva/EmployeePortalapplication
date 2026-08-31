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
    // 1. Punch log table
    [`CREATE TABLE  attendance_punches (
        punch_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        attendance_date DATE NOT NULL,
        punch_time TIME NOT NULL,
        punch_type ENUM('IN','OUT') NOT NULL,
        source VARCHAR(30) DEFAULT 'web',
        lat DECIMAL(10,6) DEFAULT NULL,
        lng DECIMAL(10,6) DEFAULT NULL,
        location VARCHAR(200) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_punch_emp_date (employee_id, attendance_date),
        CONSTRAINT fk_punch_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`, 'attendance_punches table'],

    // 2. Add break_minutes
    [`ALTER TABLE attendance ADD COLUMN   break_minutes INT DEFAULT 0 AFTER work_hours`, 'break_minutes column'],
    [`ALTER TABLE attendance ADD COLUMN   total_punches INT DEFAULT 0 AFTER break_minutes`, 'total_punches column'],
    [`ALTER TABLE attendance ADD COLUMN   checkin_lat DECIMAL(10,6) DEFAULT NULL`, 'checkin_lat column'],
    [`ALTER TABLE attendance ADD COLUMN   checkin_lng DECIMAL(10,6) DEFAULT NULL`, 'checkin_lng column'],
    [`ALTER TABLE attendance ADD COLUMN   checkin_location VARCHAR(200) DEFAULT NULL`, 'checkin_location column'],
    [`ALTER TABLE attendance ADD COLUMN   checkout_lat DECIMAL(10,6) DEFAULT NULL`, 'checkout_lat column'],
    [`ALTER TABLE attendance ADD COLUMN   checkout_lng DECIMAL(10,6) DEFAULT NULL`, 'checkout_lng column'],
    [`ALTER TABLE attendance ADD COLUMN   checkout_location VARCHAR(200) DEFAULT NULL`, 'checkout_location column'],
    // 3. sp_employee_checkin — supports multiple punches (break re-check-in)
    [`DROP PROCEDURE IF EXISTS sp_employee_checkin`, 'drop sp_employee_checkin'],
    [`CREATE PROCEDURE sp_employee_checkin(
        IN p_employee_id INT, IN p_date DATE, IN p_time TIME, IN p_shift_start TIME,
        IN p_lat DECIMAL(10,6), IN p_lng DECIMAL(10,6), IN p_location VARCHAR(200)
      )
      BEGIN
        DECLARE v_existing_in  TIME DEFAULT NULL;
        DECLARE v_existing_out TIME DEFAULT NULL;
        DECLARE v_last_punch   ENUM('IN','OUT') DEFAULT NULL;

        -- Get current state
        SELECT check_in, check_out INTO v_existing_in, v_existing_out
          FROM attendance WHERE employee_id = p_employee_id AND attendance_date = p_date;

        -- Get last punch type
        SELECT punch_type INTO v_last_punch
          FROM attendance_punches
         WHERE employee_id = p_employee_id AND attendance_date = p_date
         ORDER BY punch_time DESC LIMIT 1;

        -- Block: already punched IN without an OUT since last IN
        IF v_last_punch = 'IN' THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Already checked in — please check out first';
        END IF;

        -- Log the punch
        INSERT INTO attendance_punches (employee_id, attendance_date, punch_time, punch_type, lat, lng, location)
          VALUES (p_employee_id, p_date, p_time, 'IN', p_lat, p_lng, p_location);

        -- Upsert attendance row
        INSERT INTO attendance (employee_id, attendance_date, check_in, status,
                                checkin_lat, checkin_lng, checkin_location, total_punches)
          VALUES (p_employee_id, p_date, p_time, 'present',
                  p_lat, p_lng, p_location, 1)
          ON DUPLICATE KEY UPDATE
            check_in   = IF(check_in IS NULL, p_time, check_in),
            checkin_lat = IF(check_in IS NULL, p_lat, checkin_lat),
            checkin_lng = IF(check_in IS NULL, p_lng, checkin_lng),
            checkin_location = IF(check_in IS NULL, p_location, checkin_location),
            total_punches = total_punches + 1,
            status = 'present',
            updated_at = NOW();

        -- Return updated row
        SELECT a.*, ap_list.punches FROM attendance a
          LEFT JOIN (
            SELECT employee_id, attendance_date,
                   JSON_ARRAYAGG(JSON_OBJECT('time', punch_time, 'type', punch_type, 'location', location)) AS punches
              FROM attendance_punches
             WHERE employee_id = p_employee_id AND attendance_date = p_date
             GROUP BY employee_id, attendance_date
          ) ap_list ON ap_list.employee_id = a.employee_id AND ap_list.attendance_date = a.attendance_date
        WHERE a.employee_id = p_employee_id AND a.attendance_date = p_date;
      END`, 'create sp_employee_checkin'],

    // 4. sp_employee_checkout — recalculates work + break from punch log
    [`DROP PROCEDURE IF EXISTS sp_employee_checkout`, 'drop sp_employee_checkout'],
    [`CREATE PROCEDURE sp_employee_checkout(
        IN p_employee_id INT, IN p_date DATE, IN p_time TIME,
        IN p_lat DECIMAL(10,6), IN p_lng DECIMAL(10,6), IN p_location VARCHAR(200)
      )
      BEGIN
        DECLARE v_check_in     TIME DEFAULT NULL;
        DECLARE v_last_punch   ENUM('IN','OUT') DEFAULT NULL;
        DECLARE v_work_mins    INT DEFAULT 0;
        DECLARE v_break_mins   INT DEFAULT 0;
        DECLARE v_total_elapsed INT DEFAULT 0;
        DECLARE v_new_status   VARCHAR(20) DEFAULT 'present';

        SELECT check_in INTO v_check_in FROM attendance
         WHERE employee_id = p_employee_id AND attendance_date = p_date;

        IF v_check_in IS NULL THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No check-in found for today';
        END IF;

        SELECT punch_type INTO v_last_punch FROM attendance_punches
         WHERE employee_id = p_employee_id AND attendance_date = p_date
         ORDER BY punch_time DESC LIMIT 1;

        IF v_last_punch = 'OUT' THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Already checked out';
        END IF;

        -- Log OUT punch
        INSERT INTO attendance_punches (employee_id, attendance_date, punch_time, punch_type, lat, lng, location)
          VALUES (p_employee_id, p_date, p_time, 'OUT', p_lat, p_lng, p_location);

        -- Calculate work minutes from paired IN/OUT punches
        SET v_work_mins = (
          SELECT COALESCE(SUM(
            TIMESTAMPDIFF(MINUTE,
              TIME(in_punch.punch_time),
              TIME(out_punch.punch_time)
            )
          ), 0)
          FROM (
            SELECT punch_time, ROW_NUMBER() OVER (ORDER BY punch_time) AS rn
              FROM attendance_punches
             WHERE employee_id = p_employee_id AND attendance_date = p_date AND punch_type = 'IN'
          ) in_punch
          JOIN (
            SELECT punch_time, ROW_NUMBER() OVER (ORDER BY punch_time) AS rn
              FROM attendance_punches
             WHERE employee_id = p_employee_id AND attendance_date = p_date AND punch_type = 'OUT'
          ) out_punch ON in_punch.rn = out_punch.rn
          WHERE out_punch.punch_time > in_punch.punch_time
        );

        -- Total elapsed = last OUT - first IN
        SET v_total_elapsed = TIMESTAMPDIFF(MINUTE, v_check_in, p_time);
        IF v_total_elapsed < 0 THEN SET v_total_elapsed = v_total_elapsed + 1440; END IF;

        SET v_break_mins = GREATEST(0, v_total_elapsed - v_work_mins);

        -- Determine status
        IF v_work_mins >= 540 THEN SET v_new_status = 'present';
        ELSEIF v_work_mins >= 360 THEN SET v_new_status = 'half_day';
        ELSE SET v_new_status = 'present'; END IF;

        UPDATE attendance SET
          check_out        = p_time,
          work_hours       = ROUND(v_work_mins / 60.0, 2),
          break_minutes    = v_break_mins,
          total_punches    = total_punches + 1,
          checkout_lat     = p_lat,
          checkout_lng     = p_lng,
          checkout_location = p_location,
          status           = v_new_status,
          updated_at       = NOW()
        WHERE employee_id = p_employee_id AND attendance_date = p_date;

        -- Return updated row with punch list
        SELECT a.*, ap_list.punches FROM attendance a
          LEFT JOIN (
            SELECT employee_id, attendance_date,
                   JSON_ARRAYAGG(JSON_OBJECT('time', punch_time, 'type', punch_type, 'location', location)) AS punches
              FROM attendance_punches
             WHERE employee_id = p_employee_id AND attendance_date = p_date
             GROUP BY employee_id, attendance_date
          ) ap_list ON ap_list.employee_id = a.employee_id AND ap_list.attendance_date = a.attendance_date
        WHERE a.employee_id = p_employee_id AND a.attendance_date = p_date;
      END`, 'create sp_employee_checkout'],

    // 5. sp_get_today_attendance — include punches
    [`DROP PROCEDURE IF EXISTS sp_get_today_attendance`, 'drop sp_get_today_attendance'],
    [`CREATE PROCEDURE sp_get_today_attendance(IN p_employee_id INT)
      BEGIN
        SELECT a.*,
               ap_list.punches
          FROM attendance a
          LEFT JOIN (
            SELECT employee_id, attendance_date,
                   JSON_ARRAYAGG(
                     JSON_OBJECT('time', DATE_FORMAT(punch_time,'%H:%i'), 'type', punch_type, 'location', location)
                     ORDER BY punch_time
                   ) AS punches
              FROM attendance_punches
             WHERE employee_id = p_employee_id AND attendance_date = CURDATE()
             GROUP BY employee_id, attendance_date
          ) ap_list ON ap_list.employee_id = a.employee_id AND ap_list.attendance_date = a.attendance_date
        WHERE a.employee_id = p_employee_id AND a.attendance_date = CURDATE();
      END`, 'create sp_get_today_attendance'],

    // 6. sp_get_monthly_attendance — include break_minutes and punches count
    [`DROP PROCEDURE IF EXISTS sp_get_monthly_attendance`, 'drop sp_get_monthly_attendance'],
    [`CREATE PROCEDURE sp_get_monthly_attendance(IN p_employee_id INT, IN p_month INT, IN p_year INT)
      BEGIN
        SELECT a.*,
               COALESCE(pc.punch_count, 0) AS punch_count,
               COALESCE(pc.break_sessions, 0) AS break_sessions
          FROM attendance a
          LEFT JOIN (
            SELECT employee_id, attendance_date,
                   COUNT(*) AS punch_count,
                   FLOOR(COUNT(*) / 2) - 1 AS break_sessions
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
  ];

  for (const [sql, label] of steps) {
    try {
      await conn.query(sql);
      console.log(`  ✓ ${label}`);
    } catch (e) {
      if (e.message.includes('Duplicate column') || e.message.includes('already exists')) {
        console.log(`  ⚠ ${label} — already exists, skipped`);
      } else {
        console.error(`  ✗ ${label}: ${e.message}`);
      }
    }
  }

  await conn.end();
  console.log('\n✅ Break tracking patch complete!');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
