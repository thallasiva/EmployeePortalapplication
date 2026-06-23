import React, { useEffect, useMemo, useState } from "react";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import { getMyPayslips, getMySalaryStructure } from "../../../api/payroll.api";
import { calculatePayslip } from "../../../utils/payslipCalculations";
import { FiscalYearPicker } from "../../../component/YearPicker";
import {
  getCurrentFiscalYearStart,
  getFiscalYearRangeLabel,
  getFiscalMonthColumns,
} from "../../../lib/dateUtils";
import InteractivePieChart, { formatINR } from "../../../component/charts/InteractivePieChart";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

// Table values: Indian format with 2 decimals, no ₹
const tblFmt = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Summary KPI: ₹ prefix
const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FISCAL_ORDER = [3,4,5,6,7,8,9,10,11,0,1,2]; // Apr=3…Mar=2

/* ─── Mini bar chart (inline SVG) ─────────────────────────────────────────── */
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 520, H = 160, barW = 30, gap = (W - data.length * barW) / (data.length + 1);
  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} width="100%" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f18200" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = Math.round((d.value / max) * H);
        const x = gap + i * (barW + gap);
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH || 2}
              fill={d.value > 0 ? "url(#barGrad)" : "#f1f5f9"} rx={4} />
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.label}</text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={8} fill="#64748b">
                {Math.round(d.value / 1000)}k
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Collapsible section row ─────────────────────────────────────────────── */
function SectionHeader({ label, expanded, onToggle, colCount }) {
  return (
    <tr style={{ background: "#fff", cursor: "pointer", userSelect: "none" }} onClick={onToggle}>
      <td colSpan={colCount} style={{ padding: "9px 14px", fontWeight: 700, color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          {label}
        </span>
      </td>
    </tr>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function YTDReports() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [payslips, setPayslips]   = useState([]);
  const [structure, setStructure] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState({ income: true, deduction: true, days: true, blanks: true });

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  useEffect(() => {
    Promise.all([
      getMyPayslips({ limit: 24 }).then((r) => Array.isArray(r) ? r : r?.data ?? []),
      getMySalaryStructure().catch(() => null),
    ])
      .then(([p, s]) => { setPayslips(p); setStructure(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fiscalMonths = getFiscalMonthColumns(fiscalYearStart);
  const fyLabel = getFiscalYearRangeLabel(fiscalYearStart);

  /* Build month-by-month data */
  const monthData = useMemo(() => {
    const fiscalYear = Number(fiscalYearStart);
    return FISCAL_ORDER.map((mIdx) => {
      const year = mIdx >= 3 ? fiscalYear : fiscalYear + 1;
      const slip = payslips.find(
        (p) => Number(p.month) === mIdx + 1 && Number(p.year) === year
      );
      if (slip) {
        return {
          label: MONTH_LABELS[mIdx], hasData: true,
          basic:     Number(slip.basic ?? 0),
          hra:       Number(slip.hra ?? 0),
          special:   Number(slip.special_allowance ?? 0),
          lta:       Number(slip.lta ?? 0),
          telephone: Number(slip.telephone_and_internet ?? 0),
          gross:     Number(slip.gross_salary ?? slip.total_earnings ?? 0),
          pf:        Number(slip.pf_employee ?? slip.pf ?? 0),
          profTax:   Number(slip.professional_tax ?? 200),
          incomeTax: Number(slip.income_tax ?? 0),
          netPay:    Number(slip.net_salary ?? slip.net_pay ?? 0),
          workDays:  Number(slip.working_days ?? 30),
          daysInMonth: Number(slip.days_in_month ?? 30),
        };
      }
      if (structure?.basic) {
        const b = calculatePayslip(Number(structure.basic));
        return {
          label: MONTH_LABELS[mIdx], hasData: false,
          basic: b.basic, hra: b.hra, special: b.specialAllowance,
          lta: b.lta, telephone: b.telephoneAndInternet,
          gross: b.totalEarnings, pf: b.pf, profTax: b.profTax,
          incomeTax: b.incomeTax, netPay: b.netSalary, workDays: 30, daysInMonth: 30,
        };
      }
      return {
        label: MONTH_LABELS[mIdx], hasData: false,
        basic: 0, hra: 0, special: 0, lta: 0, telephone: 0,
        gross: 0, pf: 0, profTax: 0, incomeTax: 0, netPay: 0, workDays: 0, daysInMonth: 0,
      };
    });
  }, [payslips, structure, fiscalYearStart]);

  const totals = useMemo(() => {
    const sum = (k) => monthData.reduce((a, m) => a + (m[k] || 0), 0);
    return {
      basic: sum("basic"), hra: sum("hra"), special: sum("special"),
      lta: sum("lta"), telephone: sum("telephone"), gross: sum("gross"),
      pf: sum("pf"), profTax: sum("profTax"), incomeTax: sum("incomeTax"),
      netPay: sum("netPay"), workDays: sum("workDays"), daysInMonth: sum("daysInMonth"),
    };
  }, [monthData]);

  const totalDeductions = totals.pf + totals.profTax + totals.incomeTax;

  /* Chart data */
  const pieData = [
    { label: "Basic", value: totals.basic, color: "#f18200" },
    { label: "HRA", value: totals.hra, color: "#fb923c" },
    { label: "Special", value: totals.special, color: "#8b5cf6" },
    { label: "LTA", value: totals.lta, color: "#f59e0b" },
    { label: "Other", value: totals.telephone, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const barData = monthData.map((m) => ({ label: m.label, value: m.netPay }));

  const colCount = fiscalMonths.length + 2; // Item + Total + months

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading YTD data…</div>;

  /* ── Table row helper ─────────────────────────────────────────────────────── */
  const DataRow = ({ label, dataKey, values, totalVal, bold, highlight }) => (
    <tr style={{
      background: highlight ? "#e8f4fa" : bold ? "#f1f5f9" : "#fff",
      borderBottom: "1px solid #e2e8f0",
    }}>
      <td style={{
        padding: "8px 14px 8px 24px", fontSize: 12, color: bold ? "#1e293b" : "#475569",
        fontWeight: bold ? 700 : 400, position: "sticky", left: 0,
        background: highlight ? "#e8f4fa" : bold ? "#f1f5f9" : "#fff",
        borderRight: "1px solid #e2e8f0", whiteSpace: "nowrap",
      }}>{label}</td>
      <td style={{
        padding: "8px 14px", textAlign: "right", fontSize: 12, fontWeight: bold ? 700 : 500,
        color: bold ? "#1e293b" : "#334155", position: "sticky", left: 150,
        background: highlight ? "#e8f4fa" : bold ? "#f1f5f9" : "#fff",
        borderRight: "1px solid #e2e8f0", whiteSpace: "nowrap",
      }}>{tblFmt(totalVal)}</td>
      {monthData.map((m, i) => (
        <td key={i} style={{
          padding: "8px 12px", textAlign: "right", fontSize: 12,
          color: (m[dataKey] || 0) > 0 ? (highlight ? "#1565c0" : "#334155") : "#94a3b8",
          whiteSpace: "nowrap",
        }}>
          {tblFmt(m[dataKey] || 0)}
        </td>
      ))}
    </tr>
  );

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>YTD Report</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <FiscalYearPicker value={fiscalYearStart} onChange={setFiscalYearStart} />
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#f18200", color: "#fff", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Download size={13} /> Download
          </button>
        </div>
      </div>

      {/* ── YTD Summary Table ─────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", border: "1px solid #d5dbe3", borderRadius: 10, marginBottom: 24, overflow: "hidden" }}>
        {/* Table title bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>YTD Summary</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>{fyLabel}</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#e8f4fa" }}>
                <th style={{ padding: "9px 14px", textAlign: "left", color: "#475569", fontWeight: 700, position: "sticky", left: 0, background: "#e8f4fa", zIndex: 2, minWidth: 150, borderRight: "1px solid #d5dbe3", borderBottom: "1px solid #d5dbe3" }}>Item</th>
                <th style={{ padding: "9px 14px", textAlign: "right", color: "#475569", fontWeight: 700, position: "sticky", left: 150, background: "#e8f4fa", zIndex: 2, minWidth: 110, borderRight: "1px solid #d5dbe3", borderBottom: "1px solid #d5dbe3" }}>Total In ₹.</th>
                {fiscalMonths.map((col) => (
                  <th key={col.key} style={{ padding: "9px 12px", textAlign: "right", color: "#475569", fontWeight: 600, whiteSpace: "nowrap", minWidth: 90, borderBottom: "1px solid #d5dbe3" }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* ── Income ── */}
              <SectionHeader label="Income" expanded={expanded.income} onToggle={() => toggle("income")} colCount={colCount} />
              {expanded.income && (
                <>
                  <DataRow label="Basic" dataKey="basic" totalVal={totals.basic} />
                  <DataRow label="HRA" dataKey="hra" totalVal={totals.hra} />
                  <DataRow label="Special Allowance" dataKey="special" totalVal={totals.special} />
                  <DataRow label="Lta" dataKey="lta" totalVal={totals.lta} />
                  <DataRow label="Telephone And Inter..." dataKey="telephone" totalVal={totals.telephone} />
                  <DataRow label="Gross" dataKey="gross" totalVal={totals.gross} bold />
                </>
              )}

              {/* ── Deduction ── */}
              <SectionHeader label="Deduction" expanded={expanded.deduction} onToggle={() => toggle("deduction")} colCount={colCount} />
              {expanded.deduction && (
                <>
                  <DataRow label="PF" dataKey="pf" totalVal={totals.pf} />
                  <DataRow label="Prof Tax" dataKey="profTax" totalVal={totals.profTax} />
                  <DataRow label="Income Tax" dataKey="incomeTax" totalVal={totals.incomeTax} />
                  {/* Total Deductions row */}
                  <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 14px 8px 24px", fontWeight: 700, color: "#1e293b", position: "sticky", left: 0, background: "#f1f5f9", borderRight: "1px solid #e2e8f0" }}>Total Deductions</td>
                    <td style={{ padding: "8px 14px", textAlign: "right", fontWeight: 700, color: "#1e293b", position: "sticky", left: 150, background: "#f1f5f9", borderRight: "1px solid #e2e8f0" }}>{tblFmt(totalDeductions)}</td>
                    {monthData.map((m, i) => (
                      <td key={i} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: (m.pf + m.profTax + m.incomeTax) > 0 ? "#1e293b" : "#94a3b8" }}>
                        {tblFmt((m.pf || 0) + (m.profTax || 0) + (m.incomeTax || 0))}
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* ── Days ── */}
              <SectionHeader label="Days" expanded={expanded.days} onToggle={() => toggle("days")} colCount={colCount} />
              {expanded.days && (
                <>
                  <DataRow label="Emp Effective Workd..." dataKey="workDays" totalVal={totals.workDays} />
                  <DataRow label="Days In Month" dataKey="daysInMonth" totalVal={totals.daysInMonth} bold />
                </>
              )}

              {/* ── (Blanks) ── */}
              <SectionHeader label="(Blanks)" expanded={expanded.blanks} onToggle={() => toggle("blanks")} colCount={colCount} />
              {expanded.blanks && (
                <DataRow label="Net Pay" dataKey="netPay" totalVal={totals.netPay} bold highlight />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Charts (below table) ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>Earnings Breakdown</p>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <InteractivePieChart data={pieData} size={160} donut title="Earnings" valueFormatter={formatINR} />
            <div style={{ flex: 1 }}>
              {pieData.map((d) => (
                <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f8fafc" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                    <span style={{ fontSize: 12, color: "#64748b" }}>{d.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>Monthly Net Pay Trend</p>
          <BarChart data={barData} />
        </div>
      </div>
    </div>
  );
}
