import apiClient, { unwrap, unwrapList } from "./client";

/** GET /employees?page=&limit=&department=&status=&search= */
export const listEmployees = (params) =>
  apiClient.get("/employees", { params }).then(unwrapList);

/** GET /employees/directory?location=&department=&holidayCalendar= */
export const getEmployeeDirectory = (params) =>
  apiClient.get("/employees/directory", { params }).then(unwrap);

/** GET /employees/:id */
export const getEmployee = (id) => apiClient.get(`/employees/${id}`).then(unwrap);

/** POST /employees */
export const createEmployee = (payload) => apiClient.post("/employees", payload).then(unwrap);

/** PUT /employees/:id */
export const updateEmployee = (id, payload) =>
  apiClient.put(`/employees/${id}`, payload).then(unwrap);

/** DELETE /employees/:id */
export const deleteEmployee = (id) => apiClient.delete(`/employees/${id}`).then(unwrap);

/** GET /employees/:id/contact-info */
export const getContactInfo = (id) => apiClient.get(`/employees/${id}/contact-info`).then(unwrap);

/** PUT /employees/:id/contact-info */
export const updateContactInfo = (id, payload) =>
  apiClient.put(`/employees/${id}/contact-info`, payload).then(unwrap);

/** GET /employees/:id/bank-details */
export const getBankDetails = (id) => apiClient.get(`/employees/${id}/bank-details`).then(unwrap);

/** PUT /employees/:id/bank-details */
export const updateBankDetails = (id, payload) =>
  apiClient.put(`/employees/${id}/bank-details`, payload).then(unwrap);
