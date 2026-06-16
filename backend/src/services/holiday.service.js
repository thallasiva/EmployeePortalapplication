const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

class HolidayService extends BaseService {
  constructor() {
    super('holidays', 'holiday_id', ['holiday_name', 'holiday_date', 'holiday_calendar', 'is_restricted']);
  }

  async list({ year, holiday_calendar, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (year) {
      where.push('YEAR(holiday_date) = ?');
      params.push(year);
    }
    if (holiday_calendar) {
      where.push('holiday_calendar = ?');
      params.push(holiday_calendar);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `SELECT * FROM holidays ${whereSql} ORDER BY holiday_date ASC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM holidays ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  /**
   * Bulk-inserts holidays (used by the "Import Holiday Calendar" feature).
   * Each entry is picked through the same fillable fields as create().
   */
  async bulkCreate(holidays) {
    const entries = (holidays || [])
      .map((h) => this._pick(h))
      .filter((h) => h.holiday_name && h.holiday_date);

    if (entries.length === 0) {
      throw ApiError.badRequest('No valid holiday rows to import');
    }

    const columns = ['holiday_name', 'holiday_date', 'holiday_calendar', 'is_restricted'];
    const placeholders = entries.map(() => '(?, ?, ?, ?)').join(', ');
    const values = [];
    entries.forEach((h) => {
      values.push(
        h.holiday_name,
        h.holiday_date,
        h.holiday_calendar || 'India - Default',
        h.is_restricted ? 1 : 0
      );
    });

    await query(`INSERT INTO holidays (${columns.join(', ')}) VALUES ${placeholders}`, values);
    return { imported: entries.length };
  }
}

module.exports = new HolidayService();
