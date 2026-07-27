-- truncate_all_recruitment.sql
-- Clears ALL recruitment data: candidates, interviews, offers, jobs, onboarding, joining.
-- Recruiter Performance will show 0 for everything after this.
-- Run in MySQL Workbench.

SET FOREIGN_KEY_CHECKS = 0;

-- Joining (deepest dependents first)
TRUNCATE TABLE joining_formalities;
TRUNCATE TABLE joining_invitations;

-- Onboarding
TRUNCATE TABLE rec_onboarding;

-- Offers
TRUNCATE TABLE rec_offers;

-- Interviews
TRUNCATE TABLE rec_interviews;

-- Resume parser linked data
TRUNCATE TABLE resume_parser_logs;
TRUNCATE TABLE candidate_skills;
TRUNCATE TABLE candidate_education;
TRUNCATE TABLE candidate_experience;

-- Candidates (after all dependents cleared)
TRUNCATE TABLE rec_candidates;

-- Jobs
TRUNCATE TABLE rec_job_recruiters;
TRUNCATE TABLE rec_job_requests;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'All recruitment data cleared. Dashboard will now show 0 everywhere.' AS result;
