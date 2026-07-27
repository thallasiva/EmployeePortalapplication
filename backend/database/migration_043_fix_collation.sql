-- Fix collation mismatch in joining_invitations.token column
-- Error: Illegal mix of collations (utf8mb4_0900_ai_ci,IMPLICIT) and (utf8mb4_unicode_ci,IMPLICIT)

-- Step 1: Alter the token column to use utf8mb4_unicode_ci (match server default)
ALTER TABLE joining_invitations
  MODIFY COLUMN token VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Step 2: Recreate the verify procedure with matching collation on parameter
DROP PROCEDURE IF EXISTS sp_joining_verify_token;

DELIMITER $$
CREATE PROCEDURE sp_joining_verify_token(IN p_token VARCHAR(64) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
  SELECT ji.*,
         jf.id         AS formality_id,
         jf.status     AS formality_status,
         jf.full_name,
         jf.handbook_acknowledged,
         jf.privacy_policy_accepted
  FROM   joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE  ji.token = p_token
    AND  ji.expires_at > NOW()
    AND  ji.status NOT IN ('approved','rejected')
  LIMIT 1;
END$$
DELIMITER ;
