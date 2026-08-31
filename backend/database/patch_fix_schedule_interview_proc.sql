-- ─────────────────────────────────────────────────────────────────────────────
-- COMBINED FIX: Add missing columns + update sp_rec_schedule_interview
-- Safe to run multiple times
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Add duration_minutes if missing
SET @col1 = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rec_interviews' AND COLUMN_NAME = 'duration_minutes');

SET @sql1 = IF(@col1 = 0,
  'ALTER TABLE rec_interviews ADD COLUMN duration_minutes INT NULL DEFAULT NULL AFTER interview_time',
  'SELECT 1');

PREPARE stmt1 FROM @sql1;

EXECUTE stmt1;

DEALLOCATE PREPARE stmt1;

-- Step 2: Add candidate_type if missing
SET @col2 = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rec_interviews' AND COLUMN_NAME = 'candidate_type');

SET @sql2 = IF(@col2 = 0,
  'ALTER TABLE rec_interviews ADD COLUMN candidate_type ENUM(''Internal'',''External'') NOT NULL DEFAULT ''External'' AFTER interviewer',
  'SELECT 1');

PREPARE stmt2 FROM @sql2;

EXECUTE stmt2;

DEALLOCATE PREPARE stmt2;

-- Step 3: Drop existing procedure first
DROP PROCEDURE IF EXISTS sp_rec_schedule_interview;

-- Step 4: Recreate with all 15 IN params + 2 OUT
DELIMITER $$
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
END$$
DELIMITER ;
