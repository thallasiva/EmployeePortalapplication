const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');
const notify = require('./mailNotify.service');

class LeaveRequestService extends BaseService {
  constructor() {
    super('leave_requests', 'leave_request_id', [
    'employee_id', 'leave_type_id', 'from_date', 'from_session', 'to_date', 'to_session',
    'days', 'reason', 'status', 'reviewed_by', 'remarks', 'is_cancel_request']
    );
  }


  async _getEmailPair(employeeId) {
    const results = await callProcedure('sp_get_leave_email_pair(?)', [employeeId]);
    return (results[0] ?? [])[0] ?? {};
  }

  async list({ employee_id, status, leave_type_id, department_id, reporting_to, team_role_id, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_leave_requests(?, ?, ?, ?, ?, ?, ?)',
      [
      employee_id ?? null,
      status ?? null,
      leave_type_id ?? null,
      department_id ?? null,
      reporting_to ?? null,
      limit != null ? Math.min(Number(limit), 10000) : null,
      limit != null ? Number(offset || 0) : null]

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
    data.to_date, data.to_session || null, data.days, data.reason || null]
    );
    const { readOuts } = require('../config/db');
    const { request_id, status_msg } = await readOuts('request_id', 'status_msg');
    if (!request_id) throw ApiError.badRequest(status_msg || 'Unable to submit leave request');

    const leave = await this.getDetails(request_id);


    const pair = await this._getEmailPair(data.employee_id);
    notify.leaveApplied({
      managerEmail: pair.mgr_email || null,
      managerName: pair.mgr_name || 'Manager',
      employeeName: pair.emp_name || leave?.employee_name || `Employee #${data.employee_id}`,
      empCode: leave?.emp_code || '',
      leaveType: leave?.leave_type_name || '',
      fromDate: data.from_date,
      toDate: data.to_date,
      days: data.days,
      reason: data.reason || '',
      leaveRequestId: request_id
    });

    return leave;
  }

  async review(id, { decision, reviewed_by, remarks }) {
    try {
      await callProcedure('sp_review_leave_request(?, ?, ?, ?)', [id, decision, reviewed_by, remarks || null]);
    } catch (err) {
      if (err && err.sqlState === '45000') throw ApiError.conflict(err.sqlMessage || 'Unable to review leave request');
      throw err;
    }
    const leave = await this.getDetails(id);


    if (leave) {
      const pair = await this._getEmailPair(leave.employee_id);
      const reviewerResults = await callProcedure('sp_get_employee_display_name(?)', [reviewed_by]);
      const reviewer = (reviewerResults[0] ?? [])[0];
      const base = {
        employeeEmail: pair.emp_email || null,
        employeeName: pair.emp_name || leave.employee_name || 'Employee',
        reviewerName: reviewer?.name || leave.reviewer_name || 'Manager',
        leaveType: leave.leave_type_name || '',
        fromDate: leave.from_date,
        toDate: leave.to_date,
        days: leave.days,
        remarks
      };
      if (decision === 'Approved') notify.leaveApproved(base);else
      if (decision === 'Rejected') notify.leaveRejected(base);
    }
    return leave;
  }

  async cancel(id, employeeId) {

    const leaveBeforeCancel = await this.getDetails(id);

    await callProcedure('sp_cancel_leave_request(?, ?, @ok, @msg)', [id, employeeId]);
    const { readOuts } = require('../config/db');
    const { ok, msg: cancelMsg } = await readOuts('ok', 'msg');
    if (!ok) {
      const msg = cancelMsg ?? 'Cannot cancel';
      if (msg.includes('not found')) throw ApiError.notFound(msg);
      if (msg.includes('your own')) throw ApiError.forbidden(msg);
      throw ApiError.conflict(msg);
    }


    if (leaveBeforeCancel) {
      const pair = await this._getEmailPair(leaveBeforeCancel.employee_id || employeeId);
      notify.leaveCancelled({
        managerEmail: pair.mgr_email || null,
        managerName: pair.mgr_name || 'Manager',
        employeeName: pair.emp_name || leaveBeforeCancel.employee_name || 'Employee',
        leaveType: leaveBeforeCancel.leave_type_name || '',
        fromDate: leaveBeforeCancel.from_date,
        toDate: leaveBeforeCancel.to_date
      });
    }
    return this.getDetails(id);
  }

  async balances(employeeId, year) {
    const targetYear = year || new Date().getFullYear();
    const results = await callProcedure('sp_get_leave_balances(?, ?)', [employeeId, targetYear]);
    return results[0] ?? results;
  }

  async allBalances(year) {
    const targetYear = Number(year) || new Date().getFullYear();
    const results = await callProcedure('sp_all_leave_balances(?)', [targetYear]);

    const employees = results[0] ?? [];
    const leaveTypes = results[1] ?? [];
    const balances = results[2] ?? [];

    const balMap = {};
    balances.forEach((b) => {balMap[`${b.employee_id}_${b.leave_type_id}`] = b;});

    const result = employees.map((emp) => ({
      ...emp,
      balances: leaveTypes.map((lt) => {
        const b = balMap[`${emp.employee_id}_${lt.leave_type_id}`];
        return {
          leave_type_id: lt.leave_type_id,
          leave_type_name: lt.leave_type_name,
          annual_quota: Number(lt.annual_quota) || 0,
          opening_balance: b ? Number(b.opening_balance) || 0 : 0,
          granted: b ? Number(b.granted) || 0 : Number(lt.annual_quota) || 0,
          availed: b ? Number(b.availed) || 0 : 0,
          balance: b ? Number(b.balance) || 0 : Number(lt.annual_quota) || 0,
          initialized: !!b
        };
      })
    }));

    return { employees: result, leaveTypes, year: targetYear };
  }

  async accrueEarnedLeave(month, year) {
    const m = Number(month);
    const y = Number(year);
    if (!m || !y) throw ApiError.badRequest('Invalid month or year');
    const results = await callProcedure('sp_accrue_earned_leave(?, ?)', [m, y]);
    const out = (results[0] ?? [])[0] ?? {};
    return { accrued: out.accrued ?? 0, skipped: 0, earnedPerEmployee: null, month: m, year: y, leaveTypeId: out.leave_type_id };
  }

  async adjustBalance({ employeeId, leaveTypeId, year, opening_balance, granted, availed }) {
    const targetYear = Number(year) || new Date().getFullYear();
    const ob = Number(opening_balance) || 0;
    const gr = Number(granted) || 0;
    const av = Number(availed) || 0;
    const bal = Math.max(0, ob + gr - av);
    await callProcedure('sp_adjust_leave_balance(?, ?, ?, ?, ?, ?)', [employeeId, leaveTypeId, targetYear, ob, gr, av]);
    return { employeeId, leaveTypeId, year: targetYear, opening_balance: ob, granted: gr, availed: av, balance: bal };
  }

  async initializeBalancesForYear(year) {
    const targetYear = Number(year) || new Date().getFullYear();
    const results = await callProcedure('sp_init_leave_balances_year(?)', [targetYear]);
    const created = (results[0] ?? [])[0]?.created ?? 0;
    return { year: targetYear, created, skipped: 0 };
  }

  async importBalances(rows, year) {
    const targetYear = Number(year) || new Date().getFullYear();
    let imported = 0,errors = [];

    for (const row of rows) {
      try {
        await this.adjustBalance({
          employeeId: row.employee_id,
          leaveTypeId: row.leave_type_id,
          year: targetYear,
          opening_balance: Number(row.opening_balance) || 0,
          granted: Number(row.granted) || 0,
          availed: Number(row.availed) || 0
        });
        imported++;
      } catch (e) {
        errors.push({ row, error: e.message });
      }
    }
    return { imported, errors, year: targetYear };
  }

  async leaveSummary(year, { department_id, status } = {}) {
    const targetYear = Number(year) || new Date().getFullYear();

    const results = await callProcedure(
      'sp_get_leave_summary(?, ?, ?)',
      [targetYear, department_id ?? null, status ?? null]
    );

    const employees = results[0] ?? [];
    const leaveTypes = results[1] ?? [];
    const balances = results[2] ?? [];
    const monthlyRows = results[3] ?? [];

    const balMap = {};
    balances.forEach((b) => {balMap[`${b.employee_id}_${b.leave_type_id}`] = b;});

    const monthMap = {};
    monthlyRows.forEach((r) => {
      monthMap[`${r.employee_id}_${r.leave_type_id}_${r.month}`] = Number(r.days_taken) || 0;
    });

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const result = employees.map((emp) => ({
      employee_id: emp.employee_id,
      emp_code: emp.emp_code,
      employee_name: emp.employee_name,
      employee_status: emp.employee_status,
      department_name: emp.department_name,
      designation_name: emp.designation_name,
      emp_joining_date: emp.emp_joining_date,
      confirmation_date: emp.confirmation_date,
      leave_data: leaveTypes.map((lt) => {
        const b = balMap[`${emp.employee_id}_${lt.leave_type_id}`];
        return {
          leave_type_id: lt.leave_type_id,
          leave_type_name: lt.leave_type_name,
          opening_balance: b ? Number(b.opening_balance) || 0 : 0,
          granted: b ? Number(b.granted) || 0 : 0,
          availed: b ? Number(b.availed) || 0 : 0,
          closing_balance: b ? Number(b.closing_balance) || 0 : 0,
          monthly: MONTHS.map((_, i) =>
          monthMap[`${emp.employee_id}_${lt.leave_type_id}_${i + 1}`] || 0
          )
        };
      })
    }));

    return { employees: result, leaveTypes, year: targetYear, months: MONTHS };
  }
}

module.exports = new LeaveRequestService();
