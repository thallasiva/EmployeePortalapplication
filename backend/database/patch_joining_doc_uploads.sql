
USE hrms_db;

ALTER TABLE joining_formalities
  ADD COLUMN IF NOT EXISTS aadhar_doc_url VARCHAR(500) NULL AFTER pan_no,
  ADD COLUMN IF NOT EXISTS pan_doc_url    VARCHAR(500) NULL AFTER aadhar_doc_url;

SELECT 'Patch complete — aadhar_doc_url and pan_doc_url columns added' AS status;
