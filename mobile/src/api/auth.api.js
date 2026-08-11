import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }).then(unwrap),
  me: () => client.get('/auth/me').then(unwrap),
  logout: () => client.post('/auth/logout', {}),
  changePassword: (currentPassword, newPassword) => client.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => client.post('/auth/reset-password', { token, newPassword }),
};
