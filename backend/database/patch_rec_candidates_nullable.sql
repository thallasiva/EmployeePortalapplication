USE hrms_db;

ALTER TABLE rec_candidates
  MODIFY COLUMN mobile    VARCHAR(20)  NULL,
  MODIFY COLUMN skill_set TEXT         NULL;

SELECT 'Patch applied — mobile and skill_set are now nullable in rec_candidates' AS status;
