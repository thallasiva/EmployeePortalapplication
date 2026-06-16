const BaseService = require('./base.service');
const { query } = require('../config/db');

const LIST_SELECT = `
  SELECT ce.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS created_by_name
    FROM calendar_events ce
    LEFT JOIN employees e ON e.employee_id = ce.created_by
`;

class CalendarEventService extends BaseService {
  constructor() {
    super('calendar_events', 'event_id', ['title', 'description', 'event_date', 'event_type', 'created_by']);
  }

  async list({ month, year, event_type, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (month) {
      where.push('MONTH(ce.event_date) = ?');
      params.push(month);
    }
    if (year) {
      where.push('YEAR(ce.event_date) = ?');
      params.push(year);
    }
    if (event_type) {
      where.push('ce.event_type = ?');
      params.push(event_type);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY ce.event_date ASC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM calendar_events ce ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }
}

module.exports = new CalendarEventService();
