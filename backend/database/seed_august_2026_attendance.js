/**
 * Prepare August 2026 attendance for payroll.
 *
 * Default mode is a dry run. Apply changes with:
 *   node backend/database/seed_august_2026_attendance.js --apply
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const YEAR = 2026;
const MONTH = 8;
const START = '2026-08-01';
const END = '2026-08-31';
const APPLY = process.argv.includes('--apply');

const DB_CONFIG = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
};

function dateKey(day) {
  return `${YEAR}-${String(MONTH).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function main() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const [employees] = await conn.query(
      `SELECT employee_id, emp_code, first_name, last_name
         FROM employees
        WHERE employee_status = 'Active'
        ORDER BY employee_id`
    );
    const [holidays] = await conn.query(
      `SELECT holiday_date, holiday_calendar
         FROM holidays
        WHERE holiday_date BETWEEN ? AND ?`,
      [START, END]
    );
    const [leaveRows] = await conn.query(
      `SELECT employee_id, from_date, to_date
         FROM leave_requests
        WHERE status = 'Approved'
          AND from_date <= ?
          AND to_date >= ?`,
      [END, START]
    );

    const holidayDates = new Set(holidays.map((row) => String(row.holiday_date).slice(0, 10)));
    const approvedLeave = new Set();
    leaveRows.forEach((row) => {
      const from = new Date(`${String(row.from_date).slice(0, 10)}T12:00:00`);
      const to = new Date(`${String(row.to_date).slice(0, 10)}T12:00:00`);
      for (let date = new Date(from); date <= to; date.setDate(date.getDate() + 1)) {
        const iso = date.toISOString().slice(0, 10);
        if (iso >= START && iso <= END) approvedLeave.add(`${row.employee_id}:${iso}`);
      }
    });

    const days = [];
    for (let day = 1; day <= 31; day += 1) {
      const date = new Date(YEAR, MONTH - 1, day);
      const iso = dateKey(day);
      if (date.getDay() === 0 || holidayDates.has(iso)) continue;
      days.push(iso);
    }

    console.log(`${APPLY ? 'Applying' : 'Dry run:'} August 2026 attendance`);
    console.log(`Active employees: ${employees.length}`);
    console.log(`Payroll days considered: ${days.length}`);
    console.log(`Approved leave dates preserved: ${approvedLeave.size}`);

    if (!APPLY) {
      console.log('No database changes made. Re-run with --apply to write records.');
      return;
    }

    await conn.beginTransaction();
    let written = 0;
    let preserved = 0;

    for (const employee of employees) {
      for (const iso of days) {
        if (approvedLeave.has(`${employee.employee_id}:${iso}`)) {
          preserved += 1;
          continue;
        }

        await conn.query(
          `INSERT INTO attendance
             (employee_id, attendance_date, check_in, check_out, work_hours, late_by_minutes, status, source)
           VALUES (?, ?, '09:30:00', '18:30:00', 9.00, 0, 'present', 'admin_august_2026')
           ON DUPLICATE KEY UPDATE
             check_in = VALUES(check_in),
             check_out = VALUES(check_out),
             work_hours = VALUES(work_hours),
             late_by_minutes = VALUES(late_by_minutes),
             status = VALUES(status),
             source = VALUES(source)`,
          [employee.employee_id, iso]
        );
        written += 1;
      }
    }

    await conn.commit();
    console.log(`Attendance rows written: ${written}`);
    console.log(`Approved leave rows preserved: ${preserved}`);
    console.log('August attendance is ready for payroll review.');
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error('FATAL:', error.message);
  process.exit(1);
});