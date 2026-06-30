const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Generic CRUD repository — dynamic-table infrastructure layer.
 *
 * WHY this file uses query() directly:
 *   Stored procedures require hardcoded table names. This class is a
 *   parameterised ORM utility (table name passed via constructor), so
 *   inline query() is the only option. It is intentionally kept thin.
 *
 * RULE: No business logic goes here. Every concrete service MUST override
 *   all public methods with dedicated stored-procedure calls so that query()
 *   is never reached at runtime for production operations.
 *   (The only exception is fallback coverage for admin/settings tables that
 *   have no service-specific overrides yet.)
 */
class BaseService {
  /**
   * @param {string} table primary table name
   * @param {string} pk primary key column name
   * @param {string[]} fillable columns that may be set via create/update
   */
  constructor(table, pk, fillable = []) {
    this.table = table;
    this.pk = pk;
    this.fillable = fillable;
  }

  _pick(data) {
    const result = {};
    for (const key of this.fillable) {
      if (data[key] !== undefined) result[key] = data[key];
    }
    return result;
  }

  async findAll({ where = '1=1', params = [], orderBy = `${this.pk} DESC`, limit, offset } = {}) {
    let sql = `SELECT * FROM ${this.table} WHERE ${where} ORDER BY ${orderBy}`;
    const sqlParams = [...params];
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      sqlParams.push(Number(limit), Number(offset || 0));
    }
    return query(sql, sqlParams);
  }

  async count({ where = '1=1', params = [] } = {}) {
    const rows = await query(`SELECT COUNT(*) AS total FROM ${this.table} WHERE ${where}`, params);
    return rows[0]?.total || 0;
  }

  async findById(id) {
    const rows = await query(`SELECT * FROM ${this.table} WHERE ${this.pk} = ?`, [id]);
    return rows[0] || null;
  }

  async findOne(where, params = []) {
    const rows = await query(`SELECT * FROM ${this.table} WHERE ${where} LIMIT 1`, params);
    return rows[0] || null;
  }

  async create(data) {
    const payload = this._pick(data);
    if (Object.keys(payload).length === 0) {
      throw ApiError.badRequest('No valid fields provided');
    }
    const columns = Object.keys(payload);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map((c) => payload[c]);

    const result = await query(
      `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    return this.findById(result.insertId);
  }

  async update(id, data) {
    const payload = this._pick(data);
    if (Object.keys(payload).length === 0) {
      return this.findById(id);
    }
    const columns = Object.keys(payload);
    const setClause = columns.map((c) => `${c} = ?`).join(', ');
    const values = columns.map((c) => payload[c]);

    await query(`UPDATE ${this.table} SET ${setClause} WHERE ${this.pk} = ?`, [...values, id]);
    return this.findById(id);
  }

  async remove(id) {
    const result = await query(`DELETE FROM ${this.table} WHERE ${this.pk} = ?`, [id]);
    return result.affectedRows > 0;
  }

  async existsById(id) {
    const rows = await query(`SELECT 1 FROM ${this.table} WHERE ${this.pk} = ? LIMIT 1`, [id]);
    return rows.length > 0;
  }
}

module.exports = BaseService;
