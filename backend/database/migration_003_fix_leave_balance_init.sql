-- =====================================================================
-- Migration 003: Fix leave balance initialization
--
-- Problem: sp_apply_leave created a leave_balances row with
-- granted = 0 / balance = 0 the first time an employee applied for a
-- leave type, so every application failed with "Insufficient leave
-- balance" (shown in the UI as "we don't have any leaves").
--
-- Fix:
--   1. Recreate sp_apply_leave so a missing balance row is initialized
--      from the leave type's annual_quota instead of 0.
--   2. Backfill any existing zero/zero/zero/zero balance rows (created
--      by the old buggy procedure) using the leave type's annual_quota.
--
-- Safe to re-run.
-- =====================================================================

USE hrms_db;

-- 1. Backfill rows that were auto-created with all zeros by the old procedure.
UPDATE leave_balances lb
JOIN leave_types lt ON lt.leave_type_id = lb.leave_type_id
SET lb.granted = lt.annual_quota,
    lb.balance = lt.annual_quota - lb.availed
WHERE lb.opening_balance = 0
  AND lb.granted = 0
  AND lb.availed = 0
  AND lb.balance = 0;

-- 2. Recreate sp_apply_leave with the fixed initialization logic.
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_apply_leave $$
CREATE PROCEDURE sp_apply_leave (
  IN p_employee_id   INT,
  IN p_leave_type_id INT,
  IN p_from_date     DATE,
  IN p_from_session  VARCHAR(20),
  IN p_to_date       DATE,
  IN p_to_session    VARCHAR(20),
  IN p_days          DECIMAL(5,1),
  IN p_reason        VARCHAR(255),
  OUT p_request_id   INT,
  OUT p_status_msg   VARCHAR(100)
)
BEGIN
  DECLARE v_year INT;
  DECLARE v_balance DECIMAL(5,1);
  DECLARE v_quota DECIMAL(5,1);

  SET v_year = YEAR(p_from_date);

  SELECT balance INTO v_balance
  FROM leave_balances
  WHERE employee_id = p_employee_id AND leave_type_id = p_leave_type_id AND year = v_year
  FOR UPDATE;

  IF v_balance IS NULL THEN
    -- No balance row yet for this employee/leave type/year: initialize it
    -- using the leave type's annual quota so new employees aren't stuck at 0.
    SELECT IFNULL(annual_quota, 0) INTO v_quota
    FROM leave_types
    WHERE leave_type_id = p_leave_type_id;

    INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
    VALUES (p_employee_id, p_leave_type_id, v_year, 0, v_quota, 0, v_quota);
    SET v_balance = v_quota;
  END IF;

  IF v_balance < p_days THEN
    SET p_request_id = NULL;
    SET p_status_msg = 'Insufficient leave balance';
  ELSE
    INSERT INTO leave_requests (
      employee_id, leave_type_id, from_date, from_session, to_date, to_session,
      days, reason, status, applied_on
    ) VALUES (
      p_employee_id, p_leave_type_id, p_from_date, p_from_session, p_to_date, p_to_session,
      p_days, p_reason, 'Pending', NOW()
    );
    SET p_request_id = LAST_INSERT_ID();
    SET p_status_msg = 'Leave request submitted';
  END IF;
END $$

DELIMITER ;
