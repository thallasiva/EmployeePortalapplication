-- Migration 030: Add shift and location columns to holidays table
-- Supports General / Mid / Night shift-specific holiday calendars with optional location filter

ALTER TABLE holidays
  ADD COLUMN IF NOT EXISTS shift     ENUM('general','mid','night') NOT NULL DEFAULT 'general' AFTER holiday_calendar,
  ADD COLUMN IF NOT EXISTS location  VARCHAR(100) DEFAULT NULL AFTER shift;

-- Index for fast shift+location+year queries
CREATE INDEX IF NOT EXISTS idx_holidays_shift ON holidays (shift);
CREATE INDEX IF NOT EXISTS idx_holidays_location ON holidays (location);

-- Back-fill existing rows → general shift (already default, just explicit)
UPDATE holidays SET shift = 'general' WHERE shift IS NULL OR shift = '';
