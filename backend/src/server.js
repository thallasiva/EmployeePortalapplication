const app = require('./app');
const { port, env, jwt, salaryEncryptionKey } = require('./config/env');
const { testConnection, query } = require('./config/db');
const logger = require('./utils/logger');

// ── Auto-migrations ──────────────────────────────────────────────────────────
// Safely adds missing columns on every startup (idempotent).
// Uses information_schema so it never errors if the column already exists.
async function runAutoMigrations() {
  try {
    // ── Migration 030: holidays.shift + holidays.location ────────────────────
    const shiftExists = await query(
      `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'holidays' AND COLUMN_NAME = 'shift'`
    );
    if (!shiftExists[0]?.cnt) {
      await query(
        `ALTER TABLE holidays
           ADD COLUMN shift    ENUM('general','mid','night') NOT NULL DEFAULT 'general' AFTER holiday_calendar,
           ADD COLUMN location VARCHAR(100) DEFAULT NULL AFTER shift`
      );
      await query(`UPDATE holidays SET shift = 'general' WHERE shift IS NULL`);
      logger.info('[MIGRATION] holidays.shift + holidays.location columns added');
    }

    // ── Migration 031: reporting_history table ────────────────────────────────
    const rhExists = await query(
      `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reporting_history'`
    );
    if (!rhExists[0]?.cnt) {
      await query(`
        CREATE TABLE reporting_history (
          id              BIGINT AUTO_INCREMENT PRIMARY KEY,
          employee_id     INT NOT NULL,
          old_manager_id  INT DEFAULT NULL,
          new_manager_id  INT DEFAULT NULL,
          changed_by      INT DEFAULT NULL,
          reason          VARCHAR(255) DEFAULT NULL,
          change_type     ENUM('assign','transfer','bulk_transfer','delegation') NOT NULL DEFAULT 'assign',
          created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_rh_employee   FOREIGN KEY (employee_id)    REFERENCES employees(employee_id) ON DELETE CASCADE,
          CONSTRAINT fk_rh_old_mgr    FOREIGN KEY (old_manager_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
          CONSTRAINT fk_rh_new_mgr    FOREIGN KEY (new_manager_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
          CONSTRAINT fk_rh_changed_by FOREIGN KEY (changed_by)     REFERENCES employees(employee_id) ON DELETE SET NULL
        ) ENGINE=InnoDB
      `);
      logger.info('[MIGRATION] reporting_history table created');
    }

    // ── Migration 032a: create workflow_delegates if missing ─────────────────
    const wdTableExists = await query(
      `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'workflow_delegates'`
    );
    if (!wdTableExists[0]?.cnt) {
      await query(`
        CREATE TABLE workflow_delegates (
          id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
          employee_id          INT NOT NULL,
          delegate_employee_id INT NOT NULL,
          module               VARCHAR(60)  NOT NULL DEFAULT 'all',
          from_date            DATE         NOT NULL,
          to_date              DATE         NOT NULL,
          reason               VARCHAR(255) DEFAULT NULL,
          status               ENUM('Active','Expired','Cancelled') NOT NULL DEFAULT 'Active',
          created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_wd_emp  FOREIGN KEY (employee_id)          REFERENCES employees(employee_id) ON DELETE CASCADE,
          CONSTRAINT fk_wd_del  FOREIGN KEY (delegate_employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `);
      logger.info('[MIGRATION] workflow_delegates table created');
    }

    // ── Migration 032b: workflow_delegates.reason column ─────────────────────
    const wdReasonExists = await query(
      `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'workflow_delegates' AND COLUMN_NAME = 'reason'`
    );
    if (!wdReasonExists[0]?.cnt) {
      await query(`ALTER TABLE workflow_delegates ADD COLUMN reason VARCHAR(255) DEFAULT NULL AFTER to_date`);
      logger.info('[MIGRATION] workflow_delegates.reason column added');
    }

    // ── Migration 033: seed org hierarchy ONLY if nobody has reporting_to set ──
    // This runs once on a fresh DB. After that, manual assignments in the UI
    // are preserved — we no longer overwrite on every restart.
    {
      const assigned = await query(
        `SELECT COUNT(*) AS cnt FROM employees WHERE reporting_to IS NOT NULL AND employee_status = 'Active'`
      );
      const alreadySeeded = Number(assigned[0]?.cnt) > 0;

      if (!alreadySeeded) {
        logger.info('[MIGRATION] No hierarchy set — running initial org hierarchy seed…');

        const emps = await query(`
          SELECT e.employee_id, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name,
                 e.department_id, e.designation_id, d.designation_name
            FROM employees e
            LEFT JOIN designations d ON d.designation_id = e.designation_id
           WHERE e.employee_status = 'Active'
           ORDER BY e.employee_id
        `);

        if (emps.length > 1) {
          function rankDesig(name = '') {
            const n = (name || '').toLowerCase();
            if (/ceo|chief executive|president|founder|managing director/.test(n)) return 6;
            if (/cto|cfo|coo|cpo|chief/.test(n))   return 5;
            if (/vp|vice president|director/.test(n)) return 4;
            if (/head|manager|lead/.test(n))          return 3;
            if (/senior|sr\.|principal|specialist/.test(n)) return 2;
            return 1;
          }

          emps.forEach(e => { e._rank = rankDesig(e.designation_name); });
          const sorted = [...emps].sort((a, b) => b._rank - a._rank || a.employee_id - b.employee_id);
          const ceo = sorted[0];

          // CEO has no manager
          await query(`UPDATE employees SET reporting_to = NULL WHERE employee_id = ?`, [ceo.employee_id]);

          for (const emp of sorted) {
            if (emp.employee_id === ceo.employee_id) continue;
            const higher = sorted.filter(e => e._rank > emp._rank && e.employee_id !== emp.employee_id);
            let manager;
            if (higher.length) {
              const minRank  = Math.min(...higher.map(e => e._rank));
              const direct   = higher.filter(e => e._rank === minRank);
              const sameDept = direct.filter(e => e.department_id === emp.department_id);
              manager = sameDept[0] || direct[0];
            } else {
              manager = ceo;
            }
            await query(`UPDATE employees SET reporting_to = ? WHERE employee_id = ?`,
              [manager.employee_id, emp.employee_id]);
            logger.info(`[MIGRATION] ${emp.full_name} → ${manager.full_name}`);
          }

          logger.info(`[MIGRATION] Initial org hierarchy seeded for ${emps.length} employees`);
        }
      } else {
        logger.info('[MIGRATION] Org hierarchy already set — skipping auto-seed (preserving manual assignments)');
      }
    }

    // ── Migration 034: ensure Admin user's employee is always the org root ───
    // Runs every startup but only touches reporting_to for the admin employee
    // and anyone else stuck with NULL reporting_to who isn't the admin.
    {
      // Find the employee linked to the Admin role (role_id = 1)
      const adminRows = await query(
        `SELECT u.employee_id FROM users u WHERE u.role_id = 1 AND u.employee_id IS NOT NULL LIMIT 1`
      );
      if (adminRows.length && adminRows[0].employee_id) {
        const adminEmpId = adminRows[0].employee_id;

        // Admin employee must have reporting_to = NULL (they're the root)
        await query(`UPDATE employees SET reporting_to = NULL WHERE employee_id = ?`, [adminEmpId]);

        // Any OTHER active employee with reporting_to = NULL (orphaned roots)
        // should report to the admin employee
        await query(
          `UPDATE employees
              SET reporting_to = ?
            WHERE employee_id != ?
              AND (reporting_to IS NULL OR reporting_to = 0)
              AND employee_status = 'Active'`,
          [adminEmpId, adminEmpId]
        );

        logger.info(`[MIGRATION 034] Org root fixed → employee_id=${adminEmpId} is the CEO`);
      }
    }

  } catch (err) {
    logger.warn('[MIGRATION] Auto-migration warning:', err.message);
  }
}

// ── Cron: Earned Leave auto-accrual ─────────────────────────────────────────
// Runs on 1st of every month at 18:00 (6 PM) server time
// Credits workingDays/14 earned leave to every active employee
function startCronJobs() {
  try {
    const cron = require('node-cron');
    const leaveService = require('./services/leaveRequest.service');

    // "0 18 1 * *" = minute 0, hour 18, day 1, every month, every weekday
    cron.schedule('0 18 1 * *', async () => {
      const now = new Date();
      // Credit previous month's earned leave
      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevYear  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      logger.info(`[CRON] Starting earned leave accrual for ${prevMonth}/${prevYear}`);
      try {
        const result = await leaveService.accrueEarnedLeave(prevMonth, prevYear);
        logger.info(`[CRON] Earned leave accrual done — ${result.accrued} accrued, ${result.skipped} skipped`);
      } catch (err) {
        logger.error('[CRON] Earned leave accrual failed:', err.message);
      }
    }, { timezone: 'Asia/Kolkata' });

    logger.info('[CRON] Earned leave scheduler registered (1st of month at 18:00 IST)');
  } catch (err) {
    logger.warn('[CRON] node-cron not available — scheduled accrual disabled:', err.message);
  }
}

// ── Production security guardrails ────────────────────────────────────────────
function enforceSecrets() {
  const WEAK_SECRETS = [
    'dev_secret_change_me',
    'dev_refresh_secret_change_me',
    'secret',
    'changeme',
    'password',
    '',
  ];

  if (env === 'production') {
    if (WEAK_SECRETS.includes(jwt.secret)) {
      logger.error('FATAL: JWT_SECRET is set to a default/weak value. Set a strong random secret before running in production.');
      logger.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
      process.exit(1);
    }
    if (WEAK_SECRETS.includes(jwt.refreshSecret)) {
      logger.error('FATAL: JWT_REFRESH_SECRET is set to a default/weak value.');
      process.exit(1);
    }
    if (!salaryEncryptionKey || salaryEncryptionKey.length < 64 || salaryEncryptionKey === 'replace_with_64_char_hex_string') {
      logger.error('FATAL: SALARY_ENCRYPTION_KEY is missing or is still the placeholder value.');
      logger.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
      process.exit(1);
    }
  } else {
    // Non-production: warn but don't crash
    if (WEAK_SECRETS.includes(jwt.secret)) {
      logger.warn('WARNING: JWT_SECRET is using a weak default. Set a strong value before deploying to production.');
    }
  }
}

enforceSecrets();

(async () => {
  try {
    await testConnection();
    logger.info('Connected to MySQL database');
  } catch (err) {
    logger.error('Failed to connect to MySQL database:', err.message);
    logger.error('Make sure the database is running and .env is configured correctly.');
    process.exit(1);
  }

  await runAutoMigrations();
  startCronJobs();

  const server = app.listen(port, () => {
    logger.info(`HRMS backend listening on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use. Stop the existing backend process or set PORT to another value in backend/.env.`);
      process.exit(1);
    }

    logger.error('Backend server failed to start:', err.message);
    process.exit(1);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
