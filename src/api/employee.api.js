import apiClient, { unwrap, unwrapList } from "./client";


export const listEmployees = (params) =>
apiClient.get("/employees", { params }).then(unwrapList);


export const getEmployeeDirectory = (params) =>
apiClient.get("/employees/directory", { params }).then(unwrap);


export const getMyTeam = () =>
apiClient.get("/employees/my-team").then(unwrap);


export const getEmployee = (id) => apiClient.get(`/employees/${id}`).then(unwrap);


export const createEmployee = (payload) => apiClient.post("/employees", payload).then(unwrap);


export const updateEmployee = (id, payload) =>
apiClient.put(`/employees/${id}`, payload).then(unwrap);


export const deleteEmployee = (id) => apiClient.delete(`/employees/${id}`).then(unwrap);


export const getContactInfo = (id) => apiClient.get(`/employees/${id}/contact-info`).then(unwrap);


export const updateContactInfo = (id, payload) =>
apiClient.put(`/employees/${id}/contact-info`, payload).then(unwrap);


export const getBankDetails = (id) => apiClient.get(`/employees/${id}/bank-details`).then(unwrap);


export const updateBankDetails = (id, payload) =>
apiClient.put(`/employees/${id}/bank-details`, payload).then(unwrap);


export const getMyProfile = () => apiClient.get("/employees/me").then(unwrap);


export const getOrgChart = () => apiClient.get("/employees/org-chart").then(unwrap);


export const listRoles = () => apiClient.get("/employees/roles/list").then(unwrap);


export const changeEmployeeRole = (employeeId, roleId) =>
apiClient.put(`/employees/${employeeId}/role`, { roleId }).then(unwrap);
