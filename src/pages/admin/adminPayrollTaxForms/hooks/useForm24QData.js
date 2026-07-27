import { useState, useEffect } from "react";
import { listPayslips } from "../../../../api/payroll.api";

const QUARTERS = {
  Q1: { label: "Q1 (Apr–Jun)", months: [4, 5, 6] },
  Q2: { label: "Q2 (Jul–Sep)", months: [7, 8, 9] },
  Q3: { label: "Q3 (Oct–Dec)", months: [10, 11, 12] },
  Q4: { label: "Q4 (Jan–Mar)", months: [1, 2, 3] },
};

export function useForm24QData(year) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPayslips({ year, limit: 2000 })
      .then((r) => {
        const slips = r.data || [];
        const qData = {};
        Object.entries(QUARTERS).forEach(([q, { label, months }]) => {
          const qSlips = slips.filter((s) => months.includes(s.month));
          const employees = new Set(qSlips.map((s) => s.employee_id)).size;
          const totalGross = qSlips.reduce((s, r) => s + Number(r.gross_earnings || 0), 0);
          const totalTDS = qSlips.reduce((s, r) => {
            const b = Math.min(Number(r.basic || 0), 15000);
            const gross = Number(r.gross_earnings || 0);
            const esi = gross <= 21000 ? gross * 0.0075 : 0;
            const pt = gross < 7500 ? 0 : gross < 10000 ? 175 : gross < 15000 ? 150 : 200;
            return s + Math.max(0, Number(r.deductions || 0) - b * 0.12 - esi - pt);
          }, 0);
          qData[q] = { quarter: label, employees, totalGross, totalTDS, slips: qSlips.length };
        });
        setRows(Object.values(qData));
      })
      .finally(() => setLoading(false));
  }, [year]);

  return { rows, loading };
}
