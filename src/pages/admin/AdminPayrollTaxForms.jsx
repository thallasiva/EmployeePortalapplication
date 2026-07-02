/**
 * AdminPayrollTaxForms — Tax & statutory forms
 * Tabs: Form 16 | Form 24Q | POI Overview
 */
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { listPayslips } from "../../api/payroll.api";
import { listEmployees } from "../../api/employee.api";
import { getAllITDeclarations } from "../../api/itDeclaration.api";import { cssClass, joinClasses } from "../../utils/classStyles";

const ORANGE = "#f18200";
const TABS = [
{ key: "form16", label: "Form 16" },
{ key: "form24q", label: "Form 24Q" },
{ key: "poi", label: "POI Overview" }];


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

/* ── FORM 16 ─────────────────────────────────────────────────── */
function Form16({ year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPayslips({ year, limit: 2000 }).
    then((r) => {
      const slips = r.data || [];
      const map = {};
      slips.forEach((s) => {
        if (!map[s.employee_id]) {
          map[s.employee_id] = {
            employee_id: s.employee_id,
            emp_code: s.emp_code,
            employee_name: s.employee_name,
            department_name: s.department_name,
            pan_number: s.pan_number,
            total_gross: 0, total_deductions: 0, total_net: 0,
            total_pf: 0, estimated_tds: 0, months: 0
          };
        }
        const e = map[s.employee_id];
        e.months++;
        e.total_gross += Number(s.gross_earnings || 0);
        e.total_deductions += Number(s.deductions || 0);
        e.total_net += Number(s.net_pay || 0);
        const b = Math.min(Number(s.basic || 0), 15000);
        e.total_pf += +(b * 0.12).toFixed(2);
        // Estimated TDS = deductions - PF - ESI - PT
        const gross = Number(s.gross_earnings || 0);
        const esi = gross <= 21000 ? gross * 0.0075 : 0;
        const pt = gross < 7500 ? 0 : gross < 10000 ? 175 : gross < 15000 ? 150 : 200;
        e.estimated_tds += Math.max(0, Number(s.deductions || 0) - b * 0.12 - esi - pt);
      });
      setRows(Object.values(map));
    }).
    finally(() => setLoading(false));
  }, [year]);

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "employee_name", label: "Employee Name" },
  { key: "pan_number", label: "PAN", render: (r) =>
    r.pan_number ?
    <code className={cssClass({ fontSize: 12, background: "#f0fdf4", color: "#166534", padding: "2px 6px", borderRadius: 3 })}>{r.pan_number}</code> :
    <span className={cssClass({ color: "#dc2626" })}>Not Linked</span>
  },
  { key: "fy", label: "Financial Year", render: () => `${year}-${String(year + 1).slice(2)}` },
  { key: "total_gross", label: "Gross Salary", right: true, render: (r) => fmtINR(r.total_gross) },
  { key: "total_pf", label: "PF Deducted", right: true, render: (r) => fmtINR(r.total_pf) },
  { key: "estimated_tds", label: "TDS Deducted", right: true, render: (r) =>
    <span className={cssClass({ fontWeight: 700, color: ORANGE })}>{fmtINR(r.estimated_tds)}</span>
  },
  { key: "months", label: "Months Worked", right: true },
  { key: "status", label: "Form 16 Status", render: (r) =>
    r.months >= 12 ?
    <span className={cssClass({ background: "#dcfce7", color: "#166534", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>READY</span> :
    <span className={cssClass({ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>PARTIAL ({r.months}/12)</span>
  },
  { key: "download", label: "", render: (r) =>
    <button



      disabled={r.months === 0} className={cssClass({ padding: "4px 12px", background: r.months > 0 ? ORANGE : "#ddd", color: r.months > 0 ? "#fff" : "#aaa", border: "none", borderRadius: 4, cursor: r.months > 0 ? "pointer" : "default", fontSize: 12 })}>Download</button>
  }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  return (
    <>
      <div className={cssClass({ marginBottom: 12, fontSize: 13, color: "#666" })}>
        Form 16 — TDS Certificate for FY {year}-{String(year + 1).slice(2)}
      </div>
      <Table cols={cols} rows={rows} emptyMsg="No payslip data for this year" />
    </>);

}

/* ── FORM 24Q ─────────────────────────────────────────────────── */
function Form24Q({ year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPayslips({ year, limit: 2000 }).
    then((r) => {
      const slips = r.data || [];
      // Group by quarter
      const quarters = { Q1: { label: "Q1 (Apr–Jun)", months: [4, 5, 6] }, Q2: { label: "Q2 (Jul–Sep)", months: [7, 8, 9] }, Q3: { label: "Q3 (Oct–Dec)", months: [10, 11, 12] }, Q4: { label: "Q4 (Jan–Mar)", months: [1, 2, 3] } };
      const qData = {};
      Object.entries(quarters).forEach(([q, { label, months }]) => {
        const qSlips = slips.filter((s) => months.includes(s.month));
        const employees = new Set(qSlips.map((s) => s.employee_id)).size;
        const totalGross = qSlips.reduce((s, r) => s + Number(r.gross_earnings || 0), 0);
        const totalTDS = qSlips.reduce((s, r) => {
          const b = Math.min(Number(r.basic || 0), 15000);
          const gross = Number(r.gross_earnings || 0);
          const esi = gross <= 21000 ? gross * 0.0075 : 0;
          const pt = gross < 7500 ? 0 : gross < 10000 ? 175 : gross < 15000 ? 150 : 200;
          return s + Math.max(0, Number(r.deductions || 0) - b * 0.12 - esi - pt);
        }, 0);
        qData[q] = { quarter: label, employees, totalGross, totalTDS, slips: qSlips.length };
      });
      setRows(Object.values(qData));
    }).
    finally(() => setLoading(false));
  }, [year]);

  const cols = [
  { key: "quarter", label: "Quarter" },
  { key: "employees", label: "Employees", right: true },
  { key: "slips", label: "Payslips", right: true },
  { key: "totalGross", label: "Total Salary", right: true, render: (r) => fmtINR(r.totalGross) },
  { key: "totalTDS", label: "Total TDS", right: true, render: (r) =>
    <span className={cssClass({ fontWeight: 700, color: ORANGE })}>{fmtINR(r.totalTDS)}</span>
  },
  { key: "due_date", label: "Filing Due", render: (r) => {
      const dates = { "Q1 (Apr–Jun)": "31-Jul", "Q2 (Jul–Sep)": "31-Oct", "Q3 (Oct–Dec)": "31-Jan", "Q4 (Jan–Mar)": "31-May" };
      return dates[r.quarter] || "—";
    } },
  { key: "status", label: "Status", render: (r) =>
    r.slips > 0 ?
    <span className={cssClass({ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>PENDING FILING</span> :
    <span className={cssClass({ background: "#f3f4f6", color: "#888", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>NO DATA</span>
  }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  return (
    <>
      <div className={cssClass({ marginBottom: 12, fontSize: 13, color: "#666" })}>
        Quarterly TDS Return (Form 24Q) — FY {year}-{String(year + 1).slice(2)}
      </div>
      <Table cols={cols} rows={rows} emptyMsg="No data" />
    </>);

}

/* ── POI OVERVIEW ────────────────────────────────────────────── */
function POIOverview({ year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
    listEmployees({ status: "Active", limit: 500 }),
    getAllITDeclarations({ year, limit: 500 }).catch(() => [])]
    ).then(([empRes, declRes]) => {
      const emps = empRes.data || [];
      const decls = Array.isArray(declRes) ? declRes : declRes?.data || [];
      const declMap = {};
      decls.forEach((d) => {declMap[d.employee_id] = d;});
      setRows(emps.map((e) => ({ ...e, declaration: declMap[e.employee_id] })));
    }).finally(() => setLoading(false));
  }, [year]);

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "name", label: "Employee", render: (r) => `${r.first_name || ""} ${r.last_name || ""}`.trim() },
  { key: "department_name", label: "Department" },
  { key: "decl_status", label: "IT Declaration", render: (r) =>
    r.declaration ?
    <span className={cssClass({ background: "#dcfce7", color: "#166534", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>
            {(r.declaration.status || "SUBMITTED").toUpperCase()}
          </span> :
    <span className={cssClass({ background: "#fee2e2", color: "#991b1b", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>NOT SUBMITTED</span>
  },
  { key: "poi_status", label: "POI Submission", render: (r) =>
    r.declaration?.poi_status ?
    <span className={cssClass({ background: "#dcfce7", color: "#166534", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>UPLOADED</span> :
    <span className={cssClass({ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>PENDING</span>
  },
  { key: "declared_amount", label: "Declared Amount", right: true, render: (r) =>
    r.declaration?.total_declared ? fmtINR(r.declaration.total_declared) : "—"
  },
  { key: "approved_amount", label: "Approved Amount", right: true, render: (r) =>
    r.declaration?.total_approved ? fmtINR(r.declaration.total_approved) : "—"
  }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;

  const submitted = rows.filter((r) => r.declaration).length;
  const withPOI = rows.filter((r) => r.declaration?.poi_status).length;
  return (
    <>
      <div className={cssClass({ display: "flex", gap: 16, marginBottom: 16 })}>
        {[
        { label: "Total Employees", value: rows.length, color: ORANGE },
        { label: "Declarations Submitted", value: submitted, color: "#2563eb" },
        { label: "POI Uploaded", value: withPOI, color: "#16a34a" },
        { label: "Pending POI", value: submitted - withPOI, color: "#dc2626" }].
        map((s) =>
        <div key={s.label} className={cssClass({ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: "12px 20px", textAlign: "center" })}>
            <div className={cssClass({ fontSize: 22, fontWeight: 700, color: s.color })}>{s.value}</div>
            <div className={cssClass({ fontSize: 12, color: "#888", marginTop: 2 })}>{s.label}</div>
          </div>
        )}
      </div>
      <Table cols={cols} rows={rows} emptyMsg="No employees found" />
    </>);

}

/* ── MAIN ────────────────────────────────────────────────────── */
export default function AdminPayrollTaxForms() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "form16";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const setTab = (t) => setSearchParams({ tab: t });
  const years = [];
  for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 1; y++) years.push(y);

  return (
    <div className={cssClass({ padding: "28px 32px", fontFamily: "sans-serif" })}>
      <div className={cssClass({ marginBottom: 24 })}>
        <h2 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" })}>Tax & Statutory Forms</h2>
        <p className={cssClass({ margin: "4px 0 0", color: "#888", fontSize: 13 })}>
          Form 16, Form 24Q and Proof of Investment overview
        </p>
      </div>

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

      <div className={cssClass({ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 })}>
        <label className={cssClass({ fontSize: 13, color: "#555" })}>Financial Year:</label>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={cssClass(
          { padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14 })}>
          {years.map((y) => <option key={y} value={y}>FY {y}-{String(y + 1).slice(2)}</option>)}
        </select>
      </div>

      <div className={cssClass({ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: 20, boxShadow: "0 1px 4px #0000000a" })}>
        {tab === "form16" && <Form16 year={year} />}
        {tab === "form24q" && <Form24Q year={year} />}
        {tab === "poi" && <POIOverview year={year} />}
      </div>
    </div>);

}
