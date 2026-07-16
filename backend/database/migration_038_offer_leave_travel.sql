-- Migration 038: Add leave_travel column to rec_offers + update stored procedures

USE hrms_db;

-- Step 1: Add column (safe, idempotent)
ALTER TABLE rec_offers
  ADD COLUMN IF NOT EXISTS leave_travel DECIMAL(15,2) NOT NULL DEFAULT 0.00
  AFTER telephone_allowance;

DELIMITER $$

-- Step 2: Update sp_rec_create_offer to accept leave_travel
DROP PROCEDURE IF EXISTS sp_rec_create_offer $$
CREATE PROCEDURE sp_rec_create_offer(
  IN  p_candidate_id        INT,
  IN  p_job_req_id          INT,
  IN  p_designation         VARCHAR(200),
  IN  p_date_of_joining     DATE,
  IN  p_basic               DECIMAL(15,2),
  IN  p_hra                 DECIMAL(15,2),
  IN  p_telephone_allowance DECIMAL(15,2),
  IN  p_leave_travel        DECIMAL(15,2),
  IN  p_special_allowance   DECIMAL(15,2),
  IN  p_gross_salary        DECIMAL(15,2),
  IN  p_pf_contribution     DECIMAL(15,2),
  IN  p_statutory_bonus     DECIMAL(15,2),
  IN  p_gratuity            DECIMAL(15,2),
  IN  p_esi                 DECIMAL(15,2),
  IN  p_ctc                 DECIMAL(15,2),
  IN  p_ctc_in_words        VARCHAR(500),
  IN  p_created_by          INT,
  IN  p_ip                  VARCHAR(45),
  OUT p_offer_id            INT,
  OUT p_offer_code          VARCHAR(20)
)
BEGIN
  DECLARE v_code VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF NOT EXISTS (SELECT 1 FROM rec_candidates WHERE candidate_id = p_candidate_id AND deleted_at IS NULL) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Candidate not found';
  END IF;

  IF EXISTS (SELECT 1 FROM rec_offers WHERE candidate_id = p_candidate_id AND status NOT IN ('Rejected')) THEN
    SIGNAL SQLSTATE '45004' SET MESSAGE_TEXT = 'An active offer already exists for this candidate';
  END IF;

  START TRANSACTION;
    CALL sp_rec_next_code('OFR', 'rec_offers', 'offer_code', v_code);

    INSERT INTO rec_offers (
      offer_code, candidate_id, job_req_id, designation, date_of_joining,
      basic, hra, telephone_allowance, leave_travel, special_allowance, gross_salary,
      pf_contribution, statutory_bonus, gratuity, esi, ctc, ctc_in_words,
      status, created_by
    ) VALUES (
      v_code, p_candidate_id, p_job_req_id, p_designation, p_date_of_joining,
      p_basic, p_hra, p_telephone_allowance, p_leave_travel, p_special_allowance, p_gross_salary,
      p_pf_contribution, p_statutory_bonus, p_gratuity, p_esi, p_ctc, p_ctc_in_words,
      'Draft', p_created_by
    );

    SET p_offer_id   = LAST_INSERT_ID();
    SET p_offer_code = v_code;

    UPDATE rec_candidates SET status = 'Offer Released', updated_by = p_created_by
    WHERE candidate_id = p_candidate_id;

    CALL sp_rec_audit('offer', p_offer_id, 'created',
      NULL, JSON_OBJECT('code', v_code, 'ctc', p_ctc, 'candidate_id', p_candidate_id),
      p_created_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_offer(p_offer_id);
END $$

DELIMITER ;

SELECT 'Migration 038 complete: leave_travel column + sp_rec_create_offer updated' AS status;
