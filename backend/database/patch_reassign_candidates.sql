USE hrms_db;

-- Reassign any candidates that still have recruiter_id=1 (old hardcoded default)
-- to the first active recruiter (employee_id 51 = Mike Williams)
UPDATE rec_candidates
SET recruiter_id = 51
WHERE recruiter_id = 1
  AND deleted_at IS NULL;

SELECT CONCAT('Updated ', ROW_COUNT(), ' candidate(s) to recruiter_id=51') AS status;
