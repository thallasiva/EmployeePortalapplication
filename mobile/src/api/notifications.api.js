import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const notificationsApi = {
  list: (params) => client.get('/settings/notifications', { params }).then(unwrap),
  markRead: (id) => client.patch(`/settings/notifications/${id}/read`).then(unwrap),
  markAllRead: () => client.patch('/settings/notifications/read-all').then(unwrap),
  delete: (id) => client.delete(`/settings/notifications/${id}`),
};
