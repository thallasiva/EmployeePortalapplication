import React, { useState, useEffect } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { listPayslips } from "../../../../api/payroll.api";
import { ORANGE, MONTHS } from "../constants";
import { fmtINR } from "../utils";
import PayrollTable from "./PayrollTable";

function Remittances({ month, year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPayslips({ month, year, limit: 500 })
      .then((r) => {
        const slips = r.data || [];
        const monthly = slips.map((s) => {
          const b = Math.min(Number(s.basic || 0), 15000);
          const pf = +(b * 0.12).toFixed(2);
          const er_pf = +(b * 0.0367).toFixed(2);
          const eps = +(b * 0.0833).toFixed(2);
          const gross = Number(s.gross_earnings || 0);
          const esi = gross <= 21000 ? +(gross * 0.0075).toFixed(2) : 0;
          const pt = gross < 7500 ? 0 : gross < 10000 ? 175 : gross < 15000 ? 150 : 200;
          const estTDS = Math.max(0, Number(s.deductions || 0) - pf - esi - pt);
          return { ...s, pf, er_pf, eps, esi, pt, estTDS };
        });
        setRows(monthly);
      })
      .finally(() => setLoading(false));
  }, [month, year]);

  const totals = rows.reduce(
    (acc, r) => ({
      pf: acc.pf + r.pf, er_pf: acc.er_pf + r.er_pf, eps: acc.eps + r.eps,
      esi: acc.esi + r.esi, pt: acc.pt + r.pt, estTDS: acc.estTDS + r.estTDS,
    }),
    { pf: 0, er_pf: 0, eps: 0, esi: 0, pt: 0, estTDS: 0 }
  );

  const remitRows = [
    { category: "EPF — Employee Contribution (12%)", amount: totals.pf, due: "15th of next month" },
    { category: "EPF — Employer Contribution (3.67%)", amount: totals.er_pf, due: "15th of next month" },
    { category: "EPS — Employer Contribution (8.33%)", amount: totals.eps, due: "15th of next month" },
    { category: "ESI — Employee Contribution (0.75%)", amount: totals.esi, due: "15th of next month" },
    { category: "Professional Tax", amount: totals.pt, due: "Last working day" },
    { category: "TDS (Estimated)", amount: totals.estTDS, due: "7th of next month" },
  ];

  const cols = [
    { key: "category", label: "Statutory Component" },
    {
      key: "amount",
      label: `Amount — ${MONTHS[month - 1]} ${year}`,
      right: true,
      render: (r) => (
        <span className={cssClass({ fontWeight: 700, color: ORANGE })}>{fmtINR(r.amount)}</span>
      ),
    },
    { key: "due", label: "Due Date" },
    {
      key: "status",
      label: "Status",
      render: () => (
        <span className={cssClass({ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>DUE</span>
      ),
    },
  ];

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  }

  const total = remitRows.reduce((s, r) => s + r.amount, 0);
  return (
    <>
      <div className={cssClass({ marginBottom: 14, fontSize: 13, color: "#555" })}>
        Based on {rows.length} processed payslips for {MONTHS[month - 1]} {year}
      </div>
      <PayrollTable cols={cols} rows={remitRows} emptyMsg="No payslip data for this month" />
      {remitRows.length > 0 && (
        <div className={cssClass({ textAlign: "right", padding: "12px 0", fontWeight: 700, fontSize: 14 })}>
          Total Remittance:{" "}
          <span className={cssClass({ color: ORANGE })}>{fmtINR(total)}</span>
        </div>
      )}
    </>
  );
}

export default React.memo(Remittances);
