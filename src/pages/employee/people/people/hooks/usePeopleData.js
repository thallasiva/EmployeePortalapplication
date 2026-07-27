import { useState, useEffect, useMemo } from "react";
import apiClient, { unwrap } from "../../../../../api/client";
import { getCurrentUser } from "../../../../../api/auth.api";
import { fullName, normalize } from "../utils";

export function usePeopleData() {
  const [allEmployees, setAllEmployees] = useState([]);
  const [selfId, setSelfId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get("/employees/org-chart").then(unwrap),
      getCurrentUser().catch(() => null),
    ])
      .then(([rows, me]) => {
        const nameMap = {};
        rows.forEach((e) => { nameMap[e.employee_id] = fullName(e); });
        const normalized = rows.map((emp) => ({
          ...normalize(emp),
          reportingToName: emp.reporting_to ? nameMap[emp.reporting_to] || "—" : "—",
        }));
        setAllEmployees(normalized);
        setSelfId(me?.employeeId || me?.employee_id || null);
      })
      .catch((e) => setError(e?.response?.data?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const self = useMemo(
    () => allEmployees.find((e) => e.id === selfId) ?? null,
    [allEmployees, selfId]
  );

  const manager = useMemo(
    () => (self?.reportingToId ? allEmployees.find((e) => e.id === self.reportingToId) ?? null : null),
    [allEmployees, self]
  );

  const directReports = useMemo(
    () => allEmployees.filter((e) => e.reportingToId === selfId),
    [allEmployees, selfId]
  );

  const peers = useMemo(
    () =>
      allEmployees.filter(
        (e) =>
          e.id !== selfId &&
          e.reportingToId === self?.reportingToId &&
          e.reportingToId != null
      ),
    [allEmployees, self, selfId]
  );

  const deptTeam = useMemo(
    () =>
      allEmployees.filter(
        (e) =>
          e.id !== selfId &&
          e.departmentId === self?.departmentId &&
          e.reportingToId !== selfId &&
          e.reportingToId !== self?.reportingToId
      ),
    [allEmployees, self, selfId]
  );

  return { loading, error, self, manager, directReports, peers, deptTeam };
}
