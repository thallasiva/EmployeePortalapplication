-- ============================================================
-- Migration 035: Joining Formalities & Onboarding Invitations
-- ============================================================

-- 1. Joining Invitations — one per candidate/offer release
CREATE TABLE IF NOT EXISTS joining_invitations (
  id              INT          AUTO_INCREMENT PRIMARY KEY,
  candidate_id    INT          NOT NULL,
  offer_id        INT          NOT NULL,
  token           VARCHAR(64)  NOT NULL UNIQUE,
  candidate_name  VARCHAR(255) NULL,
  candidate_email VARCHAR(255) NOT NULL,
  job_title       VARCHAR(255) NULL,
  status          ENUM('pending','submitted','pending_verification','approved','changes_requested','rejected')
                               NOT NULL DEFAULT 'pending',
  expires_at      DATETIME     NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ji_token       (token),
  INDEX idx_ji_candidate   (candidate_id),
  INDEX idx_ji_offer       (offer_id),
  INDEX idx_ji_status      (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Joining Formalities — actual submission data per invitation
CREATE TABLE IF NOT EXISTS joining_formalities (
  id                     INT       AUTO_INCREMENT PRIMARY KEY,
  invitation_id          INT       NOT NULL UNIQUE,
  candidate_id           INT       NOT NULL,

  -- Step 1: Policy acknowledgments
  handbook_acknowledged  TINYINT(1) NOT NULL DEFAULT 0,
  privacy_policy_accepted TINYINT(1) NOT NULL DEFAULT 0,

  -- Step 2: Personal details for joining
  full_name              VARCHAR(255) NULL,
  dob                    DATE         NULL,
  gender                 ENUM('Male','Female','Other') NULL,
  blood_group            VARCHAR(10)  NULL,
  personal_email         VARCHAR(255) NULL,
  mobile                 VARCHAR(20)  NULL,
  emergency_contact_name VARCHAR(255) NULL,
  emergency_contact_phone VARCHAR(20) NULL,
  permanent_address      TEXT         NULL,
  current_address        TEXT         NULL,

  -- Step 3: Nomination forms (stored as JSON for flexibility)
  term_life_nominee_name      VARCHAR(255) NULL,
  term_life_nominee_relation  VARCHAR(100) NULL,
  term_life_nominee_dob       DATE         NULL,
  term_life_nominee_share     DECIMAL(5,2) NULL,

  gratuity_nominee_name       VARCHAR(255) NULL,
  gratuity_nominee_relation   VARCHAR(100) NULL,
  gratuity_nominee_dob        DATE         NULL,
  gratuity_nominee_address    TEXT         NULL,

  insurance_nominee_name      VARCHAR(255) NULL,
  insurance_nominee_relation  VARCHAR(100) NULL,
  insurance_nominee_dob       DATE         NULL,
  insurance_nominee_share     DECIMAL(5,2) NULL,

  -- Step 4: PF Declaration
  pf_account_number      VARCHAR(50)  NULL,
  uan_number             VARCHAR(20)  NULL,
  pf_nominee_name        VARCHAR(255) NULL,
  pf_nominee_relation    VARCHAR(100) NULL,
  pf_nominee_dob         DATE         NULL,
  pf_nominee_share       DECIMAL(5,2) NULL,
  pf_existing_member     TINYINT(1)   NOT NULL DEFAULT 0,

  -- Step 5: Bank details
  bank_name              VARCHAR(255) NULL,
  account_number         VARCHAR(50)  NULL,
  ifsc_code              VARCHAR(20)  NULL,
  account_holder_name    VARCHAR(255) NULL,

  -- Workflow
  status                 ENUM('draft','submitted','pending_verification','approved','changes_requested','rejected')
                                      NOT NULL DEFAULT 'draft',
  submitted_at           DATETIME     NULL,
  reviewed_by            INT          NULL,
  reviewed_at            DATETIME     NULL,
  review_remarks         TEXT         NULL,
  changes_requested_fields TEXT       NULL,   -- comma-separated field names needing correction

  created_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (invitation_id) REFERENCES joining_invitations(id) ON DELETE CASCADE,
  INDEX idx_jf_candidate (candidate_id),
  INDEX idx_jf_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Stored Procedures
-- ============================================================

DROP PROCEDURE IF EXISTS sp_joining_create_invitation;
DELIMITER $$
CREATE PROCEDURE sp_joining_create_invitation(
  IN p_candidate_id    INT,
  IN p_offer_id        INT,
  IN p_token           VARCHAR(64),
  IN p_candidate_name  VARCHAR(255),
  IN p_candidate_email VARCHAR(255),
  IN p_job_title       VARCHAR(255),
  IN p_expires_at      DATETIME
)
BEGIN
  INSERT INTO joining_invitations
    (candidate_id, offer_id, token, candidate_name, candidate_email, job_title, expires_at)
  VALUES
    (p_candidate_id, p_offer_id, p_token, p_candidate_name, p_candidate_email, p_job_title, p_expires_at)
  ON DUPLICATE KEY UPDATE
    token       = p_token,
    status      = 'pending',
    expires_at  = p_expires_at,
    updated_at  = CURRENT_TIMESTAMP;

  SELECT * FROM joining_invitations WHERE token = p_token LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_joining_verify_token;
DELIMITER $$
CREATE PROCEDURE sp_joining_verify_token(IN p_token VARCHAR(64))
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

DROP PROCEDURE IF EXISTS sp_joining_save_formalities;
DELIMITER $$
CREATE PROCEDURE sp_joining_save_formalities(
  IN p_invitation_id INT,
  IN p_candidate_id  INT,
  IN p_full_name     VARCHAR(255),
  IN p_dob           DATE,
  IN p_gender        VARCHAR(10),
  IN p_blood_group   VARCHAR(10),
  IN p_personal_email VARCHAR(255),
  IN p_mobile        VARCHAR(20),
  IN p_emergency_contact_name  VARCHAR(255),
  IN p_emergency_contact_phone VARCHAR(20),
  IN p_permanent_address TEXT,
  IN p_current_address   TEXT,
  IN p_handbook_acknowledged  TINYINT(1),
  IN p_privacy_policy_accepted TINYINT(1),
  -- Nominees
  IN p_tl_name     VARCHAR(255), IN p_tl_relation VARCHAR(100), IN p_tl_dob DATE, IN p_tl_share DECIMAL(5,2),
  IN p_gr_name     VARCHAR(255), IN p_gr_relation VARCHAR(100), IN p_gr_dob DATE, IN p_gr_address TEXT,
  IN p_ins_name    VARCHAR(255), IN p_ins_relation VARCHAR(100), IN p_ins_dob DATE, IN p_ins_share DECIMAL(5,2),
  -- PF
  IN p_pf_account  VARCHAR(50), IN p_uan VARCHAR(20),
  IN p_pf_nom_name VARCHAR(255), IN p_pf_nom_relation VARCHAR(100), IN p_pf_nom_dob DATE, IN p_pf_nom_share DECIMAL(5,2),
  IN p_pf_existing TINYINT(1),
  -- Bank
  IN p_bank_name    VARCHAR(255), IN p_account_number VARCHAR(50), IN p_ifsc VARCHAR(20), IN p_account_holder VARCHAR(255),
  -- Status
  IN p_status       VARCHAR(30)
)
BEGIN
  INSERT INTO joining_formalities (
    invitation_id, candidate_id,
    full_name, dob, gender, blood_group, personal_email, mobile,
    emergency_contact_name, emergency_contact_phone, permanent_address, current_address,
    handbook_acknowledged, privacy_policy_accepted,
    term_life_nominee_name, term_life_nominee_relation, term_life_nominee_dob, term_life_nominee_share,
    gratuity_nominee_name, gratuity_nominee_relation, gratuity_nominee_dob, gratuity_nominee_address,
    insurance_nominee_name, insurance_nominee_relation, insurance_nominee_dob, insurance_nominee_share,
    pf_account_number, uan_number, pf_nominee_name, pf_nominee_relation, pf_nominee_dob, pf_nominee_share, pf_existing_member,
    bank_name, account_number, ifsc_code, account_holder_name,
    status, submitted_at
  ) VALUES (
    p_invitation_id, p_candidate_id,
    p_full_name, p_dob, p_gender, p_blood_group, p_personal_email, p_mobile,
    p_emergency_contact_name, p_emergency_contact_phone, p_permanent_address, p_current_address,
    p_handbook_acknowledged, p_privacy_policy_accepted,
    p_tl_name, p_tl_relation, p_tl_dob, p_tl_share,
    p_gr_name, p_gr_relation, p_gr_dob, p_gr_address,
    p_ins_name, p_ins_relation, p_ins_dob, p_ins_share,
    p_pf_account, p_uan, p_pf_nom_name, p_pf_nom_relation, p_pf_nom_dob, p_pf_nom_share, p_pf_existing,
    p_bank_name, p_account_number, p_ifsc, p_account_holder,
    p_status, IF(p_status = 'submitted', NOW(), NULL)
  )
  ON DUPLICATE KEY UPDATE
    full_name = p_full_name, dob = p_dob, gender = p_gender, blood_group = p_blood_group,
    personal_email = p_personal_email, mobile = p_mobile,
    emergency_contact_name = p_emergency_contact_name, emergency_contact_phone = p_emergency_contact_phone,
    permanent_address = p_permanent_address, current_address = p_current_address,
    handbook_acknowledged = p_handbook_acknowledged, privacy_policy_accepted = p_privacy_policy_accepted,
    term_life_nominee_name = p_tl_name, term_life_nominee_relation = p_tl_relation,
    term_life_nominee_dob = p_tl_dob, term_life_nominee_share = p_tl_share,
    gratuity_nominee_name = p_gr_name, gratuity_nominee_relation = p_gr_relation,
    gratuity_nominee_dob = p_gr_dob, gratuity_nominee_address = p_gr_address,
    insurance_nominee_name = p_ins_name, insurance_nominee_relation = p_ins_relation,
    insurance_nominee_dob = p_ins_dob, insurance_nominee_share = p_ins_share,
    pf_account_number = p_pf_account, uan_number = p_uan,
    pf_nominee_name = p_pf_nom_name, pf_nominee_relation = p_pf_nom_relation,
    pf_nominee_dob = p_pf_nom_dob, pf_nominee_share = p_pf_nom_share, pf_existing_member = p_pf_existing,
    bank_name = p_bank_name, account_number = p_account_number, ifsc_code = p_ifsc, account_holder_name = p_account_holder,
    status = p_status,
    submitted_at = IF(p_status = 'submitted' AND submitted_at IS NULL, NOW(), submitted_at),
    updated_at = CURRENT_TIMESTAMP;

  -- Sync invitation status
  UPDATE joining_invitations SET
    status = IF(p_status = 'submitted', 'pending_verification', status),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_invitation_id;

  SELECT jf.*, ji.token, ji.candidate_email, ji.candidate_name, ji.job_title
  FROM   joining_formalities jf
  JOIN   joining_invitations  ji ON ji.id = jf.invitation_id
  WHERE  jf.invitation_id = p_invitation_id LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_joining_list_pending;
DELIMITER $$
CREATE PROCEDURE sp_joining_list_pending(
  IN p_status  VARCHAR(30),
  IN p_search  VARCHAR(255),
  IN p_limit   INT,
  IN p_offset  INT
)
BEGIN
  SELECT ji.id, ji.candidate_id, ji.offer_id, ji.token,
         ji.candidate_name, ji.candidate_email, ji.job_title,
         ji.status AS invitation_status,
         ji.created_at, ji.expires_at,
         jf.id         AS formality_id,
         jf.status     AS formality_status,
         jf.submitted_at,
         jf.reviewed_at,
         jf.review_remarks,
         jf.full_name,
         jf.mobile
  FROM   joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE  (p_status IS NULL OR ji.status = p_status)
    AND  (p_search IS NULL OR ji.candidate_name LIKE CONCAT('%', p_search, '%')
          OR ji.candidate_email LIKE CONCAT('%', p_search, '%'))
  ORDER BY ji.created_at DESC
  LIMIT  p_limit OFFSET p_offset;

  SELECT COUNT(*) AS total
  FROM   joining_invitations ji
  WHERE  (p_status IS NULL OR ji.status = p_status)
    AND  (p_search IS NULL OR ji.candidate_name LIKE CONCAT('%', p_search, '%')
          OR ji.candidate_email LIKE CONCAT('%', p_search, '%'));
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_joining_get_formality;
DELIMITER $$
CREATE PROCEDURE sp_joining_get_formality(IN p_invitation_id INT)
BEGIN
  SELECT jf.*, ji.token, ji.candidate_email, ji.candidate_name, ji.job_title, ji.status AS invitation_status
  FROM   joining_formalities jf
  JOIN   joining_invitations  ji ON ji.id = jf.invitation_id
  WHERE  jf.invitation_id = p_invitation_id LIMIT 1;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_joining_review;
DELIMITER $$
CREATE PROCEDURE sp_joining_review(
  IN p_invitation_id INT,
  IN p_decision      VARCHAR(20),
  IN p_reviewed_by   INT,
  IN p_remarks       TEXT,
  IN p_changes_fields TEXT
)
BEGIN
  DECLARE v_formality_status VARCHAR(30);
  DECLARE v_inv_status       VARCHAR(30);

  SET v_formality_status = CASE p_decision
    WHEN 'approve'           THEN 'approved'
    WHEN 'request_changes'   THEN 'changes_requested'
    WHEN 'reject'            THEN 'rejected'
    ELSE p_decision
  END;

  SET v_inv_status = CASE p_decision
    WHEN 'approve'           THEN 'approved'
    WHEN 'request_changes'   THEN 'changes_requested'
    WHEN 'reject'            THEN 'rejected'
    ELSE p_decision
  END;

  UPDATE joining_formalities SET
    status                   = v_formality_status,
    reviewed_by              = p_reviewed_by,
    reviewed_at              = NOW(),
    review_remarks           = p_remarks,
    changes_requested_fields = p_changes_fields,
    updated_at               = CURRENT_TIMESTAMP
  WHERE invitation_id = p_invitation_id;

  UPDATE joining_invitations SET
    status     = v_inv_status,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_invitation_id;

  SELECT ji.*, jf.status AS formality_status, jf.review_remarks,
         jf.candidate_id AS jf_candidate_id
  FROM   joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE  ji.id = p_invitation_id LIMIT 1;
END$$
DELIMITER ;
