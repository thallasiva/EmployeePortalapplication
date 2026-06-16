-- =====================================================================
-- Migration 007: Add ctc column to payslips table
-- Run AFTER schema.sql and previous migrations
-- =====================================================================

USE hrms_db;

ALTER TABLE payslips
  ADD COLUMN ctc DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER gross_earnings;
