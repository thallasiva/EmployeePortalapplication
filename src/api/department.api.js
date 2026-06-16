import apiClient, { unwrap } from "./client";

/** GET /api/departments — list departments (paginated, default limit is generous here). */
export async function listDepartments(params = {}) {
  const res = await apiClient.get("/departments", { params: { limit: 100, ...params } });
  return res.data?.data ?? [];
}

/** GET /api/designations?department_id= — list designations, optionally filtered by department. */
export async function listDesignations(params = {}) {
  const res = await apiClient.get("/designations", { params });
  return res.data?.data ?? [];
}
