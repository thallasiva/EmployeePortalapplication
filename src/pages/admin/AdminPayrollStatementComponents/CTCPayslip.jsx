import React from "react";
import { cssClass } from "../../../utils/classStyles";
import { fmtINR } from "./shared";
import { Table } from "./Table";
function CTCPayslip({
  payslips
}) {
  const cols = [{
    key: "emp_code",
    label: "Emp Code"
  }, {
    key: "employee_name",
    label: "Employee"
  }, {
    key: "designation_name",
    label: "Designation"
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
    key: "ctc",
    label: "CTC",
    right: true,
    render: r => {
      const ctc = Number(r.ctc) > 0 ? Number(r.ctc) : Number(r.ctc_computed) || 0;
      return <span className={cssClass({
        fontWeight: 600
      })}>{fmtINR(ctc)}</span>;
    }
  }, {
    key: "ctcAnnual",
    label: "Annual CTC",
    right: true,
    render: r => {
      const ctc = Number(r.ctc) > 0 ? Number(r.ctc) : Number(r.ctc_computed) || 0;
      return fmtINR(ctc * 12);
    }
  }];
  return <Table cols={cols} rows={payslips} emptyMsg="No payslips for this month" />;
}
export { CTCPayslip };
