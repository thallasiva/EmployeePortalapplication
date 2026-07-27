-- ============================================================
-- Patch: sp_joining_verify_token — also return candidate mobile
-- Run in MySQL Workbench against hrms_db
-- ============================================================
USE hrms_db;

DROP PROCEDURE IF EXISTS sp_joining_verify_token;

DELIMITER $$
CREATE PROCEDURE sp_joining_verify_token(
  IN p_token VARCHAR(64) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT ji.*,
         jf.id                    AS formality_id,
         jf.status                AS formality_status,
         jf.full_name,
         jf.handbook_acknowledged,
         jf.privacy_policy_accepted,
         jf.hr_remarks,
         rc.mobile                AS candidate_mobile
  FROM   joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  LEFT JOIN rec_candidates rc      ON rc.id = ji.candidate_id
  WHERE  ji.token      = p_token
    AND  ji.expires_at > NOW()
    AND  ji.status NOT IN ('approved','rejected')
  LIMIT 1;
END$$
DELIMITER ;

SELECT 'Patch complete — sp_joining_verify_token now returns candidate_mobile' AS status;
