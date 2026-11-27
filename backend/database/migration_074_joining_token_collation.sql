DROP PROCEDURE IF EXISTS sp_joining_verify_token;

DELIMITER $$
CREATE PROCEDURE sp_joining_verify_token(
  IN p_token VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci
)
BEGIN
  SELECT
      ji.*,
      jf.id AS formality_id,
      jf.status AS formality_status,
      jf.full_name,
      jf.handbook_acknowledged,
      jf.privacy_policy_accepted,
      jf.hr_remarks,
      rc.mobile AS candidate_mobile
  FROM joining_invitations ji
  LEFT JOIN joining_formalities jf
         ON jf.invitation_id = ji.id
  LEFT JOIN rec_candidates rc
         ON rc.candidate_id = ji.candidate_id
  WHERE ji.token = p_token
    AND ji.status NOT IN ('approved', 'rejected')
    AND (
          ji.expires_at > NOW()
          OR jf.id IS NOT NULL
        )
  LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_joining_get_form_by_token;

DELIMITER $$
CREATE PROCEDURE sp_joining_get_form_by_token(
  IN p_token VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci
)
BEGIN
  SELECT
    jf.*,
    ji.candidate_name, ji.candidate_email, ji.job_title,
    ji.expires_at, ji.status AS invitation_status,
    jf.hr_remarks
  FROM joining_invitations ji
  INNER JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE ji.token = p_token
    AND ji.expires_at > NOW()
    AND ji.status NOT IN ('approved','rejected')
  LIMIT 1;
END$$
DELIMITER ;
