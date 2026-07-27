import { useState, useEffect, useMemo } from "react";
import { listSalaryStructures } from "../../../../api/payroll.api";

export function useSalaryStructures(search) {
  const [structs, setStructs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSalaryStructures({ limit: 500 })
      .then((r) => setStructs(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      structs.filter((s) => {
        const name = `${s.emp_code} ${s.employee_name || s.emp_name || ""}`.toLowerCase();
        return name.includes((search || "").toLowerCase());
      }),
    [structs, search]
  );

  return { structs, filtered, loading };
}
