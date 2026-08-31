/**
 * Fix the final 3 failing procedures.
 * Run: node fix_last3.js
 */
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com',
  port: 4306, user: 'HRMSadmin', password: 'HwULGJ6gbxQIhzwNeZ9L',
  database: 'hrms_db', connectTimeout: 30000,
};

const FIXES = [

  // ── sp_assign_manager ───────────────────────────────────────────────────────
  `DROP PROCEDURE IF EXISTS sp_assign_manager`,
  `CREATE PROCEDURE sp_assign_manager (
  IN p_employee_id  INT,
  IN p_new_manager_id INT,
  IN p_changed_by   INT,
  IN p_reason       TEXT
)
BEGIN
  DECLARE v_old_manager INT;
  SELECT reporting_to INTO v_old_manager
    FROM employees WHERE employee_id = p_employee_id LIMIT 1;

  IF NOT (v_old_manager IS NULL AND p_new_manager_id IS NULL) THEN
    UPDATE employees
       SET reporting_to = p_new_manager_id
     WHERE employee_id = p_employee_id;

    INSERT INTO reporting_history
      (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
    VALUES
      (p_employee_id, v_old_manager, p_new_manager_id, p_changed_by, p_reason, 'assign');
  END IF;
END`,

  // ── sp_bulk_assign_manager ──────────────────────────────────────────────────
  `DROP PROCEDURE IF EXISTS sp_bulk_assign_manager`,
  `CREATE PROCEDURE sp_bulk_assign_manager (
  IN p_employee_id    INT,
  IN p_new_manager_id INT,
  IN p_changed_by     INT,
  IN p_reason         TEXT
)
BEGIN
  DECLARE v_old_manager INT;
  SELECT reporting_to INTO v_old_manager
    FROM employees WHERE employee_id = p_employee_id LIMIT 1;

  IF v_old_manager IS NOT NULL THEN
    UPDATE employees
       SET reporting_to = p_new_manager_id
     WHERE employee_id = p_employee_id;

    INSERT INTO reporting_history
      (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
    VALUES
      (p_employee_id, v_old_manager, p_new_manager_id, p_changed_by, p_reason, 'bulk_transfer');
  END IF;
END`,

  // ── sp_manager_action_ticket ────────────────────────────────────────────────
  `DROP PROCEDURE IF EXISTS sp_manager_action_ticket`,
  `CREATE PROCEDURE sp_manager_action_ticket (
  IN  p_manager_id   INT,
  IN  p_ticket_id    INT,
  IN  p_action       VARCHAR(20),
  IN  p_forward_team VARCHAR(50),
  IN  p_comment      TEXT,
  OUT p_ok           TINYINT,
  OUT p_msg          VARCHAR(200)
)
BEGIN
  DECLARE v_status VARCHAR(30);
  DECLARE v_cnt    INT DEFAULT 0;

  SELECT COUNT(*) INTO v_cnt
    FROM helpdesk_tickets t
    JOIN employees e ON e.employee_id = t.employee_id
   WHERE t.ticket_id = p_ticket_id AND e.reporting_to = p_manager_id;

  IF v_cnt = 0 THEN
    SET p_ok = 0;
    SET p_msg = 'Ticket does not belong to your team';
  ELSE
    SELECT status INTO v_status
      FROM helpdesk_tickets
     WHERE ticket_id = p_ticket_id
     LIMIT 1;

    IF v_status != 'Open' THEN
      SET p_ok = 0;
      SET p_msg = 'Only Open tickets can be actioned by manager';
    ELSE
      IF p_action = 'approve' THEN
        UPDATE helpdesk_tickets
           SET status = 'Forwarded', forwarded_to_team = p_forward_team
         WHERE ticket_id = p_ticket_id;
      ELSE
        UPDATE helpdesk_tickets
           SET status = 'Rejected', resolved_at = NOW()
         WHERE ticket_id = p_ticket_id;
      END IF;
      INSERT INTO helpdesk_comments (ticket_id, commented_by, comment)
      VALUES (p_ticket_id, p_manager_id, p_comment);
      SET p_ok  = 1;
      SET p_msg = 'OK';
    END IF;
  END IF;
END`,
];

async function main() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connected!\n');

  let ok = 0, err = 0;
  for (const sql of FIXES) {
    const name = sql.match(/(?:DROP PROCEDURE IF EXISTS|CREATE PROCEDURE)\s+(\w+)/i)?.[1] || '?';
    try {
      await conn.query(sql);
      if (sql.startsWith('CREATE')) { console.log(`  OK  ${name}`); ok++; }
    } catch(e) {
      if (sql.startsWith('CREATE')) { console.log(`  ERR ${name}: ${e.message}`); err++; }
    }
  }

  const [rows] = await conn.execute(
    "SELECT COUNT(*) AS cnt FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA=? AND ROUTINE_TYPE='PROCEDURE'",
    ['hrms_db']
  );
  await conn.end();

  console.log('\n' + '='.repeat(50));
  console.log(`Fixed: ${ok}  |  Errors: ${err}`);
  console.log(`Total procedures in DB: ${rows[0].cnt}`);
  console.log('='.repeat(50));
}
main().catch(e => { console.error(e); process.exit(1); });
