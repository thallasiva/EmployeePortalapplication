-- =============================================================
-- Migration 056b: punch in / break / punch out fixes.
--  * Check-in now records a CHECK_IN punch (it recorded none, so work hours were
--    computed by pairing break punches and came out wrong).
--  * Breaks use BREAK_START / BREAK_END and maintain attendance.is_on_break, so the
--    web/mobile screens can show "End Break" (the flag was never set before).
--  * Check-out while on break ends the break first instead of failing with
--    "Already checked out".
--  * Work hours = (check-out − check-in) − break minutes.
--  * Status after check-out: >= 6h worked → present (or late if the check-in was
--    late — late marks are no longer erased); less than 6h → half_day.
-- Run with: node src/database/runSql.js migration_056b_attendance_punch_fix.sql
-- =============================================================
DROP PROCEDURE IF EXISTS sp_employee_checkin;
DELIMITER $$
CREATE PROCEDURE sp_employee_checkin(
  IN p_employee_id INT, IN p_date DATE, IN p_time TIME, IN p_shift_start TIME,
  IN p_lat DECIMAL(10,6), IN p_lng DECIMAL(10,6), IN p_location VARCHAR(200)
)
BEGIN
  DECLARE v_late_minutes INT DEFAULT 0;
  DECLARE v_existing_checkin TIME DEFAULT NULL;
  SELECT check_in INTO v_existing_checkin FROM attendance
   WHERE employee_id = p_employee_id AND attendance_date = p_date LIMIT 1;
  IF v_existing_checkin IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Already checked in for this date';
  END IF;
  IF p_shift_start IS NOT NULL AND p_time > p_shift_start THEN
    SET v_late_minutes = FLOOR(TIME_TO_SEC(TIMEDIFF(p_time, p_shift_start)) / 60);
  END IF;
  INSERT INTO attendance (employee_id, attendance_date, check_in, status, late_by_minutes,
                          checkin_lat, checkin_lng, checkin_location, source, is_on_break, break_minutes, total_punches)
  VALUES (p_employee_id, p_date, p_time, IF(v_late_minutes > 0, 'late', 'present'), v_late_minutes,
          p_lat, p_lng, p_location, 'web', 0, 0, 1)
  ON DUPLICATE KEY UPDATE
    check_in = VALUES(check_in), status = VALUES(status), late_by_minutes = VALUES(late_by_minutes),
    checkin_lat = VALUES(checkin_lat), checkin_lng = VALUES(checkin_lng), checkin_location = VALUES(checkin_location),
    is_on_break = 0, total_punches = 1;
  INSERT INTO attendance_punches (employee_id, attendance_date, punch_time, punch_type, source, lat, lng, location)
  VALUES (p_employee_id, p_date, p_time, 'CHECK_IN', 'web', p_lat, p_lng, p_location);
END$$
DELIMITER ;
DROP PROCEDURE IF EXISTS sp_break_start;
DELIMITER $$
CREATE PROCEDURE sp_break_start(
  IN p_employee_id INT, IN p_date DATE, IN p_time TIME,
  IN p_lat DECIMAL(10,6), IN p_lng DECIMAL(10,6), IN p_location VARCHAR(200)
)
BEGIN
  DECLARE v_check_in TIME DEFAULT NULL;
  DECLARE v_check_out TIME DEFAULT NULL;
  DECLARE v_on_break TINYINT DEFAULT 0;
  SELECT check_in, check_out, COALESCE(is_on_break, 0)
    INTO v_check_in, v_check_out, v_on_break
    FROM attendance WHERE employee_id = p_employee_id AND attendance_date = p_date LIMIT 1;
  IF v_check_in IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You must check in before starting a break';
  END IF;
  IF v_check_out IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You have already checked out for today';
  END IF;
  IF v_on_break = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You are already on a break';
  END IF;
  INSERT INTO attendance_punches (employee_id, attendance_date, punch_time, punch_type, source, lat, lng, location)
  VALUES (p_employee_id, p_date, p_time, 'BREAK_START', 'web', p_lat, p_lng, p_location);
  UPDATE attendance
     SET is_on_break = 1, total_punches = COALESCE(total_punches, 0) + 1
   WHERE employee_id = p_employee_id AND attendance_date = p_date;
END$$
DELIMITER ;
DROP PROCEDURE IF EXISTS sp_break_end;
DELIMITER $$
CREATE PROCEDURE sp_break_end(
  IN p_employee_id INT, IN p_date DATE, IN p_time TIME,
  IN p_lat DECIMAL(10,6), IN p_lng DECIMAL(10,6), IN p_location VARCHAR(200)
)
BEGIN
  DECLARE v_on_break TINYINT DEFAULT 0;
  DECLARE v_break_start TIME DEFAULT NULL;
  DECLARE v_minutes INT DEFAULT 0;
  SELECT COALESCE(is_on_break, 0) INTO v_on_break
    FROM attendance WHERE employee_id = p_employee_id AND attendance_date = p_date LIMIT 1;
  IF v_on_break <> 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You are not currently on a break';
  END IF;
  SELECT punch_time INTO v_break_start FROM attendance_punches
   WHERE employee_id = p_employee_id AND attendance_date = p_date AND punch_type = 'BREAK_START'
   ORDER BY punch_time DESC, punch_id DESC LIMIT 1;
  SET v_minutes = GREATEST(0, FLOOR(TIME_TO_SEC(TIMEDIFF(p_time, COALESCE(v_break_start, p_time))) / 60));
  INSERT INTO attendance_punches (employee_id, attendance_date, punch_time, punch_type, source, lat, lng, location)
  VALUES (p_employee_id, p_date, p_time, 'BREAK_END', 'web', p_lat, p_lng, p_location);
  UPDATE attendance
     SET is_on_break = 0,
         break_minutes = COALESCE(break_minutes, 0) + v_minutes,
         total_punches = COALESCE(total_punches, 0) + 1
   WHERE employee_id = p_employee_id AND attendance_date = p_date;
END$$
DELIMITER ;
DROP PROCEDURE IF EXISTS sp_employee_checkout;
DELIMITER $$
CREATE PROCEDURE sp_employee_checkout(
  IN p_employee_id INT, IN p_date DATE, IN p_time TIME,
  IN p_lat DECIMAL(10,6), IN p_lng DECIMAL(10,6), IN p_location VARCHAR(200)
)
BEGIN
  DECLARE v_check_in TIME DEFAULT NULL;
  DECLARE v_check_out TIME DEFAULT NULL;
  DECLARE v_on_break TINYINT DEFAULT 0;
  DECLARE v_late INT DEFAULT 0;
  DECLARE v_break_start TIME DEFAULT NULL;
  DECLARE v_break_mins INT DEFAULT 0;
  DECLARE v_elapsed INT DEFAULT 0;
  DECLARE v_work_mins INT DEFAULT 0;
  SELECT check_in, check_out, COALESCE(is_on_break, 0), COALESCE(late_by_minutes, 0), COALESCE(break_minutes, 0)
    INTO v_check_in, v_check_out, v_on_break, v_late, v_break_mins
    FROM attendance WHERE employee_id = p_employee_id AND attendance_date = p_date LIMIT 1;
  IF v_check_in IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No check-in found for today';
  END IF;
  IF v_check_out IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Already checked out';
  END IF;
  -- Checking out while on a break ends the break at the same moment.
  IF v_on_break = 1 THEN
    SELECT punch_time INTO v_break_start FROM attendance_punches
     WHERE employee_id = p_employee_id AND attendance_date = p_date AND punch_type = 'BREAK_START'
     ORDER BY punch_time DESC, punch_id DESC LIMIT 1;
    SET v_break_mins = v_break_mins + GREATEST(0, FLOOR(TIME_TO_SEC(TIMEDIFF(p_time, COALESCE(v_break_start, p_time))) / 60));
    INSERT INTO attendance_punches (employee_id, attendance_date, punch_time, punch_type, source, lat, lng, location)
    VALUES (p_employee_id, p_date, p_time, 'BREAK_END', 'web', p_lat, p_lng, p_location);
  END IF;
  INSERT INTO attendance_punches (employee_id, attendance_date, punch_time, punch_type, source, lat, lng, location)
  VALUES (p_employee_id, p_date, p_time, 'CHECK_OUT', 'web', p_lat, p_lng, p_location);
  SET v_elapsed = FLOOR(TIME_TO_SEC(TIMEDIFF(p_time, v_check_in)) / 60);
  IF v_elapsed < 0 THEN SET v_elapsed = v_elapsed + 1440; END IF;   -- night shift past midnight
  SET v_work_mins = GREATEST(0, v_elapsed - v_break_mins);
  UPDATE attendance
     SET check_out = p_time,
         work_hours = ROUND(v_work_mins / 60.0, 2),
         break_minutes = v_break_mins,
         is_on_break = 0,
         total_punches = COALESCE(total_punches, 0) + IF(v_on_break = 1, 2, 1),
         checkout_lat = p_lat, checkout_lng = p_lng, checkout_location = p_location,
         status = CASE WHEN v_work_mins < 360 THEN 'half_day'
                       WHEN v_late > 0 THEN 'late'
                       ELSE 'present' END,
         updated_at = NOW()
   WHERE employee_id = p_employee_id AND attendance_date = p_date;
  SELECT a.* FROM attendance a WHERE a.employee_id = p_employee_id AND a.attendance_date = p_date;
END$$
DELIMITER ;
-- Today's view must use the same IST date the punches are stored with.
DROP PROCEDURE IF EXISTS sp_get_today_attendance;
DELIMITER $$
CREATE PROCEDURE sp_get_today_attendance(IN p_employee_id INT)
BEGIN
  DECLARE v_today DATE DEFAULT DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+05:30'));
  SELECT a.attendance_id, a.employee_id, a.attendance_date,
         a.check_in, a.check_out, a.status,
         a.work_hours, a.break_minutes, a.late_by_minutes,
         a.is_on_break, a.total_punches, a.source,
         a.checkin_lat, a.checkin_lng, a.checkin_location,
         a.checkout_lat, a.checkout_lng, a.checkout_location
  FROM attendance a
  WHERE a.employee_id = p_employee_id AND a.attendance_date = v_today;
  SELECT punch_id, punch_type, DATE_FORMAT(punch_time, '%H:%i') AS punch_time, location
  FROM attendance_punches
  WHERE employee_id = p_employee_id AND attendance_date = v_today
  ORDER BY punch_time ASC, punch_id ASC;
END$$
DELIMITER ;
SELECT 'migration_056b_attendance_punch_fix done' AS status;
