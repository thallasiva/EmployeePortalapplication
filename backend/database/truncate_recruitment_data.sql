-- ============================================================
-- Truncate all recruitment data: candidates, interviews,
-- offers, onboarding, joining, audit log, resume matches.
-- Job requests and recruiter assignments are kept.
-- Run in MySQL Workbench or CLI.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE joining_formalities;
TRUNCATE TABLE joining_invitations;
TRUNCATE TABLE rec_onboarding;
TRUNCATE TABLE rec_offers;
TRUNCATE TABLE rec_interviews;
TRUNCATE TABLE rec_resume_matches;
TRUNCATE TABLE rec_candidates;
TRUNCATE TABLE rec_audit_log;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Done — candidates, interviews, offers, onboarding and joining data cleared.' AS result;
