const BaseService = require('./base.service');
const { callProcedure, readOuts } = require('../config/db');
const ApiError = require('../utils/ApiError');
const notify   = require('./mailNotify.service');

const FILLABLE = [
  'emp_code', 'first_name', 'last_name', 'email', 'mobile', 'gender', 'dob',
  'marital_status', 'blood_group', 'profile_photo', 'reporting_to', 'emp_job_title',
  'department_id', 'designation_id', 'leadership_role_id', 'office_id', 'team_id',
  'employee_type', 'employee_status', 'shift', 'location', 'holiday_calendar',
  'emp_joining_date', 'emp_exit_date', 'ctc', 'base_salary', 'benefits_plan', 'assigned_member',
  'father_name', 'spouse_name', 'aadhaar_number', 'aadhaar_name', 'aadhaar_enrolment_number',
  'access_card_number', 'access_card_from_date', 'access_card_to_date',
  'pf_number', 'pf_join_date', 'esi_number', 'has_left_organization',
  'biometric_id', 'actual_dob', 'pan_number', 'project_cost_centre',
  'contract_end_date', 'date_of_confirmation', 'educational_qualification',
  'total_exp_before_joining', 'previous_employer', 'bgv_status', 'previous_designation',
];

class EmployeeService extends BaseService {
  constructor() {
    super('employees', 'employee_id', FILLABLE);
  }

  async orgChart() {
    const results = await callProcedure('sp_get_org_chart()');
    return results[0] ?? results;
  }

  async list({ department, status, search, reporting_to, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_employees(?, ?, ?, ?, ?, ?)',
      [
        department   ?? null,
        status       ?? null,
        search       ?? null,
        reporting_to ?? null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    const rows  = results[0] ?? [];
    const count = results[1] ?? [];
    return { rows, total: count[0]?.total ?? 0 };
  }

  async getProfile(employeeId) {
    const results = await callProcedure('sp_get_employee_profile(?)', [employeeId]);
    const rows        = results[0] ?? [];
    const contactRows = results[1] ?? [];
    const bankRows    = results[2] ?? [];
    if (!rows.length) return null;
    return { ...rows[0], contactInfo: contactRows[0] ?? null, bankDetails: bankRows[0] ?? null };
  }

  async createWithProcedure(data) {
    await callProcedure(
      'sp_create_employee(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @employee_id)',
      [
        data.emp_code         ?? null,
        data.first_name,
        data.last_name        ?? null,
        data.email,
        data.mobile           ?? null,
        data.emp_job_title    ?? null,
        data.department_id    ?? null,
        data.designation_id   ?? null,
        data.reporting_to     ?? null,
        data.employee_type    ?? 'Full-Time',
        data.emp_joining_date ?? null,
        data.ctc              ?? null,
        data.base_salary      ?? null,
        data.role_id          ?? 2,
        data.password_hash    ?? null,
      ]
    );
    const out = await readOuts('employee_id');
    const profile = await this.getProfile(out[0].employee_id);

    if (profile && data.email) {
      notify.employeeCreated({
        name:        (data.first_name + ' ' + (data.last_name || '')).trim(),
        email:       data.email,
        empCode:     profile.emp_code      || '',
        role:        profile.role_name     || data.emp_job_title || 'Employee',
        department:  profile.department    || '',
        joiningDate: data.emp_joining_date || null,
      });
      if (data.temp_password) {
        notify.employeeInvite({
          name:         (data.first_name + ' ' + (data.last_name || '')).trim(),
          email:        data.email,
          tempPassword: data.temp_password,
          role:         profile.role_name  || data.emp_job_title || 'Employee',
          department:   profile.department || '',
        });
      }
    }
    return profile;
  }

  async upsertContactInfo(employeeId, data) {
    const exists = await this.existsById(employeeId);
    if (!exists) throw ApiError.notFound('Employee not found');

    const results = await callProcedure(
      'sp_upsert_contact_info(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        employeeId,
        data.current_address            ?? null,
        data.permanent_address          ?? null,
        data.personal_email             ?? null,
        data.alternate_mobile           ?? null,
        data.emergency_contact_name     ?? null,
        data.emergency_contact_relation ?? null,
        data.emergency_contact_phone    ?? null,
        data.contact_name               ?? null,
        data.contact_city               ?? null,
        data.contact_country            ?? null,
        data.permanent_address_line1    ?? null,
        data.permanent_address_line2    ?? null,
        data.permanent_address_line3    ?? null,
      ]
    );
    return (results[0] ?? results)[0] ?? null;
  }

  async upsertBankDetails(employeeId, data) {
    const exists = await this.existsById(employeeId);
    if (!exists) throw ApiError.notFound('Employee not found');

    const results = await callProcedure(
      'sp_upsert_bank_details(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        employeeId,
        data.bank_name           ?? null,
        data.account_number      ?? null,
        data.ifsc_code           ?? null,
        data.pan_number          ?? null,
        data.uan_number          ?? null,
        data.account_type        ?? null,
        data.bank_branch         ?? null,
        data.dd_payable_at       ?? null,
        data.account_holder_name ?? null,
        data.payment_type        ?? null,
      ]
    );
    return (results[0] ?? results)[0] ?? null;
  }

  async myTeam(employeeId) {
    const selfResults = await callProcedure('sp_get_employee_team(?)', [employeeId]);
    const self = (selfResults[0] ?? selfResults)[0] ?? null;
    const managerId = self?.reporting_to ?? null;

    if (!managerId) {
      return { manager: null, teammates: self ? [self] : [], currentEmployeeId: employeeId };
    }

    const [managerResults, teammateResults] = await Promise.all([
      callProcedure('sp_get_employee_profile(?)', [managerId]),
      callProcedure('sp_list_employees(?, ?, ?, ?, ?, ?)', [null, 'Active', null, managerId, null, null]),
    ]);

    return {
      manager:           (managerResults[0] ?? [])[0] ?? null,
      teammates:         teammateResults[0] ?? [],
      currentEmployeeId: employeeId,
    };
  }

  async directory({ location, department, holidayCalendar } = {}) {
    const results = await callProcedure(
      'sp_get_employee_directory(?, ?, ?)',
      [
        location        && location        !== 'all' ? location            : null,
        department      && department      !== 'all' ? Number(department)  : null,
        holidayCalendar && holidayCalendar !== 'all' ? holidayCalendar     : null,
      ]
    );
    return results[0] ?? results;
  }

  async changeRole(employeeId, roleId) {
    const { query } = require('../config/db');
    const rows = await query('SELECT user_id FROM users WHERE employee_id = ? LIMIT 1', [employeeId]);
    if (!rows || !rows.length) throw ApiError.notFound('No user account linked to this employee');
    await query('UPDATE users SET role_id = ? WHERE employee_id = ?', [roleId, employeeId]);
    return true;
  }

  async listRoles() {
    const { query } = require('../config/db');
    const rows = await query('SELECT role_id, role_name, description FROM roles ORDER BY role_id');
    return rows;
  }

  async listEmployeesWithRoles() {
    const { query } = require('../config/db');
    const rows = await query(`
      SELECT
        e.employee_id, e.emp_code, e.first_name, e.last_name, e.email,
        e.emp_job_title, ds.designation_name,
        u.role_id, r.role_name
      FROM employees e
      LEFT JOIN users u         ON u.employee_id  = e.employee_id
      LEFT JOIN roles r         ON r.role_id       = u.role_id
      LEFT JOIN designations ds ON ds.designation_id = e.designation_id
      WHERE e.employee_status = 'Active'
      ORDER BY e.first_name, e.last_name
    `);
    return rows;
  }
}

module.exports = new EmployeeService();
