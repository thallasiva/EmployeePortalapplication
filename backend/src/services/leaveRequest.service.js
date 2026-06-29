const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

class LeaveRequestService extends BaseService {
  constructor() {
    super('leave_requests', 'leave_request_id', [
      'employee_id', 'leave_type_id', 'from_date', 'from_session', 'to_date', 'to_session',
      'days', 'reason', 'status', 'reviewed_by', 'remarks', 'is_cancel_request',
    ]);
  }

  async list({ employee_id, status, leave_type_id, department_id, reporting_to, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_leave_requests(?, ?, ?, ?, ?, ?, ?)',
      [
        employee_id   ?? null,
        status        ?? null,
        leave_type_id ?? null,
        department_id ?? null,
        reporting_to  ?? null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getDetails(id) {
    const results = await callProcedure('sp_get_leave_request(?)', [id]);
    return (results[0] ?? results)[0] ?? null;
  }

  async apply(data) {
    const results = await callProcedure('sp_apply_leave(?, ?, ?, ?, ?, ?, ?, ?, @request_id, @status_msg)', [
      data.employee_id, data.leave_type_id, data.from_date, data.from_session || null,
      data.to_date, data.to_session || null, data.days, data.reason || null,
    ]);
    const { query } = require('../config/db');
    const out = await query('SELECT @request_id AS request_id, @status_msg AS status_msg');
    const { request_id, status_msg } = out[0];
    if (!request_id) throw ApiError.badRequest(status_msg || 'Unable to submit leave request');
    return this.getDetails(request_id);
  }

  async review(id, { decision, reviewed_by, remarks }) {
    try {
      await callProcedure('sp_review_leave_request(?, ?, ?, ?)', [id, decision, reviewed_by, remarks || null]);
    } catch (err) {
      if (err && err.sqlState === '45000') throw ApiError.conflict(err.sqlMessage || 'Unable to review leave request');
      throw err;
    }
    return this.getDetails(id);
  }

  async cancel(id, employeeId) {
    await callProcedure('sp_cancel_leave_request(?, ?, @ok, @msg)', [id, employeeId]);
    const { query } = require('../config/db');
    const out = await query('SELECT @ok AS ok, @msg AS msg');
    if (!out[0]?.ok) {
      const msg = out[0]?.msg ?? 'Cannot cancel';
      if (msg.includes('not found'))  throw ApiError.notFound(msg);
      if (msg.includes('your own'))   throw ApiError.forbidden(msg);
      throw ApiError.conflict(msg);
    }
    return this.getDetails(id);
  }

  async balances(employeeId, year) {
    const targetYear = year || new Date().getFullYear();
    const results = await callProcedure('sp_get_leave_balances(?, ?)', [employeeId, targetYear]);
    return results[0] ?? results;
  }

  /** Returns ALL active employees x all leave types matrix for a given year */
  async allBalances(year) {
    const targetYear = Number(year) || new Date().getFullYear();

    const employees = await query(`
      SELECT e.employee_id, e.emp_code,
             CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
             d.department_name,
             CONCAT(m.first_name, ' ', IFNULL(m.last_name, '')) AS manager_name,
             m.emp_code AS manager_emp_code
        FROM employees e
        LEFT JOIN departments d ON d.department_id = e.department_id
        LEFT JOIN employees m ON m.employee_id = e.reporting_to
       WHERE e.employee_status = 'Active'
       ORDER BY e.emp_code
    `);

    const leaveTypes = await query(`
      SELECT leave_type_id, leave_type_name, annual_quota, carry_forward_limit
        FROM leave_types ORDER BY leave_type_name
    `);

    const balanceRows = await query(`
      SELECT lb.employee_id, lb.leave_type_id,
             lb.opening_balance, lb.granted, lb.availed, lb.balance
        FROM leave_balances lb WHERE lb.year = ?
    `, [targetYear]);

    const balMap = {};
    balanceRows.forEach((b) => { balMap[`${b.employee_id}_${b.leave_type_id}`] = b; });

    const result = employees.map((emp) => ({
      ...emp,
      balances: leaveTypes.map((lt) => {
        const b = balMap[`${emp.employee_id}_${lt.leave_type_id}`];
        return {
          leave_type_id:   lt.leave_type_id,
          leave_type_name: lt.leave_type_name,
          annual_quota:    Number(lt.annual_quota) || 0,
          opening_balance: b ? Number(b.opening_balance) || 0 : 0,
          granted:         b ? Number(b.granted)         || 0 : Number(lt.annual_quota) || 0,
          availed:         b ? Number(b.availed)         || 0 : 0,
          balance:         b ? Number(b.balance)         || 0 : Number(lt.annual_quota) || 0,
          initialized:     !!b,
        };
      }),
    }));

    return { employees: result, leaveTypes, year: targetYear };
  }

  /**
   * AUTO EARNED LEAVE ACCRUAL
   * Formula: floor(workingDays / 14 * 2) / 2  →  nearest 0.5-day increment
   * Source:  payslips.paid_days for that month (accurate); fallback = count Mon–Fri
   * Target:  leave_balances row for "Earned Leave" (short_code='EL' or first match)
   */
  async accrueEarnedLeave(month, year) {
    const m = Number(month);
    const y = Number(year);
    if (!m || !y) throw new (require('../utils/ApiError'))('Invalid month or year', 400);

    // 1. Find Earned Leave type (leave_types has no short_code column)
    const elTypes = await query(
      `SELECT leave_type_id FROM leave_types
        WHERE leave_type_name LIKE '%Earned%'
           OR leave_type_name LIKE '%EL%'
           OR leave_type_name LIKE '%PL%'
       ORDER BY leave_type_id ASC LIMIT 1`
    );
    if (!elTypes.length) throw new (require('../utils/ApiError'))('No Earned Leave type configured', 400);
    const leaveTypeId = elTypes[0].leave_type_id;

    // 2. Get all active employees
    const employees = await query(
      `SELECT employee_id FROM employees WHERE employee_status = 'Active'`
    );
    if (!employees.length) return { accrued: 0, skipped: 0, month: m, year: y };

    // 3. Get paid_days from payslips for this month (most accurate)
    const paidRows = await query(
      `SELECT employee_id, IFNULL(paid_days, working_days) AS paid_days
         FROM payslips WHERE month = ? AND year = ?`,
      [m, y]
    );
    const paidMap = {};
    paidRows.forEach(r => { paidMap[r.employee_id] = Number(r.paid_days) || 0; });

    // 4. Fallback: count Mon–Fri in the month
    const daysInMonth = new Date(y, m, 0).getDate();
    let calendarWorkDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(y, m - 1, d).getDay();
      if (dow !== 0 && dow !== 6) calendarWorkDays++;
    }

    // 5. Accrue for each employee
    let accrued = 0, skipped = 0;
    const currentYear = y; // leave balance year

    for (const emp of employees) {
      const workDays = paidMap[emp.employee_id] || calendarWorkDays;
      // Round to nearest 0.5
      const earnDays = Math.floor(workDays / 14 * 2) / 2;
      if (earnDays <= 0) { skipped++; continue; }

      // Upsert balance row — add to granted & recalculate balance
      const existing = await query(
        `SELECT opening_balance, granted, availed, balance
           FROM leave_balances
          WHERE employee_id = ? AND leave_type_id = ? AND year = ?`,
        [emp.employee_id, leaveTypeId, currentYear]
      );

      if (existing.length) {
        const ob = Number(existing[0].opening_balance) || 0;
        const gr = Number(existing[0].granted) + earnDays;
        const av = Number(existing[0].availed) || 0;
        const bal = Math.max(0, ob + gr - av);
        await query(
          `UPDATE leave_balances SET granted = ?, balance = ?
            WHERE employee_id = ? AND leave_type_id = ? AND year = ?`,
          [gr, bal, emp.employee_id, leaveTypeId, currentYear]
        );
      } else {
        await query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
           VALUES (?, ?, ?, 0, ?, 0, ?)`,
          [emp.employee_id, leaveTypeId, currentYear, earnDays, earnDays]
        );
      }
      accrued++;
    }

    return { accrued, skipped, earnedPerEmployee: null, month: m, year: y, leaveTypeId };
  }

  /** Admin: upsert one employee's leave balance row */
  async adjustBalance({ employeeId, leaveTypeId, year, opening_balance, granted, availed }) {
    const targetYear = Number(year) || new Date().getFullYear();
    const ob  = Number(opening_balance) || 0;
    const gr  = Number(granted)         || 0;
    const av  = Number(availed)         || 0;
    const bal = Math.max(0, ob + gr - av);

    const existing = await query(
      `SELECT 1 FROM leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ?`,
      [employeeId, leaveTypeId, targetYear]
    );

    if (existing.length > 0) {
      await query(
        `UPDATE leave_balances SET opening_balance=?, granted=?, availed=?, balance=?
          WHERE employee_id=? AND leave_type_id=? AND year=?`,
        [ob, gr, av, bal, employeeId, leaveTypeId, targetYear]
      );
    } else {
      await query(
        `INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [employeeId, leaveTypeId, targetYear, ob, gr, av, bal]
      );
    }
    return { employeeId, leaveTypeId, year: targetYear, opening_balance: ob, granted: gr, availed: av, balance: bal };
  }

  /** Admin: seed missing balance rows for all active employees for a given year */
  async initializeBalancesForYear(year) {
    const targetYear = Number(year) || new Date().getFullYear();
    const prevYear   = targetYear - 1;
    const employees  = await query(`SELECT employee_id FROM employees WHERE employee_status = 'Active'`);
    const leaveTypes = await query(`SELECT leave_type_id, annual_quota, carry_forward_limit FROM leave_types`);

    let created = 0, skipped = 0;

    for (const emp of employees) {
      for (const lt of leaveTypes) {
        const exists = await query(
          `SELECT 1 FROM leave_balances WHERE employee_id=? AND leave_type_id=? AND year=?`,
          [emp.employee_id, lt.leave_type_id, targetYear]
        );
        if (exists.length > 0) { skipped++; continue; }

        const prev = await query(
          `SELECT balance FROM leave_balances WHERE employee_id=? AND leave_type_id=? AND year=?`,
          [emp.employee_id, lt.leave_type_id, prevYear]
        );
        const cfLimit = Number(lt.carry_forward_limit) || 0;
        const prevBal = prev.length > 0 ? Number(prev[0].balance) || 0 : 0;
        const opening = Math.min(prevBal, cfLimit);
        const granted = Number(lt.annual_quota) || 0;
        const balance = opening + granted;

        await query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
           VALUES (?, ?, ?, ?, ?, 0, ?)`,
          [emp.employee_id, lt.leave_type_id, targetYear, opening, granted, balance]
        );
        created++;
      }
    }
    return { year: targetYear, created, skipped };
  }

  /** Admin: bulk-import leave balances from parsed CSV/Excel rows */
  async importBalances(rows, year) {
    const targetYear = Number(year) || new Date().getFullYear();
    let imported = 0, errors = [];

    for (const row of rows) {
      try {
        await this.adjustBalance({
          employeeId:      row.employee_id,
          leaveTypeId:     row.leave_type_id,
          year:            targetYear,
          opening_balance: Number(row.opening_balance) || 0,
          granted:         Number(row.granted)         || 0,
          availed:         Number(row.availed)         || 0,
        });
        imported++;
      } catch (e) {
        errors.push({ row, error: e.message });
      }
    }
    return { imported, errors, year: targetYear };
  }

  /**
   * Admin: Full leave summary ledger for all active employees for a year.
   * Returns per-employee:
   *  - Employee details (code, name, status, department, designation, DOJ)
   *  - Opening balances per leave type
   *  - Leave eligibility (granted) per leave type
   *  - Total availed per leave type
   *  - Monthly availed breakdown (Jan-Dec) per leave type
   *  - Closing balance per leave type
   */
  async leaveSummary(year, { department_id, status } = {}) {
    const targetYear = Number(year) || new Date().getFullYear();

    // Single stored procedure call — returns 4 result sets
    const results = await callProcedure(
      'sp_get_leave_summary(?, ?, ?)',
      [targetYear, department_id ?? null, status ?? null]
    );

    const employees   = results[0] ?? [];
    const leaveTypes  = results[1] ?? [];
    const balances    = results[2] ?? [];
    const monthlyRows = results[3] ?? [];

    const balMap = {};
    balances.forEach((b) => { balMap[`${b.employee_id}_${b.leave_type_id}`] = b; });

    const monthMap = {};
    monthlyRows.forEach((r) => {
      monthMap[`${r.employee_id}_${r.leave_type_id}_${r.month}`] = Number(r.days_taken) || 0;
    });

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const result = employees.map((emp) => ({
      employee_id:       emp.employee_id,
      emp_code:          emp.emp_code,
      employee_name:     emp.employee_name,
      employee_status:   emp.employee_status,
      department_name:   emp.department_name,
      designation_name:  emp.designation_name,
      emp_joining_date:  emp.emp_joining_date,
      confirmation_date: emp.confirmation_date,
      leave_data: leaveTypes.map((lt) => {
        const b = balMap[`${emp.employee_id}_${lt.leave_type_id}`];
        return {
          leave_type_id:   lt.leave_type_id,
          leave_type_name: lt.leave_type_name,
          opening_balance: b ? Number(b.opening_balance) || 0 : 0,
          granted:         b ? Number(b.granted)         || 0 : 0,
          availed:         b ? Number(b.availed)         || 0 : 0,
          closing_balance: b ? Number(b.closing_balance) || 0 : 0,
          monthly: MONTHS.map((_, i) =>
            monthMap[`${emp.employee_id}_${lt.leave_type_id}_${i + 1}`] || 0
          ),
        };
      }),
    }));

    return { employees: result, leaveTypes, year: targetYear, months: MONTHS };
  }

}

module.exports = new LeaveRequestService();