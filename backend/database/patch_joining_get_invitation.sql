-- Patch: add sp_joining_get_invitation (just the invitation row, no formality required)
DROP PROCEDURE IF EXISTS sp_joining_get_invitation;
DELIMITER $$
CREATE PROCEDURE sp_joining_get_invitation(IN p_invitation_id INT)
BEGIN
  SELECT ji.*
  FROM   joining_invitations ji
  WHERE  ji.id = p_invitation_id
  LIMIT  1;
END$$
DELIMITER ;
