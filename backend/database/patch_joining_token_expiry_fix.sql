-- ============================================================
-- Patch: sp_joining_verify_token — fix "Link Invalid or Expired"
-- Changes:
--   1. Token still works after expires_at IF a formality is already
--      in draft or submitted state (candidate started filling it out)
--   2. Returns candidate_mobile from rec_candidates
-- Run in MySQL Workbench against hrms_db
-- ============================================================
USE hrms_db;

DROP PROCEDURE IF EXISTS sp_joining_verify_token;

DELIMITER $$
CREATE PROCEDURE sp_joining_verify_token(
  IN p_token VARCHAR(64) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  -- Allow access when:
  --   a) token is not yet expired, OR
  --   b) a formality record already exists (candidate already started)
  -- Block only when status is 'approved' or 'rejected'
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
  WHERE  ji.token = p_token
    AND  ji.status NOT IN ('approved', 'rejected')
    AND  (
           ji.expires_at > NOW()          -- not yet expired
           OR jf.id IS NOT NULL           -- OR candidate already has a draft/submitted record
         )
  LIMIT 1;
END$$
DELIMITER ;

-- Also extend existing invitation expiry dates that are within the last 30 days
-- so current candidates with recently expired links can access again
SET SQL_SAFE_UPDATES = 0;
UPDATE joining_invitations
SET    expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY)
WHERE  id > 0
  AND  expires_at < NOW()
  AND  expires_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND  status NOT IN ('approved', 'rejected');
SET SQL_SAFE_UPDATES = 1;

SELECT CONCAT(
  'Patch complete — sp_joining_verify_token now allows expired links if formality exists. ',
  ROW_COUNT(), ' invitation(s) had their expiry extended.'
) AS status;
