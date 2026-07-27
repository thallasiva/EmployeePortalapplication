-- patch_joining_review_fix.sql
-- Quick fix: adds hr_remarks + 4 admin columns to joining_formalities,
-- then recreates sp_joining_review (9 params) and sp_joining_verify_token
-- Run this if migration_044 has NOT been executed yet.

ALTER TABLE joining_formalities
  ADD COLUMN IF NOT EXISTS hr_remarks           TEXT         NULL,
  ADD COLUMN IF NOT EXISTS admin_employee_id    VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS admin_designation    VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS admin_reporting_to   VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS admin_department     VARCHAR(255) NULL;

-- ── sp_joining_review (9 params, with expires_at reset on request_changes) ──
DROP PROCEDURE IF EXISTS sp_joining_review;

DELIMITER $$
CREATE PROCEDURE sp_joining_review(
  IN p_invitation_id   INT,
  IN p_decision        VARCHAR(30),
  IN p_reviewed_by     INT,
  IN p_remarks         TEXT,
  IN p_changes_fields  TEXT,
  IN p_employee_id     VARCHAR(50),
  IN p_designation     VARCHAR(255),
  IN p_reporting_to    VARCHAR(255),
  IN p_department      VARCHAR(255)
)
BEGIN
  DECLARE v_jf_status VARCHAR(30);
  SET v_jf_status = CASE p_decision
    WHEN 'approve'         THEN 'approved'
    WHEN 'request_changes' THEN 'changes_requested'
    WHEN 'reject'          THEN 'rejected'
    ELSE p_decision
  END;

  UPDATE joining_invitations SET
    status = CASE p_decision
               WHEN 'approve'         THEN 'approved'
               WHEN 'request_changes' THEN 'pending_verification'
               WHEN 'reject'          THEN 'rejected'
               ELSE status
             END,
    expires_at = CASE p_decision
                   WHEN 'request_changes' THEN DATE_ADD(NOW(), INTERVAL 5 DAY)
                   ELSE expires_at
                 END,
    updated_at = NOW()
  WHERE id = p_invitation_id;

  UPDATE joining_formalities SET
    status             = v_jf_status,
    hr_remarks         = p_remarks,
    reviewed_by        = p_reviewed_by,
    reviewed_at        = NOW(),
    admin_employee_id  = COALESCE(p_employee_id,  admin_employee_id),
    admin_designation  = COALESCE(p_designation,  admin_designation),
    admin_reporting_to = COALESCE(p_reporting_to, admin_reporting_to),
    admin_department   = COALESCE(p_department,   admin_department),
    updated_at         = NOW()
  WHERE invitation_id = p_invitation_id;

  SELECT ji.*, jf.status AS formality_status, jf.hr_remarks AS review_remarks,
         jf.reviewed_at, jf.admin_employee_id, jf.admin_designation,
         jf.admin_reporting_to, jf.admin_department
  FROM joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE ji.id = p_invitation_id LIMIT 1;
END$$
DELIMITER ;

-- ── sp_joining_verify_token (returns hr_remarks for the changes-requested banner) ──
DROP PROCEDURE IF EXISTS sp_joining_verify_token;

DELIMITER $$
CREATE PROCEDURE sp_joining_verify_token(
  IN p_token VARCHAR(64) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT ji.*,
         jf.id                   AS formality_id,
         jf.status               AS formality_status,
         jf.full_name,
         jf.handbook_acknowledged,
         jf.privacy_policy_accepted,
         jf.hr_remarks
  FROM   joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE  ji.token    = p_token
    AND  ji.expires_at > NOW()
    AND  ji.status NOT IN ('approved','rejected')
  LIMIT 1;
END$$
DELIMITER ;
