const mysql = require('mysql2/promise');
const { db } = require('./env');

/**
 * Shared connection pool. Use `query()` for plain SQL and `callProcedure()`
 * for stored procedure calls.
 */
const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.database,
  waitForConnections: true,
  connectionLimit: db.connectionLimit,
  queueLimit: 0,
  dateStrings: true,
});

/**
 * Run a parameterized SQL query.
 * @param {string} sql
 * @param {Array} params
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Call a stored procedure. `name` must already include the full
 * `proc_name(?, ?, ..., @out1)` placeholder/argument list - this matches
 * the convention used by every caller (e.g.
 * `callProcedure('sp_apply_leave(?, ?, ?, @request_id)', [a, b, c])`).
 * Returns the first result set as well as any OUT parameters (when the
 * procedure was called with a session-variable convention, e.g.
 * CALL sp_name(?, @out1); SELECT @out1 AS out1).
 */
async function callProcedure(name, params = []) {
  const [results] = await pool.query(`CALL ${name}`, params);
  // mysql2 returns an array of result sets; the last item is metadata
  return results;
}

/**
 * Run a function within a transaction using a dedicated connection.
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<any>} fn
 */
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

module.exports = { pool, query, callProcedure, withTransaction, testConnection };
