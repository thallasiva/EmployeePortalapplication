const BaseService = require('./base.service');
const { callProcedure, query } = require('../config/db');
const ApiError = require('../utils/ApiError');
class RequestHubService extends BaseService {
  constructor() {
    super('request_hub', 'request_id', [
      'employee_id', 'request_type', 'title', 'description', 'status', 'reviewed_by',
    ]);
  }
  async list({ employee_id, status, request_type, limit, offset, companyId } = {}) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    const conditions = ['e.company_id = ?'];
    const params = [company];
    if (employee_id != null) {
      conditions.push('rh.employee_id = ?');
      params.push(employee_id);
    }
    if (status != null) {
      conditions.push('rh.status = ?');
      params.push(status);
    }
    if (request_type != null) {
      conditions.push('rh.request_type = ?');
      params.push(request_type);
    }
    const where = conditions.join(' AND ');
    const [rows, countRows] = await Promise.all([
      query(
        `SELECT rh.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
                e.emp_code, CONCAT(rv.first_name, ' ', IFNULL(rv.last_name, '')) AS reviewer_name
           FROM request_hub rh
           JOIN employees e ON e.employee_id = rh.employee_id
           LEFT JOIN employees rv ON rv.employee_id = rh.reviewed_by
          WHERE ${where}
          ORDER BY rh.created_at DESC
          ${limit != null ? 'LIMIT ? OFFSET ?' : ''}`,
        limit != null ? [...params, Number(limit), Number(offset || 0)] : params
      ),
      query(
        `SELECT COUNT(*) AS total
           FROM request_hub rh
           JOIN employees e ON e.employee_id = rh.employee_id
          WHERE ${where}`,
        params
      )
    ]);
    return { rows, total: countRows[0]?.total ?? 0 };
  }
  async getDetails(id) {
    const results = await callProcedure('sp_get_request_hub(?)', [id]);
    return (results[0] ?? [])[0] ?? null;
  }
  async updateStatus(id, status, reviewedBy, companyId) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    const existing = await this.getDetails(id);
    if (!existing) throw ApiError.notFound('Request not found');
    const employeeRows = await query(
      'SELECT 1 FROM employees WHERE employee_id = ? AND company_id = ? LIMIT 1',
      [existing.employee_id, company]
    );
    if (!employeeRows.length) throw ApiError.notFound('Request not found');
    const reviewerRows = await query(
      'SELECT 1 FROM employees WHERE employee_id = ? AND company_id = ? LIMIT 1',
      [reviewedBy, company]
    );
    if (!reviewerRows.length) throw ApiError.forbidden('You can only act for your company');
    await callProcedure('sp_update_request_hub_status(?, ?, ?)', [id, status, reviewedBy || null]);
    return this.getDetails(id);
  }
}
module.exports = new RequestHubService();
