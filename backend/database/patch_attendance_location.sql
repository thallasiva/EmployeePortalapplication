-- ============================================================
-- PATCH: Add location capture columns to attendance table
-- Run in MySQL Workbench / DBeaver against hrms_db
-- ============================================================

ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS checkin_lat      DECIMAL(10,6) DEFAULT NULL AFTER source,
  ADD COLUMN IF NOT EXISTS checkin_lng      DECIMAL(10,6) DEFAULT NULL AFTER checkin_lat,
  ADD COLUMN IF NOT EXISTS checkin_location VARCHAR(200)  DEFAULT NULL AFTER checkin_lng,
  ADD COLUMN IF NOT EXISTS checkout_lat     DECIMAL(10,6) DEFAULT NULL AFTER checkin_location,
  ADD COLUMN IF NOT EXISTS checkout_lng     DECIMAL(10,6) DEFAULT NULL AFTER checkout_lat,
  ADD COLUMN IF NOT EXISTS checkout_location VARCHAR(200) DEFAULT NULL AFTER checkout_lng;

-- Update sp_employee_checkin to store location
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_employee_checkin $$
CREATE PROCEDURE sp_employee_checkin (
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

  INSERT INTO attendance (employee_id, attendance_date, check_in, status, late_by_minutes,
                          checkin_lat, checkin_lng, checkin_location, source)
  VALUES (p_employee_id, p_date, p_time,
          IF(v_late_minutes > 0, 'late', 'present'), v_late_minutes,
          p_lat, p_lng, p_location, 'web')
  ON DUPLICATE KEY UPDATE
    check_in         = IF(check_in IS NULL, p_time, check_in),
    status           = IF(check_in IS NULL, IF(v_late_minutes > 0, 'late', 'present'), status),
    late_by_minutes  = IF(check_in IS NULL, v_late_minutes, late_by_minutes),
    checkin_lat      = IF(check_in IS NULL, p_lat, checkin_lat),
    checkin_lng      = IF(check_in IS NULL, p_lng, checkin_lng),
    checkin_location = IF(check_in IS NULL, p_location, checkin_location);
END $$

DROP PROCEDURE IF EXISTS sp_employee_checkout $$
CREATE PROCEDURE sp_employee_checkout (
  IN p_employee_id INT,
  IN p_date        DATE,
  IN p_time        TIME,
  IN p_lat         DECIMAL(10,6),
  IN p_lng         DECIMAL(10,6),
  IN p_location    VARCHAR(200)
)
BEGIN
  DECLARE v_checkin  TIME DEFAULT NULL;
  DECLARE v_checkout TIME DEFAULT NULL;

  SELECT check_in, check_out
    INTO v_checkin, v_checkout
    FROM attendance
   WHERE employee_id = p_employee_id AND attendance_date = p_date;

  IF v_checkin IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot check out — no check-in found for today';
  END IF;

  IF v_checkout IS NOT NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Already checked out for today';
  END IF;

  IF p_time < v_checkin THEN
    -- overnight shift
    UPDATE attendance
    SET check_out        = p_time,
        work_hours       = ROUND((TIME_TO_SEC(p_time) + 86400 - TIME_TO_SEC(v_checkin)) / 3600, 2),
        checkout_lat     = p_lat,
        checkout_lng     = p_lng,
        checkout_location = p_location
    WHERE employee_id = p_employee_id AND attendance_date = p_date;
  ELSE
    UPDATE attendance
    SET check_out        = p_time,
        work_hours       = ROUND(TIME_TO_SEC(TIMEDIFF(p_time, v_checkin)) / 3600, 2),
        checkout_lat     = p_lat,
        checkout_lng     = p_lng,
        checkout_location = p_location
    WHERE employee_id = p_employee_id AND attendance_date = p_date;
  END IF;
END $$

DELIMITER ;
