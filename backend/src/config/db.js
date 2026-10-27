const mysql = require('mysql2/promise');
const { db } = require('./env');





const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.database,
  waitForConnections: true,
  connectionLimit: db.connectionLimit,
  queueLimit: 0,
  dateStrings: true
});






async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}










async function callProcedure(name, params = []) {
  const [results] = await pool.query(`CALL ${name}`, params);

  return results;
}





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













// Calls a procedure with OUT params (e.g. 'sp_x(?, @ok, @msg)') and reads them back.
// Session variables are per-connection, so the CALL and the SELECT must share one
// connection — reading @vars through the pool can hit another request's session.
async function callProcedureWithOuts(call, params = []) {
  const vars = [...new Set(call.match(/@\w+/g) || [])].map((v) => v.slice(1));
  const conn = await pool.getConnection();
  try {
    const [results] = await conn.query(`CALL ${call}`, params);
    if (!vars.length) return { results, outs: {} };
    const [rows] = await conn.query('SELECT ' + vars.map((v) => `@${v} AS \`${v}\``).join(', '));
    return { results, outs: rows[0] ?? {} };
  } finally {
    conn.release();
  }
}

async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

module.exports = { pool, query, callProcedure, callProcedureWithOuts, withTransaction, testConnection };
