/**
 * AdminPayrollYTD — Published Info section
 * Tabs: YTD Summary | PF YTD Statement | Reimbursement Statement
 */
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { listPayslips } from "../../api/payroll.api";
import { listEmployees } from "../../api/employee.api";import { cssClass, joinClasses } from "../../utils/classStyles";

const ORANGE = "#f18200";
const TABS = [
{ key: "ytd", label: "YTD Summary" },
{ key: "pf-ytd", label: "PF YTD Statement" },
{ key: "reimb", label: "Reimbursement Statement" }];


const fmtINR = (v) =>
"₹ " + Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });

function Table({ cols, rows, emptyMsg = "No data" }) {
  if (!rows.length) return (
    <div className={cssClass({ textAlign: "center", padding: 60, color: "#aaa", fontSize: 14 })}>{emptyMsg}</div>);

  return (
    <div className={cssClass({ overflowX: "auto" })}>
      <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
        <thead>
          <tr className={cssClass({ background: "#fafafa" })}>
            {cols.map((c) =>
            <th key={c.key} className={cssClass({
              padding: "10px 12px", textAlign: c.right ? "right" : "left",
              borderBottom: "2px solid #eee", color: "#555", fontWeight: 600, whiteSpace: "nowrap"
            })}>{c.label}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) =>
          <tr key={i} className={cssClass({ background: i % 2 === 0 ? "#fff" : "#fafafa" })}>
              {cols.map((c) =>
            <td key={c.key} className={cssClass({
              padding: "9px 12px", borderBottom: "1px solid #f0f0f0",
              textAlign: c.right ? "right" : "left", color: "#333", whiteSpace: "nowrap"
            })}>
                  {c.render ? c.render(r) : r[c.key] ?? "—"}
                </td>
            )}
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}

/* ── YTD SUMMARY ─────────────────────────────────────────────── */
function YTDSummary({ year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch all payslips for the year
    listPayslips({ year, limit: 2000 }).
    then((r) => {
      const slips = r.data || [];
      // Group by employee
      const map = {};
      slips.forEach((s) => {
        if (!map[s.employee_id]) {
          map[s.employee_id] = {
            employee_id: s.employee_id,
            emp_code: s.emp_code,
            employee_name: s.employee_name,
            department_name: s.department_name,
            designation_name: s.designation_name,
            months: 0, total_gross: 0, total_deductions: 0, total_net: 0, total_lop: 0
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
    }).
    finally(() => setLoading(false));
  }, [year]);

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "employee_name", label: "Employee" },
  { key: "department_name", label: "Department" },
  { key: "months", label: "Months Processed", right: true },
  { key: "total_gross", label: "Total Gross", right: true, render: (r) => fmtINR(r.total_gross) },
  { key: "total_deductions", label: "Total Deductions", right: true, render: (r) => fmtINR(r.total_deductions) },
  { key: "total_net", label: "Total Net Pay", right: true, render: (r) =>
    <span className={cssClass({ fontWeight: 700, color: ORANGE })}>{fmtINR(r.total_net)}</span>
  },
  { key: "total_lop", label: "Total LOP Days", right: true }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  return (
    <>
      <div className={cssClass({ marginBottom: 12, fontSize: 13, color: "#666" })}>
        YTD Summary for FY {year}-{String(year + 1).slice(2)}
      </div>
      <Table cols={cols} rows={rows} emptyMsg="No payslip data for this year" />
    </>);

}

/* ── PF YTD STATEMENT ────────────────────────────────────────── */
function PFYTDStatement({ year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
    listPayslips({ year, limit: 2000 }),
    listEmployees({ limit: 500 })]
    ).then(([slipRes, empRes]) => {
      const slips = slipRes.data || [];
      const emps = empRes.data || [];
      const empMap = {};
      emps.forEach((e) => {empMap[e.employee_id] = e;});

      const map = {};
      slips.forEach((s) => {
        const b = Math.min(Number(s.basic || 0), 15000);
        const pfEmp = +(b * 0.12).toFixed(2);
        const pfEr = +(b * 0.0367).toFixed(2); // EPF employer (8.33% to pension + 3.67% to EPF)
        const eps = +(b * 0.0833).toFixed(2);
        if (!map[s.employee_id]) {
          const emp = empMap[s.employee_id] || {};
          map[s.employee_id] = {
            employee_id: s.employee_id,
            emp_code: s.emp_code,
            employee_name: s.employee_name,
            uan: emp.uan_number || "—",
            pf_number: emp.pf_number || "—",
            months: 0, total_pf_employee: 0, total_eps: 0, total_epf_employer: 0
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

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "employee_name", label: "Employee" },
  { key: "uan", label: "UAN" },
  { key: "pf_number", label: "PF Account No." },
  { key: "months", label: "Months", right: true },
  { key: "total_pf_employee", label: "Employee PF (12%)", right: true, render: (r) => fmtINR(r.total_pf_employee) },
  { key: "total_eps", label: "EPS (8.33%)", right: true, render: (r) => fmtINR(r.total_eps) },
  { key: "total_epf_employer", label: "Employer EPF (3.67%)", right: true, render: (r) => fmtINR(r.total_epf_employer) },
  { key: "total_pf", label: "Total PF Contribution", right: true, render: (r) =>
    <span className={cssClass({ fontWeight: 700, color: ORANGE })}>
        {fmtINR(r.total_pf_employee + r.total_epf_employer + r.total_eps)}
      </span>
  }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  return (
    <>
      <div className={cssClass({ marginBottom: 12, fontSize: 13, color: "#666" })}>
        Provident Fund YTD Statement — FY {year}-{String(year + 1).slice(2)}
      </div>
      <Table cols={cols} rows={rows} emptyMsg="No PF data for this year" />
    </>);

}

/* ── REIMBURSEMENT STATEMENT ─────────────────────────────────── */
function ReimbStatement({ month, year }) {
  // Reimbursements are part of allowances in payslips
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPayslips({ month, year, limit: 500 }).
    then((r) => {
      const slips = r.data || [];
      // Show employees with allowances (which include reimbursements)
      setRows(slips.filter((s) => Number(s.allowances || 0) > 0));
    }).
    finally(() => setLoading(false));
  }, [month, year]);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "employee_name", label: "Employee" },
  { key: "department_name", label: "Department" },
  { key: "month", label: "Month", render: (r) => `${MONTHS[r.month - 1]} ${r.year}` },
  { key: "basic", label: "Basic", right: true, render: (r) => fmtINR(r.basic) },
  { key: "hra", label: "HRA", right: true, render: (r) => fmtINR(r.hra) },
  { key: "allowances", label: "Allowances / Reimbursements", right: true,
    render: (r) => <span className={cssClass({ fontWeight: 600, color: ORANGE })}>{fmtINR(r.allowances)}</span> },
  { key: "gross_earnings", label: "Gross", right: true, render: (r) => fmtINR(r.gross_earnings) }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  return <Table cols={cols} rows={rows} emptyMsg="No reimbursement records for this month" />;
}

/* ── MAIN ────────────────────────────────────────────────────── */
export default function AdminPayrollYTD() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "ytd";

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const setTab = (t) => setSearchParams({ tab: t });

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) years.push(y);

  return (
    <div className={cssClass({ padding: "28px 32px", fontFamily: "sans-serif" })}>
      <div className={cssClass({ marginBottom: 24 })}>
        <h2 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" })}>Published Info</h2>
        <p className={cssClass({ margin: "4px 0 0", color: "#888", fontSize: 13 })}>
          Year-to-date earnings, PF contributions and reimbursements
        </p>
      </div>

      {/* Tabs */}
      <div className={cssClass({ display: "flex", gap: 0, borderBottom: "2px solid #eee", marginBottom: 24 })}>
        {TABS.map((t) =>
        <button key={t.key} onClick={() => setTab(t.key)} className={cssClass(
          {
            padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? ORANGE : "#666",
            borderBottom: tab === t.key ? `2px solid ${ORANGE}` : "2px solid transparent",
            marginBottom: -2
          })}>
          {t.label}</button>
        )}
      </div>

      {/* Year selector for YTD/PF, Month+Year for Reimb */}
      <div className={cssClass({ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 })}>
        {tab === "reimb" &&
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={cssClass(
          { padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14 })}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        }
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={cssClass(
          { padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14 })}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className={cssClass({ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: 20, boxShadow: "0 1px 4px #0000000a" })}>
        {tab === "ytd" && <YTDSummary year={year} />}
        {tab === "pf-ytd" && <PFYTDStatement year={year} />}
        {tab === "reimb" && <ReimbStatement month={month} year={year} />}
      </div>
    </div>);

}
