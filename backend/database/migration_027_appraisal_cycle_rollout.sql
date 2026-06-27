-- ============================================================
-- Migration 027 – Appraisal cycle rollout enhancements
-- Adds rollout_type so admin can choose All vs Selected employees
-- ============================================================

USE hrms_db;

ALTER TABLE appraisal_cycles
  ADD COLUMN IF NOT EXISTS rollout_type ENUM('all', 'selected') NOT NULL DEFAULT 'all' AFTER status,
  ADD COLUMN IF NOT EXISTS disabled_at  DATETIME                                  DEFAULT NULL AFTER rolled_out_at,
  ADD COLUMN IF NOT EXISTS disabled_by  INT UNSIGNED                              DEFAULT NULL AFTER disabled_at;
