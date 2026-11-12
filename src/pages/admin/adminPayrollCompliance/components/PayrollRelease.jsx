import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cssClass } from "../../../../utils/classStyles";
import { listPayslips } from "../../../../api/payroll.api";
import { fmtINR } from "../utils";
import PayrollTable from "./PayrollTable";
import { Check } from "lucide-react";
function PayrollRelease({ month, year }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    listPayslips({ month, year, limit: 500 })
      .then((r) => setRows(r.data || []))
      .finally(() => setLoading(false));
  }, [month, year]);
  useEffect(() => { load(); }, [load]);
  const cols = [
    { key: "emp_code", label: "Emp Code" },
    { key: "employee_name", label: "Employee" },
    { key: "department_name", label: "Department" },
    { key: "net_pay", label: "Net Pay", right: true, render: (r) => fmtINR(r.net_pay) },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const status = String(r.status || "draft").toLowerCase();
        const map = { paid: "#16a34a", generated: "#e87500", "on hold": "#b45309", draft: "#888" };
        const clr = map[status] || "#888";
        return (
          <span className={cssClass({ background: clr + "22", color: clr, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>
            {status.toUpperCase()}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      render: (r) =>
        String(r.status).toLowerCase() === "generated" ? (
          <button type="button" onClick={() => navigate("/dashboard/payroll/payments")} className={cssClass({ padding: "4px 12px", background: "#fff7ed", color: "#b45309", border: "1px solid #fed7aa", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 700 })}>
            Reconcile payment
          </button>
        ) : String(r.status).toLowerCase() === "paid" ? (
          <span className={cssClass({ color: "#16a34a", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 3 })}><Check size={12} /> Released</span>
        ) : (
          <span className={cssClass({ color: "#aaa", fontSize: 12 })}>Not generated</span>
        ),
    },
  ];
  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  }
  const generated = rows.filter((r) => String(r.status).toLowerCase() === "generated").length;
  const paid = rows.filter((r) => String(r.status).toLowerCase() === "paid").length;
  const summaryStats = [
    { label: "Total", value: rows.length, color: "#555" },
    { label: "Generated", value: generated, color: "#e87500" },
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
