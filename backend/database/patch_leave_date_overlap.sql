-- ============================================================
-- Patch: Block duplicate leave applications for same dates
-- An employee cannot reapply for dates that already have a
-- Pending or Approved leave request.
-- Only allowed after the existing request is Rejected.
-- ============================================================
USE hrms_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_apply_leave $$
CREATE PROCEDURE sp_apply_leave (
  IN  p_employee_id    INT,
  IN  p_leave_type_id  INT,
  IN  p_from_date      DATE,
  IN  p_from_session   VARCHAR(10),
  IN  p_to_date        DATE,
  IN  p_to_session     VARCHAR(10),
  IN  p_days           DECIMAL(5,2),
  IN  p_reason         TEXT,
  OUT p_request_id     INT,
  OUT p_status_msg     VARCHAR(200)
)
BEGIN
  DECLARE v_balance      DECIMAL(6,2) DEFAULT 0;
  DECLARE v_year         INT;
  DECLARE v_conflict_id  INT DEFAULT NULL;
  DECLARE v_conflict_status VARCHAR(20) DEFAULT NULL;

  SET v_year = YEAR(p_from_date);

  -- ── 1. Check for date overlap with non-Rejected requests ─────
  SELECT leave_request_id, status
    INTO v_conflict_id, v_conflict_status
    FROM leave_requests
   WHERE employee_id  = p_employee_id
     AND status       IN ('Pending', 'Approved')
     AND from_date    <= p_to_date
     AND to_date      >= p_from_date
   LIMIT 1;

  IF v_conflict_id IS NOT NULL THEN
    SET p_request_id = NULL;
    SET p_status_msg = CONCAT(
      'You already have a ', v_conflict_status,
      ' leave request covering these dates (ID #', v_conflict_id, '). ',
      'Please wait for it to be rejected before reapplying.'
    );

  ELSE
    -- ── 2. Check leave balance ──────────────────────────────────
    SELECT IFNULL(lb.balance, lt.annual_quota) INTO v_balance
      FROM leave_types lt
      LEFT JOIN leave_balances lb
             ON lb.leave_type_id = lt.leave_type_id
            AND lb.employee_id   = p_employee_id
            AND lb.year          = v_year
     WHERE lt.leave_type_id = p_leave_type_id LIMIT 1;

    IF v_balance < p_days THEN
      SET p_request_id = NULL;
      SET p_status_msg = CONCAT('Insufficient leave balance. Available: ', v_balance, ' day(s)');

    ELSE
      -- ── 3. Insert leave request ─────────────────────────────
      INSERT INTO leave_requests
        (employee_id, leave_type_id, from_date, from_session,
         to_date, to_session, days, reason, status)
      VALUES
        (p_employee_id, p_leave_type_id, p_from_date, p_from_session,
         p_to_date, p_to_session, p_days, p_reason, 'Pending');

      SET p_request_id = LAST_INSERT_ID();
      SET p_status_msg = 'OK';
    END IF;
  END IF;
END $$

DELIMITER ;

SELECT 'patch_leave_date_overlap applied — duplicate date check active' AS status;
