-- Phase 1: companies, countries, regions and branches.
-- Branches reuse offices.office_id so existing employee.office_id values remain valid.

PREPARE migration_preflight FROM 'SELECT company_id, company_name, country FROM companies LIMIT 0';
EXECUTE migration_preflight;
DEALLOCATE PREPARE migration_preflight;

PREPARE migration_preflight FROM 'SELECT office_id, company_id, location FROM offices LIMIT 0';
EXECUTE migration_preflight;
DEALLOCATE PREPARE migration_preflight;

PREPARE migration_preflight FROM 'SELECT employee_id, company_id, office_id, department_id, emp_joining_date FROM employees LIMIT 0';
EXECUTE migration_preflight;
DEALLOCATE PREPARE migration_preflight;

PREPARE migration_preflight FROM 'SELECT department_id, company_id FROM departments LIMIT 0';
EXECUTE migration_preflight;
DEALLOCATE PREPARE migration_preflight;

CREATE TABLE IF NOT EXISTS countries (
  country_id INT NOT NULL AUTO_INCREMENT,
  country_code VARCHAR(3) DEFAULT NULL,
  country_name VARCHAR(120) NOT NULL,
  default_currency CHAR(3) DEFAULT NULL,
  default_timezone VARCHAR(64) DEFAULT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (country_id),
  UNIQUE KEY uq_countries_code (country_code),
  UNIQUE KEY uq_countries_name (country_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS regions (
  region_id INT NOT NULL AUTO_INCREMENT,
  country_id INT NOT NULL,
  region_code VARCHAR(32) NOT NULL,
  region_name VARCHAR(120) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (region_id),
  UNIQUE KEY uq_regions_country_code (country_id, region_code),
  UNIQUE KEY uq_regions_country_name (country_id, region_name),
  CONSTRAINT fk_regions_country FOREIGN KEY (country_id)
    REFERENCES countries (country_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

SET @company_columns := (
  SELECT GROUP_CONCAT(column_definition SEPARATOR ', ')
    FROM (
      SELECT 'ADD COLUMN company_code VARCHAR(32) NULL' AS column_definition
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'company_code')
      UNION ALL SELECT 'ADD COLUMN legal_name VARCHAR(255) NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'legal_name')
      UNION ALL SELECT 'ADD COLUMN registration_number VARCHAR(100) NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'registration_number')
      UNION ALL SELECT 'ADD COLUMN registration_country_id INT NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'registration_country_id')
      UNION ALL SELECT 'ADD COLUMN country_id INT NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'country_id')
      UNION ALL SELECT 'ADD COLUMN headquarters_office_id INT NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'headquarters_office_id')
      UNION ALL SELECT 'ADD COLUMN logo_url VARCHAR(500) NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'logo_url')
    ) missing_columns
);
SET @company_alter := IF(
  @company_columns IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE companies ', @company_columns)
);
PREPARE migration_stmt FROM @company_alter;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @office_columns := (
  SELECT GROUP_CONCAT(column_definition SEPARATOR ', ')
    FROM (
      SELECT 'ADD COLUMN branch_code VARCHAR(32) NULL' AS column_definition
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'branch_code')
      UNION ALL SELECT 'ADD COLUMN country_id INT NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'country_id')
      UNION ALL SELECT 'ADD COLUMN region_id INT NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'region_id')
      UNION ALL SELECT 'ADD COLUMN state VARCHAR(120) NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'state')
      UNION ALL SELECT 'ADD COLUMN city VARCHAR(120) NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'city')
      UNION ALL SELECT 'ADD COLUMN postal_code VARCHAR(32) NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'postal_code')
      UNION ALL SELECT 'ADD COLUMN currency CHAR(3) NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'currency')
      UNION ALL SELECT 'ADD COLUMN contact_email VARCHAR(254) NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'contact_email')
      UNION ALL SELECT 'ADD COLUMN contact_phone VARCHAR(40) NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'contact_phone')
      UNION ALL SELECT 'ADD COLUMN branch_head_employee_id INT NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'branch_head_employee_id')
      UNION ALL SELECT 'ADD COLUMN hr_manager_employee_id INT NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'hr_manager_employee_id')
      UNION ALL SELECT 'ADD COLUMN working_days VARCHAR(100) NULL'
       WHERE NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'working_days')
    ) missing_columns
);
SET @office_alter := IF(
  @office_columns IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE offices ', @office_columns)
);
PREPARE migration_stmt FROM @office_alter;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

UPDATE companies
   SET company_code = CONCAT('COMP-', company_id)
 WHERE company_code IS NULL OR TRIM(company_code) = '';

UPDATE companies
   SET legal_name = company_name
 WHERE legal_name IS NULL OR TRIM(legal_name) = '';

UPDATE offices
   SET branch_code = CONCAT('OFF-', office_id)
 WHERE branch_code IS NULL OR TRIM(branch_code) = '';

INSERT IGNORE INTO countries (country_code, country_name, default_currency, default_timezone)
VALUES
  ('IND', 'India', 'INR', 'Asia/Kolkata'),
  ('USA', 'United States', 'USD', 'America/New_York'),
  ('AUS', 'Australia', 'AUD', 'Australia/Sydney');

INSERT INTO countries (country_name)
SELECT DISTINCT TRIM(c.country)
  FROM companies c
 WHERE c.country IS NOT NULL
   AND TRIM(c.country) <> ''
   AND NOT EXISTS (
     SELECT 1 FROM countries existing
      WHERE LOWER(existing.country_name) = LOWER(TRIM(c.country))
   );

INSERT INTO regions (country_id, region_code, region_name)
SELECT c.country_id, seed.region_code, seed.region_name
  FROM countries c
  JOIN (
    SELECT 'IND' AS country_code, 'TG' AS region_code, 'Telangana' AS region_name
    UNION ALL SELECT 'IND', 'KA', 'Karnataka'
    UNION ALL SELECT 'IND', 'TN', 'Tamil Nadu'
    UNION ALL SELECT 'IND', 'AP', 'Andhra Pradesh'
    UNION ALL SELECT 'USA', 'NY', 'New York'
    UNION ALL SELECT 'USA', 'TX', 'Texas'
    UNION ALL SELECT 'AUS', 'NSW', 'New South Wales'
    UNION ALL SELECT 'AUS', 'VIC', 'Victoria'
  ) seed ON seed.country_code = c.country_code
 WHERE NOT EXISTS (
   SELECT 1 FROM regions existing
    WHERE existing.country_id = c.country_id
      AND existing.region_code = seed.region_code
 );

UPDATE companies c
JOIN countries co ON LOWER(co.country_name) = LOWER(TRIM(c.country))
   SET c.country_id = COALESCE(c.country_id, co.country_id);

UPDATE offices o
JOIN companies c ON c.company_id = o.company_id
JOIN countries co ON LOWER(co.country_name) = LOWER(TRIM(c.country))
   SET o.country_id = COALESCE(o.country_id, co.country_id),
       o.city = COALESCE(NULLIF(o.city, ''), NULLIF(o.location, ''));

SET @company_id_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'company_id'
);
SET @office_id_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND COLUMN_NAME = 'office_id'
);
SET @employee_id_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees' AND COLUMN_NAME = 'employee_id'
);
SET @department_id_type := (
  SELECT COLUMN_TYPE FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'departments' AND COLUMN_NAME = 'department_id'
);

SET @sql := CONCAT(
  'ALTER TABLE companies MODIFY company_code VARCHAR(32) NOT NULL'
);
PREPARE migration_stmt FROM @sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @index_sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND INDEX_NAME = 'uq_companies_code') = 0,
  'ALTER TABLE companies ADD UNIQUE KEY uq_companies_code (company_code)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @index_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @sql := CONCAT(
  'ALTER TABLE offices MODIFY branch_code VARCHAR(32) NOT NULL'
);
PREPARE migration_stmt FROM @sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @index_sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND INDEX_NAME = 'uq_offices_company_branch_code') = 0,
  'ALTER TABLE offices ADD UNIQUE KEY uq_offices_company_branch_code (company_id, branch_code)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @index_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @sql := CONCAT(
  'ALTER TABLE offices MODIFY branch_head_employee_id ', @employee_id_type, ' NULL, ',
  'MODIFY hr_manager_employee_id ', @employee_id_type, ' NULL'
);
PREPARE migration_stmt FROM @sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @sql := CONCAT(
  'ALTER TABLE companies MODIFY headquarters_office_id ', @office_id_type, ' NULL'
);
PREPARE migration_stmt FROM @sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @index_sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices' AND INDEX_NAME = 'uq_offices_id_company') = 0,
  'ALTER TABLE offices ADD UNIQUE KEY uq_offices_id_company (office_id, company_id)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @index_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @index_sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'departments' AND INDEX_NAME = 'uq_departments_id_company') = 0,
  'ALTER TABLE departments ADD UNIQUE KEY uq_departments_id_company (department_id, company_id)',
  'SELECT 1'
);
PREPARE migration_stmt FROM @index_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @sql := CONCAT(
  'CREATE TABLE IF NOT EXISTS branch_departments (',
  'company_id ', @company_id_type, ' NOT NULL, ',
  'branch_id ', @office_id_type, ' NOT NULL, ',
  'department_id ', @department_id_type, ' NOT NULL, ',
  'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ',
  'PRIMARY KEY (branch_id, department_id), ',
  'KEY ix_branch_departments_company (company_id), ',
  'CONSTRAINT fk_branch_departments_company FOREIGN KEY (company_id) ',
  'REFERENCES companies (company_id) ON DELETE RESTRICT ON UPDATE CASCADE, ',
  'CONSTRAINT fk_branch_departments_branch FOREIGN KEY (branch_id, company_id) ',
  'REFERENCES offices (office_id, company_id) ON DELETE RESTRICT ON UPDATE CASCADE, ',
  'CONSTRAINT fk_branch_departments_department FOREIGN KEY (department_id, company_id) ',
  'REFERENCES departments (department_id, company_id) ON DELETE RESTRICT ON UPDATE CASCADE',
  ') ENGINE=InnoDB'
);
PREPARE migration_stmt FROM @sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @sql := CONCAT(
  'CREATE TABLE IF NOT EXISTS employee_assignments (',
  'assignment_id BIGINT NOT NULL AUTO_INCREMENT, ',
  'employee_id ', @employee_id_type, ' NOT NULL, ',
  'company_id ', @company_id_type, ' NOT NULL, ',
  'branch_id ', @office_id_type, ' NOT NULL, ',
  'department_id ', @department_id_type, ' NULL, ',
  'start_date DATE NOT NULL, ',
  'end_date DATE NULL, ',
  'is_current TINYINT(1) NOT NULL DEFAULT 1, ',
  'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ',
  'updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ',
  'PRIMARY KEY (assignment_id), ',
  'KEY ix_employee_assignments_employee_current (employee_id, is_current), ',
  'KEY ix_employee_assignments_branch_current (branch_id, is_current), ',
  'CONSTRAINT fk_employee_assignments_employee FOREIGN KEY (employee_id) ',
  'REFERENCES employees (employee_id) ON DELETE RESTRICT ON UPDATE CASCADE, ',
  'CONSTRAINT fk_employee_assignments_company FOREIGN KEY (company_id) ',
  'REFERENCES companies (company_id) ON DELETE RESTRICT ON UPDATE CASCADE, ',
  'CONSTRAINT fk_employee_assignments_branch FOREIGN KEY (branch_id, company_id) ',
  'REFERENCES offices (office_id, company_id) ON DELETE RESTRICT ON UPDATE CASCADE, ',
  'CONSTRAINT fk_employee_assignments_department FOREIGN KEY (department_id, company_id) ',
  'REFERENCES departments (department_id, company_id) ON DELETE RESTRICT ON UPDATE CASCADE',
  ') ENGINE=InnoDB'
);
PREPARE migration_stmt FROM @sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @sql := CONCAT(
  'CREATE TABLE IF NOT EXISTS branch_settings (',
  'setting_id BIGINT NOT NULL AUTO_INCREMENT, ',
  'branch_id ', @office_id_type, ' NOT NULL, ',
  'setting_key VARCHAR(100) NOT NULL, ',
  'setting_value LONGTEXT NULL, ',
  'updated_by ', @employee_id_type, ' NULL, ',
  'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ',
  'updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ',
  'PRIMARY KEY (setting_id), ',
  'UNIQUE KEY uq_branch_settings_key (branch_id, setting_key), ',
  'CONSTRAINT fk_branch_settings_branch FOREIGN KEY (branch_id) ',
  'REFERENCES offices (office_id) ON DELETE RESTRICT ON UPDATE CASCADE, ',
  'CONSTRAINT fk_branch_settings_employee FOREIGN KEY (updated_by) ',
  'REFERENCES employees (employee_id) ON DELETE SET NULL ON UPDATE CASCADE',
  ') ENGINE=InnoDB'
);
PREPARE migration_stmt FROM @sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

INSERT IGNORE INTO branch_departments (company_id, branch_id, department_id)
SELECT e.company_id, e.office_id, e.department_id
  FROM employees e
  JOIN offices o ON o.office_id = e.office_id AND o.company_id = e.company_id
  JOIN departments d ON d.department_id = e.department_id AND d.company_id = e.company_id
 WHERE e.company_id IS NOT NULL
   AND e.office_id IS NOT NULL
   AND e.department_id IS NOT NULL;

INSERT INTO employee_assignments
  (employee_id, company_id, branch_id, department_id, start_date, is_current)
SELECT e.employee_id, e.company_id, e.office_id, d.department_id,
       COALESCE(e.emp_joining_date, CURRENT_DATE()), 1
  FROM employees e
  JOIN offices o ON o.office_id = e.office_id AND o.company_id = e.company_id
  JOIN companies c ON c.company_id = e.company_id
  LEFT JOIN departments d ON d.department_id = e.department_id AND d.company_id = e.company_id
  LEFT JOIN employee_assignments a
    ON a.employee_id = e.employee_id AND a.is_current = 1
 WHERE e.company_id IS NOT NULL
   AND e.office_id IS NOT NULL
   AND a.assignment_id IS NULL;

SET @add_fk_sql := IF(
  (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_companies_registration_country') = 0,
  'ALTER TABLE companies ADD CONSTRAINT fk_companies_registration_country FOREIGN KEY (registration_country_id) REFERENCES countries (country_id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE migration_stmt FROM @add_fk_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @add_fk_sql := IF(
  (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_companies_country') = 0,
  'ALTER TABLE companies ADD CONSTRAINT fk_companies_country FOREIGN KEY (country_id) REFERENCES countries (country_id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE migration_stmt FROM @add_fk_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @add_fk_sql := IF(
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices'
      AND COLUMN_NAME = 'country_id' AND REFERENCED_TABLE_NAME = 'countries') = 0,
  'ALTER TABLE offices ADD CONSTRAINT fk_offices_country FOREIGN KEY (country_id) REFERENCES countries (country_id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE migration_stmt FROM @add_fk_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @add_fk_sql := IF(
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices'
      AND COLUMN_NAME = 'region_id' AND REFERENCED_TABLE_NAME = 'regions') = 0,
  'ALTER TABLE offices ADD CONSTRAINT fk_offices_region FOREIGN KEY (region_id) REFERENCES regions (region_id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE migration_stmt FROM @add_fk_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @add_fk_sql := IF(
  (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offices'
      AND COLUMN_NAME = 'company_id' AND REFERENCED_TABLE_NAME = 'companies') = 0,
  'ALTER TABLE offices ADD CONSTRAINT fk_offices_company FOREIGN KEY (company_id) REFERENCES companies (company_id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE migration_stmt FROM @add_fk_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @add_fk_sql := CONCAT(
  'ALTER TABLE offices ADD CONSTRAINT fk_offices_branch_head FOREIGN KEY (branch_head_employee_id) ',
  'REFERENCES employees (employee_id) ON DELETE SET NULL ON UPDATE CASCADE'
);
SET @add_fk_sql := IF(
  (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_offices_branch_head') = 0,
  @add_fk_sql,
  'SELECT 1'
);
PREPARE migration_stmt FROM @add_fk_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @add_fk_sql := CONCAT(
  'ALTER TABLE offices ADD CONSTRAINT fk_offices_hr_manager FOREIGN KEY (hr_manager_employee_id) ',
  'REFERENCES employees (employee_id) ON DELETE SET NULL ON UPDATE CASCADE'
);
SET @add_fk_sql := IF(
  (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_offices_hr_manager') = 0,
  @add_fk_sql,
  'SELECT 1'
);
PREPARE migration_stmt FROM @add_fk_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @add_fk_sql := CONCAT(
  'ALTER TABLE companies ADD CONSTRAINT fk_companies_headquarters FOREIGN KEY (headquarters_office_id) ',
  'REFERENCES offices (office_id) ON DELETE SET NULL ON UPDATE CASCADE'
);
SET @add_fk_sql := IF(
  (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_companies_headquarters') = 0,
  @add_fk_sql,
  'SELECT 1'
);
PREPARE migration_stmt FROM @add_fk_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
