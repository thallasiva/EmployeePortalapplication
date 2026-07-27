import { useState, useEffect, useMemo } from "react";
import apiClient, { unwrap } from "../../../../../api/client";
import { getCurrentUser } from "../../../../../api/auth.api";
import { deptColor } from "../constants/palette";

export function useOrgChart() {
  const [flat, setFlat] = useState([]);
  const [selfId, setSelfId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      apiClient.get("/employees/org-chart").then(unwrap),
      getCurrentUser().catch(() => null),
    ])
      .then(([rows, me]) => {
        setFlat(rows);
        setSelfId(me?.employeeId || me?.employee_id || null);
      })
      .catch((e) => setError(e?.response?.data?.message || "Failed to load org chart"))
      .finally(() => setLoading(false));
  }, []);

  const selfEmp = useMemo(() => flat.find((e) => e.employee_id === selfId) ?? null, [flat, selfId]);
  const managerId = selfEmp?.reporting_to ?? null;

  const manager = useMemo(
    () => (managerId ? flat.find((e) => e.employee_id === managerId) ?? null : null),
    [flat, managerId],
  );

  const team = useMemo(
    () => (managerId ? flat.filter((e) => e.reporting_to === managerId) : []),
    [flat, managerId],
  );

  const ancestorChain = useMemo(() => {
    if (!manager?.reporting_to) return [];
    const chain = [];
    let currentId = manager.reporting_to;
    const visited = new Set([managerId]);
    while (currentId) {
      if (visited.has(currentId)) break;
      visited.add(currentId);
      const emp = flat.find((e) => e.employee_id === currentId);
      if (!emp) break;
      chain.unshift(emp);
      currentId = emp.reporting_to;
    }
    return chain;
  }, [flat, manager, managerId]);

  const depts = useMemo(() => {
    const m = new Map();
    flat.forEach((e) => {
      if (e.department_id && !m.has(e.department_id)) {
        m.set(e.department_id, {
          id: e.department_id,
          label: e.department_name || `Dept ${e.department_id}`,
          color: deptColor(e.department_id),
        });
      }
    });
    return [...m.values()];
  }, [flat]);

  const selfDirectReports = useMemo(
    () => (selfEmp ? flat.filter((e) => e.reporting_to === selfEmp.employee_id) : []),
    [flat, selfEmp],
  );

  return {
    selfEmp, selfId, manager, managerId, team,
    ancestorChain, depts, selfDirectReports,
    loading, error,
  };
}
