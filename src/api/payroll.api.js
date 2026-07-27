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


export const markPayslipPaid = (id) =>
apiClient.put(`/payroll/payslips/${id}/mark-paid`).then(unwrap);




export const listPayrollRuns = (params) =>
apiClient.get("/payroll/runs", { params }).then(unwrapList);


export const getPayrollRun = (id) => apiClient.get(`/payroll/runs/${id}`).then(unwrap);


export const runPayroll = (payload) =>
apiClient.post("/payroll/runs", payload).then(unwrap);
