const { callProcedure, readOuts } = require('../config/db');
const ApiError = require('../utils/ApiError');

function toDateStr(val) {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) return String(val);
  return new Date(val).toISOString().slice(0, 10);
}

class HolidayService {
  async list({ year, holiday_calendar, shift, location, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_holidays(?, ?, ?, ?, ?, ?)',
      [
        year             ? Number(year) : null,
        shift            || null,
        location         || null,
        holiday_calendar || null,
        limit !== undefined ? Number(limit)  : 0,
        offset !== undefined ? Number(offset) : 0,
      ]
    );
    const rowsSet  = Array.isArray(results[0]) ? results[0] : [];
    const countSet = Array.isArray(results[1]) ? results[1] : [];
    return { rows: rowsSet, total: countSet[0]?.total ?? rowsSet.length };
  }

  async listLocations() {
    const results = await callProcedure('sp_list_holiday_locations()', []);
    return (Array.isArray(results[0]) ? results[0] : []).map((r) => r.location);
  }

  async getById(id) {
    const results = await callProcedure('sp_get_holiday_by_id(?)', [id]);
    return (results[0] ?? [])[0] || null;
  }

  async create(data) {
    await callProcedure(
      'sp_create_holiday(?, ?, ?, ?, ?, ?, @p_holiday_id)',
      [
        data.holiday_name     || null,
        toDateStr(data.holiday_date),
        data.holiday_calendar || 'India - Default',
        data.shift            || 'general',
        data.location         || null,
        data.is_restricted    ? 1 : 0,
      ]
    );
    const out = await readOuts('p_holiday_id');
    return { holiday_id: out.p_holiday_id };
  }

  async update(id, data) {
    await callProcedure(
      'sp_update_holiday(?, ?, ?, ?, ?, ?, ?)',
      [
        Number(id),
        data.holiday_name     ?? null,
        data.holiday_date ? toDateStr(data.holiday_date) : null,
        data.holiday_calendar ?? null,
        data.shift            ?? null,
        data.location         ?? null,
        data.is_restricted !== undefined ? (data.is_restricted ? 1 : 0) : null,
      ]
    );
    return { updated: true };
  }

  async delete(id) {
    await callProcedure('sp_delete_holiday(?)', [Number(id)]);
    return { deleted: true };
  }

  async bulkCreate(holidays) {
    const entries = (holidays || []).filter((h) => h.holiday_name && h.holiday_date);
    if (entries.length === 0) throw ApiError.badRequest('No valid holiday rows to import');

    const VALID_SHIFTS = ['general', 'mid', 'night'];
    let imported = 0;

    for (const h of entries) {
      const shift = VALID_SHIFTS.includes((h.shift || '').toLowerCase()) ? h.shift.toLowerCase() : 'general';
      await callProcedure('sp_import_holiday(?, ?, ?, ?, ?, ?)', [
        h.holiday_name,
        toDateStr(h.holiday_date),
        h.holiday_calendar || 'India - Default',
        shift,
        h.location || null,
        h.is_restricted ? 1 : 0,
      ]);
      imported++;
    }

    return { imported };
  }
}

module.exports = new HolidayService();
