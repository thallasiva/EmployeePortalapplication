import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const salaryApi = {
  // Structures
  structures:   (params) => client.get('/salary-components/structures', { params }).then(unwrap),
  structure:    (id)     => client.get(`/salary-components/structures/${id}`).then(unwrap),
  // Components
  components:   (params) => client.get('/salary-components/components', { params }).then(unwrap),
  // Assignments
  assignments:  (params) => client.get('/salary-assignments', { params }).then(unwrap),
  assignment:   (empId)  => client.get(`/salary-assignments/${empId}`).then(unwrap),
  assign:       (empId, data) => client.post(`/salary-assignments/${empId}`, data).then(unwrap),
  // Employee payroll
  myPayslips:   (params) => client.get('/payroll/payslips/me', { params }).then(unwrap),
  mySalary:     ()       => client.get('/payroll/salary-structures/me').then(unwrap),
};
