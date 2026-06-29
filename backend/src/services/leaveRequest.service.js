const BaseService = require('./base.service');
const { query, callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

const LIST_SELECT = `
  SELECT lr.*, e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
         d.department_name,
         lt.leave_type_name,
         CONCAT(rv.first_name, ' ', IFNULL(rv.last_name, '')) AS reviewer_name
    FROM leave_requests lr
    JOIN employees e ON e.employee_id = lr.employee_id
    JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees rv ON rv.employee_id = lr.reviewed_by
`;

class LeaveRequestService extends BaseService {
  constructor() {
    super('leave_requests', 'leave_request_id', [
      'employee_id', 'leave_type_id', 'from_date', 'from_session', 'to_date', 'to_session',
      'days', 'reason', 'status', 'reviewed_by', 'remarks', 'is_cancel_request',
    ]);
  }

  async list({ employee_id, status, leave_type_id, department_id, reporting_to, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (employee_id) { where.push('lr.employee_id = ?'); params.push(employee_id); }
    if (status)      { where.push('lr.status = ?');      params.push(status); }
    if (leave_type_id) { where.push('lr.leave_type_id = ?'); params.push(leave_type_id); }
    if (department_id) { where.push('e.department_id = ?');  params.push(department_id); }
    if (reporting_to)  { where.push('e.reporting_to = ?');   params.push(reporting_to); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY lr.applied_on DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM leave_requests lr JOIN employees e ON e.employee_id = lr.employee_id ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE lr.leave_request_id = ?`, [id]);
    return rows[0] || null;
  }

  async apply(data) {
    const results = await callProcedure('sp_apply_leave(?, ?, ?, ?, ?, ?, ?, ?, @request_id, @status_msg)', [
      data.employee_id, data.leave_type_id, data.from_date, data.from_session || null,
      data.to_date, data.to_session || null, data.days, data.reason || null,
    ]);
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
    const request = await this.findById(id);
    if (!request) throw ApiError.notFound('Leave request not found');
    if (request.employee_id !== employeeId) throw ApiError.forbidden('You can only cancel your own leave requests');
    if (request.status !== 'Pending') throw ApiError.conflict('Only pending leave requests can be cancelled');
    await query('UPDATE leave_requests SET status = ? WHERE leave_request_id = ?', ['Cancelled', id]);
    return this.getDetails(id);
  }

  async balances(employeeId, year) {
    const targetYear = year || new Date().getFullYear();
    return query(
      `SELECT lt.leave_type_id, lt.leave_type_name, lt.annual_quota, lt.carry_forward_limit,
              IFNULL(lb.opening_balance, 0) AS opening_balance,
              IFNULL(lb.granted, lt.annual_quota) AS granted,
              IFNULL(lb.availed, 0) AS availed,
              IFNULL(lb.balance, lt.annual_quota) AS balance
         FROM leave_types lt
         LEFT JOIN leave_balances lb
           ON lb.leave_type_id = lt.leave_type_id AND lb.employee_id = ? AND lb.year = ?
        ORDER BY lt.leave_type_name`,
      [employeeId, targetYear]
    );
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

    // 1. Employees
    const empWhere = ["e.employee_status != 'Deleted'"];
    const empParams = [];
    if (department_id) { empWhere.push('e.department_id = ?'); empParams.push(department_id); }
    if (status)        { empWhere.push('e.employee_status = ?'); empParams.push(status); }

    const employees = await query(`
      SELECT e.employee_id, e.emp_code,
             CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
             e.employee_status,
             e.emp_joining_date,
             e.confirmation_date,
             d.department_name,
             des.designation_name
        FROM employees e
        LEFT JOIN departments d ON d.department_id = e.department_id
        LEFT JOIN designations des ON des.designation_id = e.designation_id
       WHERE ${empWhere.join(' AND ')}
       ORDER BY e.emp_code
    `, empParams);

    // 2. Leave types
    const leaveTypes = await query(
      `SELECT leave_type_id, leave_type_name FROM leave_types ORDER BY leave_type_name`
    );

    // 3. Balances (opening, granted, availed, closing)
    const balances = await query(
      `SELECT lb.employee_id, lb.leave_type_id,
              lb.opening_balance, lb.granted, lb.availed,
              GREATEST(0, lb.opening_balance + lb.granted - lb.availed) AS closing_balance
         FROM leave_balances lb WHERE lb.year = ?`,
      [targetYear]
    );
    const balMap = {};
    balances.forEach((b) => { balMap[`${b.employee_id}_${b.leave_type_id}`] = b; });

    // 4. Approved leave requests grouped by employee, leave type, and month
    const empIds = employees.map((e) => e.employee_id);
    let monthlyRows = [];
    if (empIds.length > 0) {
      monthlyRows = await query(`
        SELECT lr.employee_id, lr.leave_type_id,
               MONTH(lr.from_date) AS month,
               SUM(lr.days) AS days_taken
          FROM leave_requests lr
         WHERE lr.status = 'Approved'
           AND YEAR(lr.from_date) = ?
           AND lr.employee_id IN (${empIds.map(() => '?').join(',')})
         GROUP BY lr.employee_id, lr.leave_type_id, MONTH(lr.from_date)
      `, [targetYear, ...empIds]);
    }

    // Build monthly map: { "empId_ltId_month": days }
    const monthMap = {};
    monthlyRows.forEach((r) => {
      monthMap[`${r.employee_id}_${r.leave_type_id}_${r.month}`] = Number(r.days_taken) || 0;
    });

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const result = employees.map((emp) => {
      const leaveData = leaveTypes.map((lt) => {
        const b = balMap[`${emp.employee_id}_${lt.leave_type_id}`];
        const monthly = MONTHS.map((_, i) =>
          monthMap[`${emp.employee_id}_${lt.leave_type_id}_${i + 1}`] || 0
        );
        return {
          leave_type_id:   lt.leave_type_id,
          leave_type_name: lt.leave_type_name,
          opening_balance: b ? Number(b.opening_balance) || 0 : 0,
          granted:         b ? Number(b.granted)         || 0 : 0,
          availed:         b ? Number(b.availed)         || 0 : 0,
          closing_balance: b ? Number(b.closing_balance) || 0 : 0,
          monthly,          // [jan, feb, ..., dec]
        };
      });
      return {
        employee_id:      emp.employee_id,
        emp_code:         emp.emp_code,
        employee_name:    emp.employee_name,
        employee_status:  emp.employee_status,
        department_name:  emp.department_name,
        designation_name: emp.designation_name,
        emp_joining_date: emp.emp_joining_date,
        confirmation_date: emp.confirmation_date,
        leave_data:       leaveData,
      };
    });

    return { employees: result, leaveTypes, year: targetYear, months: MONTHS };
  }

}

module.exports = new LeaveRequestService();
