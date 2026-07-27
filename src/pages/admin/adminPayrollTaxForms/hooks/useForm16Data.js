import { useState, useEffect } from "react";
import { listPayslips } from "../../../../api/payroll.api";

export function useForm16Data(year) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPayslips({ year, limit: 2000 })
      .then((r) => {
        const slips = r.data || [];
        const map = {};
        slips.forEach((s) => {
          if (!map[s.employee_id]) {
            map[s.employee_id] = {
              employee_id: s.employee_id,
              emp_code: s.emp_code,
              employee_name: s.employee_name,
              department_name: s.department_name,
              pan_number: s.pan_number,
              total_gross: 0,
              total_deductions: 0,
              total_net: 0,
              total_pf: 0,
              estimated_tds: 0,
              months: 0,
            };
          }
          const e = map[s.employee_id];
          e.months++;
          e.total_gross += Number(s.gross_earnings || 0);
          e.total_deductions += Number(s.deductions || 0);
          e.total_net += Number(s.net_pay || 0);
          const b = Math.min(Number(s.basic || 0), 15000);
          e.total_pf += +(b * 0.12).toFixed(2);
          const gross = Number(s.gross_earnings || 0);
          const esi = gross <= 21000 ? gross * 0.0075 : 0;
          const pt = gross < 7500 ? 0 : gross < 10000 ? 175 : gross < 15000 ? 150 : 200;
          e.estimated_tds += Math.max(0, Number(s.deductions || 0) - b * 0.12 - esi - pt);
        });
        setRows(Object.values(map));
      })
      .finally(() => setLoading(false));
  }, [year]);

  return { rows, loading };
}
