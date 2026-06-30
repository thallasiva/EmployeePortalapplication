const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');

class CalendarEventService extends BaseService {
  constructor() {
    super('calendar_events', 'event_id', ['title', 'description', 'event_date', 'event_type', 'created_by']);
  }

  async list({ month, year, event_type, employee_id, limit, offset } = {}) {
    // Build from/to dates from month+year if provided
    let fromDate = null;
    let toDate   = null;
    if (month && year) {
      fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      toDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    } else if (year) {
      fromDate = `${year}-01-01`;
      toDate   = `${year}-12-31`;
    }

    const results = await callProcedure(
      'sp_list_calendar_events(?, ?, ?, ?, ?, ?, ?)',
      [
        employee_id ?? null,
        null,            // visibility — no filter from this context
        event_type ?? null,
        fromDate,
        toDate,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }
}

module.exports = new CalendarEventService();
