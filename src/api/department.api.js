import apiClient from "./client";


export async function listDepartments(params = {}) {
  const res = await apiClient.get("/departments", { params: { limit: 100, ...params } });
  return res.data?.data ?? [];
}


export async function listDesignations(params = {}) {
  const res = await apiClient.get("/designations", { params });
  return res.data?.data ?? [];
}
