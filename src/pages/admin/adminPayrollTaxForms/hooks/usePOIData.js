import { useState, useEffect } from "react";
import { listEmployees } from "../../../../api/employee.api";
import { getAllITDeclarations } from "../../../../api/itDeclaration.api";

export function usePOIData(year) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listEmployees({ status: "Active", limit: 500 }),
      getAllITDeclarations({ year, limit: 500 }).catch(() => []),
    ])
      .then(([empRes, declRes]) => {
        const emps = empRes.data || [];
        const decls = Array.isArray(declRes) ? declRes : declRes?.data || [];
        const declMap = {};
        decls.forEach((d) => {
          declMap[d.employee_id] = d;
        });
        setRows(emps.map((e) => ({ ...e, declaration: declMap[e.employee_id] })));
      })
      .finally(() => setLoading(false));
  }, [year]);

  return { rows, loading };
}
