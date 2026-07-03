-- ═══════════════════════════════════════════════════════════════════
-- COMBINED PATCH — run this once in MySQL Workbench / CLI
-- Covers: ENUM fix + duration_minutes column + teams_join_url + SPs
-- ═══════════════════════════════════════════════════════════════════

-- ── PART 1: Fix ENUM values ───────────────────────────────────────
ALTER TABLE rec_interviews
  MODIFY COLUMN level
    ENUM('Round 1','Round 2','Round 3','HR','Final')
    NOT NULL DEFAULT 'Round 1',
  MODIFY COLUMN interview_type
    ENUM('Video Call','Phone','In-Person','Teams')
    NOT NULL DEFAULT 'Video Call';

-- ── PART 2: Add duration_minutes column (skip if already exists) ──
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'rec_interviews'
    AND COLUMN_NAME  = 'duration_minutes'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE rec_interviews ADD COLUMN duration_minutes INT NULL DEFAULT NULL AFTER interview_time',
  'SELECT ''duration_minutes already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── PART 3: Add teams_join_url column (skip if already exists) ────
SET @col_exists2 = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'rec_interviews'
    AND COLUMN_NAME  = 'teams_join_url'
);
SET @sql2 = IF(@col_exists2 = 0,
  'ALTER TABLE rec_interviews ADD COLUMN teams_join_url VARCHAR(1000) NULL DEFAULT NULL AFTER teams_end',
  'SELECT ''teams_join_url already exists'' AS info'
);
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- ── PART 4: Updated sp_rec_schedule_interview (14 IN + 2 OUT) ────
DROP PROCEDURE IF EXISTS sp_rec_schedule_interview;

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
      interview_date, interview_time, duration_minutes, interviewer,
      teams_subject, teams_participants, teams_start, teams_end,
      scheduled_by
    ) VALUES (
      v_code, p_candidate_id, p_job_req_id, p_level, p_interview_type,
      p_interview_date, p_interview_time, p_duration_minutes, p_interviewer,
      p_teams_subject, p_teams_participants, p_teams_start, p_teams_end,
      p_scheduled_by
    );

    SET p_interview_id   = LAST_INSERT_ID();
    SET p_interview_code = v_code;

    UPDATE rec_candidates
    SET status = 'Interview Scheduled', updated_by = p_scheduled_by
    WHERE candidate_id = p_candidate_id;

    CALL sp_rec_audit('interview', p_interview_id, 'scheduled',
      NULL, JSON_OBJECT('level', p_level, 'interview_type', p_interview_type, 'interview_date', p_interview_date),
      p_scheduled_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_interview(p_interview_id);
END $$

-- ── PART 5: Updated sp_rec_submit_feedback (round progression) ───
DROP PROCEDURE IF EXISTS sp_rec_submit_feedback $$

CREATE PROCEDURE sp_rec_submit_feedback(
  IN p_interview_id       INT,
  IN p_feedback_status    VARCHAR(20),
  IN p_feedback_comments  TEXT,
  IN p_shortlisted        TINYINT(1),
  IN p_submitted_by       INT,
  IN p_ip                 VARCHAR(45)
)
BEGIN
  DECLARE v_cand_id  INT;
  DECLARE v_level    VARCHAR(30);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF NOT EXISTS (SELECT 1 FROM rec_interviews WHERE interview_id = p_interview_id AND status = 'Scheduled') THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Interview not found or already completed';
  END IF;

  SELECT candidate_id, level
  INTO   v_cand_id, v_level
  FROM   rec_interviews
  WHERE  interview_id = p_interview_id;

  START TRANSACTION;
    UPDATE rec_interviews SET
      feedback_status   = p_feedback_status,
      feedback_comments = p_feedback_comments,
      shortlisted       = COALESCE(p_shortlisted, 0),
      status            = 'Completed',
      feedback_by       = p_submitted_by
    WHERE interview_id = p_interview_id;

    -- Round progression logic
    IF p_feedback_status = 'Selected' THEN
      IF v_level = 'Final' THEN
        -- Final round passed → ready for offer
        UPDATE rec_candidates SET status = 'Shortlisted', updated_by = p_submitted_by
        WHERE candidate_id = v_cand_id;
      ELSE
        -- Intermediate round passed → recruiter schedules next round
        UPDATE rec_candidates SET status = 'Schedule Interview', updated_by = p_submitted_by
        WHERE candidate_id = v_cand_id;
      END IF;
    ELSEIF p_feedback_status = 'Not Selected' THEN
      UPDATE rec_candidates SET status = 'Rejected', updated_by = p_submitted_by
      WHERE candidate_id = v_cand_id;
    END IF;
    -- 'Hold' → no status change

    CALL sp_rec_audit('interview', p_interview_id, 'feedback_submitted',
      NULL, JSON_OBJECT('feedback_status', p_feedback_status, 'level', v_level, 'shortlisted', p_shortlisted),
      p_submitted_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_interview(p_interview_id);
END $$

DELIMITER ;
