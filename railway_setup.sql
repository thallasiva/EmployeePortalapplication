-- ============================================================
-- TimeSheet App — Railway MySQL Setup (Full Reset)
-- Drops existing tables and recreates with correct schema
-- ============================================================

USE railway;

-- Disable FK checks so we can drop in any order
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS timesheets;
DROP TABLE IF EXISTS weekly_timesheets;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255)  NOT NULL,
    email      VARCHAR(255)  UNIQUE NOT NULL,
    password   VARCHAR(255)  NOT NULL,
    role       VARCHAR(50)   NOT NULL DEFAULT 'employee',
    status     VARCHAR(50)   NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(255)  NOT NULL,
    client_name  VARCHAR(255),
    code         VARCHAR(100),
    budget       DECIMAL(12,2) DEFAULT 0,
    created_by   INT,
    hours        DECIMAL(10,2) DEFAULT 0,
    project_type VARCHAR(100),
    status       VARCHAR(50)   DEFAULT 'active',
    description  TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE weekly_timesheets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT  NOT NULL,
    week_start DATE NOT NULL,
    week_end   DATE NOT NULL,
    status     VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_week (user_id, week_start, week_end)
);

CREATE TABLE timesheets (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    project_id    INT,
    project_name  VARCHAR(255),
    activity_name VARCHAR(255),
    activity_desc TEXT,
    start_date    DATE,
    start_time    TIME,
    end_time      TIME,
    hours         DECIMAL(5,2) DEFAULT 0,
    week_id       INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)   REFERENCES users(id)             ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id)         ON DELETE SET NULL,
    FOREIGN KEY (week_id)   REFERENCES weekly_timesheets(id) ON DELETE SET NULL
);

CREATE TABLE tasks (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    user_id              INT,
    project_or_client_id INT,
    activity             VARCHAR(255),
    task_description     TEXT,
    task_start_Date      DATE,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    project_id   INT,
    amount       DECIMAL(12,2) NOT NULL,
    description  TEXT,
    expense_date DATE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE invoices (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    project_id   INT,
    total_amount DECIMAL(12,2) NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- ============================================================
-- DEFAULT ADMIN USER  (login: admin@timesheet.com / Admin@123)
-- ============================================================
INSERT INTO users (name, email, password, role, status)
VALUES ('Admin', 'admin@timesheet.com', 'Admin@123', 'admin', 'active');

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DROP PROCEDURE IF EXISTS sp_employee_register;
DELIMITER $$
CREATE PROCEDURE sp_employee_register(IN p_name VARCHAR(255), IN p_email VARCHAR(255), IN p_password VARCHAR(255))
BEGIN
    INSERT INTO users (name, email, password, role, status)
    VALUES (p_name, p_email, p_password, 'employee', 'pending');
    SELECT * FROM users WHERE id = LAST_INSERT_ID();
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_employee_login;
DELIMITER $$
CREATE PROCEDURE sp_employee_login(IN p_email VARCHAR(255), IN p_password VARCHAR(255))
BEGIN
    SELECT id, name, email, role, status, created_at
    FROM users
    WHERE email = p_email AND password = p_password AND role = 'employee';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_admin_login;
DELIMITER $$
CREATE PROCEDURE sp_admin_login(IN p_email VARCHAR(255), IN p_password VARCHAR(255))
BEGIN
    SELECT id, name, email, role, status, created_at
    FROM users
    WHERE email = p_email AND password = p_password AND role = 'admin';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_login;
DELIMITER $$
CREATE PROCEDURE sp_login(IN p_email VARCHAR(255), IN p_password VARCHAR(255))
BEGIN
    SELECT id, name, email, role, status, created_at
    FROM users
    WHERE email = p_email AND password = p_password;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_admin_create_employee;
DELIMITER $$
CREATE PROCEDURE sp_admin_create_employee(IN p_name VARCHAR(255), IN p_email VARCHAR(255), IN p_password VARCHAR(255))
BEGIN
    INSERT INTO users (name, email, password, role, status)
    VALUES (p_name, p_email, p_password, 'employee', 'active');
    SELECT * FROM users WHERE id = LAST_INSERT_ID();
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_pending_employees;
DELIMITER $$
CREATE PROCEDURE sp_get_pending_employees()
BEGIN
    SELECT id, name, email, role, status, created_at
    FROM users WHERE role = 'employee' AND status = 'pending'
    ORDER BY created_at DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_all_employees;
DELIMITER $$
CREATE PROCEDURE sp_get_all_employees()
BEGIN
    SELECT id, name, email, role, status, created_at
    FROM users WHERE role = 'employee'
    ORDER BY created_at DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_approve_employee;
DELIMITER $$
CREATE PROCEDURE sp_approve_employee(IN p_id INT)
BEGIN
    UPDATE users SET status = 'active' WHERE id = p_id AND role = 'employee';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_reject_employee;
DELIMITER $$
CREATE PROCEDURE sp_reject_employee(IN p_id INT)
BEGIN
    UPDATE users SET status = 'rejected' WHERE id = p_id AND role = 'employee';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_pending_weekly_timesheets;
DELIMITER $$
CREATE PROCEDURE sp_get_pending_weekly_timesheets()
BEGIN
    SELECT wt.*, u.name AS employee_name, u.email AS employee_email
    FROM weekly_timesheets wt
    JOIN users u ON u.id = wt.user_id
    WHERE wt.status = 'PENDING'
    ORDER BY wt.week_start DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_weekly_timesheet_daywise;
DELIMITER $$
CREATE PROCEDURE sp_get_weekly_timesheet_daywise(IN p_week_id INT)
BEGIN
    SELECT t.*, u.name AS employee_name, p.name AS project_name
    FROM timesheets t
    LEFT JOIN users u ON u.id = t.user_id
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.week_id = p_week_id
    ORDER BY t.start_date ASC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_approve_timesheet;
DELIMITER $$
CREATE PROCEDURE sp_approve_timesheet(IN p_id INT)
BEGIN
    UPDATE weekly_timesheets SET status = 'APPROVED' WHERE id = p_id;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_reject_timesheet;
DELIMITER $$
CREATE PROCEDURE sp_reject_timesheet(IN p_id INT)
BEGIN
    UPDATE weekly_timesheets SET status = 'REJECTED' WHERE id = p_id;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_employee_monthly_summary;
DELIMITER $$
CREATE PROCEDURE sp_get_employee_monthly_summary(IN p_user_id INT, IN p_year INT, IN p_month INT)
BEGIN
    SELECT t.start_date, SUM(t.hours) AS total_hours,
           GROUP_CONCAT(DISTINCT p.name) AS projects
    FROM timesheets t
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.user_id = p_user_id
      AND YEAR(t.start_date) = p_year
      AND MONTH(t.start_date) = p_month
    GROUP BY t.start_date ORDER BY t.start_date ASC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS USER_PROJECTS;
DELIMITER $$
CREATE PROCEDURE USER_PROJECTS(IN p_user_id INT)
BEGIN
    SELECT * FROM projects WHERE status = 'active' ORDER BY name ASC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS ADD_USERS_TASKS;
DELIMITER $$
CREATE PROCEDURE ADD_USERS_TASKS(IN p_project_id INT, IN p_activity VARCHAR(255), IN p_description TEXT, IN p_start_date DATE)
BEGIN
    INSERT INTO tasks (project_or_client_id, activity, task_description, task_start_Date)
    VALUES (p_project_id, p_activity, p_description, p_start_date);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS GET_USERS_TASKS_LIST;
DELIMITER $$
CREATE PROCEDURE GET_USERS_TASKS_LIST(IN p_user_id INT)
BEGIN
    SELECT t.*, p.name AS project_name
    FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_or_client_id
    ORDER BY t.task_start_Date DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_weekly_timesheet_view;
DELIMITER $$
CREATE PROCEDURE sp_weekly_timesheet_view(IN p_user_id INT, IN p_week_start DATE, IN p_week_end DATE)
BEGIN
    INSERT IGNORE INTO weekly_timesheets (user_id, week_start, week_end, status)
    VALUES (p_user_id, p_week_start, p_week_end, 'PENDING');
    SELECT t.*, p.name AS project_name
    FROM timesheets t
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.user_id = p_user_id
      AND t.start_date BETWEEN p_week_start AND p_week_end
    ORDER BY t.start_date ASC, t.start_time ASC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS updateWeeklyTimesheet;
DELIMITER $$
CREATE PROCEDURE updateWeeklyTimesheet(IN p_json JSON)
BEGIN
    SET @i = 0;
    SET @len = JSON_LENGTH(p_json);
    WHILE @i < @len DO
        UPDATE timesheets
        SET hours = JSON_UNQUOTE(JSON_EXTRACT(p_json, CONCAT('$[',@i,'].hours'))),
            activity_desc = JSON_UNQUOTE(JSON_EXTRACT(p_json, CONCAT('$[',@i,'].description')))
        WHERE id = JSON_UNQUOTE(JSON_EXTRACT(p_json, CONCAT('$[',@i,'].id')));
        SET @i = @i + 1;
    END WHILE;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_submit_weekly_timesheet;
DELIMITER $$
CREATE PROCEDURE sp_submit_weekly_timesheet(IN p_user_id INT, IN p_week_start DATE, IN p_week_end DATE)
BEGIN
    UPDATE weekly_timesheets SET status = 'PENDING'
    WHERE user_id = p_user_id AND week_start = p_week_start AND week_end = p_week_end;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_submit_week;
DELIMITER $$
CREATE PROCEDURE sp_submit_week(IN p_user_id INT, IN p_week_start DATE, IN p_week_end DATE)
BEGIN
    CALL sp_submit_weekly_timesheet(p_user_id, p_week_start, p_week_end);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS userwise_time_sheet;
DELIMITER $$
CREATE PROCEDURE userwise_time_sheet(IN p_user_id INT)
BEGIN
    SELECT wt.*, COALESCE(SUM(t.hours),0) AS total_hours
    FROM weekly_timesheets wt
    LEFT JOIN timesheets t ON t.week_id = wt.id
    WHERE wt.user_id = p_user_id
    GROUP BY wt.id ORDER BY wt.week_start DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_users_with_hours;
DELIMITER $$
CREATE PROCEDURE sp_get_users_with_hours()
BEGIN
    SELECT u.id, u.name, u.email, COALESCE(SUM(t.hours),0) AS total_hours
    FROM users u
    LEFT JOIN timesheets t ON t.user_id = u.id
    WHERE u.role = 'employee'
    GROUP BY u.id, u.name, u.email ORDER BY total_hours DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_create_task_and_store_weekly;
DELIMITER $$
CREATE PROCEDURE sp_create_task_and_store_weekly(
    IN p_user_id INT, IN p_proj_id INT, IN p_activity VARCHAR(255),
    IN p_desc TEXT, IN p_start_date DATE, IN p_start_time TIME,
    IN p_end_time TIME, IN p_project_name VARCHAR(255))
BEGIN
    DECLARE v_week_start DATE;
    DECLARE v_week_end   DATE;
    DECLARE v_week_id    INT;
    DECLARE v_hours      DECIMAL(5,2);
    SET v_week_start = DATE_SUB(p_start_date, INTERVAL (DAYOFWEEK(p_start_date)+5)%7 DAY);
    SET v_week_end   = DATE_ADD(v_week_start, INTERVAL 6 DAY);
    SET v_hours = ROUND(MOD(TIME_TO_SEC(p_end_time)-TIME_TO_SEC(p_start_time)+86400,86400)/3600.0, 2);
    INSERT IGNORE INTO weekly_timesheets (user_id, week_start, week_end, status)
    VALUES (p_user_id, v_week_start, v_week_end, 'PENDING');
    SELECT id INTO v_week_id FROM weekly_timesheets
    WHERE user_id=p_user_id AND week_start=v_week_start AND week_end=v_week_end;
    INSERT INTO timesheets (user_id, project_id, project_name, activity_name, activity_desc,
        start_date, start_time, end_time, hours, week_id)
    VALUES (p_user_id, p_proj_id, p_project_name, p_activity, p_desc,
        p_start_date, p_start_time, p_end_time, v_hours, v_week_id);
    SELECT LAST_INSERT_ID() AS inserted_id, v_hours AS hours;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_users_list;
DELIMITER $$
CREATE PROCEDURE sp_users_list()
BEGIN
    SELECT id, name, email, role, status FROM users WHERE role='employee' ORDER BY name;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_user_timesheets_list;
DELIMITER $$
CREATE PROCEDURE sp_get_user_timesheets_list(IN p_user_id INT)
BEGIN
    SELECT t.*, p.name AS project_name
    FROM timesheets t LEFT JOIN projects p ON p.id=t.project_id
    WHERE t.user_id=p_user_id ORDER BY t.start_date DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_timesheet_update_project;
DELIMITER $$
CREATE PROCEDURE sp_timesheet_update_project(IN p_id INT, IN p_hours DECIMAL(5,2), IN p_description TEXT)
BEGIN
    UPDATE timesheets SET hours=p_hours, activity_desc=p_description WHERE id=p_id;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_create_project;
DELIMITER $$
CREATE PROCEDURE sp_create_project(IN p_name VARCHAR(255), IN p_client_name VARCHAR(255),
    IN p_code VARCHAR(100), IN p_budget DECIMAL(12,2), IN p_created_by INT,
    IN p_hours DECIMAL(10,2), IN p_project_type VARCHAR(100))
BEGIN
    INSERT INTO projects (name, client_name, code, budget, created_by, hours, project_type, status)
    VALUES (p_name, p_client_name, p_code, p_budget, p_created_by, p_hours, p_project_type, 'active');
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_delete_project;
DELIMITER $$
CREATE PROCEDURE sp_delete_project(IN p_id INT)
BEGIN
    DELETE FROM projects WHERE id=p_id;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_update_project;
DELIMITER $$
CREATE PROCEDURE sp_update_project(IN p_id INT, IN p_name VARCHAR(255),
    IN p_budget DECIMAL(12,2), IN p_hours DECIMAL(10,2), IN p_description TEXT, IN p_code VARCHAR(100))
BEGIN
    UPDATE projects SET name=p_name, budget=p_budget, hours=p_hours,
        description=p_description, code=p_code WHERE id=p_id;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_project_by_id;
DELIMITER $$
CREATE PROCEDURE sp_get_project_by_id(IN p_id INT)
BEGIN
    SELECT * FROM projects WHERE id=p_id;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_save_import_project;
DELIMITER $$
CREATE PROCEDURE sp_save_import_project(IN p_id INT, IN p_name VARCHAR(255),
    IN p_client_name VARCHAR(255), IN p_budget DECIMAL(12,2), IN p_status VARCHAR(50),
    IN p_created_by INT, IN p_hours DECIMAL(10,2), IN p_project_type VARCHAR(100),
    IN p_code VARCHAR(100), IN p_description TEXT)
BEGIN
    IF p_id IS NOT NULL THEN
        INSERT INTO projects (id,name,client_name,budget,status,created_by,hours,project_type,code,description)
        VALUES (p_id,p_name,p_client_name,p_budget,p_status,p_created_by,p_hours,p_project_type,p_code,p_description)
        ON DUPLICATE KEY UPDATE name=p_name,client_name=p_client_name,budget=p_budget,
            status=p_status,hours=p_hours,project_type=p_project_type,code=p_code,description=p_description;
    ELSE
        INSERT INTO projects (name,client_name,budget,status,created_by,hours,project_type,code,description)
        VALUES (p_name,p_client_name,p_budget,p_status,p_created_by,p_hours,p_project_type,p_code,p_description);
    END IF;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_create_expense;
DELIMITER $$
CREATE PROCEDURE sp_create_expense(IN p_user_id INT, IN p_project_id INT,
    IN p_amount DECIMAL(12,2), IN p_description TEXT, IN p_expense_date DATE)
BEGIN
    INSERT INTO expenses (user_id,project_id,amount,description,expense_date)
    VALUES (p_user_id,p_project_id,p_amount,p_description,p_expense_date);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_delete_expense;
DELIMITER $$
CREATE PROCEDURE sp_delete_expense(IN p_id INT)
BEGIN
    DELETE FROM expenses WHERE id=p_id;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_create_invoice;
DELIMITER $$
CREATE PROCEDURE sp_create_invoice(IN p_project_id INT, IN p_total_amount DECIMAL(12,2))
BEGIN
    INSERT INTO invoices (project_id,total_amount) VALUES (p_project_id,p_total_amount);
END$$
DELIMITER ;

SELECT 'Setup complete!' AS result;
SHOW TABLES;
