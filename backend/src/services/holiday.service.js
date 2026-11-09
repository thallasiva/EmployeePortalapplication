const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
function toDateStr(val) {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) return String(val);
  return new Date(val).toISOString().slice(0, 10);
}
class HolidayService {
  async list({ year, holiday_calendar, shift, location, limit, offset, companyId = null } = {}) {
    const where = `WHERE (? IS NULL OR company_id = ?) AND (? IS NULL OR YEAR(holiday_date) = ?)
      AND (? IS NULL OR shift = ?) AND (? IS NULL OR location = ?) AND (? IS NULL OR holiday_calendar = ?)`;
    const params = [companyId, companyId, year || null, year || null, shift || null, shift || null,
      location || null, location || null, holiday_calendar || null, holiday_calendar || null];
    const totals = await query(`SELECT COUNT(*) AS total FROM holidays ${where}`, params);
    let sql = `SELECT * FROM holidays ${where} ORDER BY holiday_date, holiday_name`;
    const rowParams = [...params];
    if (limit !== undefined) { sql += ' LIMIT ? OFFSET ?'; rowParams.push(Number(limit), Number(offset || 0)); }
    return { rows: await query(sql, rowParams), total: Number(totals[0]?.total || 0) };
  }
  async listLocations(companyId = null) {
    const rows = await query(`SELECT DISTINCT location FROM holidays
      WHERE location IS NOT NULL AND location <> '' AND (? IS NULL OR company_id = ?) ORDER BY location`, [companyId, companyId]);
    return rows.map((r) => r.location);
  }
  async getById(id, companyId = null) {
    const rows = await query('SELECT * FROM holidays WHERE holiday_id = ? AND (? IS NULL OR company_id = ?) LIMIT 1', [id, companyId, companyId]);
    return rows[0] || null;
  }
  async create(data, companyId = null) {
    const result = await query(`INSERT INTO holidays
      (company_id, holiday_name, holiday_date, holiday_calendar, shift, location, is_restricted)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [companyId, data.holiday_name, toDateStr(data.holiday_date),
      data.holiday_calendar || 'India - Default', data.shift || 'general', data.location || null, data.is_restricted ? 1 : 0]);
    return this.getById(result.insertId, companyId);
  }
  async update(id, data, companyId = null) {
    const existing = await this.getById(id, companyId);
    if (!existing) throw ApiError.notFound('Holiday not found');
    await query(`UPDATE holidays SET holiday_name = ?, holiday_date = ?, holiday_calendar = ?, shift = ?,
      location = ?, is_restricted = ? WHERE holiday_id = ? AND (? IS NULL OR company_id = ?)`,
    [data.holiday_name ?? existing.holiday_name, data.holiday_date ? toDateStr(data.holiday_date) : existing.holiday_date,
      data.holiday_calendar ?? existing.holiday_calendar, data.shift ?? existing.shift, data.location ?? existing.location,
      data.is_restricted !== undefined ? (data.is_restricted ? 1 : 0) : existing.is_restricted, id, companyId, companyId]);
    return this.getById(id, companyId);
  }
  async delete(id, companyId = null) {
    const result = await query('DELETE FROM holidays WHERE holiday_id = ? AND (? IS NULL OR company_id = ?)', [Number(id), companyId, companyId]);
    if (!result.affectedRows) throw ApiError.notFound('Holiday not found');
    return { deleted: true };
  }
  async bulkCreate(holidays, companyId = null) {
    const entries = (holidays || []).filter((h) => h.holiday_name && h.holiday_date);
    if (entries.length === 0) throw ApiError.badRequest('No valid holiday rows to import');
    const VALID_SHIFTS = ['general', 'mid', 'night'];
    let imported = 0;
    for (const h of entries) {
      const shift = VALID_SHIFTS.includes((h.shift || '').toLowerCase()) ? h.shift.toLowerCase() : 'general';
      await this.create({ ...h, shift }, companyId);
      imported++;
    }
    return { imported };
  }
}
module.exports = new HolidayService();
