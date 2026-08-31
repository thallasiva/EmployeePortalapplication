-- ============================================================
-- PATCH: Attendance business rules
-- Run this in MySQL Workbench / DBeaver against hrms_db
-- ============================================================
-- 1. Prevent re-check-in if already checked in today
-- 2. Prevent check-out before check-in / without check-in
-- 3. Regularization: enforce 5-day monthly limit
-- 4. Regularization: add 4 hours work credit on approval
-- 5. Regularization: recalculate work_hours when both times set
-- ============================================================

DELIMITER $$

-- ─────────────────────────────────────────────────────────────
-- FIX 1: sp_employee_checkin
-- Blocks overwriting an existing check-in for the same day
-- ─────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_employee_checkin $$
CREATE PROCEDURE sp_employee_checkin (
  IN p_employee_id INT,
  IN p_date        DATE,
  IN p_time        TIME,
  IN p_shift_start TIME
)
BEGIN
  DECLARE v_late_minutes INT DEFAULT 0;
  DECLARE v_existing_checkin TIME DEFAULT NULL;

  -- Block double check-in
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

  INSERT INTO attendance (employee_id, attendance_date, check_in, status, late_by_minutes)
  VALUES (p_employee_id, p_date, p_time, IF(v_late_minutes > 0, 'late', 'present'), v_late_minutes)
  ON DUPLICATE KEY UPDATE
    check_in        = IF(check_in IS NULL, p_time, check_in),
    status          = IF(check_in IS NULL, IF(v_late_minutes > 0, 'late', 'present'), status),
    late_by_minutes = IF(check_in IS NULL, v_late_minutes, late_by_minutes);
END $$


-- ─────────────────────────────────────────────────────────────
-- FIX 2: sp_employee_checkout
-- Guards: must have checked in, checkout must be AFTER check-in
-- ─────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_employee_checkout $$
CREATE PROCEDURE sp_employee_checkout (
  IN p_employee_id INT,
  IN p_date        DATE,
  IN p_time        TIME
)
BEGIN
  DECLARE v_checkin TIME DEFAULT NULL;
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

  -- Allow overnight shifts: if checkout < check_in assume next-day (+24h)
  IF p_time < v_checkin THEN
    -- overnight: work_hours crosses midnight
    UPDATE attendance
    SET check_out    = p_time,
        work_hours   = ROUND((TIME_TO_SEC(p_time) + 86400 - TIME_TO_SEC(v_checkin)) / 3600, 2)
    WHERE employee_id = p_employee_id AND attendance_date = p_date;
  ELSE
    UPDATE attendance
    SET check_out  = p_time,
        work_hours = ROUND(TIME_TO_SEC(TIMEDIFF(p_time, v_checkin)) / 3600, 2)
    WHERE employee_id = p_employee_id AND attendance_date = p_date;
  END IF;
END $$


-- ─────────────────────────────────────────────────────────────
-- FIX 3+4+5: sp_review_attendance_regularization
-- Enforces 5-day monthly limit
-- Adds 4 hours work credit when no times provided
-- Recalculates work_hours when both times are set
-- ─────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_review_attendance_regularization $$
CREATE PROCEDURE sp_review_attendance_regularization (
  IN p_id INT,
  IN p_decision VARCHAR(20),
  IN p_reviewed_by INT,
  IN p_remarks TEXT
)
BEGIN
  DECLARE v_employee_id    INT;
  DECLARE v_date           DATE;
  DECLARE v_check_in       TIME;
  DECLARE v_check_out      TIME;
  DECLARE v_approved_count INT DEFAULT 0;
  DECLARE v_work_hours     DECIMAL(5,2) DEFAULT 4.00;  -- default 4-hour credit

  SELECT employee_id, attendance_date, requested_check_in, requested_check_out
    INTO v_employee_id, v_date, v_check_in, v_check_out
    FROM attendance_regularization
   WHERE regularization_id = p_id;

  -- ── 5-day monthly limit check ──────────────────────────────
  IF p_decision = 'Approved' THEN
    SELECT COUNT(*) INTO v_approved_count
    FROM attendance_regularization
    WHERE employee_id  = v_employee_id
      AND MONTH(attendance_date) = MONTH(v_date)
      AND YEAR(attendance_date)  = YEAR(v_date)
      AND status = 'Approved'
      AND regularization_id <> p_id;

    IF v_approved_count >= 5 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Regularization limit reached: maximum 5 approvals allowed per month';
    END IF;
  END IF;

  -- ── Update regularization record ───────────────────────────
  UPDATE attendance_regularization
     SET status      = p_decision,
         reviewed_by = p_reviewed_by,
         reviewed_on = NOW(),
         remarks     = p_remarks
   WHERE regularization_id = p_id;

  -- ── Apply to attendance on Approved ────────────────────────
  IF p_decision = 'Approved' THEN
    -- Calculate work hours: if both times given use them, else default to 4h credit
    IF v_check_in IS NOT NULL AND v_check_out IS NOT NULL THEN
      IF v_check_out > v_check_in THEN
        SET v_work_hours = ROUND(TIME_TO_SEC(TIMEDIFF(v_check_out, v_check_in)) / 3600, 2);
      ELSE
        -- overnight
        SET v_work_hours = ROUND((TIME_TO_SEC(v_check_out) + 86400 - TIME_TO_SEC(v_check_in)) / 3600, 2);
      END IF;
    ELSEIF v_check_in IS NULL AND v_check_out IS NULL THEN
      -- No times provided — grant flat 4-hour credit
      SET v_work_hours = 4.00;
    END IF;

    INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, work_hours, status, source)
    VALUES (v_employee_id, v_date, v_check_in, v_check_out, v_work_hours, 'present', 'regularization')
    ON DUPLICATE KEY UPDATE
      check_in   = IFNULL(v_check_in,  check_in),
      check_out  = IFNULL(v_check_out, check_out),
      work_hours = v_work_hours,
      status     = 'present',
      source     = 'regularization';
  END IF;
END $$

DELIMITER ;

-- ============================================================
-- Verify: check current regularization counts
-- ============================================================
-- SELECT employee_id, MONTH(attendance_date) AS month, YEAR(attendance_date) AS year,
--        COUNT(*) AS approved_count
-- FROM attendance_regularization
-- WHERE status = 'Approved'
-- GROUP BY employee_id, MONTH(attendance_date), YEAR(attendance_date)
-- ORDER BY year DESC, month DESC;
