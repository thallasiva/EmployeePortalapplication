const BaseService = require('./base.service');
const { query } = require('../config/db');

const LIST_SELECT = `
  SELECT d.*, dc.category_name,
         CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
         CONCAT(u.first_name, ' ', IFNULL(u.last_name, '')) AS uploaded_by_name
    FROM documents d
    LEFT JOIN document_categories dc ON dc.category_id = d.category_id
    LEFT JOIN employees e ON e.employee_id = d.employee_id
    LEFT JOIN employees u ON u.employee_id = d.uploaded_by
`;

class DocumentService extends BaseService {
  constructor() {
    super('documents', 'document_id', [
      'title', 'description', 'category_id', 'file_type', 'file_size',
      'file_url', 'visibility', 'employee_id', 'uploaded_by',
    ]);
  }

  async list({ employee_id, category_id, visibility, search, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (employee_id) {
      where.push('(d.employee_id = ? OR d.visibility = "all")');
      params.push(employee_id);
    }
    if (category_id) {
      where.push('d.category_id = ?');
      params.push(category_id);
    }
    if (visibility) {
      where.push('d.visibility = ?');
      params.push(visibility);
    }
    if (search) {
      where.push('d.title LIKE ?');
      params.push(`%${search}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY d.created_at DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM documents d ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE d.document_id = ?`, [id]);
    return rows[0] || null;
  }
}

module.exports = new DocumentService();
