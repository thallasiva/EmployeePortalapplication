'use strict';
/**
 * Attendance-based salary calculation.
 *
 * For a month it classifies every calendar day of every employee (weekly off, holiday,
 * present, paid/unpaid leave, absent, pending…), turns that into paid days and loss of
 * pay, prorates the salary structure, and — when the admin processes payroll — writes
 * the payslips. The admin sees exactly the same numbers before and after processing.
 */
const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { computeStructure } = require('../utils/formulaEngine');
const salaryAssignmentSvc = require('./salaryAssignment.service');

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
// No schedule on file: Monday–Friday (attendance data shows Saturday is not worked).
const DEFAULT_WORK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const PF_WAGE_CAP = 15000;
const ESI_GROSS_LIMIT = 21000;

const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const toDateStr = (v) => (v ? String(v).slice(0, 10) : null);
const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

function parseWorkDays(raw) {
  let days = raw;
  if (typeof raw === 'string') { try { days = JSON.parse(raw); } catch { days = null; } }
  if (!Array.isArray(days) || !days.length) return DEFAULT_WORK_DAYS;
  return days.map((d) => String(d).slice(0, 3).toLowerCase()).filter((d) => DAY_KEYS.includes(d));
}

// A leave covering a single half day is worth 0.5; everything else is a full day per date.
function leaveDayValue(leave, date) {
  const half = (s) => s === 'First Half' || s === 'Second Half';
  if (leave.from_date === leave.to_date) return half(leave.from_session) || Number(leave.days) === 0.5 ? 0.5 : 1;
  if (date === leave.from_date && half(leave.from_session)) return 0.5;
  if (date === leave.to_date && half(leave.to_session)) return 0.5;
  return 1;
}

/** Monthly earnings/deductions split for one employee, before attendance proration. */
async function salaryBasis(emp) {
  try {
    const assignment = await salaryAssignmentSvc.getAssignment(emp.employee_id);
    if (assignment?.lines?.length && Number(assignment.ctc_annual) > 0) {
      const { components } = computeStructure(assignment.lines, Number(assignment.ctc_annual), {});
      const earnings = components.filter((c) => c.category === 'Earning' && !c._deferred && c.monthly_amount > 0)
        .map((c) => ({ code: c.component_code, label: c.component_name || c.component_code, monthly: c.monthly_amount }));
      const fixedDeductions = components.filter((c) => c.category === 'Deduction' && !c._deferred && c.monthly_amount > 0)
        .filter((c) => !/(^|_)(PF|EPF|ESI|PT|PROF)/i.test(c.component_code || '') && !/provident|esi|professional/i.test(c.component_name || ''))
        .map((c) => ({ code: c.component_code, label: c.component_name || c.component_code, monthly: c.monthly_amount }));
      if (earnings.length) {
        return { source: 'structure', ctcAnnual: Number(assignment.ctc_annual), structureName: assignment.structure_name || null, earnings, fixedDeductions };
      }
    }
  } catch { /* fall through to base salary */ }

  const monthly = Number(emp.base_salary) || 0;
  if (monthly <= 0) return null;
  // No salary structure: split the monthly base salary 50 / 20 / 30.
  return {
    source: 'base_salary',
    ctcAnnual: monthly * 12,
    structureName: null,
    earnings: [
      { code: 'BASIC', label: 'Basic', monthly: round2(monthly * 0.5) },
      { code: 'HRA', label: 'HRA', monthly: round2(monthly * 0.2) },
      { code: 'SPECIAL', label: 'Special Allowance', monthly: round2(monthly * 0.3) },
    ],
    fixedDeductions: [],
  };
}

async function loadMonth(month, year, employeeIds) {
  const start = ymd(year, month, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const end = ymd(year, month, lastDay);
  const idFilter = employeeIds?.length ? 'AND e.employee_id IN (?)' : '';
  const idParams = employeeIds?.length ? [employeeIds] : [];

  const employees = await query(
    `SELECT e.employee_id, e.emp_code, TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) AS name,
            e.employee_status, e.emp_joining_date, e.emp_exit_date, e.holiday_calendar, e.shift, e.base_salary,
            d.department_name, COALESCE(ds.designation_name, e.emp_job_title) AS designation,
            ws.work_days,
            b.account_number, b.ifsc_code
       FROM employees e
       LEFT JOIN departments d ON d.department_id = e.department_id
       LEFT JOIN designations ds ON ds.designation_id = e.designation_id
       LEFT JOIN employee_work_schedules ws ON ws.employee_id = e.employee_id
       LEFT JOIN employee_bank_details b ON b.employee_id = e.employee_id
      WHERE (e.employee_status = 'Active' OR (e.emp_exit_date BETWEEN ? AND ?))
        AND (e.emp_joining_date IS NULL OR e.emp_joining_date <= ?)
        ${idFilter}
      ORDER BY name`,
    [start, end, end, ...idParams]
  );
  const ids = employees.map((e) => e.employee_id);
  if (!ids.length) return { start, end, lastDay, employees, holidays: [], attendance: [], leaves: [], pendingRegs: [], inputs: [], adjustments: [] };

  const [holidays, attendance, leaves, pendingRegs, inputs, adjustments] = await Promise.all([
    query(`SELECT holiday_date, holiday_calendar, holiday_name, shift FROM holidays
            WHERE holiday_date BETWEEN ? AND ? AND COALESCE(is_restricted, 0) = 0`, [start, end]),
    query(`SELECT employee_id, attendance_date, status, late_by_minutes, work_hours
             FROM attendance WHERE attendance_date BETWEEN ? AND ? AND employee_id IN (?)`, [start, end, ids]),
    query(`SELECT lr.employee_id, lr.from_date, lr.to_date, lr.from_session, lr.to_session, lr.days, lr.status,
                  lt.leave_type_name, COALESCE(lt.is_paid, 1) AS is_paid
             FROM leave_requests lr LEFT JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
            WHERE lr.status IN ('Approved', 'Pending') AND COALESCE(lr.is_cancel_request, 0) = 0
              AND lr.from_date <= ? AND lr.to_date >= ? AND lr.employee_id IN (?)`, [end, start, ids]),
    query(`SELECT employee_id, attendance_date FROM attendance_regularization
            WHERE status = 'Pending' AND attendance_date BETWEEN ? AND ? AND employee_id IN (?)`, [start, end, ids]),
    query(`SELECT employee_id, input_type, SUM(amount) AS amount FROM payroll_inputs
            WHERE month = ? AND year = ? AND status = 'APPROVED' AND employee_id IN (?)
            GROUP BY employee_id, input_type`, [month, year, ids]),
    query(`SELECT employee_id, lop_adjustment, hold_salary, reason, updated_at FROM payroll_attendance_adjustments
            WHERE month = ? AND year = ? AND employee_id IN (?)`, [month, year, ids]),
  ]);
  return { start, end, lastDay, employees, holidays, attendance, leaves, pendingRegs, inputs, adjustments };
}

/** Per-day breakdown + totals for one employee. */
function classifyDays(emp, ctx, month, year) {
  const today = todayIST();
  const workDays = parseWorkDays(emp.work_days);
  const joining = toDateStr(emp.emp_joining_date);
  const exit = toDateStr(emp.emp_exit_date);
  const cal = emp.holiday_calendar;
  const shift = emp.shift || 'general';
  // Holidays are defined per calendar and per shift (a night shift's holiday can start the day before).
  const holidayOn = new Map(ctx.holidays
    .filter((h) => (!h.holiday_calendar || !cal || h.holiday_calendar === cal) && (!h.shift || h.shift === shift))
    .map((h) => [toDateStr(h.holiday_date), h.holiday_name]));
  const att = new Map(ctx.attendance.filter((a) => a.employee_id === emp.employee_id).map((a) => [toDateStr(a.attendance_date), a]));
  const myLeaves = ctx.leaves.filter((l) => l.employee_id === emp.employee_id)
    .map((l) => ({ ...l, from_date: toDateStr(l.from_date), to_date: toDateStr(l.to_date) }));
  const pendingReg = new Set(ctx.pendingRegs.filter((r) => r.employee_id === emp.employee_id).map((r) => toDateStr(r.attendance_date)));

  const t = { calendarDays: ctx.lastDay, monthWorkingDays: 0, employedWorkingDays: 0, present: 0, late: 0, halfDays: 0,
    paidLeave: 0, unpaidLeave: 0, absent: 0, pendingLeave: 0, pendingRegularization: 0, upcoming: 0,
    holidays: 0, weeklyOffs: 0, workedOnOffDays: 0, notEmployed: 0 };
  const days = [];

  for (let d = 1; d <= ctx.lastDay; d += 1) {
    const date = ymd(year, month, d);
    const dow = DAY_KEYS[new Date(year, month - 1, d).getDay()];
    const a = att.get(date);
    const isWorkDay = workDays.includes(dow) && !holidayOn.has(date);
    if (isWorkDay) t.monthWorkingDays += 1;

    if ((joining && date < joining) || (exit && date > exit)) {
      t.notEmployed += 1;
      days.push({ date, type: 'not_employed', lop: 0 });
      continue;
    }
    if (!isWorkDay) {
      const type = holidayOn.has(date) ? 'holiday' : 'weekly_off';
      if (type === 'holiday') t.holidays += 1; else t.weeklyOffs += 1;
      if (a && ['present', 'late', 'half_day'].includes(a.status)) t.workedOnOffDays += 1;
      days.push({ date, type, label: holidayOn.get(date) || null, worked: Boolean(a && ['present', 'late', 'half_day'].includes(a.status)), lop: 0 });
      continue;
    }

    t.employedWorkingDays += 1;
    const approved = myLeaves.find((l) => l.status === 'Approved' && date >= l.from_date && date <= l.to_date);
    const pending = myLeaves.find((l) => l.status === 'Pending' && date >= l.from_date && date <= l.to_date);
    let entry;

    if (a && (a.status === 'present' || a.status === 'late')) {
      t.present += 1;
      if (a.status === 'late' || Number(a.late_by_minutes) > 0) t.late += 1;
      entry = { type: a.status === 'late' ? 'late' : 'present', lop: 0 };
    } else if (a && a.status === 'half_day') {
      t.present += 0.5; t.halfDays += 1;
      // The other half: approved leave covers it, otherwise it is loss of pay.
      if (approved) {
        if (approved.is_paid) { t.paidLeave += 0.5; entry = { type: 'half_day', lop: 0, note: `Half day + ${approved.leave_type_name}` }; }
        else { t.unpaidLeave += 0.5; entry = { type: 'half_day', lop: 0.5, note: `Half day + ${approved.leave_type_name}` }; }
      } else {
        entry = { type: 'half_day', lop: 0.5 };
      }
    } else if (approved) {
      const v = leaveDayValue(approved, date);
      if (approved.is_paid) { t.paidLeave += v; } else { t.unpaidLeave += v; }
      // A half-day leave with no attendance for the other half is LOP for that half.
      const otherHalfLop = v < 1 && date < today ? 1 - v : 0;
      if (otherHalfLop) t.absent += otherHalfLop;
      entry = { type: approved.is_paid ? 'paid_leave' : 'unpaid_leave', label: approved.leave_type_name, lop: (approved.is_paid ? 0 : v) + otherHalfLop };
    } else if (date >= today) {
      t.upcoming += 1;
      entry = { type: 'upcoming', lop: 0 };
    } else if (pending) {
      t.pendingLeave += 1;
      entry = { type: 'pending_leave', label: pending.leave_type_name, lop: 1 };
    } else if (pendingReg.has(date)) {
      t.pendingRegularization += 1;
      entry = { type: 'pending_regularization', lop: 1 };
    } else {
      t.absent += 1;
      entry = { type: 'absent', lop: 1 };
    }
    days.push({ date, ...entry });
  }
  return { totals: t, days, workDays };
}

/** Builds the full row (attendance + salary) for one employee. */
async function buildEmployeeRow(emp, ctx, month, year) {
  const { totals: t, days, workDays } = classifyDays(emp, ctx, month, year);
  const adj = ctx.adjustments.find((a) => a.employee_id === emp.employee_id) || null;
  const inputs = Object.fromEntries(ctx.inputs.filter((i) => i.employee_id === emp.employee_id).map((i) => [i.input_type, Number(i.amount)]));

  const computedLop = round2(days.reduce((s, d) => s + (d.lop || 0), 0));
  const lopAdjustment = Number(adj?.lop_adjustment || 0);
  const lopDays = Math.min(t.employedWorkingDays, Math.max(0, round2(computedLop + lopAdjustment)));
  const paidDays = round2(t.employedWorkingDays - lopDays);
  const payFactor = t.monthWorkingDays > 0 ? paidDays / t.monthWorkingDays : 0;

  const basis = await salaryBasis(emp);
  const flags = [];
  if (!basis) flags.push({ code: 'NO_SALARY', label: 'No salary structure or base salary' });
  if (!emp.account_number || !emp.ifsc_code) flags.push({ code: 'NO_BANK', label: 'Bank account / IFSC missing' });
  if (t.pendingLeave) flags.push({ code: 'PENDING_LEAVE', label: `${t.pendingLeave} day(s) of leave awaiting approval` });
  if (t.pendingRegularization) flags.push({ code: 'PENDING_REGULARIZATION', label: `${t.pendingRegularization} regularization(s) awaiting approval` });
  if (t.absent >= 3) flags.push({ code: 'HIGH_ABSENCE', label: `${t.absent} day(s) without attendance or leave` });
  if (t.upcoming) flags.push({ code: 'MONTH_NOT_OVER', label: `${t.upcoming} working day(s) still to come — counted as paid` });
  if (adj?.hold_salary) flags.push({ code: 'ON_HOLD', label: `Salary on hold: ${adj.reason}` });
  if (emp.emp_exit_date && toDateStr(emp.emp_exit_date) <= ctx.end) flags.push({ code: 'EXITING', label: `Last working day ${toDateStr(emp.emp_exit_date)}` });
  if (emp.emp_joining_date && toDateStr(emp.emp_joining_date) >= ctx.start) flags.push({ code: 'NEW_JOINER', label: `Joined ${toDateStr(emp.emp_joining_date)}` });

  let pay = null;
  if (basis) {
    const earnings = basis.earnings.map((e) => ({ ...e, amount: Math.round(e.monthly * payFactor) }));
    if (inputs.OVERTIME) earnings.push({ code: 'OVERTIME', label: 'Overtime', monthly: 0, amount: Math.round(inputs.OVERTIME) });
    if (inputs.ARREARS) earnings.push({ code: 'ARREARS', label: 'Arrears', monthly: 0, amount: Math.round(inputs.ARREARS) });
    const gross = earnings.reduce((s, e) => s + e.amount, 0);
    const basic = earnings.find((e) => /^BASIC/i.test(e.code || '') || /^basic/i.test(e.label))?.amount || 0;
    const hra = earnings.find((e) => /HRA/i.test(e.code || '') || /house rent|hra/i.test(e.label))?.amount || 0;

    const deductions = [];
    const pf = Math.round(Math.min(basic, PF_WAGE_CAP) * 0.12);
    if (pf > 0) deductions.push({ code: 'PF', label: 'Provident Fund (12%)', amount: pf });
    const fixedGross = basis.earnings.reduce((s, e) => s + e.monthly, 0);
    if (fixedGross <= ESI_GROSS_LIMIT && gross > 0) deductions.push({ code: 'ESI', label: 'ESI (0.75%)', amount: Math.round(gross * 0.0075) });
    const pt = gross <= 15000 ? 0 : gross <= 20000 ? 150 : 200;
    if (pt) deductions.push({ code: 'PT', label: 'Professional Tax', amount: pt });
    basis.fixedDeductions.forEach((d) => deductions.push({ code: d.code, label: d.label, amount: Math.round(d.monthly) }));
    const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);

    pay = {
      source: basis.source,
      structureName: basis.structureName,
      ctcAnnual: basis.ctcAnnual,
      monthlyGross: Math.round(fixedGross),
      perDayRate: t.monthWorkingDays ? round2(fixedGross / t.monthWorkingDays) : 0,
      lopDeduction: Math.max(0, Math.round(fixedGross) - (gross - (inputs.OVERTIME || 0) - (inputs.ARREARS || 0))),
      earnings, deductions,
      basic, hra, allowances: gross - basic - hra,
      gross, totalDeductions, net: Math.max(0, gross - totalDeductions),
      overtime: inputs.OVERTIME || 0, arrears: inputs.ARREARS || 0,
    };
  }

  return {
    employee_id: emp.employee_id,
    emp_code: emp.emp_code,
    name: emp.name,
    department: emp.department_name,
    designation: emp.designation,
    joining_date: toDateStr(emp.emp_joining_date),
    exit_date: toDateStr(emp.emp_exit_date),
    work_days: workDays,
    attendance: { ...t, computedLop, lopAdjustment, lopDays, paidDays },
    adjustment: adj ? { lop_adjustment: Number(adj.lop_adjustment), hold_salary: Boolean(adj.hold_salary), reason: adj.reason, updated_at: adj.updated_at } : null,
    on_hold: Boolean(adj?.hold_salary),
    pay,
    flags,
    days,
  };
}

async function runStatus(month, year) {
  const rows = await query('SELECT payroll_run_id, status, review_status, is_locked, total_amount, processed_on FROM payroll_runs WHERE month = ? AND year = ?', [month, year]);
  return rows[0] || null;
}

async function getMonthSummary({ month, year, employeeIds = null, includeDays = true }) {
  const m = Number(month), y = Number(year);
  if (!(m >= 1 && m <= 12) || !(y >= 2000 && y <= 2100)) throw ApiError.badRequest('Valid month and year are required');
  const ctx = await loadMonth(m, y, employeeIds);
  const rows = [];
  for (const emp of ctx.employees) {
    const row = await buildEmployeeRow(emp, ctx, m, y);
    if (!includeDays) delete row.days;
    rows.push(row);
  }
  const payable = rows.filter((r) => r.pay && !r.on_hold);
  const totals = {
    employees: rows.length,
    payable: payable.length,
    onHold: rows.filter((r) => r.on_hold).length,
    withoutSalary: rows.filter((r) => !r.pay).length,
    withIssues: rows.filter((r) => r.flags.some((f) => !['MONTH_NOT_OVER', 'NEW_JOINER', 'EXITING'].includes(f.code))).length,
    lopDays: round2(rows.reduce((s, r) => s + r.attendance.lopDays, 0)),
    gross: payable.reduce((s, r) => s + r.pay.gross, 0),
    deductions: payable.reduce((s, r) => s + r.pay.totalDeductions, 0),
    net: payable.reduce((s, r) => s + r.pay.net, 0),
    lopAmount: payable.reduce((s, r) => s + r.pay.lopDeduction, 0),
  };
  return { month: m, year: y, period: { start: ctx.start, end: ctx.end }, run: await runStatus(m, y), totals, employees: rows };
}

async function saveAdjustment({ employeeId, month, year, lopAdjustment, holdSalary, reason, userId }) {
  const run = await runStatus(month, year);
  if (run?.is_locked) throw ApiError.forbidden('Payroll for this month is locked. Unlock it before changing attendance adjustments.');
  if (!Number(lopAdjustment) && !holdSalary) {
    await query('DELETE FROM payroll_attendance_adjustments WHERE employee_id = ? AND month = ? AND year = ?', [employeeId, month, year]);
    return null;
  }
  await query(
    `INSERT INTO payroll_attendance_adjustments (employee_id, month, year, lop_adjustment, hold_salary, reason, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE lop_adjustment = VALUES(lop_adjustment), hold_salary = VALUES(hold_salary),
                             reason = VALUES(reason), updated_by = VALUES(updated_by)`,
    [employeeId, month, year, Number(lopAdjustment) || 0, holdSalary ? 1 : 0, reason, userId || null]
  );
  return (await query('SELECT * FROM payroll_attendance_adjustments WHERE employee_id = ? AND month = ? AND year = ?', [employeeId, month, year]))[0];
}

/**
 * Process payroll for the month from attendance: one payslip per payable employee.
 * Held employees get an "On Hold" payslip; employees without salary are skipped.
 */
async function processPayroll({ month, year, processedBy }) {
  const run = await runStatus(month, year);
  if (run?.is_locked) throw ApiError.forbidden('Payroll for this month is locked. Unlock it to re-process.');
  if (run?.review_status === 'APPROVED') throw ApiError.conflict('Payroll for this month is already approved.');

  const summary = await getMonthSummary({ month, year });
  const toPay = summary.employees.filter((r) => r.pay);
  const skipped = summary.employees.filter((r) => !r.pay).map((r) => ({ employee_id: r.employee_id, name: r.name, reason: 'No salary structure or base salary' }));

  const runId = await withTransaction(async (conn) => {
    await conn.query(
      `INSERT INTO payroll_runs (month, year, status, processed_by, processed_on, review_status)
       VALUES (?, ?, 'Processing', ?, NOW(), 'DRAFT')
       ON DUPLICATE KEY UPDATE status = 'Processing', processed_by = VALUES(processed_by), processed_on = NOW(),
         review_status = IF(review_status = 'REJECTED', 'DRAFT', review_status)`,
      [month, year, processedBy || null]
    );
    const [[runRow]] = await conn.query('SELECT payroll_run_id FROM payroll_runs WHERE month = ? AND year = ?', [month, year]);
    const id = runRow.payroll_run_id;

    for (const r of toPay) {
      const a = r.attendance;
      const breakdown = {
        engine: 'attendance-v1',
        earnings: r.pay.earnings.map(({ code, label, amount, monthly }) => ({ code, label, amount, full_month: monthly })),
        deductions: r.pay.deductions,
        attendance: {
          month_working_days: a.monthWorkingDays, employed_working_days: a.employedWorkingDays, present: a.present,
          late: a.late, half_days: a.halfDays, paid_leave: a.paidLeave, unpaid_leave: a.unpaidLeave, absent: a.absent,
          pending_leave: a.pendingLeave, pending_regularization: a.pendingRegularization, holidays: a.holidays,
          weekly_offs: a.weeklyOffs, computed_lop: a.computedLop, lop_adjustment: a.lopAdjustment,
          lop_days: a.lopDays, paid_days: a.paidDays,
        },
        adjustment_reason: r.adjustment?.reason || null,
        monthly_gross: r.pay.monthlyGross, lop_deduction: r.pay.lopDeduction, per_day_rate: r.pay.perDayRate,
        salary_source: r.pay.source, structure: r.pay.structureName,
      };
      await conn.query(
        `INSERT INTO payslips (payroll_run_id, employee_id, month, year, basic, hra, allowances, gross_earnings, ctc,
                               deductions, net_pay, working_days, paid_days, lop_days, status, breakdown_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE payroll_run_id = VALUES(payroll_run_id), basic = VALUES(basic), hra = VALUES(hra),
           allowances = VALUES(allowances), gross_earnings = VALUES(gross_earnings), ctc = VALUES(ctc),
           deductions = VALUES(deductions), net_pay = VALUES(net_pay), working_days = VALUES(working_days),
           paid_days = VALUES(paid_days), lop_days = VALUES(lop_days),
           status = IF(status = 'Paid', 'Paid', VALUES(status)), breakdown_json = VALUES(breakdown_json), generated_on = NOW()`,
        [id, r.employee_id, month, year, r.pay.basic, r.pay.hra, r.pay.allowances, r.pay.gross, r.pay.ctcAnnual,
          r.pay.totalDeductions, r.pay.net, a.monthWorkingDays, a.paidDays, a.lopDays,
          r.on_hold ? 'On Hold' : 'Generated', JSON.stringify(breakdown)]
      );
    }

    if (toPay.length) {
      await conn.query(
        `UPDATE payroll_inputs SET status = 'CONSUMED'
          WHERE month = ? AND year = ? AND status = 'APPROVED' AND employee_id IN (?)`,
        [month, year, toPay.map((r) => r.employee_id)]
      );
    }
    await conn.query(
      `UPDATE payroll_runs SET status = 'Completed',
         total_amount = (SELECT COALESCE(SUM(net_pay), 0) FROM payslips WHERE payroll_run_id = ? AND status <> 'On Hold')
       WHERE payroll_run_id = ?`,
      [id, id]
    );
    return id;
  });

  return {
    payroll_run_id: runId,
    processed: toPay.filter((r) => !r.on_hold).length,
    on_hold: toPay.filter((r) => r.on_hold).length,
    skipped,
    totals: summary.totals,
  };
}

module.exports = { getMonthSummary, saveAdjustment, processPayroll, parseWorkDays, DEFAULT_WORK_DAYS };
