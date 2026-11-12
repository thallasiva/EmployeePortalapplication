'use strict';
const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');

class PayrollPayGroupService {
  _company(companyId) {
    const id = Number(companyId);
    if (!Number.isInteger(id) || id <= 0) throw ApiError.forbidden('Company context is required');
    return id;
  }
  async list(companyId) {
    const company = this._company(companyId);
    return query(`SELECT g.*, COUNT(DISTINCT CASE WHEN a.effective_from<=CURRENT_DATE AND (a.effective_to IS NULL OR a.effective_to>=CURRENT_DATE) THEN a.employee_id END) AS employee_count
      FROM payroll_pay_groups g LEFT JOIN employee_pay_group_assignments a ON a.pay_group_id=g.pay_group_id AND a.company_id=g.company_id
      WHERE g.company_id=? GROUP BY g.pay_group_id ORDER BY g.is_active DESC, g.group_name`, [company]);
  }
  async listAssignments(companyId, asOf = null) {
    const company = this._company(companyId);
    const sql = `SELECT a.employee_pay_group_assignment_id,a.employee_id,a.pay_group_id,a.effective_from,a.effective_to,
          e.emp_code,TRIM(CONCAT_WS(' ',e.first_name,e.last_name)) employee_name,g.group_name
        FROM employee_pay_group_assignments a
        JOIN employees e ON e.employee_id=a.employee_id AND e.company_id=a.company_id
        JOIN payroll_pay_groups g ON g.pay_group_id=a.pay_group_id AND g.company_id=a.company_id
       WHERE a.company_id=? ${asOf ? 'AND a.effective_from<=? AND (a.effective_to IS NULL OR a.effective_to>=?)' : ''}
       ORDER BY employee_name,a.effective_from DESC`;
    return query(sql, asOf ? [company, asOf, asOf] : [company]);
  }
  async assignEmployee(companyId, userId, { employee_id, pay_group_id, effective_from }) {
    const company = this._company(companyId);
    await withTransaction(async (conn) => {
      const [[employee]] = await conn.query('SELECT employee_id FROM employees WHERE employee_id=? AND company_id=? FOR UPDATE', [employee_id, company]);
      const [[group]] = await conn.query('SELECT pay_group_id FROM payroll_pay_groups WHERE pay_group_id=? AND company_id=? AND is_active=1 FOR UPDATE', [pay_group_id, company]);
      if (!employee || !group) throw ApiError.badRequest('Select an active employee and pay group from this company');
      const [[next]] = await conn.query(`SELECT effective_from FROM employee_pay_group_assignments
        WHERE company_id=? AND employee_id=? AND effective_from>? ORDER BY effective_from LIMIT 1 FOR UPDATE`, [company, employee_id, effective_from]);
      const endDate = next ? new Date(new Date(`${next.effective_from}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10) : null;
      await conn.query(`UPDATE employee_pay_group_assignments SET effective_to=DATE_SUB(?,INTERVAL 1 DAY)
        WHERE company_id=? AND employee_id=? AND effective_from<? AND (effective_to IS NULL OR effective_to>=?)`, [effective_from, company, employee_id, effective_from, effective_from]);
      await conn.query(`INSERT INTO employee_pay_group_assignments
        (company_id,employee_id,pay_group_id,effective_from,effective_to,assigned_by) VALUES (?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE pay_group_id=VALUES(pay_group_id),effective_to=VALUES(effective_to),assigned_by=VALUES(assigned_by)`,
      [company, employee_id, pay_group_id, effective_from, endDate, userId || null]);
    });
    return (await this.listAssignments(company, effective_from)).find((row) => Number(row.employee_id) === Number(employee_id));
  }
  async create(companyId, userId, payload) {
    const company = this._company(companyId);
    try {
      const result = await query(
        `INSERT INTO payroll_pay_groups (company_id,group_name,payroll_frequency,currency_code,cutoff_day,salary_payment_day,created_by)
         VALUES (?,?,?,?,?,?,?)`,
        [company, payload.group_name.trim(), payload.payroll_frequency, payload.currency_code.toUpperCase(), payload.cutoff_day, payload.salary_payment_day, userId || null]
      );
      return (await query('SELECT * FROM payroll_pay_groups WHERE pay_group_id=? AND company_id=?', [result.insertId, company]))[0];
    } catch (error) {
      if (error?.code === 'ER_DUP_ENTRY') throw ApiError.conflict('A pay group with this name already exists');
      throw error;
    }
  }
  async update(companyId, id, payload) {
    const company = this._company(companyId);
    const result = await query(
      `UPDATE payroll_pay_groups SET group_name=?, payroll_frequency=?, currency_code=?, cutoff_day=?, salary_payment_day=?
        WHERE pay_group_id=? AND company_id=?`,
      [payload.group_name.trim(), payload.payroll_frequency, payload.currency_code.toUpperCase(), payload.cutoff_day, payload.salary_payment_day, id, company]
    );
    const [row] = await query('SELECT * FROM payroll_pay_groups WHERE pay_group_id=? AND company_id=? LIMIT 1', [id, company]);
    if (!row) throw ApiError.notFound('Payroll pay group not found');
    if (!result.affectedRows && row.group_name !== payload.group_name.trim()) throw ApiError.conflict('Pay group was not updated');
    return row;
  }
  async deactivate(companyId, id) {
    const company = this._company(companyId);
    const result = await query('UPDATE payroll_pay_groups SET is_active=0 WHERE pay_group_id=? AND company_id=?', [id, company]);
    if (!result.affectedRows) throw ApiError.notFound('Payroll pay group not found');
  }
}

module.exports = new PayrollPayGroupService();
