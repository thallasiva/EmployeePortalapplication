import { useState, useEffect, useMemo } from "react";
import { listPayslips } from "../../../../api/payroll.api";

export function useLOPDays(month, year) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPayslips({ month, year, limit: 500 })
      .then((r) => setRows(r.data || []))
      .finally(() => setLoading(false));
  }, [month, year]);

  const totalLOP = useMemo(
    () => rows.reduce((s, r) => s + Number(r.lop_days || 0), 0),
    [rows]
  );

  return { rows, loading, totalLOP };
}
