-- =====================================================================
-- HRMS Backend - Database Schema
-- Database: MySQL 8.0+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS hrms_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hrms_db;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. ORGANIZATION STRUCTURE
-- =====================================================================

CREATE TABLE IF NOT EXISTS companies (
  company_id    INT AUTO_INCREMENT PRIMARY KEY,
  company_name  VARCHAR(150) NOT NULL,
  address       VARCHAR(255) DEFAULT NULL,
  email         VARCHAR(150) DEFAULT NULL,
  phone         VARCHAR(30)  DEFAULT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roles (
  role_id    INT AUTO_INCREMENT PRIMARY KEY,
  role_name  VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS departments (
  department_id   INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL,
  company_id       INT DEFAULT NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_department_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS designations (
  designation_id   INT AUTO_INCREMENT PRIMARY KEY,
  designation_name VARCHAR(100) NOT NULL,
  department_id    INT DEFAULT NULL,
  CONSTRAINT fk_designation_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leadership_roles (
  leadership_role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name          VARCHAR(100) NOT NULL,
  description        VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS offices (
  office_id    INT AUTO_INCREMENT PRIMARY KEY,
  office_name  VARCHAR(100) NOT NULL,
  location     VARCHAR(100) DEFAULT NULL,
  address      VARCHAR(255) DEFAULT NULL,
  holiday_calendar VARCHAR(100) DEFAULT 'India - Default'
) ENGINE=InnoDB;

-- =====================================================================
-- 2. EMPLOYEES & AUTH
-- =====================================================================

CREATE TABLE IF NOT EXISTS employees (
  employee_id     INT AUTO_INCREMENT PRIMARY KEY,
  emp_code        VARCHAR(30) UNIQUE,
  first_name      VARCHAR(80) NOT NULL,
  last_name       VARCHAR(80) DEFAULT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  mobile          VARCHAR(20) DEFAULT NULL,
  gender          ENUM('Male','Female','Other') DEFAULT NULL,
  dob             DATE DEFAULT NULL,
  marital_status  VARCHAR(20) DEFAULT NULL,
  blood_group     VARCHAR(10) DEFAULT NULL,
  profile_photo   VARCHAR(255) DEFAULT NULL,
  reporting_to    INT DEFAULT NULL,
  emp_job_title   VARCHAR(100) DEFAULT NULL,
  department_id   INT DEFAULT NULL,
  designation_id  INT DEFAULT NULL,
  leadership_role_id INT DEFAULT NULL,
  office_id       INT DEFAULT NULL,
  team_id         INT DEFAULT NULL,
  employee_type   VARCHAR(30) DEFAULT 'Full-Time',
  employee_status VARCHAR(20) DEFAULT 'Active',
  shift           VARCHAR(20) DEFAULT 'general',
  location        VARCHAR(100) DEFAULT NULL,
  holiday_calendar VARCHAR(100) DEFAULT 'India - Default',
  emp_joining_date DATE DEFAULT NULL,
  emp_exit_date    DATE DEFAULT NULL,
  ctc              DECIMAL(12,2) DEFAULT NULL,
  base_salary      DECIMAL(12,2) DEFAULT NULL,
  benefits_plan    VARCHAR(40) DEFAULT 'standard',
  assigned_member  VARCHAR(100) DEFAULT NULL,
  father_name      VARCHAR(100) DEFAULT NULL,
  spouse_name      VARCHAR(100) DEFAULT NULL,
  aadhaar_number   VARCHAR(20) DEFAULT NULL,
  aadhaar_name     VARCHAR(100) DEFAULT NULL,
  aadhaar_enrolment_number VARCHAR(40) DEFAULT NULL,
  access_card_number VARCHAR(40) DEFAULT NULL,
  access_card_from_date DATE DEFAULT NULL,
  access_card_to_date   DATE DEFAULT NULL,
  pf_number        VARCHAR(40) DEFAULT NULL,
  pf_join_date     DATE DEFAULT NULL,
  esi_number       VARCHAR(40) DEFAULT NULL,
  has_left_organization TINYINT(1) DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
  CONSTRAINT fk_employee_designation FOREIGN KEY (designation_id) REFERENCES designations(designation_id) ON DELETE SET NULL,
  CONSTRAINT fk_employee_leadership FOREIGN KEY (leadership_role_id) REFERENCES leadership_roles(leadership_role_id) ON DELETE SET NULL,
  CONSTRAINT fk_employee_office FOREIGN KEY (office_id) REFERENCES offices(office_id) ON DELETE SET NULL,
  CONSTRAINT fk_employee_manager FOREIGN KEY (reporting_to) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_contact_info (
  employee_id          INT PRIMARY KEY,
  current_address      VARCHAR(255) DEFAULT NULL,
  permanent_address     VARCHAR(255) DEFAULT NULL,
  personal_email        VARCHAR(150) DEFAULT NULL,
  alternate_mobile      VARCHAR(20) DEFAULT NULL,
  emergency_contact_name VARCHAR(100) DEFAULT NULL,
  emergency_contact_relation VARCHAR(50) DEFAULT NULL,
  emergency_contact_phone VARCHAR(20) DEFAULT NULL,
  contact_name          VARCHAR(100) DEFAULT NULL,
  contact_city          VARCHAR(100) DEFAULT NULL,
  contact_country       VARCHAR(100) DEFAULT NULL,
  permanent_address_line1 VARCHAR(255) DEFAULT NULL,
  permanent_address_line2 VARCHAR(255) DEFAULT NULL,
  permanent_address_line3 VARCHAR(255) DEFAULT NULL,
  CONSTRAINT fk_contact_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_bank_details (
  employee_id    INT PRIMARY KEY,
  bank_name      VARCHAR(100) DEFAULT NULL,
  account_number VARCHAR(40) DEFAULT NULL,
  ifsc_code      VARCHAR(20) DEFAULT NULL,
  pan_number     VARCHAR(20) DEFAULT NULL,
  uan_number     VARCHAR(20) DEFAULT NULL,
  account_type   VARCHAR(30) DEFAULT NULL,
  bank_branch    VARCHAR(100) DEFAULT NULL,
  dd_payable_at  VARCHAR(100) DEFAULT NULL,
  account_holder_name VARCHAR(100) DEFAULT NULL,
  payment_type   VARCHAR(30) DEFAULT NULL,
  CONSTRAINT fk_bank_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id       INT NOT NULL DEFAULT 2,
  employee_id   INT DEFAULT NULL,
  status        ENUM('Active','Inactive','Locked') DEFAULT 'Active',
  reset_token       VARCHAR(255) DEFAULT NULL,
  reset_token_expiry DATETIME DEFAULT NULL,
  last_login    DATETIME DEFAULT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(role_id),
  CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 3. TEAMS
-- =====================================================================

CREATE TABLE IF NOT EXISTS teams (
  team_id        INT AUTO_INCREMENT PRIMARY KEY,
  team_name      VARCHAR(100) NOT NULL,
  department_id  INT DEFAULT NULL,
  description    VARCHAR(255) DEFAULT NULL,
  lead_employee_id INT DEFAULT NULL,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_team_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
  CONSTRAINT fk_team_lead FOREIGN KEY (lead_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS team_members (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  team_id     INT NOT NULL,
  employee_id INT NOT NULL,
  title       VARCHAR(100) DEFAULT NULL,
  is_lead     TINYINT(1) DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_team_member (team_id, employee_id),
  CONSTRAINT fk_member_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
  CONSTRAINT fk_member_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 4. ATTENDANCE
-- =====================================================================

CREATE TABLE IF NOT EXISTS attendance (
  attendance_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT NOT NULL,
  attendance_date DATE NOT NULL,
  check_in        TIME DEFAULT NULL,
  check_out       TIME DEFAULT NULL,
  work_hours      DECIMAL(5,2) DEFAULT 0,
  late_by_minutes INT DEFAULT 0,
  status          ENUM('present','absent','late','leave','weekend','holiday','half_day') DEFAULT 'absent',
  source          VARCHAR(30) DEFAULT 'web',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance_emp_date (employee_id, attendance_date),
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attendance_regularization (
  regularization_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id        INT NOT NULL,
  attendance_date    DATE NOT NULL,
  requested_check_in  TIME DEFAULT NULL,
  requested_check_out TIME DEFAULT NULL,
  reason             VARCHAR(255) DEFAULT NULL,
  status             ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  reviewed_by        INT DEFAULT NULL,
  reviewed_on        DATETIME DEFAULT NULL,
  remarks            VARCHAR(255) DEFAULT NULL,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_regularization_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_regularization_reviewer FOREIGN KEY (reviewed_by) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 5. LEAVE MANAGEMENT
-- =====================================================================

CREATE TABLE IF NOT EXISTS leave_types (
  leave_type_id    INT AUTO_INCREMENT PRIMARY KEY,
  leave_type_name  VARCHAR(60) NOT NULL UNIQUE,
  annual_quota     DECIMAL(5,1) DEFAULT 0,
  carry_forward_limit DECIMAL(5,1) DEFAULT 0,
  requires_proof   TINYINT(1) DEFAULT 0,
  description      VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leave_balances (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT NOT NULL,
  leave_type_id   INT NOT NULL,
  year            INT NOT NULL,
  opening_balance DECIMAL(5,1) DEFAULT 0,
  granted         DECIMAL(5,1) DEFAULT 0,
  availed         DECIMAL(5,1) DEFAULT 0,
  balance         DECIMAL(5,1) DEFAULT 0,
  UNIQUE KEY uq_leave_balance (employee_id, leave_type_id, year),
  CONSTRAINT fk_balance_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_balance_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(leave_type_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leave_requests (
  leave_request_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id       INT NOT NULL,
  leave_type_id     INT NOT NULL,
  from_date         DATE NOT NULL,
  from_session      VARCHAR(20) DEFAULT NULL,
  to_date           DATE NOT NULL,
  to_session        VARCHAR(20) DEFAULT NULL,
  days              DECIMAL(5,1) NOT NULL,
  reason            VARCHAR(255) DEFAULT NULL,
  status            ENUM('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
  applied_on        DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by       INT DEFAULT NULL,
  reviewed_on       DATETIME DEFAULT NULL,
  remarks           VARCHAR(255) DEFAULT NULL,
  is_cancel_request TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(leave_type_id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewed_by) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS holidays (
  holiday_id   INT AUTO_INCREMENT PRIMARY KEY,
  holiday_name VARCHAR(100) NOT NULL,
  holiday_date DATE NOT NULL,
  holiday_calendar VARCHAR(100) DEFAULT 'India - Default',
  is_restricted TINYINT(1) DEFAULT 0
) ENGINE=InnoDB;

-- =====================================================================
-- 6. PAYROLL
-- =====================================================================

CREATE TABLE IF NOT EXISTS salary_structures (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  employee_id      INT NOT NULL,
  basic            DECIMAL(12,2) DEFAULT 0,
  hra              DECIMAL(12,2) DEFAULT 0,
  conveyance       DECIMAL(12,2) DEFAULT 0,
  medical_allowance DECIMAL(12,2) DEFAULT 0,
  special_allowance DECIMAL(12,2) DEFAULT 0,
  pf_employee      DECIMAL(12,2) DEFAULT 0,
  pf_employer      DECIMAL(12,2) DEFAULT 0,
  professional_tax DECIMAL(12,2) DEFAULT 0,
  income_tax       DECIMAL(12,2) DEFAULT 0,
  ctc              DECIMAL(12,2) DEFAULT 0,
  effective_from   DATE NOT NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_salary_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payroll_runs (
  payroll_run_id INT AUTO_INCREMENT PRIMARY KEY,
  month          TINYINT NOT NULL,
  year           INT NOT NULL,
  status         ENUM('Draft','Processing','Completed','Failed') DEFAULT 'Draft',
  processed_by   INT DEFAULT NULL,
  processed_on   DATETIME DEFAULT NULL,
  total_amount   DECIMAL(14,2) DEFAULT 0,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payroll_period (month, year),
  CONSTRAINT fk_payroll_processed_by FOREIGN KEY (processed_by) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payslips (
  payslip_id     INT AUTO_INCREMENT PRIMARY KEY,
  payroll_run_id INT DEFAULT NULL,
  employee_id    INT NOT NULL,
  month          TINYINT NOT NULL,
  year           INT NOT NULL,
  basic          DECIMAL(12,2) DEFAULT 0,
  hra            DECIMAL(12,2) DEFAULT 0,
  allowances     DECIMAL(12,2) DEFAULT 0,
  gross_earnings DECIMAL(12,2) DEFAULT 0,
  deductions     DECIMAL(12,2) DEFAULT 0,
  net_pay        DECIMAL(12,2) DEFAULT 0,
  working_days   DECIMAL(4,1) DEFAULT 0,
  paid_days      DECIMAL(4,1) DEFAULT 0,
  lop_days       DECIMAL(4,1) DEFAULT 0,
  status         ENUM('Generated','Paid','On Hold') DEFAULT 'Generated',
  generated_on   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payslip_period (employee_id, month, year),
  CONSTRAINT fk_payslip_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_payslip_run FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(payroll_run_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 7. HIRING
-- =====================================================================

CREATE TABLE IF NOT EXISTS jobs (
  job_id          INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(150) NOT NULL,
  department_id   INT DEFAULT NULL,
  location        VARCHAR(100) DEFAULT NULL,
  employment_type VARCHAR(30) DEFAULT 'Full-Time',
  description     TEXT,
  status          ENUM('Open','Closed','On Hold') DEFAULT 'Open',
  posted_on       DATE DEFAULT NULL,
  closing_date    DATE DEFAULT NULL,
  created_by      INT DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_job_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
  CONSTRAINT fk_job_created_by FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_applications (
  application_id INT AUTO_INCREMENT PRIMARY KEY,
  job_id         INT NOT NULL,
  applicant_name VARCHAR(120) NOT NULL,
  email          VARCHAR(150) DEFAULT NULL,
  mobile         VARCHAR(20) DEFAULT NULL,
  resume_url     VARCHAR(255) DEFAULT NULL,
  status         ENUM('Applied','Shortlisted','Interview','Offered','Rejected','Hired') DEFAULT 'Applied',
  applied_on     DATETIME DEFAULT CURRENT_TIMESTAMP,
  source         VARCHAR(50) DEFAULT NULL,
  applicant_employee_id INT DEFAULT NULL,
  CONSTRAINT fk_application_job FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
  CONSTRAINT fk_application_employee FOREIGN KEY (applicant_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS referrals (
  referral_id     INT AUTO_INCREMENT PRIMARY KEY,
  job_id          INT NOT NULL,
  referred_by     INT NOT NULL,
  candidate_name  VARCHAR(120) NOT NULL,
  candidate_email VARCHAR(150) DEFAULT NULL,
  candidate_mobile VARCHAR(20) DEFAULT NULL,
  resume_url      VARCHAR(255) DEFAULT NULL,
  status          ENUM('Submitted','Shortlisted','Interview','Hired','Rejected') DEFAULT 'Submitted',
  referred_on     DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_referral_job FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
  CONSTRAINT fk_referral_employee FOREIGN KEY (referred_by) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 8. PERFORMANCE REVIEWS
-- =====================================================================

CREATE TABLE IF NOT EXISTS review_types (
  review_type_id INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  description    VARCHAR(255) DEFAULT NULL,
  frequency      VARCHAR(30) DEFAULT 'Annual'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reviews (
  review_id      INT AUTO_INCREMENT PRIMARY KEY,
  review_type_id INT NOT NULL,
  employee_id    INT NOT NULL,
  reviewer_id    INT DEFAULT NULL,
  cycle_start    DATE DEFAULT NULL,
  cycle_end      DATE DEFAULT NULL,
  due_date       DATE DEFAULT NULL,
  status         ENUM('Pending','In Progress','Submitted','Completed') DEFAULT 'Pending',
  overall_rating DECIMAL(3,1) DEFAULT NULL,
  comments       TEXT,
  submitted_on   DATETIME DEFAULT NULL,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_type FOREIGN KEY (review_type_id) REFERENCES review_types(review_type_id) ON DELETE CASCADE,
  CONSTRAINT fk_review_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 9. HELPDESK
-- =====================================================================

CREATE TABLE IF NOT EXISTS helpdesk_tickets (
  ticket_id    INT AUTO_INCREMENT PRIMARY KEY,
  employee_id  INT NOT NULL,
  category     VARCHAR(60) DEFAULT 'General',
  subject      VARCHAR(150) NOT NULL,
  description  TEXT,
  priority     ENUM('Low','Medium','High','Urgent') DEFAULT 'Medium',
  status       ENUM('Open','In Progress','Resolved','Closed') DEFAULT 'Open',
  assigned_to  INT DEFAULT NULL,
  attachment_url VARCHAR(255) DEFAULT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at  DATETIME DEFAULT NULL,
  CONSTRAINT fk_ticket_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_assignee FOREIGN KEY (assigned_to) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS helpdesk_comments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id     INT NOT NULL,
  commented_by  INT NOT NULL,
  comment       TEXT NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_ticket FOREIGN KEY (ticket_id) REFERENCES helpdesk_tickets(ticket_id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_employee FOREIGN KEY (commented_by) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 10. DOCUMENTS
-- =====================================================================

CREATE TABLE IF NOT EXISTS document_categories (
  category_id   INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documents (
  document_id  INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(150) NOT NULL,
  description  VARCHAR(255) DEFAULT NULL,
  category_id  INT DEFAULT NULL,
  file_type    VARCHAR(10) DEFAULT NULL,
  file_size    VARCHAR(20) DEFAULT NULL,
  file_url     VARCHAR(255) DEFAULT NULL,
  visibility   ENUM('all','admin','employee') DEFAULT 'all',
  employee_id  INT DEFAULT NULL,
  uploaded_by  INT DEFAULT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_document_category FOREIGN KEY (category_id) REFERENCES document_categories(category_id) ON DELETE SET NULL,
  CONSTRAINT fk_document_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_document_uploader FOREIGN KEY (uploaded_by) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 11. PERMISSIONS / RBAC
-- =====================================================================

CREATE TABLE IF NOT EXISTS permissions (
  permission_id INT AUTO_INCREMENT PRIMARY KEY,
  module        VARCHAR(60) NOT NULL,
  action        ENUM('view','add','edit','delete') NOT NULL,
  UNIQUE KEY uq_permission (module, action)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  role_id       INT NOT NULL,
  permission_id INT NOT NULL,
  allowed       TINYINT(1) DEFAULT 1,
  UNIQUE KEY uq_role_permission (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 12. WORKFLOWS / REQUEST HUB / CALENDAR EVENTS
-- =====================================================================

CREATE TABLE IF NOT EXISTS workflow_delegates (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  employee_id          INT NOT NULL,
  delegate_employee_id INT NOT NULL,
  module               VARCHAR(60) DEFAULT 'all',
  from_date            DATE NOT NULL,
  to_date              DATE NOT NULL,
  status               ENUM('Active','Expired','Cancelled') DEFAULT 'Active',
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_delegate_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_delegate_delegate FOREIGN KEY (delegate_employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS request_hub (
  request_id   INT AUTO_INCREMENT PRIMARY KEY,
  employee_id  INT NOT NULL,
  request_type VARCHAR(60) NOT NULL,
  title        VARCHAR(150) NOT NULL,
  description  VARCHAR(255) DEFAULT NULL,
  status       ENUM('Pending','Approved','Rejected','Completed') DEFAULT 'Pending',
  reviewed_by  INT DEFAULT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at  DATETIME DEFAULT NULL,
  CONSTRAINT fk_request_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_request_reviewer FOREIGN KEY (reviewed_by) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS calendar_events (
  event_id    INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  event_date  DATE NOT NULL,
  event_type  VARCHAR(40) DEFAULT 'General',
  created_by  INT DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_creator FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 13. AUDIT LOG
-- =====================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT DEFAULT NULL,
  action      VARCHAR(60) NOT NULL,
  entity      VARCHAR(60) NOT NULL,
  entity_id   VARCHAR(40) DEFAULT NULL,
  details     JSON DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(employee_status);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_payslips_period ON payslips(month, year);
CREATE INDEX idx_helpdesk_status ON helpdesk_tickets(status);
CREATE INDEX idx_documents_category ON documents(category_id);

SET FOREIGN_KEY_CHECKS = 1;
