import { useState, useEffect } from "react";
import { listPayslips } from "../../../../api/payroll.api";

export function useOvertimeRegister(month, year) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPayslips({ month, year, limit: 500 })
      .then((r) => {
        const slips = r.data || [];
        const withOT = slips.map((s) => {
          const ot_days = Math.max(
            0,
            Number(s.paid_days || 0) - Number(s.working_days || 0)
          );
          const daily =
            Number(s.gross_earnings || 0) /
            Math.max(Number(s.working_days || 26), 1);
          return { ...s, ot_days, ot_amount: +(daily * ot_days * 2).toFixed(2) };
        });
        setRows(withOT);
      })
      .finally(() => setLoading(false));
  }, [month, year]);

  return { rows, loading };
}
