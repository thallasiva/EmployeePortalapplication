import React, { useMemo } from "react";
import { useLOPDays } from "../hooks/useLOPDays";
import { fmtINR } from "../utils/formatters";
import { cssClass } from "../../../../utils/classStyles";
import Table from "./Table";

const LOPDays = React.memo(function LOPDays({ month, year }) {
  const { rows, loading, totalLOP } = useLOPDays(month, year);

  const cols = useMemo(() => [
    { key: "emp_code", label: "Emp Code" },
    { key: "employee_name", label: "Employee Name" },
    { key: "department_name", label: "Department" },
    { key: "working_days", label: "Working Days", right: true },
    { key: "paid_days", label: "Paid Days", right: true },
    {
      key: "lop_days", label: "LOP Days", right: true,
      render: (r) => (
        <span className={cssClass({ fontWeight: 600, color: Number(r.lop_days) > 0 ? "#dc2626" : "#333" })}>
          {r.lop_days || 0}
        </span>
      ),
    },
    {
      key: "lop_deduction", label: "LOP Deduction", right: true,
      render: (r) => {
        const daily = Number(r.gross_earnings || 0) / Math.max(Number(r.working_days || 26), 1);
        return (
          <span className={cssClass({ color: "#dc2626" })}>
            {fmtINR(daily * Number(r.lop_days || 0))}
          </span>
        );
      },
    },
    { key: "net_pay", label: "Net Pay", right: true, render: (r) => fmtINR(r.net_pay) },
  ], []);

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  }

  return (
    <>
      <Table cols={cols} rows={rows} emptyMsg="No payslip data for this month" />
      {rows.length > 0 && (
        <div className={cssClass({ textAlign: "right", padding: "10px 0", fontSize: 13, color: "#888" })}>
          Total LOP Days this month:{" "}
          <strong className={cssClass({ color: "#dc2626" })}>{totalLOP}</strong>
        </div>
      )}
    </>
  );
});

export default LOPDays;
