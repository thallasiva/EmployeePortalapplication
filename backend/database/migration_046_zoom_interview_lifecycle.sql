-- Run once before enabling Zoom interview scheduling.
-- Stores the Zoom meeting ID needed to cancel the remote meeting later.
ALTER TABLE rec_interviews
  ADD COLUMN zoom_meeting_id VARCHAR(64) NULL AFTER teams_join_url;

DROP PROCEDURE IF EXISTS sp_rec_set_zoom_meeting_details;
DELIMITER $$
CREATE PROCEDURE sp_rec_set_zoom_meeting_details(
  IN p_interview_id INT,
  IN p_meeting_id VARCHAR(64),
  IN p_join_url TEXT
)
BEGIN
  UPDATE rec_interviews
  SET zoom_meeting_id = p_meeting_id,
      teams_join_url = p_join_url
  WHERE interview_id = p_interview_id;
END $$
DELIMITER ;
