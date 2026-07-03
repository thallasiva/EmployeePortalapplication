-- Patch: Interview round progression
-- When feedback = "Selected" and round is NOT Final → candidate moves to "Schedule Interview" (next round)
-- When feedback = "Selected" and round IS Final    → candidate moves to "Shortlisted" (ready for offer)
-- When feedback = "Not Selected"                   → candidate moves to "Rejected"
-- When feedback = "Hold"                           → candidate status unchanged

DROP PROCEDURE IF EXISTS sp_rec_submit_feedback;

DELIMITER $$
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
        -- Intermediate round passed → ready for next round
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
