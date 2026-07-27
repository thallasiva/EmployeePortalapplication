import { useState, useEffect } from "react";
import { listEmployees } from "../../../../../api/employee.api";
import { listHolidays } from "../../../../../api/holiday.api";

export function useEngageData() {
  const [employees, setEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const yr = new Date().getFullYear();
    setLoading(true);
    Promise.allSettled([
      listEmployees({ limit: 500, status: "active" }),
      listHolidays({ year: yr, limit: 50 }),
    ]).then(([emp, hol]) => {
      const arr = (v) =>
        v.status === "fulfilled"
          ? Array.isArray(v.value) ? v.value : (v.value?.data ?? [])
          : [];
      setEmployees(arr(emp));
      setHolidays(arr(hol));
    }).finally(() => setLoading(false));
  }, []);

  return { employees, holidays, loading };
}
