-- =====================================================================
-- Migration 002: Extended employee profile fields
-- Adds statutory, identity, bank and address fields used by the
-- HR employee data template (Aadhaar, PAN/PF/ESI/UAN, access card,
-- extended bank details, extended contact/address fields).
-- Safe to re-run (uses ADD COLUMN IF NOT EXISTS, MySQL 8.0.29+).
-- =====================================================================

USE hrms_db;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS father_name VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS aadhaar_name VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS aadhaar_enrolment_number VARCHAR(40) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS access_card_number VARCHAR(40) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS access_card_from_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS access_card_to_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pf_number VARCHAR(40) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pf_join_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS esi_number VARCHAR(40) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_left_organization TINYINT(1) DEFAULT 0;

ALTER TABLE employee_contact_info
  ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contact_city VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contact_country VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS permanent_address_line1 VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS permanent_address_line2 VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS permanent_address_line3 VARCHAR(255) DEFAULT NULL;

ALTER TABLE employee_bank_details
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(30) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dd_payable_at VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_type VARCHAR(30) DEFAULT NULL;
