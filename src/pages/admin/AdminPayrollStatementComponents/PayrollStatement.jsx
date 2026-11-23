import React from "react";
import { cssClass } from "../../../utils/classStyles";
import { ORANGE, fmtINR } from "./shared";
import { Table } from "./Table";
function PayrollStatement({
  payslips
}) {
  const cols = [{
    key: "emp_code",
    label: "Emp Code"
  }, {
    key: "employee_name",
    label: "Name"
  }, {
    key: "department_name",
    label: "Dept"
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
    label: "Allowances",
    right: true,
    render: r => fmtINR(r.allowances)
  }, {
    key: "gross_earnings",
    label: "Gross",
    right: true,
    render: r => fmtINR(r.gross_earnings)
  }, {
    key: "deductions",
    label: "Deductions",
    right: true,
    render: r => fmtINR(r.deductions)
  }, {
    key: "net_pay",
    label: "Net Pay",
    right: true,
    render: r => <span className={cssClass({
      fontWeight: 600,
      color: ORANGE
    })}>{fmtINR(r.net_pay)}</span>
  }, {
    key: "lop_days",
    label: "LOP",
    right: true
  }, {
    key: "status",
    label: "Status",
    render: r => {
      const clr = r.status === "paid" ? "#16a34a" : r.status === "generated" ? "#e87500" : "#888";
      return <span className={cssClass({
        background: clr + "22",
        color: clr,
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600
      })}>{(r.status || "draft").toUpperCase()}</span>;
    }
  }];
  return <Table cols={cols} rows={payslips} emptyMsg="No payslips for this month" />;
}
export { PayrollStatement };
