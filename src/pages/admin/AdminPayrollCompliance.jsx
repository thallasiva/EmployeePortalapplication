/**
 * AdminPayrollCompliance — Admin Compliance section
 * Tabs: PAN Status | PF KYC Mapping | Remittances | Payroll Release
 */
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { listPayslips, markPayslipPaid } from "../../api/payroll.api";
import { listEmployees } from "../../api/employee.api";import { cssClass, joinClasses } from "../../utils/classStyles";

const ORANGE = "#f18200";
const TABS = [
{ key: "pan", label: "PAN Status" },
{ key: "pf-kyc", label: "PF KYC Mapping" },
{ key: "remittances", label: "Remittances" },
{ key: "release", label: "Payroll Release" }];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtINR = (v) =>
"₹ " + Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });

function MonthBar({ month, year, onChange }) {
  const now = new Date();
  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) years.push(y);
  return (
    <div className={cssClass({ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 })}>
      <select value={month} onChange={(e) => onChange(Number(e.target.value), year)} className={cssClass(
        { padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14 })}>
        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
      </select>
      <select value={year} onChange={(e) => onChange(month, Number(e.target.value))} className={cssClass(
        { padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14 })}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>);

}

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

/* ── PAN STATUS ──────────────────────────────────────────────── */
function PANStatus() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEmployees({ status: "Active", limit: 500 }).
    then((r) => setRows(r.data || [])).
    finally(() => setLoading(false));
  }, []);

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "name", label: "Employee", render: (r) => `${r.first_name || ""} ${r.last_name || ""}`.trim() },
  { key: "department_name", label: "Department" },
  { key: "pan_number", label: "PAN Number", render: (r) =>
    r.pan_number ?
    <code className={cssClass({ background: "#f0fdf4", color: "#166534", padding: "2px 6px", borderRadius: 3, fontFamily: "monospace" })}>
            {r.pan_number}
          </code> :
    <span className={cssClass({ color: "#dc2626", fontWeight: 600 })}>Not Linked</span>
  },
  { key: "uan_number", label: "UAN Number", render: (r) =>
    r.uan_number ?
    <code className={cssClass({ background: "#eff6ff", color: "#1e40af", padding: "2px 6px", borderRadius: 3 })}>
            {r.uan_number}
          </code> :
    "—"
  },
  { key: "account_number", label: "Bank Account", render: (r) =>
    r.account_number ? `****${String(r.account_number).slice(-4)}` : "—"
  },
  { key: "bank_name", label: "Bank" },
  { key: "pan_status", label: "PAN Status", render: (r) =>
    r.pan_number ?
    <span className={cssClass({ background: "#dcfce7", color: "#166534", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>VERIFIED</span> :
    <span className={cssClass({ background: "#fee2e2", color: "#991b1b", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>MISSING</span>
  }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;

  const missing = rows.filter((r) => !r.pan_number).length;
  return (
    <>
      {missing > 0 &&
      <div className={cssClass({ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#991b1b" })}>
          ⚠️ {missing} employee{missing > 1 ? "s" : ""} missing PAN number — TDS deduction may be at higher rate (20%)
        </div>
      }
      <Table cols={cols} rows={rows} emptyMsg="No employees found" />
    </>);

}

/* ── PF KYC MAPPING ──────────────────────────────────────────── */
function PFKYCMapping() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEmployees({ status: "Active", limit: 500 }).
    then((r) => setRows(r.data || [])).
    finally(() => setLoading(false));
  }, []);

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "name", label: "Employee", render: (r) => `${r.first_name || ""} ${r.last_name || ""}`.trim() },
  { key: "pf_number", label: "PF Account No.", render: (r) =>
    r.pf_number ?
    <code className={cssClass({ padding: "2px 6px", borderRadius: 3, background: "#f0fdf4", color: "#166534" })}>{r.pf_number}</code> :
    <span className={cssClass({ color: "#dc2626" })}>Not Available</span>
  },
  { key: "uan_number", label: "UAN Number", render: (r) =>
    r.uan_number ?
    <code className={cssClass({ padding: "2px 6px", borderRadius: 3, background: "#eff6ff", color: "#1e40af" })}>{r.uan_number}</code> :
    <span className={cssClass({ color: "#dc2626" })}>Not Linked</span>
  },
  { key: "pf_join_date", label: "PF Join Date", render: (r) =>
    r.pf_join_date ? new Date(r.pf_join_date).toLocaleDateString("en-IN") : "—"
  },
  { key: "esi_number", label: "ESI Number", render: (r) =>
    r.esi_number ?
    <code className={cssClass({ padding: "2px 6px", borderRadius: 3, background: "#faf5ff", color: "#6b21a8" })}>{r.esi_number}</code> :
    "—"
  },
  { key: "kyc_status", label: "KYC Status", render: (r) =>
    r.uan_number && r.pan_number ?
    <span className={cssClass({ background: "#dcfce7", color: "#166534", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>APPROVED</span> :
    <span className={cssClass({ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>PENDING</span>
  }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  return <Table cols={cols} rows={rows} emptyMsg="No employees found" />;
}

/* ── REMITTANCES ─────────────────────────────────────────────── */
function Remittances({ month, year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPayslips({ month, year, limit: 500 }).
    then((r) => {
      const slips = r.data || [];
      // Compute PF, ESI, PT, TDS per employee
      const monthly = slips.map((s) => {
        const b = Math.min(Number(s.basic || 0), 15000);
        const pf = +(b * 0.12).toFixed(2);
        const er_pf = +(b * 0.0367).toFixed(2);
        const eps = +(b * 0.0833).toFixed(2);
        const gross = Number(s.gross_earnings || 0);
        const esi = gross <= 21000 ? +(gross * 0.0075).toFixed(2) : 0;
        const pt = gross < 7500 ? 0 : gross < 10000 ? 175 : gross < 15000 ? 150 : 200;
        // TDS: from deductions total minus PF/ESI/PT
        const estTDS = Math.max(0, Number(s.deductions || 0) - pf - esi - pt);
        return { ...s, pf, er_pf, eps, esi, pt, estTDS };
      });
      setRows(monthly);
    }).
    finally(() => setLoading(false));
  }, [month, year]);

  const totals = rows.reduce((acc, r) => ({
    pf: acc.pf + r.pf, er_pf: acc.er_pf + r.er_pf, eps: acc.eps + r.eps,
    esi: acc.esi + r.esi, pt: acc.pt + r.pt, estTDS: acc.estTDS + r.estTDS
  }), { pf: 0, er_pf: 0, eps: 0, esi: 0, pt: 0, estTDS: 0 });

  const remitRows = [
  { category: "EPF — Employee Contribution (12%)", amount: totals.pf, due: "15th of next month" },
  { category: "EPF — Employer Contribution (3.67%)", amount: totals.er_pf, due: "15th of next month" },
  { category: "EPS — Employer Contribution (8.33%)", amount: totals.eps, due: "15th of next month" },
  { category: "ESI — Employee Contribution (0.75%)", amount: totals.esi, due: "15th of next month" },
  { category: "Professional Tax", amount: totals.pt, due: "Last working day" },
  { category: "TDS (Estimated)", amount: totals.estTDS, due: "7th of next month" }];


  const cols = [
  { key: "category", label: "Statutory Component" },
  { key: "amount", label: `Amount — ${MONTHS[month - 1]} ${year}`, right: true, render: (r) =>
    <span className={cssClass({ fontWeight: 700, color: ORANGE })}>{fmtINR(r.amount)}</span>
  },
  { key: "due", label: "Due Date" },
  { key: "status", label: "Status", render: () =>
    <span className={cssClass({ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>DUE</span>
  }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;

  const total = remitRows.reduce((s, r) => s + r.amount, 0);
  return (
    <>
      <div className={cssClass({ marginBottom: 14, fontSize: 13, color: "#555" })}>
        Based on {rows.length} processed payslips for {MONTHS[month - 1]} {year}
      </div>
      <Table cols={cols} rows={remitRows} emptyMsg="No payslip data for this month" />
      {remitRows.length > 0 &&
      <div className={cssClass({ textAlign: "right", padding: "12px 0", fontWeight: 700, fontSize: 14 })}>
          Total Remittance: <span className={cssClass({ color: ORANGE })}>{fmtINR(total)}</span>
        </div>
      }
    </>);

}

/* ── PAYROLL RELEASE ─────────────────────────────────────────── */
function PayrollRelease({ month, year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    listPayslips({ month, year, limit: 500 }).
    then((r) => setRows(r.data || [])).
    finally(() => setLoading(false));
  }, [month, year]);

  useEffect(() => {load();}, [load]);

  const handleRelease = async (id) => {
    setReleasing((p) => ({ ...p, [id]: true }));
    try {
      await markPayslipPaid(id);
      load();
    } catch {}
    setReleasing((p) => ({ ...p, [id]: false }));
  };

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "employee_name", label: "Employee" },
  { key: "department_name", label: "Department" },
  { key: "net_pay", label: "Net Pay", right: true, render: (r) => fmtINR(r.net_pay) },
  { key: "status", label: "Status", render: (r) => {
      const map = { paid: "#16a34a", generated: "#2563eb", draft: "#888" };
      const clr = map[r.status] || "#888";
      return <span className={cssClass({ background: clr + "22", color: clr, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>
        {(r.status || "draft").toUpperCase()}
      </span>;
    } },
  { key: "actions", label: "", render: (r) =>
    r.status === "generated" ?
    <button
      disabled={releasing[r.payslip_id]}
      onClick={() => handleRelease(r.payslip_id)} className={cssClass(
        {
          padding: "4px 14px", background: ORANGE, color: "#fff",
          border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600,
          opacity: releasing[r.payslip_id] ? 0.6 : 1
        })}>
      
          {releasing[r.payslip_id] ? "..." : "Mark Paid"}
        </button> :
    r.status === "paid" ?
    <span className={cssClass({ color: "#16a34a", fontSize: 12 })}>✓ Released</span> :

    <span className={cssClass({ color: "#aaa", fontSize: 12 })}>Not generated</span>

  }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;

  const generated = rows.filter((r) => r.status === "generated").length;
  const paid = rows.filter((r) => r.status === "paid").length;
  return (
    <>
      <div className={cssClass({ display: "flex", gap: 16, marginBottom: 16 })}>
        {[
        { label: "Total", value: rows.length, color: "#555" },
        { label: "Generated", value: generated, color: "#2563eb" },
        { label: "Released / Paid", value: paid, color: "#16a34a" },
        { label: "Pending", value: rows.length - generated - paid, color: "#888" }].
        map((s) =>
        <div key={s.label} className={cssClass({
          background: "#fff", border: "1px solid #eee", borderRadius: 8,
          padding: "12px 20px", minWidth: 100, textAlign: "center"
        })}>
            <div className={cssClass({ fontSize: 22, fontWeight: 700, color: s.color })}>{s.value}</div>
            <div className={cssClass({ fontSize: 12, color: "#888", marginTop: 2 })}>{s.label}</div>
          </div>
        )}
      </div>
      <Table cols={cols} rows={rows} emptyMsg="No payslips for this month" />
    </>);

}

/* ── MAIN ────────────────────────────────────────────────────── */
export default function AdminPayrollCompliance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "pan";

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const setTab = (t) => setSearchParams({ tab: t });
  const needsMonth = ["remittances", "release"].includes(tab);

  return (
    <div className={cssClass({ padding: "28px 32px", fontFamily: "sans-serif" })}>
      <div className={cssClass({ marginBottom: 24 })}>
        <h2 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" })}>Payroll Admin</h2>
        <p className={cssClass({ margin: "4px 0 0", color: "#888", fontSize: 13 })}>
          PAN/PF compliance, statutory remittances and payslip release management
        </p>
      </div>

      {/* Tabs */}
      <div className={cssClass({ display: "flex", gap: 0, borderBottom: "2px solid #eee", marginBottom: 24, flexWrap: "wrap" })}>
        {TABS.map((t) =>
        <button key={t.key} onClick={() => setTab(t.key)} className={cssClass(
          {
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? ORANGE : "#666",
            borderBottom: tab === t.key ? `2px solid ${ORANGE}` : "2px solid transparent",
            marginBottom: -2
          })}>
          {t.label}</button>
        )}
      </div>

      {needsMonth &&
      <MonthBar month={month} year={year} onChange={(m, y) => {setMonth(m);setYear(y);}} />
      }

      <div className={cssClass({ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: 20, boxShadow: "0 1px 4px #0000000a" })}>
        {tab === "pan" && <PANStatus />}
        {tab === "pf-kyc" && <PFKYCMapping />}
        {tab === "remittances" && <Remittances month={month} year={year} />}
        {tab === "release" && <PayrollRelease month={month} year={year} />}
      </div>
    </div>);

}
