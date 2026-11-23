import React, { useState, useEffect } from "react";
import { listPayslips } from "../../../api/payroll.api";
import { listEmployees } from "../../../api/employee.api";
import { cssClass } from "../../../utils/classStyles";
import { ORANGE, fmtINR } from "./shared";
import { Table } from "./Table";
function PFYTDStatement({
  year
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    Promise.all([listPayslips({
      year,
      limit: 2000
    }), listEmployees({
      limit: 500
    })]).then(([slipRes, empRes]) => {
      const slips = slipRes.data || [];
      const emps = empRes.data || [];
      const empMap = {};
      emps.forEach(e => {
        empMap[e.employee_id] = e;
      });
      const map = {};
      slips.forEach(s => {
        const b = Math.min(Number(s.basic || 0), 15000);
        const pfEmp = +(b * 0.12).toFixed(2);
        const pfEr = +(b * 0.0367).toFixed(2);
        const eps = +(b * 0.0833).toFixed(2);
        if (!map[s.employee_id]) {
          const emp = empMap[s.employee_id] || {};
          map[s.employee_id] = {
            employee_id: s.employee_id,
            emp_code: s.emp_code,
            employee_name: s.employee_name,
            uan: emp.uan_number || "—",
            pf_number: emp.pf_number || "—",
            months: 0,
            total_pf_employee: 0,
            total_eps: 0,
            total_epf_employer: 0
          };
        }
        const e = map[s.employee_id];
        e.months++;
        e.total_pf_employee += pfEmp;
        e.total_eps += eps;
        e.total_epf_employer += pfEr;
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
    key: "uan",
    label: "UAN"
  }, {
    key: "pf_number",
    label: "PF Account No."
  }, {
    key: "months",
    label: "Months",
    right: true
  }, {
    key: "total_pf_employee",
    label: "Employee PF (12%)",
    right: true,
    render: r => fmtINR(r.total_pf_employee)
  }, {
    key: "total_eps",
    label: "EPS (8.33%)",
    right: true,
    render: r => fmtINR(r.total_eps)
  }, {
    key: "total_epf_employer",
    label: "Employer EPF (3.67%)",
    right: true,
    render: r => fmtINR(r.total_epf_employer)
  }, {
    key: "total_pf",
    label: "Total PF Contribution",
    right: true,
    render: r => <span className={cssClass({
      fontWeight: 700,
      color: ORANGE
    })}>
        {fmtINR(r.total_pf_employee + r.total_epf_employer + r.total_eps)}
      </span>
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
        Provident Fund YTD Statement — FY {year}-{String(year + 1).slice(2)}
      </div>
      <Table cols={cols} rows={rows} emptyMsg="No PF data for this year" />
    </>;
}
export { PFYTDStatement };
