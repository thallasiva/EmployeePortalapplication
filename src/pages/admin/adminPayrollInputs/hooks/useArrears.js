import { useState, useEffect } from "react";
import { listSalaryStructures } from "../../../../api/payroll.api";

export function useArrears(year) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listSalaryStructures({ limit: 500 })
      .then((r) => {
        const structs = r.data || [];
        const map = {};
        structs.forEach((s) => {
          if (!map[s.employee_id]) {
            map[s.employee_id] = {
              employee_id: s.employee_id,
              emp_code: s.emp_code,
              employee_name: s.employee_name || s.emp_name,
              revisions: [],
            };
          }
          map[s.employee_id].revisions.push(s);
        });

        const arrears = [];
        Object.values(map).forEach((emp) => {
          const sorted = emp.revisions.sort(
            (a, b) => new Date(a.effective_from || 0) - new Date(b.effective_from || 0)
          );
          for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            const diff =
              Number(curr.net_pay || curr.ctc || 0) -
              Number(prev.net_pay || prev.ctc || 0);
            if (diff > 0) {
              arrears.push({
                emp_code: emp.emp_code,
                employee_name: emp.employee_name,
                prev_effective: prev.effective_from,
                curr_effective: curr.effective_from,
                prev_ctc: prev.ctc || prev.gross,
                curr_ctc: curr.ctc || curr.gross,
                arrears_diff: diff,
              });
            }
          }
        });
        setRows(arrears);
      })
      .finally(() => setLoading(false));
  }, [year]);

  return { rows, loading };
}
