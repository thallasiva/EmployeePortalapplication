import apiClient, { unwrap, unwrapList } from "./client";
export const listSalaryStructures = (params) =>
apiClient.get("/payroll/salary-structures", { params }).then(unwrapList);
export const getSalaryStructure = (id) =>
apiClient.get(`/payroll/salary-structures/${id}`).then(unwrap);
export const getMySalaryStructure = () =>
apiClient.get("/payroll/salary-structures/me").then(unwrap);
export const createSalaryStructure = (payload) =>
apiClient.post("/payroll/salary-structures", payload).then(unwrap);
export const updateSalaryStructure = (id, payload) =>
apiClient.put(`/payroll/salary-structures/${id}`, payload).then(unwrap);
export const deleteSalaryStructure = (id) =>
apiClient.delete(`/payroll/salary-structures/${id}`).then(unwrap);
export const importSalaryStructures = (items) =>
apiClient.post("/payroll/salary-structures/import", { items }).then(unwrap);
export const listPayslips = (params) =>
apiClient.get("/payroll/payslips", { params }).then(unwrapList);
export const getMyPayslips = (params) =>
apiClient.get("/payroll/payslips/me", { params }).then(unwrapList);
export const getPayslip = (id) => apiClient.get(`/payroll/payslips/${id}`).then(unwrap);
export const getPayslipFull = (id) =>
apiClient.get(`/payroll/payslips/${id}/full`).then(unwrap);
export const generatePayslip = (payload) =>
apiClient.post("/payroll/payslips/generate", payload).then(unwrap);
export const generateMyPayslip = (payload) =>
apiClient.post("/payroll/payslips/me/generate", payload).then(unwrap);
export const generateAllPayslips = (payload) =>
apiClient.post("/payroll/payslips/generate-all", payload).then(unwrap);
export const listPayrollRuns = (params) =>
apiClient.get("/payroll/runs", { params }).then(unwrapList);
export const getPayrollDashboard = (params) =>
  apiClient.get("/payroll/dashboard", { params }).then(unwrap);
export const getPayrollSettings = (params) =>
  apiClient.get("/payroll/settings", { params }).then(unwrap);
export const updatePayrollSettings = (payload) =>
  apiClient.put("/payroll/settings", payload).then(unwrap);
export const listPayrollPayGroups = () =>
  apiClient.get("/payroll/pay-groups").then(unwrapList);
export const createPayrollPayGroup = (payload) =>
  apiClient.post("/payroll/pay-groups", payload).then(unwrap);
export const updatePayrollPayGroup = (id, payload) =>
  apiClient.put(`/payroll/pay-groups/${id}`, payload).then(unwrap);
export const deactivatePayrollPayGroup = (id) =>
  apiClient.delete(`/payroll/pay-groups/${id}`).then(unwrap);
export const listPayrollGroupAssignments = (params) =>
  apiClient.get("/payroll/pay-groups/assignments", { params }).then(unwrapList);
export const assignPayrollGroup = (payload) =>
  apiClient.post("/payroll/pay-groups/assignments", payload).then(unwrap);
export const getPayrollPeriod = (year, month) =>
  apiClient.get(`/payroll/periods/${year}/${month}`).then(unwrap);
export const lockPayrollInputs = (year, month, reason) =>
  apiClient.post(`/payroll/periods/${year}/${month}/lock-inputs`, { reason }).then(unwrap);
export const closePayrollPeriod = (year, month, reason) =>
  apiClient.post(`/payroll/periods/${year}/${month}/close`, { reason }).then(unwrap);
export const reopenPayrollPeriod = (year, month, reason) =>
  apiClient.post(`/payroll/periods/${year}/${month}/reopen`, { reason }).then(unwrap);
export const getPayrollRun = (id) => apiClient.get(`/payroll/runs/${id}`).then(unwrap);
export const runPayroll = (payload) =>
apiClient.post("/payroll/runs", payload).then((r) => ({ ...(r.data?.data || {}), message: r.data?.message }));
// Attendance → salary for a month, per employee (before processing)
export const getPayrollAttendanceSummary = (params) =>
apiClient.get("/payroll/attendance-summary", { params }).then(unwrap);
export const savePayrollAttendanceAdjustment = (employeeId, payload) =>
apiClient.put(`/payroll/attendance-summary/${employeeId}/adjustment`, payload).then(unwrap);
export const submitPayrollReview = (id) =>
  apiClient.post(`/payroll/runs/${id}/submit-review`).then(unwrap);
export const reviewPayrollRun = (id, payload) =>
  apiClient.put(`/payroll/runs/${id}/review`, payload).then(unwrap);
export const lockPayrollRun = (id, note) =>
  apiClient.post(`/payroll/runs/${id}/lock`, { note }).then(unwrap);
export const unlockPayrollRun = (id) =>
  apiClient.delete(`/payroll/runs/${id}/lock`).then(unwrap);
export const exportBankFile = (id) =>
  apiClient.post(`/payroll/runs/${id}/bank-export`, {}, { responseType: 'blob' });
export const listPayrollPaymentBatches = (params) =>
  apiClient.get('/payroll/payment-batches', { params }).then(unwrapList);
export const getPayrollPaymentBatch = (id) =>
  apiClient.get(`/payroll/payment-batches/${id}`).then(unwrap);
export const reconcilePayrollPaymentBatch = (id, payload) =>
  apiClient.post(`/payroll/payment-batches/${id}/reconcile`, payload).then(unwrap);
