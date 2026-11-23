import React, { useState, useEffect } from "react";
import { listPayslips } from "../../../api/payroll.api";
import { cssClass } from "../../../utils/classStyles";
import { ORANGE, fmtINR } from "./shared";
import { Table } from "./Table";
function ReimbStatement({
  month,
  year
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    listPayslips({
      month,
      year,
      limit: 500
    }).then(r => {
      const slips = r.data || [];
      setRows(slips.filter(s => Number(s.allowances || 0) > 0));
    }).finally(() => setLoading(false));
  }, [month, year]);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const cols = [{
    key: "emp_code",
    label: "Emp Code"
  }, {
    key: "employee_name",
    label: "Employee"
  }, {
    key: "department_name",
    label: "Department"
  }, {
    key: "month",
    label: "Month",
    render: r => `${MONTHS[r.month - 1]} ${r.year}`
  }, {
    key: "basic",
    label: "Basic",
    right: true,
    render: r => fmtINR(r.basic)
  }, {
    key: "hra",
    label: "HRA",
    right: true,
    render: r => fmtINR(r.hra)
  }, {
    key: "allowances",
    label: "Allowances / Reimbursements",
    right: true,
    render: r => <span className={cssClass({
      fontWeight: 600,
      color: ORANGE
    })}>{fmtINR(r.allowances)}</span>
  }, {
    key: "gross_earnings",
    label: "Gross",
    right: true,
    render: r => fmtINR(r.gross_earnings)
  }];
  if (loading) return <div className={cssClass({
    padding: 40,
    textAlign: "center",
    color: "#aaa"
  })}>Loading…</div>;
  return <Table cols={cols} rows={rows} emptyMsg="No reimbursement records for this month" />;
}
export { ReimbStatement };
