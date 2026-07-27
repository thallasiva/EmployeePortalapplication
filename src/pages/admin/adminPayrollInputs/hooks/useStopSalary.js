import { useState, useEffect, useCallback } from "react";
import { listEmployees } from "../../../../api/employee.api";

export function useStopSalary() {
  const [emps, setEmps] = useState([]);
  const [stopped, setStopped] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEmployees({ status: "Active", limit: 500 })
      .then((r) => setEmps(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const toggleStopped = useCallback((employeeId) => {
    setStopped((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }));
  }, []);

  return { emps, stopped, loading, toggleStopped };
}
