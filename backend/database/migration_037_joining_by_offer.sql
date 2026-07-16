-- ============================================================
-- Migration 037: sp_joining_get_by_offer
-- Returns the latest joining invitation for a given offer_id.
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_joining_get_by_offer $$
CREATE PROCEDURE sp_joining_get_by_offer(IN p_offer_id INT)
BEGIN
  SELECT id, token, status, expires_at,
         candidate_name, candidate_email, job_title,
         created_at, updated_at
  FROM   joining_invitations
  WHERE  offer_id = p_offer_id
  ORDER  BY created_at DESC
  LIMIT  1;
END $$

DELIMITER ;
