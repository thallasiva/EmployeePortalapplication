-- truncate_offers_and_jobs.sql
-- Clears offers and job positions along with all dependent records.
-- Run in MySQL Workbench.

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE joining_formalities;
TRUNCATE TABLE joining_invitations;
TRUNCATE TABLE rec_onboarding;
TRUNCATE TABLE rec_offers;
TRUNCATE TABLE rec_job_recruiters;
TRUNCATE TABLE rec_job_requests;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Offers and job positions cleared successfully.' AS result;
