import React, { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { fmtINR } from "../utils";

function employeeName(employee) {
  return employee.employee_name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Employee";
}

function buildRows(employees, attendanceRows, payslips) {
  const byEmployee = new Map();
  attendanceRows.forEach((record) => {
    const rows = byEmployee.get(Number(record.employee_id)) || [];
    rows.push(record);
    byEmployee.set(Number(record.employee_id), rows);
  });
  const payslipByEmployee = new Map(payslips.map((payslip) => [Number(payslip.employee_id), payslip]));

  return employees.map((employee) => {
    const records = byEmployee.get(Number(employee.employee_id)) || [];
    const present = records.filter((record) => ["present", "late"].includes(record.status)).length;
    const absent = records.filter((record) => record.status === "absent").length;
    const leave = records.filter((record) => record.status === "leave").length;
    const halfDays = records.filter((record) => record.status === "half_day").length;
    const lop = absent + halfDays * 0.5;
    const payslip = payslipByEmployee.get(Number(employee.employee_id));
    const salary = Number(payslip?.gross_earnings || payslip?.gross || employee.base_salary || 0);
    const workingDays = records.filter((record) => !["weekend", "holiday"].includes(record.status)).length;
    const lopDeduction = workingDays ? (salary / workingDays) * lop : 0;
    const net = payslip ? Number(payslip.net_pay || payslip.net || 0) : Math.max(0, salary - lopDeduction);

    return {
      employee,
      name: employeeName(employee),
      present,
      absent,
      leave,
      lop,
      salary,
      lopDeduction,
      net,
      processed: Boolean(payslip),
    };
  });
}

export default function PayrollEmployeeTable({ employees, attendanceRows, payslips }) {
  const [search, setSearch] = useState("");
  const rows = useMemo(() => buildRows(employees, attendanceRows, payslips), [employees, attendanceRows, payslips]);
  const filteredRows = rows.filter((row) => `${row.name} ${row.employee.emp_code || ""}`.toLowerCase().includes(search.toLowerCase()));
  const totalLop = rows.reduce((total, row) => total + row.lop, 0);
  const totalLopDeduction = rows.reduce((total, row) => total + row.lopDeduction, 0);

  const headings = ["Employee", "Salary", "Present", "Absent", "Leave", "LOP", "LOP deduction", "Net salary", "Status"];

  return (
    <section className={cssClass({ gridColumn: "1 / -1", background: "#fff", border: "1px solid #e9eaec", borderRadius: 14, padding: "22px 24px", boxShadow: "0 2px 8px #0000000d" })}>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 })}>
        <div>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 800, color: "#111827" })}><Users size={18} color="#f18200" />Employee Payroll</div>
          <div className={cssClass({ marginTop: 3, fontSize: 12, color: "#9ca3af" })}>Attendance, LOP, and salary impact for this month</div>
        </div>
        <div className={cssClass({ display: "flex", gap: 14, fontSize: 12, fontWeight: 700 })}>
          <span className={cssClass({ color: "#b45309" })}>LOP days: {totalLop}</span>
          <span className={cssClass({ color: "#dc2626" })}>LOP deduction: {fmtINR(totalLopDeduction)}</span>
        </div>
      </div>

      <div className={cssClass({ position: "relative", maxWidth: 360, marginBottom: 14 })}>
        <Search size={15} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee or code" aria-label="Search payroll employees" className={cssClass({ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #dbe1ea", borderRadius: 9, fontSize: 13, outline: "none" })} />
      </div>

      <div className={cssClass({ overflowX: "auto", border: "1px solid #eef0f3", borderRadius: 10 })}>
        <table className={cssClass({ width: "100%", minWidth: 900, borderCollapse: "collapse" })}>
          <thead><tr>{headings.map((heading) => <th key={heading} className={cssClass({ padding: "11px 12px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", color: "#64748b", fontSize: 10, fontWeight: 800, textAlign: "left", textTransform: "uppercase", whiteSpace: "nowrap" })}>{heading}</th>)}</tr></thead>
          <tbody>
            {filteredRows.map((row) => <tr key={row.employee.employee_id}>
              <td className={cssClass({ padding: 12, borderBottom: "1px solid #f1f5f9" })}><div className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1f2937" })}>{row.name}</div><div className={cssClass({ marginTop: 2, fontSize: 11, color: "#94a3b8" })}>{row.employee.emp_code || "—"}</div></td>
              <td className={cssClass({ padding: 12, borderBottom: "1px solid #f1f5f9", fontSize: 13 })}>{fmtINR(row.salary)}</td>
              <td className={cssClass({ padding: 12, borderBottom: "1px solid #f1f5f9", color: "#16a34a", fontWeight: 700 })}>{row.present}</td>
              <td className={cssClass({ padding: 12, borderBottom: "1px solid #f1f5f9", color: row.absent ? "#dc2626" : "#64748b", fontWeight: 700 })}>{row.absent}</td>
              <td className={cssClass({ padding: 12, borderBottom: "1px solid #f1f5f9", color: "#7c3aed" })}>{row.leave}</td>
              <td className={cssClass({ padding: 12, borderBottom: "1px solid #f1f5f9", color: row.lop ? "#dc2626" : "#16a34a", fontWeight: 800 })}>{row.lop}</td>
              <td className={cssClass({ padding: 12, borderBottom: "1px solid #f1f5f9", color: "#dc2626" })}>{fmtINR(row.lopDeduction)}</td>
              <td className={cssClass({ padding: 12, borderBottom: "1px solid #f1f5f9", color: "#111827", fontWeight: 800 })}>{fmtINR(row.net)}</td>
              <td className={cssClass({ padding: 12, borderBottom: "1px solid #f1f5f9" })}><span className={cssClass({ padding: "4px 8px", borderRadius: 999, background: row.processed ? "#f0fdf4" : "#fffbeb", color: row.processed ? "#15803d" : "#b45309", fontSize: 10, fontWeight: 800 })}>{row.processed ? "Processed" : "Pending"}</span></td>
            </tr>)}
          </tbody>
        </table>
        {!filteredRows.length && <div className={cssClass({ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>No employees match your search.</div>}
      </div>
    </section>
  );
}
