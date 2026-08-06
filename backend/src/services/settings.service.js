'use strict';
const { query } = require('../config/db');

/* ── auto-create tables on first use ── */
async function ensureTables() {
  await query(`CREATE TABLE IF NOT EXISTS hr_smtp_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    \`key\` VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await query(`CREATE TABLE IF NOT EXISTS hr_email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    subject VARCHAR(500),
    body LONGTEXT,
    status ENUM('Active','Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await query(`CREATE TABLE IF NOT EXISTS hr_email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient VARCHAR(300),
    subject VARCHAR(500),
    module VARCHAR(100),
    status ENUM('Sent','Failed','Pending','Queued') DEFAULT 'Pending',
    error_message TEXT,
    retry_count INT DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await query(`CREATE TABLE IF NOT EXISTS hr_email_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    freq VARCHAR(50),
    send_time VARCHAR(10),
    template_name VARCHAR(200),
    recipient VARCHAR(300),
    cron_expr VARCHAR(100),
    status ENUM('Active','Paused','Disabled') DEFAULT 'Active',
    next_run VARCHAR(100),
    last_run VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await query(`CREATE TABLE IF NOT EXISTS hr_email_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    permissions JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await query(`CREATE TABLE IF NOT EXISTS hr_menu_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    permissions JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await query(`CREATE TABLE IF NOT EXISTS hr_custom_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    status ENUM('Draft','Published') DEFAULT 'Draft',
    fields JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await query(`CREATE TABLE IF NOT EXISTS hr_custom_dashboards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    widgets JSON,
    is_active TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await query(`CREATE TABLE IF NOT EXISTS hr_custom_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    module VARCHAR(100),
    format VARCHAR(50) DEFAULT 'table',
    columns JSON,
    filters JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await query(`CREATE TABLE IF NOT EXISTS hr_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    title VARCHAR(300),
    message TEXT,
    type ENUM('info','success','warning','error') DEFAULT 'info',
    module VARCHAR(100),
    link VARCHAR(500),
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
}

/* ════════════════════════════════════
   SMTP
════════════════════════════════════ */
async function getSmtp() {
  await ensureTables();
  const rows = await query('SELECT `key`, value FROM hr_smtp_settings');
  const cfg = {};
  rows.forEach(r => { try { cfg[r.key] = JSON.parse(r.value); } catch { cfg[r.key] = r.value; } });
  return cfg;
}
async function saveSmtp(data) {
  await ensureTables();
  for (const [k, v] of Object.entries(data)) {
    await query(
      'INSERT INTO hr_smtp_settings (`key`, value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=?',
      [k, JSON.stringify(v), JSON.stringify(v)]
    );
  }
  return getSmtp();
}

/* ════════════════════════════════════
   EMAIL TEMPLATES
════════════════════════════════════ */
async function listTemplates({ search, category, status, page = 1, limit = 50 }) {
  await ensureTables();
  const offset = (page - 1) * limit;
  let where = 'WHERE 1=1';
  const params = [];
  if (search)   { where += ' AND (name LIKE ? OR subject LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (category) { where += ' AND category=?'; params.push(category); }
  if (status)   { where += ' AND status=?'; params.push(status); }
  const [rows, total] = await Promise.all([
    query(`SELECT * FROM hr_email_templates ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
    query(`SELECT COUNT(*) AS c FROM hr_email_templates ${where}`, params),
  ]);
  rows.forEach(r => { try { r.variables = JSON.parse(r.variables || '[]'); } catch {} });
  return { rows, total: total[0].c };
}
async function getTemplate(id) {
  await ensureTables();
  const rows = await query('SELECT * FROM hr_email_templates WHERE id=?', [id]);
  return rows[0] || null;
}
async function createTemplate(data) {
  await ensureTables();
  const { name, category, subject, body, status = 'Active' } = data;
  const r = await query(
    'INSERT INTO hr_email_templates (name,category,subject,body,status) VALUES (?,?,?,?,?)',
    [name, category, subject, body, status]
  );
  return getTemplate(r.insertId);
}
async function updateTemplate(id, data) {
  await ensureTables();
  const { name, category, subject, body, status } = data;
  await query(
    'UPDATE hr_email_templates SET name=?,category=?,subject=?,body=?,status=?,updated_at=NOW() WHERE id=?',
    [name, category, subject, body, status, id]
  );
  return getTemplate(id);
}
async function deleteTemplate(id) {
  await ensureTables();
  await query('DELETE FROM hr_email_templates WHERE id=?', [id]);
}
async function cloneTemplate(id) {
  await ensureTables();
  const t = await getTemplate(id);
  if (!t) return null;
  const r = await query(
    'INSERT INTO hr_email_templates (name,category,subject,body,status) VALUES (?,?,?,?,?)',
    [`${t.name} (Copy)`, t.category, t.subject, t.body, 'Draft']
  );
  return getTemplate(r.insertId);
}

/* ════════════════════════════════════
   EMAIL LOGS
════════════════════════════════════ */
async function listLogs({ search, status, module, page = 1, limit = 20 }) {
  await ensureTables();
  const offset = (page - 1) * limit;
  let where = 'WHERE 1=1';
  const params = [];
  if (search) { where += ' AND (recipient LIKE ? OR subject LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (status && status !== 'All Status') { where += ' AND status=?'; params.push(status); }
  if (module && module !== 'All Modules') { where += ' AND module=?'; params.push(module); }
  const [rows, total] = await Promise.all([
    query(`SELECT * FROM hr_email_logs ${where} ORDER BY sent_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
    query(`SELECT COUNT(*) AS c FROM hr_email_logs ${where}`, params),
  ]);
  return { rows, total: total[0].c };
}
async function retryLog(id) {
  await ensureTables();
  await query('UPDATE hr_email_logs SET status="Sent", error_message=NULL, retry_count=retry_count+1 WHERE id=?', [id]);
  const rows = await query('SELECT * FROM hr_email_logs WHERE id=?', [id]);
  return rows[0];
}
async function getLogStats() {
  await ensureTables();
  const rows = await query('SELECT status, COUNT(*) AS cnt FROM hr_email_logs GROUP BY status');
  const stats = { total: 0, Sent: 0, Failed: 0, Pending: 0, Queued: 0 };
  rows.forEach(r => { stats[r.status] = r.cnt; stats.total += r.cnt; });
  return stats;
}

/* ════════════════════════════════════
   EMAIL SCHEDULES
════════════════════════════════════ */
async function listSchedules() {
  await ensureTables();
  return query('SELECT * FROM hr_email_schedules ORDER BY created_at DESC');
}
async function createSchedule(data) {
  await ensureTables();
  const { name, freq, send_time, template_name, recipient, cron_expr, status = 'Active' } = data;
  const r = await query(
    'INSERT INTO hr_email_schedules (name,freq,send_time,template_name,recipient,cron_expr,status) VALUES (?,?,?,?,?,?,?)',
    [name, freq, send_time, template_name, recipient, cron_expr || null, status]
  );
  const rows = await query('SELECT * FROM hr_email_schedules WHERE id=?', [r.insertId]);
  return rows[0];
}
async function updateSchedule(id, data) {
  await ensureTables();
  const { name, freq, send_time, template_name, recipient, cron_expr, status } = data;
  await query(
    'UPDATE hr_email_schedules SET name=?,freq=?,send_time=?,template_name=?,recipient=?,cron_expr=?,status=?,updated_at=NOW() WHERE id=?',
    [name, freq, send_time, template_name, recipient, cron_expr || null, status, id]
  );
  const rows = await query('SELECT * FROM hr_email_schedules WHERE id=?', [id]);
  return rows[0];
}
async function toggleSchedule(id) {
  await ensureTables();
  await query("UPDATE hr_email_schedules SET status=IF(status='Active','Paused','Active'), updated_at=NOW() WHERE id=?", [id]);
  const rows = await query('SELECT * FROM hr_email_schedules WHERE id=?', [id]);
  return rows[0];
}
async function deleteSchedule(id) {
  await ensureTables();
  await query('DELETE FROM hr_email_schedules WHERE id=?', [id]);
}

/* ════════════════════════════════════
   EMAIL PERMISSIONS (JSON per role)
════════════════════════════════════ */
async function getEmailPermissions() {
  await ensureTables();
  const rows = await query('SELECT role_name, permissions FROM hr_email_permissions');
  const out = {};
  rows.forEach(r => { try { out[r.role_name] = JSON.parse(r.permissions); } catch { out[r.role_name] = r.permissions; } });
  return out;
}
async function saveEmailPermissions(data) {
  await ensureTables();
  for (const [role, perms] of Object.entries(data)) {
    await query(
      'INSERT INTO hr_email_permissions (role_name, permissions) VALUES (?,?) ON DUPLICATE KEY UPDATE permissions=?, updated_at=NOW()',
      [role, JSON.stringify(perms), JSON.stringify(perms)]
    );
  }
  return getEmailPermissions();
}

/* ════════════════════════════════════
   MENU PERMISSIONS
════════════════════════════════════ */
async function getMenuPermissions() {
  await ensureTables();
  const rows = await query('SELECT role_name, permissions FROM hr_menu_permissions');
  const out = {};
  rows.forEach(r => { try { out[r.role_name] = JSON.parse(r.permissions); } catch { out[r.role_name] = r.permissions; } });
  return out;
}
async function saveMenuPermissions(data) {
  await ensureTables();
  for (const [role, perms] of Object.entries(data)) {
    await query(
      'INSERT INTO hr_menu_permissions (role_name, permissions) VALUES (?,?) ON DUPLICATE KEY UPDATE permissions=?, updated_at=NOW()',
      [role, JSON.stringify(perms), JSON.stringify(perms)]
    );
  }
  return getMenuPermissions();
}

/* ════════════════════════════════════
   FORM BUILDER
════════════════════════════════════ */
async function listForms() {
  await ensureTables();
  const rows = await query('SELECT id, name, category, status, updated_at, JSON_LENGTH(fields) AS field_count FROM hr_custom_forms ORDER BY updated_at DESC');
  return rows;
}
async function getForm(id) {
  await ensureTables();
  const rows = await query('SELECT * FROM hr_custom_forms WHERE id=?', [id]);
  if (!rows[0]) return null;
  try { rows[0].fields = JSON.parse(rows[0].fields || '[]'); } catch {}
  return rows[0];
}
async function createForm(data) {
  await ensureTables();
  const r = await query(
    'INSERT INTO hr_custom_forms (name, category, status, fields) VALUES (?,?,?,?)',
    [data.name, data.category, data.status || 'Draft', JSON.stringify(data.fields || [])]
  );
  return getForm(r.insertId);
}
async function updateForm(id, data) {
  await ensureTables();
  await query(
    'UPDATE hr_custom_forms SET name=?, category=?, status=?, fields=?, updated_at=NOW() WHERE id=?',
    [data.name, data.category, data.status, JSON.stringify(data.fields || []), id]
  );
  return getForm(id);
}
async function deleteForm(id) {
  await ensureTables();
  await query('DELETE FROM hr_custom_forms WHERE id=?', [id]);
}

/* ════════════════════════════════════
   DASHBOARD BUILDER
════════════════════════════════════ */
async function listDashboards() {
  await ensureTables();
  return query('SELECT id, name, is_active, updated_at, JSON_LENGTH(widgets) AS widget_count FROM hr_custom_dashboards ORDER BY updated_at DESC');
}
async function getDashboard(id) {
  await ensureTables();
  const rows = await query('SELECT * FROM hr_custom_dashboards WHERE id=?', [id]);
  if (!rows[0]) return null;
  try { rows[0].widgets = JSON.parse(rows[0].widgets || '[]'); } catch {}
  return rows[0];
}
async function createDashboard(data) {
  await ensureTables();
  const r = await query(
    'INSERT INTO hr_custom_dashboards (name, widgets, is_active) VALUES (?,?,?)',
    [data.name, JSON.stringify(data.widgets || []), data.is_active ? 1 : 0]
  );
  return getDashboard(r.insertId);
}
async function updateDashboard(id, data) {
  await ensureTables();
  await query(
    'UPDATE hr_custom_dashboards SET name=?, widgets=?, is_active=?, updated_at=NOW() WHERE id=?',
    [data.name, JSON.stringify(data.widgets || []), data.is_active ? 1 : 0, id]
  );
  return getDashboard(id);
}
async function deleteDashboard(id) {
  await ensureTables();
  await query('DELETE FROM hr_custom_dashboards WHERE id=?', [id]);
}

/* ════════════════════════════════════
   REPORT BUILDER
════════════════════════════════════ */
async function listReports() {
  await ensureTables();
  return query('SELECT id, name, module, format, updated_at FROM hr_custom_reports ORDER BY updated_at DESC');
}
async function getReport(id) {
  await ensureTables();
  const rows = await query('SELECT * FROM hr_custom_reports WHERE id=?', [id]);
  if (!rows[0]) return null;
  try { rows[0].columns = JSON.parse(rows[0].columns || '[]'); } catch {}
  try { rows[0].filters = JSON.parse(rows[0].filters || '[]'); } catch {}
  return rows[0];
}
async function createReport(data) {
  await ensureTables();
  const r = await query(
    'INSERT INTO hr_custom_reports (name, module, format, columns, filters) VALUES (?,?,?,?,?)',
    [data.name, data.module, data.format || 'table', JSON.stringify(data.columns || []), JSON.stringify(data.filters || [])]
  );
  return getReport(r.insertId);
}
async function updateReport(id, data) {
  await ensureTables();
  await query(
    'UPDATE hr_custom_reports SET name=?, module=?, format=?, columns=?, filters=?, updated_at=NOW() WHERE id=?',
    [data.name, data.module, data.format, JSON.stringify(data.columns || []), JSON.stringify(data.filters || []), id]
  );
  return getReport(id);
}
async function deleteReport(id) {
  await ensureTables();
  await query('DELETE FROM hr_custom_reports WHERE id=?', [id]);
}

/* ════════════════════════════════════
   NOTIFICATIONS
════════════════════════════════════ */
async function listNotifications({ employee_id, page = 1, limit = 20, unread_only = false }) {
  await ensureTables();
  const offset = (page - 1) * limit;
  let where = 'WHERE 1=1';
  const params = [];
  if (employee_id) { where += ' AND employee_id=?'; params.push(employee_id); }
  if (unread_only) { where += ' AND is_read=0'; }
  const [rows, total, unread] = await Promise.all([
    query(`SELECT * FROM hr_notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
    query(`SELECT COUNT(*) AS c FROM hr_notifications ${where}`, params),
    query(`SELECT COUNT(*) AS c FROM hr_notifications ${where} AND is_read=0`, params),
  ]);
  return { rows, total: total[0].c, unread: unread[0].c };
}
async function markRead(id) {
  await ensureTables();
  await query('UPDATE hr_notifications SET is_read=1 WHERE id=?', [id]);
}
async function markAllRead(employee_id) {
  await ensureTables();
  const params = employee_id ? [employee_id] : [];
  await query(`UPDATE hr_notifications SET is_read=1${employee_id ? ' WHERE employee_id=?' : ''}`, params);
}
async function deleteNotification(id) {
  await ensureTables();
  await query('DELETE FROM hr_notifications WHERE id=?', [id]);
}
async function createNotification(data) {
  await ensureTables();
  const { employee_id, title, message, type = 'info', module, link } = data;
  const r = await query(
    'INSERT INTO hr_notifications (employee_id, title, message, type, module, link) VALUES (?,?,?,?,?,?)',
    [employee_id || null, title, message, type, module || null, link || null]
  );
  const rows = await query('SELECT * FROM hr_notifications WHERE id=?', [r.insertId]);
  return rows[0];
}


/* ════════════════════════════════════
   NOTIFICATION PREFERENCES
════════════════════════════════════ */
async function getNotificationPreferences() {
  await ensureTables();
  const rows = await query("SELECT value FROM hr_smtp_settings WHERE \`key\`='notif_preferences'");
  if (!rows[0]) return null;
  try { return JSON.parse(rows[0].value); } catch { return null; }
}
async function saveNotificationPreferences(data) {
  await ensureTables();
  const val = JSON.stringify(data);
  await query(
    "INSERT INTO hr_smtp_settings (\`key\`, value) VALUES ('notif_preferences',?) ON DUPLICATE KEY UPDATE value=?",
    [val, val]
  );
  return data;
}

module.exports = {
  getSmtp, saveSmtp,
  listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, cloneTemplate,
  listLogs, retryLog, getLogStats,
  listSchedules, createSchedule, updateSchedule, toggleSchedule, deleteSchedule,
  getEmailPermissions, saveEmailPermissions,
  getMenuPermissions, saveMenuPermissions,
  listForms, getForm, createForm, updateForm, deleteForm,
  listDashboards, getDashboard, createDashboard, updateDashboard, deleteDashboard,
  listReports, getReport, createReport, updateReport, deleteReport,
  listNotifications, markRead, markAllRead, deleteNotification, createNotification,
  getNotificationPreferences, saveNotificationPreferences,
};

