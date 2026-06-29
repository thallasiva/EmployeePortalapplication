-- ── Migration 019: Fix resignation column names ──────────────────────────────
-- Run this if the table was created with old column names (submission_date / required_lwd)
-- mysql -u root -p hrms_db < migration_019_fix_resignation_columns.sql

USE hrms_db;

-- Rename submission_date → start_date (if exists)
ALTER TABLE resignations
  CHANGE COLUMN submission_date start_date DATE NOT NULL;

-- Rename required_lwd → end_date (if exists)
ALTER TABLE resignations
  CHANGE COLUMN required_lwd end_date DATE NOT NULL;
