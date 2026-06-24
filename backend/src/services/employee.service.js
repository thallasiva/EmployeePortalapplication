const BaseService = require('./base.service');
const { query, callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

const FILLABLE = [
  'emp_code', 'first_name', 'last_name', 'email', 'mobile', 'gender', 'dob',
  'marital_status', 'blood_group', 'profile_photo', 'reporting_to', 'emp_job_title',
  'department_id', 'designation_id', 'leadership_role_id', 'office_id', 'team_id',
  'employee_type', 'employee_status', 'shift', 'location', 'holiday_calendar',
  'emp_joining_date', 'emp_exit_date', 'ctc', 'base_salary', 'benefits_plan', 'assigned_member',
  'father_name', 'spouse_name', 'aadhaar_number', 'aadhaar_name', 'aadhaar_enrolment_number',
  'access_card_number', 'access_card_from_date', 'access_card_to_date',
  'pf_number', 'pf_join_date', 'esi_number', 'has_left_organization',
  // Extended fields (migration_009)
  'biometric_id', 'actual_dob', 'pan_number', 'project_cost_centre',
  'contract_end_date', 'date_of_confirmation', 'educational_qualification',
  'total_exp_before_joining', 'previous_employer', 'bgv_status', 'previous_designation',
];

const LIST_SELECT = `
  SELECT e.*, d.department_name, ds.designation_name,
         CONCAT(m.first_name, ' ', IFNULL(m.last_name, '')) AS reporting_to_name,
         m.emp_code AS reporting_to_code,
         ci.current_address, ci.permanent_address, ci.personal_email, ci.alternate_mobile,
         ci.emergency_contact_name, ci.emergency_contact_relation, ci.emergency_contact_phone,
         ci.contact_name, ci.contact_city, ci.contact_country,
         ci.permanent_address_line1, ci.permanent_address_line2, ci.permanent_address_line3,
         bd.bank_name, bd.account_number, bd.ifsc_code, bd.pan_number, bd.uan_number,
         bd.account_type, bd.bank_branch, bd.dd_payable_at, bd.account_holder_name, bd.payment_type,
         EXISTS(
           SELECT 1 FROM resignations r
           WHERE r.employee_id = e.employee_id
             AND r.status IN ('pending','rm_approved','accepted')
         ) AS serving_notice
    FROM employees e
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN designations ds ON ds.designation_id = e.designation_id
    LEFT JOIN employees m ON m.employee_id = e.reporting_to
    LEFT JOIN employee_contact_info ci ON ci.employee_id = e.employee_id
    LEFT JOIN employee_bank_details bd ON bd.employee_id = e.employee_id
`;

class EmployeeService extends BaseService {
  constructor() {
    super('employees', 'employee_id', FILLABLE);
  }

  /** Returns all active employees with just the fields needed to build the org hierarchy. */
  async orgChart() {
    const rows = await query(
      `SELECT e.employee_id, e.first_name, e.last_name, e.emp_code, e.emp_job_title,
              e.reporting_to, e.profile_photo,
              d.department_name, d.department_id,
              des.designation_name
         FROM employees e
         LEFT JOIN departments d  ON d.department_id  = e.department_id
         LEFT JOIN designations des ON des.designation_id = e.designation_id
        WHERE e.employee_status = 'Active' AND e.has_left_organization = 0
        ORDER BY e.employee_id ASC`
    );
    return rows;
  }

  async list({ department, status, search, reporting_to, limit, offset } = {}) {
    const conditions = [];
    const params = [];

    if (reporting_to) {
      conditions.push('e.reporting_to = ?');
      params.push(reporting_to);
    }
    if (department) {
      conditions.push('e.department_id = ?');
      params.push(department);
    }
    if (status) {
      conditions.push('e.employee_status = ?');
      params.push(status);
    }
    if (search) {
      conditions.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.emp_code LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${where} ORDER BY e.employee_id DESC`;

    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(`SELECT COUNT(*) AS total FROM employees e ${where}`, params.slice(0, conditions.length ? params.length - (limit !== undefined ? 2 : 0) : 0));
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getProfile(employeeId) {
    const rows = await query(`${LIST_SELECT} WHERE e.employee_id = ?`, [employeeId]);
    if (!rows.length) return null;

    const [contact, bank] = await Promise.all([
      query('SELECT * FROM employee_contact_info WHERE employee_id = ?', [employeeId]),
      query('SELECT * FROM employee_bank_details WHERE employee_id = ?', [employeeId]),
    ]);

    return {
      ...rows[0],
      contactInfo: contact[0] || null,
      bankDetails: bank[0] || null,
    };
  }

  /**
   * Creates an employee (and optionally a linked login) using the
   * sp_create_employee stored procedure inside a single transaction.
   */
  async createWithProcedure(data) {
    const results = await callProcedure(
      'sp_create_employee(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @employee_id)',
      [
        data.emp_code || null,
        data.first_name,
        data.last_name || null,
        data.email,
        data.mobile || null,
        data.emp_job_title || null,
        data.department_id || null,
        data.designation_id || null,
        data.reporting_to || null,
        data.employee_type || 'Full-Time',
        data.emp_joining_date || null,
        data.ctc || null,
        data.base_salary || null,
        data.role_id || 2,
        data.password_hash || null,
      ]
    );

    const out = await query('SELECT @employee_id AS employee_id');
    const employeeId = out[0].employee_id;
    return this.getProfile(employeeId);
  }

  async upsertContactInfo(employeeId, data) {
    const exists = await this.existsById(employeeId);
    if (!exists) throw ApiError.notFound('Employee not found');

    const fields = [
      'current_address', 'permanent_address', 'personal_email', 'alternate_mobile',
      'emergency_contact_name', 'emergency_contact_relation', 'emergency_contact_phone',
      'contact_name', 'contact_city', 'contact_country',
      'permanent_address_line1', 'permanent_address_line2', 'permanent_address_line3',
    ];
    const payload = {};
    for (const f of fields) if (data[f] !== undefined) payload[f] = data[f];

    const columns = Object.keys(payload);
    if (!columns.length) return query('SELECT * FROM employee_contact_info WHERE employee_id = ?', [employeeId]).then((r) => r[0] || null);

    const insertCols = ['employee_id', ...columns];
    const placeholders = insertCols.map(() => '?').join(', ');
    const updateClause = columns.map((c) => `${c} = VALUES(${c})`).join(', ');
    const values = [employeeId, ...columns.map((c) => payload[c])];

    await query(
      `INSERT INTO employee_contact_info (${insertCols.join(', ')}) VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE ${updateClause}`,
      values
    );

    const rows = await query('SELECT * FROM employee_contact_info WHERE employee_id = ?', [employeeId]);
    return rows[0];
  }

  async upsertBankDetails(employeeId, data) {
    const exists = await this.existsById(employeeId);
    if (!exists) throw ApiError.notFound('Employee not found');

    const fields = [
      'bank_name', 'account_number', 'ifsc_code', 'pan_number', 'uan_number',
      'account_type', 'bank_branch', 'dd_payable_at', 'account_holder_name', 'payment_type',
    ];
    const payload = {};
    for (const f of fields) if (data[f] !== undefined) payload[f] = data[f];

    const columns = Object.keys(payload);
    if (!columns.length) return query('SELECT * FROM employee_bank_details WHERE employee_id = ?', [employeeId]).then((r) => r[0] || null);

    const insertCols = ['employee_id', ...columns];
    const placeholders = insertCols.map(() => '?').join(', ');
    const updateClause = columns.map((c) => `${c} = VALUES(${c})`).join(', ');
    const values = [employeeId, ...columns.map((c) => payload[c])];

    await query(
      `INSERT INTO employee_bank_details (${insertCols.join(', ')}) VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE ${updateClause}`,
      values
    );

    const rows = await query('SELECT * FROM employee_bank_details WHERE employee_id = ?', [employeeId]);
    return rows[0];
  }

  /**
   * Returns the team context for the logged-in employee:
   *  - their manager's record
   *  - all active teammates (employees under the same manager)
   */
  async myTeam(employeeId) {
    // Get self to find reporting_to
    const selfRows = await query(
      `${LIST_SELECT} WHERE e.employee_id = ?`,
      [employeeId]
    );
    const self = selfRows[0] || null;
    const managerId = self ? self.reporting_to : null;

    if (!managerId) {
      // Employee has no manager — show just themselves
      return { manager: null, teammates: self ? [self] : [], currentEmployeeId: employeeId };
    }

    // Get manager record
    const managerRows = await query(
      `${LIST_SELECT} WHERE e.employee_id = ?`,
      [managerId]
    );
    const manager = managerRows[0] || null;

    // Get all active teammates (report to same manager)
    const teammates = await query(
      `${LIST_SELECT} WHERE e.reporting_to = ? AND e.employee_status = 'Active' ORDER BY e.first_name`,
      [managerId]
    );

    return { manager, teammates, currentEmployeeId: employeeId };
  }

  async directory({ location, department, holidayCalendar } = {}) {
    const conditions = ["e.employee_status = 'Active'"];
    const params = [];

    if (department && department !== 'all') {
      conditions.push('e.department_id = ?');
      params.push(department);
    }
    if (location && location !== 'all') {
      conditions.push('e.location = ?');
      params.push(location);
    }
    if (holidayCalendar && holidayCalendar !== 'all') {
      conditions.push('e.holiday_calendar = ?');
      params.push(holidayCalendar);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    return query(`${LIST_SELECT} ${where} ORDER BY e.first_name`, params);
  }
}

module.exports = new EmployeeService();
