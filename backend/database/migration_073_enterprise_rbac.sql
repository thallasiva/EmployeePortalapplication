-- Enterprise RBAC builds on the legacy roles/permission procedures and the
-- company/branch foundation from migration 072.
PREPARE migration_preflight FROM 'SELECT user_id, employee_id, role_id, status FROM users LIMIT 0';
EXECUTE migration_preflight;
DEALLOCATE PREPARE migration_preflight;

PREPARE migration_preflight FROM 'SELECT role_id, role_name, description FROM roles LIMIT 0';
EXECUTE migration_preflight;
DEALLOCATE PREPARE migration_preflight;

PREPARE migration_preflight FROM 'SELECT company_id FROM companies LIMIT 0';
EXECUTE migration_preflight;
DEALLOCATE PREPARE migration_preflight;

PREPARE migration_preflight FROM 'SELECT office_id, company_id, region_id FROM offices LIMIT 0';
EXECUTE migration_preflight;
DEALLOCATE PREPARE migration_preflight;

PREPARE migration_preflight FROM 'SELECT department_id, company_id FROM departments LIMIT 0';
EXECUTE migration_preflight;
DEALLOCATE PREPARE migration_preflight;

SET @role_key_add := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND COLUMN_NAME = 'role_key') = 0,
  'ALTER TABLE roles ADD COLUMN role_key VARCHAR(64) NULL',
  'SELECT 1'
);
PREPARE migration_stmt FROM @role_key_add;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @role_key_index := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND INDEX_NAME = 'uq_roles_role_key') = 0,
  'ALTER TABLE roles ADD UNIQUE KEY uq_roles_role_key (role_key)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @role_key_index;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

INSERT IGNORE INTO roles (role_name, role_key, description) VALUES
  ('Super Admin', 'SUPER_ADMIN', 'Platform-wide administration'),
  ('Company Admin', 'COMPANY_ADMIN', 'Administration within assigned companies'),
  ('Regional Admin', 'REGIONAL_ADMIN', 'Administration within assigned regions'),
  ('Branch Admin', 'BRANCH_ADMIN', 'Administration within assigned branches'),
  ('HR Head', 'HR_HEAD', 'Human resources leadership'),
  ('HR Manager', 'HR_MANAGER', 'Human resources operations'),
  ('Finance Manager', 'FINANCE_MANAGER', 'Finance operations'),
  ('Department Manager', 'DEPARTMENT_MANAGER', 'Department-scoped management'),
  ('IT Manager', 'IT_MANAGER', 'IT operations'),
  ('Associate Manager', 'ASSOCIATE_MANAGER', 'Assigned management responsibilities'),
  ('Recruitment Head', 'RECRUITMENT_HEAD', 'Recruitment leadership'),
  ('Recruiter', 'RECRUITER', 'Assigned recruitment work'),
  ('Team Lead', 'TEAM_LEAD', 'Team-scoped management'),
  ('Employee', 'EMPLOYEE', 'Self-service employee access');

UPDATE roles SET role_key = 'SUPER_ADMIN'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('super admin', 'super_admin');
UPDATE roles SET role_key = 'COMPANY_ADMIN'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('company admin', 'company_admin');
UPDATE roles SET role_key = 'REGIONAL_ADMIN'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('regional admin', 'regional_admin');
UPDATE roles SET role_key = 'BRANCH_ADMIN'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('branch admin', 'branch_admin');
UPDATE roles SET role_key = 'HR_HEAD'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('hr head', 'hr_head');
UPDATE roles SET role_key = 'HR_MANAGER'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('hr manager', 'hr_manager');
UPDATE roles SET role_key = 'FINANCE_MANAGER'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('finance manager', 'finance_manager');
UPDATE roles SET role_key = 'DEPARTMENT_MANAGER'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('department manager', 'department_manager');
UPDATE roles SET role_key = 'IT_MANAGER'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('it manager', 'it_manager');
UPDATE roles SET role_key = 'ASSOCIATE_MANAGER'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('associate manager', 'associate_manager');
UPDATE roles SET role_key = 'RECRUITMENT_HEAD'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('recruitment head', 'recruitment_head');
UPDATE roles SET role_key = 'RECRUITER'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('recruiter', 'recruitment specialist');
UPDATE roles SET role_key = 'TEAM_LEAD'
 WHERE role_key IS NULL AND LOWER(role_name) IN ('team lead', 'team_lead');
UPDATE roles SET role_key = 'EMPLOYEE'
 WHERE role_key IS NULL AND LOWER(role_name) = 'employee';

SET @recruiter_role_id := (
  SELECT role_id FROM roles WHERE role_key = 'RECRUITER' LIMIT 1
);
CALL sp_upsert_role_permission(@recruiter_role_id, 'recruitment', 'view', 1);

SET @user_id_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'user_id'
);
SET @role_id_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND COLUMN_NAME = 'role_id'
);
SET @company_id_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'company_id'
);
SET @branch_id_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'office_id'
);
SET @department_id_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'departments' AND COLUMN_NAME = 'department_id'
);

SET @sql := CONCAT(
  'CREATE TABLE IF NOT EXISTS user_roles (',
  'user_role_id BIGINT NOT NULL AUTO_INCREMENT, ',
  'user_id ', @user_id_type, ' NOT NULL, ',
  'role_id ', @role_id_type, ' NOT NULL, ',
  'is_active TINYINT(1) NOT NULL DEFAULT 1, ',
  'assigned_by ', @user_id_type, ' NULL, ',
  'assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ',
  'updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ',
  'PRIMARY KEY (user_role_id), ',
  'UNIQUE KEY uq_user_roles_user_role (user_id, role_id), ',
  'KEY ix_user_roles_role_active (role_id, is_active), ',
  'CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE, ',
  'CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE RESTRICT ON UPDATE CASCADE, ',
  'CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE',
  ') ENGINE=InnoDB'
);
PREPARE migration_stmt FROM @sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

INSERT IGNORE INTO user_roles (user_id, role_id, is_active)
SELECT u.user_id, r.role_id, 1
  FROM users u
  JOIN roles r ON r.role_id = u.role_id
 WHERE r.role_key = 'RECRUITER';

SET @sql := CONCAT(
  'CREATE TABLE IF NOT EXISTS user_role_scopes (',
  'user_role_scope_id BIGINT NOT NULL AUTO_INCREMENT, ',
  'user_role_id BIGINT NOT NULL, ',
  'scope_type VARCHAR(32) NOT NULL, ',
  'company_id ', @company_id_type, ' NULL, ',
  'region_id INT NULL, ',
  'branch_id ', @branch_id_type, ' NULL, ',
  'department_id ', @department_id_type, ' NULL, ',
  'team_id BIGINT NULL, ',
  'resource_type VARCHAR(64) NULL, ',
  'resource_id VARCHAR(128) NULL, ',
  'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ',
  'PRIMARY KEY (user_role_scope_id), ',
  'KEY ix_user_role_scopes_assignment (user_role_id, scope_type), ',
  'KEY ix_user_role_scopes_company (company_id, scope_type), ',
  'KEY ix_user_role_scopes_branch (branch_id, scope_type), ',
  'KEY ix_user_role_scopes_department (department_id, scope_type), ',
  'CONSTRAINT fk_user_role_scopes_assignment FOREIGN KEY (user_role_id) REFERENCES user_roles (user_role_id) ON DELETE CASCADE ON UPDATE CASCADE, ',
  'CONSTRAINT fk_user_role_scopes_company FOREIGN KEY (company_id) REFERENCES companies (company_id) ON DELETE RESTRICT ON UPDATE CASCADE, ',
  'CONSTRAINT fk_user_role_scopes_region FOREIGN KEY (region_id) REFERENCES regions (region_id) ON DELETE RESTRICT ON UPDATE CASCADE, ',
  'CONSTRAINT fk_user_role_scopes_branch FOREIGN KEY (branch_id) REFERENCES offices (office_id) ON DELETE RESTRICT ON UPDATE CASCADE, ',
  'CONSTRAINT fk_user_role_scopes_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON DELETE RESTRICT ON UPDATE CASCADE',
  ') ENGINE=InnoDB'
);
PREPARE migration_stmt FROM @sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @sql := CONCAT(
  'CREATE TABLE IF NOT EXISTS access_audit_logs (',
  'access_audit_log_id BIGINT NOT NULL AUTO_INCREMENT, ',
  'actor_user_id ', @user_id_type, ' NULL, ',
  'target_user_id ', @user_id_type, ' NULL, ',
  'role_id ', @role_id_type, ' NULL, ',
  'action VARCHAR(64) NOT NULL, ',
  'scope_type VARCHAR(32) NULL, ',
  'scope_id VARCHAR(128) NULL, ',
  'details JSON NULL, ',
  'ip_address VARCHAR(45) NULL, ',
  'user_agent VARCHAR(500) NULL, ',
  'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ',
  'PRIMARY KEY (access_audit_log_id), ',
  'KEY ix_access_audit_target_time (target_user_id, created_at), ',
  'KEY ix_access_audit_actor_time (actor_user_id, created_at), ',
  'CONSTRAINT fk_access_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE, ',
  'CONSTRAINT fk_access_audit_target FOREIGN KEY (target_user_id) REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE, ',
  'CONSTRAINT fk_access_audit_role FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE SET NULL ON UPDATE CASCADE',
  ') ENGINE=InnoDB'
);
PREPARE migration_stmt FROM @sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

INSERT IGNORE INTO user_roles (user_id, role_id, is_active)
SELECT u.user_id, super_admin.role_id, 1
  FROM users u
  JOIN roles super_admin ON super_admin.role_key = 'SUPER_ADMIN'
 WHERE u.role_id = 1;

INSERT INTO user_role_scopes (user_role_id, scope_type)
SELECT ur.user_role_id, 'GLOBAL'
  FROM user_roles ur
  JOIN roles r ON r.role_id = ur.role_id AND r.role_key = 'SUPER_ADMIN'
  LEFT JOIN user_role_scopes urs ON urs.user_role_id = ur.user_role_id
 WHERE ur.is_active = 1
   AND urs.user_role_scope_id IS NULL;
