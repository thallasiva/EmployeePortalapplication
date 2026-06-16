import apiClient, { unwrap, unwrapList } from "./client";

// --- Salary structures ---

/** GET /payroll/salary-structures?employee_id=&page=&limit= */
export const listSalaryStructures = (params) =>
  apiClient.get("/payroll/salary-structures", { params }).then(unwrapList);

/** GET /payroll/salary-structures/:id */
export const getSalaryStructure = (id) =>
  apiClient.get(`/payroll/salary-structures/${id}`).then(unwrap);

/** GET /payroll/salary-structures/me (logged-in employee's latest structure) */
export const getMySalaryStructure = () =>
  apiClient.get("/payroll/salary-structures/me").then(unwrap);

/** POST /payroll/salary-structures (create a single salary structure) */
export const createSalaryStructure = (payload) =>
  apiClient.post("/payroll/salary-structures", payload).then(unwrap);

/** PUT /payroll/salary-structures/:id */
export const updateSalaryStructure = (id, payload) =>
  apiClient.put(`/payroll/salary-structures/${id}`, payload).then(unwrap);

/** DELETE /payroll/salary-structures/:id */
export const deleteSalaryStructure = (id) =>
  apiClient.delete(`/payroll/salary-structures/${id}`).then(unwrap);

/**
 * POST /payroll/salary-structures/import — bulk import salary structures from a CSV.
 * `items` is an array of { emp_code, basic, hra, conveyance, medical_allowance,
 * special_allowance, pf_employee, pf_employer, professional_tax, income_tax, ctc, effective_from }
 */
export const importSalaryStructures = (items) =>
  apiClient.post("/payroll/salary-structures/import", { items }).then(unwrap);

// --- Payslips ---

/** GET /payroll/payslips?employee_id=&month=&year=&status=&department_id=&page=&limit= */
export const listPayslips = (params) =>
  apiClient.get("/payroll/payslips", { params }).then(unwrapList);

/** GET /payroll/payslips/me?month=&year=&status= */
export const getMyPayslips = (params) =>
  apiClient.get("/payroll/payslips/me", { params }).then(unwrapList);

/** GET /payroll/payslips/:id */
export const getPayslip = (id) => apiClient.get(`/payroll/payslips/${id}`).then(unwrap);

/**
 * GET /payroll/payslips/:id/full — full payslip view-model for the printable
 * payslip layout (employee/company/bank details, earnings/deductions
 * breakdown, net pay in words, TDS / Income Tax Deduction / Tax Paid
 * Details sections).
 */
export const getPayslipFull = (id) =>
  apiClient.get(`/payroll/payslips/${id}/full`).then(unwrap);

/** POST /payroll/payslips/generate — { employee_id, month, year } */
export const generatePayslip = (payload) =>
  apiClient.post("/payroll/payslips/generate", payload).then(unwrap);

/**
 * POST /payroll/payslips/me/generate — { month?, year? } (self-service).
 * Generates (or refreshes) the logged-in employee's own payslip for the
 * given month/year, defaulting to the current month. Safe to call
 * repeatedly — idempotent on (employee_id, month, year).
 */
export const generateMyPayslip = (payload) =>
  apiClient.post("/payroll/payslips/me/generate", payload).then(unwrap);

/**
 * POST /payroll/payslips/generate-all — { month, year }
 * Generates payslips for every active employee and emails each a summary.
 */
export const generateAllPayslips = (payload) =>
  apiClient.post("/payroll/payslips/generate-all", payload).then(unwrap);

/** PUT /payroll/payslips/:id/mark-paid */
export const markPayslipPaid = (id) =>
  apiClient.put(`/payroll/payslips/${id}/mark-paid`).then(unwrap);

// --- Payroll runs ---

/** GET /payroll/runs?year=&status=&page=&limit= */
export const listPayrollRuns = (params) =>
  apiClient.get("/payroll/runs", { params }).then(unwrapList);

/** GET /payroll/runs/:id */
export const getPayrollRun = (id) => apiClient.get(`/payroll/runs/${id}`).then(unwrap);

/** POST /payroll/runs — { month, year } */
export const runPayroll = (payload) =>
  apiClient.post("/payroll/runs", payload).then(unwrap);
