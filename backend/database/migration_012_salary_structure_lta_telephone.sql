-- =====================================================================
-- Migration 012: Add lta & telephone_allowance columns to salary_structures
--                and backfill from basic (statutory estimates).
-- =====================================================================
USE hrms_db;

ALTER TABLE salary_structures
  ADD COLUMN IF NOT EXISTS lta                  DECIMAL(12,2) DEFAULT 0 AFTER special_allowance,
  ADD COLUMN IF NOT EXISTS telephone_allowance  DECIMAL(12,2) DEFAULT 0 AFTER lta;

-- Backfill existing rows using same percentages as calculatePayslip utility
-- LTA = 4.5% of basic, Telephone = 2% of basic
UPDATE salary_structures
SET
  lta                 = ROUND(basic * 0.045),
  telephone_allowance = ROUND(basic * 0.02)
WHERE lta = 0 OR telephone_allowance = 0;
