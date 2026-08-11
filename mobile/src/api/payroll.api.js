import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const payrollApi = {
  // Employee
  myPayslips:      (params) => client.get('/payroll/payslips/me', { params }).then(unwrap),
  mySalaryStruct:  ()       => client.get('/payroll/salary-structures/me').then(unwrap),
  // Detail
  payslip:         (id)     => client.get(`/payroll/payslips/${id}/full`).then(unwrap),
  // Admin
  list:            (params) => client.get('/payroll/payslips', { params }).then(unwrap),
  salaryStructures:(params) => client.get('/payroll/salary-structures', { params }).then(unwrap),
  salaryStructure: (id)     => client.get(`/payroll/salary-structures/${id}`).then(unwrap),
  payrollRuns:     (params) => client.get('/payroll/runs', { params }).then(unwrap),
  markPaid:        (id)     => client.put(`/payroll/payslips/${id}/mark-paid`).then(unwrap),
};
