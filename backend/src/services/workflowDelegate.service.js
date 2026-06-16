const BaseService = require('./base.service');
const { query } = require('../config/db');

const LIST_SELECT = `
  SELECT wd.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
         CONCAT(d.first_name, ' ', IFNULL(d.last_name, '')) AS delegate_name
    FROM workflow_delegates wd
    JOIN employees e ON e.employee_id = wd.employee_id
    JOIN employees d ON d.employee_id = wd.delegate_employee_id
`;

class WorkflowDelegateService extends BaseService {
  constructor() {
    super('workflow_delegates', 'id', [
      'employee_id', 'delegate_employee_id', 'module', 'from_date', 'to_date', 'status',
    ]);
  }

  async list({ employee_id, status, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (employee_id) {
      where.push('(wd.employee_id = ? OR wd.delegate_employee_id = ?)');
      params.push(employee_id, employee_id);
    }
    if (status) {
      where.push('wd.status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY wd.created_at DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM workflow_delegates wd ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE wd.id = ?`, [id]);
    return rows[0] || null;
  }

  async cancel(id) {
    await query("UPDATE workflow_delegates SET status = 'Cancelled' WHERE id = ?", [id]);
    return this.getDetails(id);
  }
}

module.exports = new WorkflowDelegateService();
