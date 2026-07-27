import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../../../../api/client";
import { successToast, errorToast } from "../../../../utils/ToastControllers";
import { ROLE_COLORS } from "../constants";

export function useRoleManagement() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [pickedRole, setPickedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEmployees = useCallback(async () => {
    const r = await apiClient.get("/employees/with-roles");
    setEmployees(r?.data?.data ?? []);
  }, []);

  useEffect(() => {
    Promise.all([
      loadEmployees(),
      apiClient.get("/employees/roles/list").then((r) => setRoles(r?.data?.data ?? []))
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [loadEmployees]);

  const selectEmployee = useCallback((emp) => {
    setSelected(emp);
    setPickedRole(emp.role_id ?? null);
  }, []);

  const handleDesignationSaved = useCallback((employeeId, newTitle) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.employee_id === employeeId
          ? { ...e, emp_job_title: newTitle, designation_name: newTitle }
          : e
      )
    );
    setSelected((prev) =>
      prev?.employee_id === employeeId
        ? { ...prev, emp_job_title: newTitle, designation_name: newTitle }
        : prev
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!selected || !pickedRole) return;
    if (pickedRole === (selected.role_id ?? null)) {
      errorToast("No change — same role is already assigned");
      return;
    }
    setSaving(true);
    try {
      await apiClient.put(`/employees/${selected.employee_id}/role`, { roleId: pickedRole });
      successToast(`System role updated for ${selected.first_name} ${selected.last_name}`);
      await loadEmployees();
      setSelected((prev) => ({ ...prev, role_id: pickedRole }));
    } catch (err) {
      errorToast(err?.response?.data?.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  }, [selected, pickedRole, loadEmployees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => {
      const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
      return (
        !q ||
        name.includes(q) ||
        (e.emp_code || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q)
      );
    });
  }, [employees, search]);

  const getRoleLabel = useCallback(
    (roleId) => roles.find((r) => r.role_id === roleId)?.role_name || "—",
    [roles]
  );

  const getRoleStyle = useCallback(
    (roleId) => ROLE_COLORS[roleId] || ROLE_COLORS[2],
    []
  );

  return {
    employees,
    roles,
    search,
    setSearch,
    selected,
    pickedRole,
    setPickedRole,
    loading,
    saving,
    filtered,
    selectEmployee,
    handleDesignationSaved,
    handleSave,
    loadEmployees,
    getRoleLabel,
    getRoleStyle
  };
}
