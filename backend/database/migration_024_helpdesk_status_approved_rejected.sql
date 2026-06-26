-- migration_024: Full helpdesk workflow
-- 1. Extend status ENUM  (Open → Forwarded → In Progress → Resolved → Closed | Rejected)
-- 2. Add forwarded_to_team column  (set by manager when approving)

ALTER TABLE helpdesk_tickets
  MODIFY COLUMN status
    ENUM('Open','Forwarded','In Progress','Resolved','Closed','Rejected')
    NOT NULL DEFAULT 'Open';

ALTER TABLE helpdesk_tickets
  ADD COLUMN IF NOT EXISTS forwarded_to_team
    ENUM('IT Team','Admin Team','HR Team','Finance Team')
    DEFAULT NULL
    AFTER assigned_to;
