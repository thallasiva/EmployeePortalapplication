const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');

class WorkflowDelegateService extends BaseService {
  constructor() {
    super('workflow_delegates', 'id', [
      'employee_id', 'delegate_employee_id', 'module', 'from_date', 'to_date', 'status',
    ]);
  }

  async list({ employee_id, status, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_workflow_delegates(?, ?, ?, ?)',
      [
        employee_id ?? null,
        status      ?? null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getDetails(id) {
    const results = await callProcedure('sp_get_workflow_delegate(?)', [id]);
    return (results[0] ?? [])[0] ?? null;
  }

  async cancel(id) {
    await callProcedure('sp_cancel_workflow_delegate(?)', [id]);
    return this.getDetails(id);
  }
}

module.exports = new WorkflowDelegateService();
