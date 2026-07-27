import React, { useState, useEffect, useCallback } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { listPayslips, markPayslipPaid } from "../../../../api/payroll.api";
import { ORANGE } from "../constants";
import { fmtINR } from "../utils";
import PayrollTable from "./PayrollTable";

function PayrollRelease({ month, year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    listPayslips({ month, year, limit: 500 })
      .then((r) => setRows(r.data || []))
      .finally(() => setLoading(false));
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const handleRelease = useCallback(async (id) => {
    setReleasing((p) => ({ ...p, [id]: true }));
    try {
      await markPayslipPaid(id);
      load();
    } catch {}
    setReleasing((p) => ({ ...p, [id]: false }));
  }, [load]);

  const cols = [
    { key: "emp_code", label: "Emp Code" },
    { key: "employee_name", label: "Employee" },
    { key: "department_name", label: "Department" },
    { key: "net_pay", label: "Net Pay", right: true, render: (r) => fmtINR(r.net_pay) },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const map = { paid: "#16a34a", generated: "#2563eb", draft: "#888" };
        const clr = map[r.status] || "#888";
        return (
          <span className={cssClass({ background: clr + "22", color: clr, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>
            {(r.status || "draft").toUpperCase()}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      render: (r) =>
        r.status === "generated" ? (
          <button
            disabled={releasing[r.payslip_id]}
            onClick={() => handleRelease(r.payslip_id)}
            className={cssClass({
              padding: "4px 14px", background: ORANGE, color: "#fff",
              border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600,
              opacity: releasing[r.payslip_id] ? 0.6 : 1,
            })}
          >
            {releasing[r.payslip_id] ? "..." : "Mark Paid"}
          </button>
        ) : r.status === "paid" ? (
          <span className={cssClass({ color: "#16a34a", fontSize: 12 })}>✓ Released</span>
        ) : (
          <span className={cssClass({ color: "#aaa", fontSize: 12 })}>Not generated</span>
        ),
    },
  ];

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  }

  const generated = rows.filter((r) => r.status === "generated").length;
  const paid = rows.filter((r) => r.status === "paid").length;
  const summaryStats = [
    { label: "Total", value: rows.length, color: "#555" },
    { label: "Generated", value: generated, color: "#2563eb" },
    { label: "Released / Paid", value: paid, color: "#16a34a" },
    { label: "Pending", value: rows.length - generated - paid, color: "#888" },
  ];

  return (
    <>
      <div className={cssClass({ display: "flex", gap: 16, marginBottom: 16 })}>
        {summaryStats.map((s) => (
          <div
            key={s.label}
            className={cssClass({
              background: "#fff", border: "1px solid #eee", borderRadius: 8,
              padding: "12px 20px", minWidth: 100, textAlign: "center",
            })}
          >
            <div className={cssClass({ fontSize: 22, fontWeight: 700, color: s.color })}>{s.value}</div>
            <div className={cssClass({ fontSize: 12, color: "#888", marginTop: 2 })}>{s.label}</div>
          </div>
        ))}
      </div>
      <PayrollTable cols={cols} rows={rows} emptyMsg="No payslips for this month" />
    </>
  );
}

export default React.memo(PayrollRelease);
