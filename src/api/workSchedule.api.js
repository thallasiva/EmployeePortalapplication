import apiClient, { unwrap } from "./client";
const BASE = "/work-schedules";

export const listWorkSchedules    = ()             => apiClient.get(BASE).then(unwrap);
export const getEmployeeSchedule  = (empId)        => apiClient.get(`${BASE}/${empId}`).then(unwrap);
export const saveEmployeeSchedule = (empId, body)  => apiClient.put(`${BASE}/${empId}`, body).then(unwrap);
export const resetEmployeeSchedule = (empId)       => apiClient.delete(`${BASE}/${empId}`).then(unwrap);
