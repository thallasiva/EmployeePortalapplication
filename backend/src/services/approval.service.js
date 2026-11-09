'use strict';
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listPending({ companyId, employeeId, roleName }) {
  const company = Number(companyId);
  if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
  if (!['Admin', 'HR Manager', 'Reporting Manager'].includes(roleName)) {
    throw ApiError.forbidden('You do not have permission to view approvals');
  }
  const managerScoped = roleName === 'Reporting Manager';
  const employeeFilter = managerScoped ? 'AND e.reporting_to = ?' : '';
  const params = managerScoped ? [company, employeeId] : [company];
  const selectEmployee = `CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name, e.emp_code`;
  const baseJoin = `JOIN employees e ON e.employee_id = x.employee_id`;
  const [leaves, regularizations, resignations, timesheets, appraisals, moduleRows] = await Promise.all([
    query(
      `SELECT x.leave_request_id AS request_id, 'Leave' AS type, ${selectEmployee},
              lt.leave_type_name AS title, x.applied_on AS submitted_at,
              'leave' AS module
         FROM leave_requests x
         ${baseJoin}
         JOIN leave_types lt ON lt.leave_type_id = x.leave_type_id
        WHERE e.company_id = ? AND x.status = 'Pending' ${employeeFilter}`,
      params
    ),
    query(
      `SELECT x.regularization_id AS request_id, 'Attendance' AS type, ${selectEmployee},
              DATE_FORMAT(x.attendance_date, '%Y-%m-%d') AS title, x.created_at AS submitted_at,
              'attendance' AS module
         FROM attendance_regularization x
         ${baseJoin}
        WHERE e.company_id = ? AND x.status = 'Pending' ${employeeFilter}`,
      params
    ),
    query(
      `SELECT x.resignation_id AS request_id, 'Resignation' AS type, ${selectEmployee},
              DATE_FORMAT(x.end_date, '%Y-%m-%d') AS title, x.created_at AS submitted_at,
              'resignation' AS module
         FROM resignations x
         ${baseJoin}
        WHERE e.company_id = ? AND x.status = 'pending' ${employeeFilter}`,
      params
    ),
    query(
      `SELECT x.timesheet_id AS request_id, 'Timesheet' AS type, ${selectEmployee},
              CONCAT(DATE_FORMAT(x.week_start, '%Y-%m-%d'), ' to ', DATE_FORMAT(x.week_end, '%Y-%m-%d')) AS title,
              x.submitted_at, 'timesheets' AS module
         FROM weekly_timesheets x
         ${baseJoin}
        WHERE e.company_id = ? AND x.status = 'pending' ${employeeFilter}`,
      params
    ),
    query(
      `SELECT x.appraisal_id AS request_id, 'Appraisal' AS type, ${selectEmployee},
              ac.fy_label AS title, x.updated_at AS submitted_at,
              'appraisal' AS module
         FROM self_appraisals x
         ${baseJoin}
         JOIN appraisal_cycles ac ON ac.cycle_id = x.cycle_id
        WHERE e.company_id = ? AND x.status IN ('manager_review', 'hr_review')
          ${managerScoped ? "AND x.status = 'manager_review'" : ''} ${employeeFilter}`,
      params
    ),
    query('SELECT module_key, enabled FROM company_modules WHERE company_id = ?', [company]),
  ]);
  const routes = {
    Admin: {
      leave: '/dashboard/leave?tab=requests',
      attendance: '/dashboard/attendance',
      resignation: '/dashboard/resignations',
      timesheets: '/dashboard/timesheets',
      appraisal: '/dashboard/performance',
    },
    'HR Manager': {
      leave: '/dashboard/leave?tab=requests',
      attendance: '/dashboard/attendance',
      resignation: '/dashboard/resignations',
      timesheets: '/dashboard/timesheets',
      appraisal: '/dashboard/performance',
    },
    'Reporting Manager': {
      leave: '/manager/team/leave',
      attendance: '/manager/team/regularizations',
      resignation: '/manager/team/resignations',
      timesheets: '/manager/timesheets',
      appraisal: '/manager/team/performance',
    },
  }[roleName];
  const disabled = new Set(moduleRows.filter((module) => Number(module.enabled) !== 1).map((module) => module.module_key));
  const moduleForApproval = { Leave: 'leave', Attendance: 'attendance', Resignation: 'employees', Timesheet: 'timesheets', Appraisal: 'performance' };
  return [...leaves, ...regularizations, ...resignations, ...timesheets, ...appraisals]
    .filter((item) => !disabled.has(moduleForApproval[item.type]))
    .map((item) => ({ ...item, review_path: routes[item.module] }))
    .sort((a, b) => String(b.submitted_at || '').localeCompare(String(a.submitted_at || '')));
}

module.exports = { listPending };
