const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');

class DocumentService extends BaseService {
  constructor() {
    super('documents', 'document_id', [
      'title', 'description', 'category_id', 'file_type', 'file_size',
      'file_url', 'visibility', 'employee_id', 'uploaded_by',
    ]);
  }

  async list({ employee_id, category_id, visibility, search, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_documents(?, ?, ?, ?, ?, ?)',
      [
        employee_id  ?? null,
        category_id  ?? null,
        visibility   ?? null,
        search       ? `%${search}%` : null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getDetails(id) {
    const results = await callProcedure('sp_get_document(?)', [id]);
    return (results[0] ?? [])[0] ?? null;
  }
}

module.exports = new DocumentService();
