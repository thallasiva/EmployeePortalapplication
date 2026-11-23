import React from "react";
import { cssClass } from "../../../utils/classStyles";
import { ORANGE, fmtINR } from "./shared";
import { Table } from "./Table";
function QuickStatement({
  payslips
}) {
  const cols = [{
    key: "sno",
    label: "S.No",
    render: (_, i) => i + 1
  }, {
    key: "emp_code",
    label: "Emp Code"
  }, {
    key: "employee_name",
    label: "Employee Name"
  }, {
    key: "department_name",
    label: "Department"
  }, {
    key: "working_days",
    label: "Work Days",
    right: true
  }, {
    key: "paid_days",
    label: "Paid Days",
    right: true
  }, {
    key: "lop_days",
    label: "LOP Days",
    right: true
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
  }];
  const rows = payslips.map((r, i) => ({
    ...r,
    sno: i + 1
  }));
  const totalNet = payslips.reduce((s, r) => s + Number(r.net_pay || 0), 0);
  return <>
      <Table cols={cols} rows={rows} emptyMsg="No payslips for this month" />
      {payslips.length > 0 && <div className={cssClass({
      textAlign: "right",
      padding: "12px 0",
      fontWeight: 600,
      fontSize: 14
    })}>
          Total Net Pay: <span className={cssClass({
        color: ORANGE
      })}>{fmtINR(totalNet)}</span>
        </div>}
    </>;
}
export { QuickStatement };
