-- ── Migration 018: Resignation multi-step review ────────────────────────────
-- Run: mysql -u root -p hrms_db < migration_018_resignation_review.sql

USE hrms_db;

ALTER TABLE resignations
  MODIFY COLUMN status
    ENUM('pending','rm_approved','rm_rejected','accepted','rejected','withdrawn')
    DEFAULT 'pending',
  ADD COLUMN manager_remarks      TEXT        AFTER admin_remarks,
  ADD COLUMN manager_reviewed_by  INT         AFTER manager_remarks,
  ADD COLUMN manager_reviewed_at  DATETIME    AFTER manager_reviewed_by,
  ADD FOREIGN KEY fk_res_mgr (manager_reviewed_by)
    REFERENCES employees(employee_id) ON DELETE SET NULL;
