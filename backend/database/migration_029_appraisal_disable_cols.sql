-- ============================================================
-- Migration 029 – Add missing appraisal_cycles columns
-- Adds disabled_at / disabled_by used by disableCycle service.
-- Safe to re-run (IF NOT EXISTS).
-- ============================================================

USE hrms_db;

ALTER TABLE appraisal_cycles
  ADD COLUMN IF NOT EXISTS disabled_at DATETIME     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS disabled_by INT UNSIGNED DEFAULT NULL;
