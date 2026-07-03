-- Patch: align rec_interviews ENUM values with backend validator
-- Run this once on your database

ALTER TABLE rec_interviews
  MODIFY COLUMN level ENUM('Round 1','Round 2','Round 3','HR','Final') NOT NULL DEFAULT 'Round 1',
  MODIFY COLUMN interview_type ENUM('Video Call','Phone','In-Person','Teams') NOT NULL DEFAULT 'Video Call';
