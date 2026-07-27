import { useState, useEffect } from "react";
import { listSalaryStructures } from "../../../../api/payroll.api";

export function useRevisionData() {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSalaryStructures({ limit: 500 })
      .then((r) => {
        const all = r.data || [];

        const map = {};
        all.forEach((s) => {
          if (!map[s.employee_id]) map[s.employee_id] = [];
          map[s.employee_id].push(s);
        });

        const result = [];
        Object.values(map).forEach((empStructs) => {
          const sorted = empStructs.sort(
            (a, b) => new Date(a.effective_from || 0) - new Date(b.effective_from || 0)
          );
          for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            result.push({
              emp_code: curr.emp_code,
              employee_name: curr.employee_name || curr.emp_name,
              revision_date: curr.effective_from,
              prev_ctc: Number(prev.ctc || 0),
              new_ctc: Number(curr.ctc || 0),
              increment: Number(curr.ctc || 0) - Number(prev.ctc || 0),
              increment_pct: prev.ctc
                ? ((curr.ctc - prev.ctc) / prev.ctc * 100).toFixed(1)
                : "0",
            });
          }
          if (sorted.length === 1) {
            result.push({
              emp_code: sorted[0].emp_code,
              employee_name: sorted[0].employee_name || sorted[0].emp_name,
              revision_date: sorted[0].effective_from,
              prev_ctc: null,
              new_ctc: Number(sorted[0].ctc || 0),
              increment: null,
              increment_pct: null,
              is_initial: true,
            });
          }
        });

        setRevisions(
          result.sort((a, b) => new Date(b.revision_date || 0) - new Date(a.revision_date || 0))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return { revisions, loading };
}
