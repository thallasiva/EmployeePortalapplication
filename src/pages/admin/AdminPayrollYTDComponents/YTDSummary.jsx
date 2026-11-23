import React, { useState, useEffect } from "react";
import { listPayslips } from "../../../api/payroll.api";
import { cssClass } from "../../../utils/classStyles";
import { ORANGE, fmtINR } from "./shared";
import { Table } from "./Table";
function YTDSummary({
  year
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    listPayslips({
      year,
      limit: 2000
    }).then(r => {
      const slips = r.data || [];
      const map = {};
      slips.forEach(s => {
        if (!map[s.employee_id]) {
          map[s.employee_id] = {
            employee_id: s.employee_id,
            emp_code: s.emp_code,
            employee_name: s.employee_name,
            department_name: s.department_name,
            designation_name: s.designation_name,
            months: 0,
            total_gross: 0,
            total_deductions: 0,
            total_net: 0,
            total_lop: 0
          };
        }
        const e = map[s.employee_id];
        e.months++;
        e.total_gross += Number(s.gross_earnings || 0);
        e.total_deductions += Number(s.deductions || 0);
        e.total_net += Number(s.net_pay || 0);
        e.total_lop += Number(s.lop_days || 0);
      });
      setRows(Object.values(map));
    }).finally(() => setLoading(false));
  }, [year]);
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
    key: "months",
    label: "Months Processed",
    right: true
  }, {
    key: "total_gross",
    label: "Total Gross",
    right: true,
    render: r => fmtINR(r.total_gross)
  }, {
    key: "total_deductions",
    label: "Total Deductions",
    right: true,
    render: r => fmtINR(r.total_deductions)
  }, {
    key: "total_net",
    label: "Total Net Pay",
    right: true,
    render: r => <span className={cssClass({
      fontWeight: 700,
      color: ORANGE
    })}>{fmtINR(r.total_net)}</span>
  }, {
    key: "total_lop",
    label: "Total LOP Days",
    right: true
  }];
  if (loading) return <div className={cssClass({
    padding: 40,
    textAlign: "center",
    color: "#aaa"
  })}>Loading…</div>;
  return <>
      <div className={cssClass({
      marginBottom: 12,
      fontSize: 13,
      color: "#666"
    })}>
        YTD Summary for FY {year}-{String(year + 1).slice(2)}
      </div>
      <Table cols={cols} rows={rows} emptyMsg="No payslip data for this year" />
    </>;
}
export { YTDSummary };
