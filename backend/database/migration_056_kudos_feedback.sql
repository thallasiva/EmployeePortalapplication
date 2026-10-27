-- =============================================================
-- Migration 056: Kudos & Feedback (My Worklife).
-- Replaces the static Kudos / Feedback pages with real data:
--   kudos_categories     admin-managed categories for kudos and feedback
--   kudos                recognition from one employee to another
--   employee_feedback    Positive / Constructive / Developmental feedback
--   feedback_requests    "please give me feedback" requests, answered by employee_feedback
-- Run with: node src/database/runSql.js migration_056_kudos_feedback.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS kudos_categories (
  category_id    INT AUTO_INCREMENT PRIMARY KEY,
  category_name  VARCHAR(60) NOT NULL,
  description    VARCHAR(255) DEFAULT NULL,
  color          VARCHAR(20) NOT NULL DEFAULT '#f18200',
  category_type  ENUM('kudos', 'feedback') NOT NULL DEFAULT 'kudos',
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_kudos_category (category_type, category_name)
);

CREATE TABLE IF NOT EXISTS kudos (
  kudos_id          INT AUTO_INCREMENT PRIMARY KEY,
  from_employee_id  INT NOT NULL,
  to_employee_id    INT NOT NULL,
  category_id       INT DEFAULT NULL,
  message           TEXT NOT NULL,
  is_public         TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_kudos_to (to_employee_id, created_at),
  KEY idx_kudos_from (from_employee_id, created_at),
  CONSTRAINT fk_kudos_from FOREIGN KEY (from_employee_id) REFERENCES employees (employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_kudos_to FOREIGN KEY (to_employee_id) REFERENCES employees (employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_kudos_category FOREIGN KEY (category_id) REFERENCES kudos_categories (category_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS feedback_requests (
  request_id             INT AUTO_INCREMENT PRIMARY KEY,
  requester_employee_id  INT NOT NULL,
  reviewer_employee_id   INT NOT NULL,
  topic                  VARCHAR(150) NOT NULL,
  message                TEXT DEFAULT NULL,
  status                 ENUM('pending', 'completed', 'declined') NOT NULL DEFAULT 'pending',
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at           DATETIME DEFAULT NULL,
  KEY idx_fbreq_reviewer (reviewer_employee_id, status),
  KEY idx_fbreq_requester (requester_employee_id, status),
  CONSTRAINT fk_fbreq_requester FOREIGN KEY (requester_employee_id) REFERENCES employees (employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_fbreq_reviewer FOREIGN KEY (reviewer_employee_id) REFERENCES employees (employee_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employee_feedback (
  feedback_id       INT AUTO_INCREMENT PRIMARY KEY,
  from_employee_id  INT NOT NULL,
  to_employee_id    INT NOT NULL,
  feedback_type     ENUM('Positive', 'Constructive', 'Developmental') NOT NULL,
  category_id       INT DEFAULT NULL,
  message           TEXT NOT NULL,
  is_anonymous      TINYINT(1) NOT NULL DEFAULT 0,
  request_id        INT DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_feedback_to (to_employee_id, created_at),
  KEY idx_feedback_from (from_employee_id, created_at),
  CONSTRAINT fk_feedback_from FOREIGN KEY (from_employee_id) REFERENCES employees (employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_to FOREIGN KEY (to_employee_id) REFERENCES employees (employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_category FOREIGN KEY (category_id) REFERENCES kudos_categories (category_id) ON DELETE SET NULL,
  CONSTRAINT fk_feedback_request FOREIGN KEY (request_id) REFERENCES feedback_requests (request_id) ON DELETE SET NULL
);

INSERT IGNORE INTO kudos_categories (category_name, description, color, category_type) VALUES
  ('Teamwork',       'Helped others succeed together',             '#f18200', 'kudos'),
  ('Innovation',     'New ideas that improved how we work',        '#7c3aed', 'kudos'),
  ('Customer Focus', 'Went beyond for a client or candidate',      '#0e7490', 'kudos'),
  ('Ownership',      'Took responsibility end to end',             '#16a34a', 'kudos'),
  ('Leadership',     'Guided and lifted the team',                 '#1d4ed8', 'kudos'),
  ('Above & Beyond', 'Did more than was asked',                    '#db2777', 'kudos'),
  ('Communication',  'Clarity, listening and keeping others informed', '#0e7490', 'feedback'),
  ('Delivery',       'Quality and timeliness of work',             '#16a34a', 'feedback'),
  ('Collaboration',  'Working with peers and other teams',         '#f18200', 'feedback');

SELECT 'migration_056_kudos_feedback done' AS status;
