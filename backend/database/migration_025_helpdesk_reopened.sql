-- migration_025: Add 'Reopened' status to helpdesk_tickets
-- Run: mysql -u root -p hrms_db < backend/database/migration_025_helpdesk_reopened.sql

ALTER TABLE helpdesk_tickets
  MODIFY COLUMN status
    ENUM('Open','Forwarded','In Progress','Reopened','Resolved','Closed','Rejected')
    NOT NULL DEFAULT 'Open';
