const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

/** Normalise any date value to plain YYYY-MM-DD string for MySQL DATE columns */
function toDateStr(val) {
  if (!val) return null;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) return String(val);
  // ISO timestamp → slice the date part
  return new Date(val).toISOString().slice(0, 10);
}

class HolidayService {
  /**
   * List holidays via sp_list_holidays.
   * Returns first result set = rows, second = count row.
   */
  async list({ year, holiday_calendar, shift, location, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_holidays(?, ?, ?, ?, ?, ?)',
      [
        year             ? Number(year)    : null,
        shift            || null,
        location         || null,
        holiday_calendar || null,
        limit !== undefined ? Number(limit)        : 0,
        offset !== undefined ? Number(offset)      : 0,
      ]
    );
    // sp_list_holidays returns 2 result sets: [0]=rows, [1]=count
    const rowsSet  = Array.isArray(results[0]) ? results[0] : [];
    const countSet = Array.isArray(results[1]) ? results[1] : [];
    const total    = countSet[0]?.total ?? rowsSet.length;
    return { rows: rowsSet, total };
  }

  /**
   * Distinct locations for the filter dropdown via sp_list_holiday_locations.
   */
  async listLocations() {
    const results = await callProcedure('sp_list_holiday_locations()', []);
    const rows = Array.isArray(results[0]) ? results[0] : [];
    return rows.map((r) => r.location);
  }

  /**
   * Get single holiday by ID (plain SELECT — no procedure needed for PK lookup).
   */
  async getById(id) {
    const { query } = require('../config/db');
    const rows = await query('SELECT * FROM holidays WHERE holiday_id = ?', [id]);
    return rows[0] || null;
  }

  /**
   * Create a single holiday via sp_create_holiday.
   */
  async create(data) {
    const results = await callProcedure(
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
    // Fetch OUT param
    const { query } = require('../config/db');
    const out = await query('SELECT @p_holiday_id AS holiday_id');
    const id  = out[0]?.holiday_id;
    return { holiday_id: id };
  }

  /**
   * Update a holiday via sp_update_holiday.
   */
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

  /**
   * Delete a holiday via sp_delete_holiday.
   */
  async delete(id) {
    await callProcedure('sp_delete_holiday(?)', [Number(id)]);
    return { deleted: true };
  }

  /**
   * Bulk-import holidays — direct INSERT per row.
   * Bypasses stored procedure JSON parsing; preserves shift/location exactly.
   */
  async bulkCreate(holidays) {
    const { query } = require('../config/db');

    const entries = (holidays || []).filter(
      (h) => h.holiday_name && h.holiday_date
    );

    if (entries.length === 0) {
      throw ApiError.badRequest('No valid holiday rows to import');
    }

    const VALID_SHIFTS = ['general', 'mid', 'night'];
    let imported = 0;

    for (const h of entries) {
      const shift = VALID_SHIFTS.includes((h.shift || '').toLowerCase())
        ? h.shift.toLowerCase()
        : 'general';

      await query(
        `INSERT INTO holidays
           (holiday_name, holiday_date, holiday_calendar, shift, location, is_restricted)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          h.holiday_name,
          toDateStr(h.holiday_date),
          h.holiday_calendar || 'India - Default',
          shift,
          h.location || null,
          h.is_restricted ? 1 : 0,
        ]
      );
      imported++;
    }

    return { imported };
  }
}

module.exports = new HolidayService();
