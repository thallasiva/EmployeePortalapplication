import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const reportsApi = {
  employees:  (params) => client.get('/reports/employees', { params }).then(unwrap),
  attendance: (params) => client.get('/reports/attendance', { params }).then(unwrap),
  leave:      (params) => client.get('/reports/leave', { params }).then(unwrap),
  payroll:    (params) => client.get('/reports/payroll', { params }).then(unwrap),
  helpdesk:   (params) => client.get('/reports/helpdesk', { params }).then(unwrap),
  hiring:     (params) => client.get('/reports/hiring', { params }).then(unwrap),
  reviews:    (params) => client.get('/reports/reviews', { params }).then(unwrap),
  // Downloads
  downloadEmpData:      (params) => client.get('/reports/download/emp-data', { params, responseType: 'blob' }),
  downloadLeaveBalance: (params) => client.get('/reports/download/leave-balance', { params, responseType: 'blob' }),
  downloadLeaveSummary: (params) => client.get('/reports/download/leave-summary', { params, responseType: 'blob' }),
};
