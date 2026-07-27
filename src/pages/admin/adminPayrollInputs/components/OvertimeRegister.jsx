import React, { useMemo } from "react";
import { useOvertimeRegister } from "../hooks/useOvertimeRegister";
import { fmtINR } from "../utils/formatters";
import { ORANGE } from "../constants";
import { cssClass } from "../../../../utils/classStyles";
import Table from "./Table";

const OvertimeRegister = React.memo(function OvertimeRegister({ month, year }) {
  const { rows, loading } = useOvertimeRegister(month, year);

  const cols = useMemo(() => [
    { key: "emp_code", label: "Emp Code" },
    { key: "employee_name", label: "Employee" },
    { key: "department_name", label: "Department" },
    { key: "working_days", label: "Scheduled Days", right: true },
    { key: "paid_days", label: "Worked Days", right: true },
    {
      key: "ot_days", label: "OT Days", right: true,
      render: (r) => (
        <span className={cssClass({
          color: r.ot_days > 0 ? ORANGE : "#888",
          fontWeight: r.ot_days > 0 ? 700 : 400,
        })}>
          {r.ot_days}
        </span>
      ),
    },
    {
      key: "ot_amount", label: "OT Amount (2x)", right: true,
      render: (r) => (
        <span className={cssClass({ color: r.ot_days > 0 ? ORANGE : "#888" })}>
          {fmtINR(r.ot_amount)}
        </span>
      ),
    },
    { key: "net_pay", label: "Net Pay", right: true, render: (r) => fmtINR(r.net_pay) },
  ], []);

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  }

  return (
    <Table cols={cols} rows={rows} emptyMsg="No payslip data for this month" />
  );
});

export default OvertimeRegister;
