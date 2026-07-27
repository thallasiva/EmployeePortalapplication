import apiClient from './client';

const B = '/salary-assignments';

export const listSalaryAssignments   = (params = {}) => apiClient.get(B, { params }).then(r => r.data.data);
export const getEmployeeAssignment   = (empId)       => apiClient.get(`${B}/${empId}`).then(r => r.data.data);
export const assignSalaryStructure   = (empId, data) => apiClient.post(`${B}/${empId}`, data).then(r => r.data.data);
export const getAssignmentHistory    = (empId)       => apiClient.get(`${B}/${empId}/history`).then(r => r.data.data);
export const computePayslipBreakdown = (empId, ctc_annual) =>
  apiClient.post(`${B}/${empId}/compute-breakdown`, { ctc_annual }).then(r => r.data.data);
