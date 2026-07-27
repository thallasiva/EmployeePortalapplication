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













async function readOuts(...vars) {
  const sql = 'SELECT ' + vars.map((v) => `@${v} AS \`${v}\``).join(', ');
  const [rows] = await pool.query(sql);
  return rows[0] ?? {};
}

async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

module.exports = { pool, query, callProcedure, readOuts, withTransaction, testConnection };
