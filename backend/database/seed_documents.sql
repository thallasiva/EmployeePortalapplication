-- =====================================================================
-- NAT IT — Company Documents Seed
-- Inserts 3 policy/handbook documents visible to ALL employees
--
-- Run: node src/database/runSql.js database/seed_documents.sql
-- =====================================================================

USE hrms_db;

-- Ensure categories exist
INSERT INTO document_categories (category_id, category_name) VALUES
  (1, 'policies'),
  (2, 'handbooks'),
  (3, 'templates'),
  (4, 'forms')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

-- Remove previous entries if re-running
DELETE FROM documents WHERE file_url IN (
  '/uploads/posh-policy-natit.pdf',
  '/uploads/natit-handbook.pdf',
  '/uploads/natit-hr-policy-manual.pdf'
);

-- Insert the 3 documents (visibility = 'all' → visible to every employee)
INSERT INTO documents (title, description, category_id, file_type, file_size, file_url, visibility, employee_id, uploaded_by)
VALUES
  (
    'POSH Policy – NAT IT (Ver 1.0)',
    'Prevention of Sexual Harassment (POSH) Policy for NAT IT Services. Covers definitions, complaint procedure, internal committee, and penalties.',
    1,           -- policies
    'pdf',
    NULL,
    '/uploads/posh-policy-natit.pdf',
    'all',       -- visible to all employees
    NULL,
    1            -- uploaded_by: Lenin Kumar (Admin, employee_id=1)
  ),
  (
    'NAT IT Services – Employee Handbook',
    'Official employee handbook covering company culture, code of conduct, benefits, leave policies, and workplace guidelines.',
    2,           -- handbooks
    'pdf',
    NULL,
    '/uploads/natit-handbook.pdf',
    'all',
    NULL,
    1
  ),
  (
    'NAT IT Services – HR Policy Manual (Ver 1.0)',
    'Comprehensive HR Policy Manual including recruitment, onboarding, performance management, compensation, and disciplinary procedures.',
    1,           -- policies
    'pdf',
    NULL,
    '/uploads/natit-hr-policy-manual.pdf',
    'all',
    NULL,
    1
  );

-- ─────────────────────────────────────────────────────────────────────
-- Done ✓  All 3 documents will appear in:
--   Admin   → Dashboard → Documents section
--   Employee → Document Center → Documents tab
-- ─────────────────────────────────────────────────────────────────────
