-- ============================================================
-- Migration 028 – Add cycle_type to appraisal_cycles
-- Types: monthly, quarterly, half_yearly, yearly
-- ============================================================

USE hrms_db;

ALTER TABLE appraisal_cycles
  ADD COLUMN IF NOT EXISTS cycle_type
    ENUM('monthly','quarterly','half_yearly','yearly')
    NOT NULL DEFAULT 'yearly'
  AFTER fy_label;
