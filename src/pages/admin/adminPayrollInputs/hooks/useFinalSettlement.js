import { useState, useEffect } from "react";
import { listEmployees } from "../../../../api/employee.api";

const isSeparated = (e) =>
  e.has_left_organization ||
  e.employee_status === "Resigned" ||
  e.employee_status === "Terminated";

export function useFinalSettlement(month, year) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listEmployees({ has_left: true, limit: 500 })
      .then((r) => {
        const emps = r.data || [];
        setRows(emps.filter(isSeparated));
      })
      .catch(() => {
        listEmployees({ limit: 500 })
          .then((r) => {
            const emps = r.data || [];
            setRows(emps.filter(isSeparated));
          })
          .finally(() => setLoading(false));
        setLoading(false);
      })
      .finally(() => setLoading(false));
  }, [month, year]);

  return { rows, loading };
}
