import client from './client';

const BASE = '/settings';

/* ═══════════════════════════════
   SMTP
═══════════════════════════════ */
export const smtpApi = {
  get:  ()     => client.get(`${BASE}/smtp`).then(r => r.data?.data || {}),
  save: (data) => client.put(`${BASE}/smtp`, data).then(r => r.data?.data),
  test: ()     => client.post(`${BASE}/smtp/test`).then(r => r.data?.data),
};

/* ═══════════════════════════════
   EMAIL TEMPLATES
═══════════════════════════════ */
export const emailTemplatesApi = {
  list:   (params = {}) => client.get(`${BASE}/email-templates`, { params }).then(r => r.data?.data || { rows: [], total: 0 }),
  get:    (id)          => client.get(`${BASE}/email-templates/${id}`).then(r => r.data?.data),
  create: (data)        => client.post(`${BASE}/email-templates`, data).then(r => r.data?.data),
  update: (id, data)    => client.put(`${BASE}/email-templates/${id}`, data).then(r => r.data?.data),
  delete: (id)          => client.delete(`${BASE}/email-templates/${id}`),
  clone:  (id)          => client.post(`${BASE}/email-templates/${id}/clone`).then(r => r.data?.data),
};

/* ═══════════════════════════════
   EMAIL LOGS
═══════════════════════════════ */
export const emailLogsApi = {
  list:  (params = {}) => client.get(`${BASE}/email-logs`, { params }).then(r => r.data?.data || { rows: [], total: 0 }),
  stats: ()            => client.get(`${BASE}/email-logs/stats`).then(r => r.data?.data || {}),
  retry: (id)          => client.post(`${BASE}/email-logs/${id}/retry`).then(r => r.data?.data),
};

/* ═══════════════════════════════
   EMAIL SCHEDULES
═══════════════════════════════ */
export const emailSchedulesApi = {
  list:   ()           => client.get(`${BASE}/email-schedules`).then(r => r.data?.data || []),
  create: (data)       => client.post(`${BASE}/email-schedules`, data).then(r => r.data?.data),
  update: (id, data)   => client.put(`${BASE}/email-schedules/${id}`, data).then(r => r.data?.data),
  toggle: (id)         => client.patch(`${BASE}/email-schedules/${id}/toggle`).then(r => r.data?.data),
  delete: (id)         => client.delete(`${BASE}/email-schedules/${id}`),
};

/* ═══════════════════════════════
   EMAIL PERMISSIONS
═══════════════════════════════ */
export const emailPermissionsApi = {
  get:  ()     => client.get(`${BASE}/email-permissions`).then(r => r.data?.data || {}),
  save: (data) => client.put(`${BASE}/email-permissions`, data).then(r => r.data?.data),
};

/* ═══════════════════════════════
   MENU PERMISSIONS
═══════════════════════════════ */
export const menuPermissionsApi = {
  get:  ()     => client.get(`${BASE}/menu-permissions`).then(r => r.data?.data || {}),
  save: (data) => client.put(`${BASE}/menu-permissions`, data).then(r => r.data?.data),
};

/* ═══════════════════════════════
   FORM BUILDER
═══════════════════════════════ */
export const formsApi = {
  list:   ()         => client.get(`${BASE}/forms`).then(r => r.data?.data || []),
  get:    (id)       => client.get(`${BASE}/forms/${id}`).then(r => r.data?.data),
  create: (data)     => client.post(`${BASE}/forms`, data).then(r => r.data?.data),
  update: (id, data) => client.put(`${BASE}/forms/${id}`, data).then(r => r.data?.data),
  delete: (id)       => client.delete(`${BASE}/forms/${id}`),
};

/* ═══════════════════════════════
   DASHBOARD BUILDER
═══════════════════════════════ */
export const dashboardsApi = {
  list:   ()         => client.get(`${BASE}/dashboards`).then(r => r.data?.data || []),
  get:    (id)       => client.get(`${BASE}/dashboards/${id}`).then(r => r.data?.data),
  create: (data)     => client.post(`${BASE}/dashboards`, data).then(r => r.data?.data),
  update: (id, data) => client.put(`${BASE}/dashboards/${id}`, data).then(r => r.data?.data),
  delete: (id)       => client.delete(`${BASE}/dashboards/${id}`),
};

/* ═══════════════════════════════
   REPORT BUILDER
═══════════════════════════════ */
export const reportsApi = {
  list:   ()         => client.get(`${BASE}/reports`).then(r => r.data?.data || []),
  get:    (id)       => client.get(`${BASE}/reports/${id}`).then(r => r.data?.data),
  create: (data)     => client.post(`${BASE}/reports`, data).then(r => r.data?.data),
  update: (id, data) => client.put(`${BASE}/reports/${id}`, data).then(r => r.data?.data),
  delete: (id)       => client.delete(`${BASE}/reports/${id}`),
};

/* ═══════════════════════════════
   NOTIFICATIONS
═══════════════════════════════ */
export const notificationsApi = {
  list:       (params = {})   => client.get(`${BASE}/notifications`, { params }).then(r => r.data?.data || { rows: [], total: 0, unread: 0 }),
  create:     (data)          => client.post(`${BASE}/notifications`, data).then(r => r.data?.data),
  markRead:   (id)            => client.patch(`${BASE}/notifications/${id}/read`),
  markAllRead:(employee_id)   => client.patch(`${BASE}/notifications/read-all`, null, { params: { employee_id } }),
  delete:     (id)            => client.delete(`${BASE}/notifications/${id}`),
};
