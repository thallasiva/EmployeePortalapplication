import React, { useEffect, useMemo, useState } from "react";
import { Download, ChevronUp, ChevronDown } from "lucide-react";
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

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FISCAL_ORDER = [3,4,5,6,7,8,9,10,11,0,1,2]; // Apr=3…Mar=2 (JS month indices)

/* ─── Mini bar chart (inline SVG) ─────────────────────────────────────────── */

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 520, H = 160, barW = 30, gap = (W - data.length * barW) / (data.length + 1);
  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} width="100%" style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const barH = Math.round((d.value / max) * H);
        const x = gap + i * (barW + gap);
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH}
              fill={d.value > 0 ? "url(#barGrad)" : "#f1f5f9"} rx={4} />
            <text x={x + barW / 2} y={H + 16} textAnchor="middle"
              fontSize={9} fill="#94a3b8">{d.label}</text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                fontSize={8} fill="#64748b">
                {Math.round(d.value / 1000)}k
              </text>
            )}
          </g>
        );
      })}
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */

export default function YTDReports() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [payslips, setPayslips]   = useState([]);
  const [structure, setStructure] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("ytd");
  const [expanded, setExpanded]   = useState({ income: true, deductions: true, days: true });

  useEffect(() => {
    Promise.all([
      getMyPayslips({ limit: 24 }).then((r) => Array.isArray(r) ? r : r?.data ?? []),
      getMySalaryStructure().catch(() => null),
    ])
      .then(([p, s]) => { setPayslips(p); setStructure(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Build month-by-month data ------------------------------------------------ */
  const monthData = useMemo(() => {
    const fiscalYear = Number(fiscalYearStart);
    return FISCAL_ORDER.map((mIdx) => {
      const year = mIdx >= 3 ? fiscalYear : fiscalYear + 1;
      const slip = payslips.find(
        (p) => Number(p.month) === mIdx + 1 && Number(p.year) === year
      );
      if (slip) {
        return {
          label: MONTH_LABELS[mIdx],
          gross:       Number(slip.gross_salary  ?? slip.total_earnings ?? 0),
          basic:       Number(slip.basic         ?? 0),
          hra:         Number(slip.hra           ?? 0),
          special:     Number(slip.special_allowance ?? 0),
          lta:         Number(slip.lta           ?? 0),
          telephone:   Number(slip.telephone_and_internet ?? 0),
          pf:          Number(slip.pf_employee   ?? slip.pf ?? 0),
          profTax:     Number(slip.professional_tax ?? 200),
          incomeTax:   Number(slip.income_tax    ?? 0),
          netPay:      Number(slip.net_salary    ?? slip.net_pay ?? 0),
          days:        Number(slip.working_days  ?? 30),
        };
      }
      // If no payslip, use structure for a projected value
      if (structure?.basic) {
        const b = calculatePayslip(Number(structure.basic));
        return {
          label: MONTH_LABELS[mIdx], projected: true,
          gross: b.totalEarnings, basic: b.basic, hra: b.hra,
          special: b.specialAllowance, lta: b.lta, telephone: b.telephoneAndInternet,
          pf: b.pf, profTax: b.profTax, incomeTax: b.incomeTax, netPay: b.netSalary, days: 30,
        };
      }
      return { label: MONTH_LABELS[mIdx], gross: 0, basic: 0, hra: 0, special: 0, lta: 0, telephone: 0, pf: 0, profTax: 0, incomeTax: 0, netPay: 0, days: 0 };
    });
  }, [payslips, structure, fiscalYearStart]);

  const totals = useMemo(() => {
    const sum = (k) => monthData.reduce((a, m) => a + (m[k] || 0), 0);
    return { gross: sum("gross"), basic: sum("basic"), hra: sum("hra"), special: sum("special"),
      lta: sum("lta"), telephone: sum("telephone"), pf: sum("pf"),
      profTax: sum("profTax"), incomeTax: sum("incomeTax"), netPay: sum("netPay"), days: sum("days") };
  }, [monthData]);

  /* Chart data -------------------------------------------------------------- */
  const pieData = [
    { label: "Basic", value: totals.basic, color: "#3b82f6" },
    { label: "HRA", value: totals.hra, color: "#06b6d4" },
    { label: "Special", value: totals.special, color: "#8b5cf6" },
    { label: "LTA", value: totals.lta, color: "#f59e0b" },
    { label: "Other", value: totals.gross - totals.basic - totals.hra - totals.special - totals.lta, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const barData = monthData.map((m) => ({ label: m.label, value: m.netPay }));

  const fyLabel = getFiscalYearRangeLabel(fiscalYearStart);
  const fiscalMonths = getFiscalMonthColumns(fiscalYearStart);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading YTD data…</div>;

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>YTD Report</h1>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>{fyLabel}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <FiscalYearPicker value={fiscalYearStart} onChange={setFiscalYearStart}
            selectClassName="h-[38px] px-4 border border-[#d5dbe3] bg-white rounded text-[14px] outline-none" />
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#3b82f6", color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Download size={14} />Excel
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#1e293b", color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Download size={14} />PDF
          </button>
        </div>
      </div>

      {/* Summary KPI row */}
      {[
        { label: "Gross Paid (YTD)", value: fmt(totals.gross), color: "#1e293b" },
        { label: "Total Deductions", value: fmt(totals.pf + totals.profTax + totals.incomeTax), color: "#ef4444" },
        { label: "Net Paid (YTD)", value: fmt(totals.netPay), color: "#15803d" },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ display: "inline-block", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 24px", marginRight: 14, marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
          <p style={{ fontSize: 22, fontWeight: 800, color, margin: "6px 0 0" }}>{value}</p>
        </div>
      ))}

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["ytd", "pfytd"].map((t) => (
          <button key={t} type="button" onClick={() => setActiveTab(t)}
            style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: activeTab === t ? "#3b82f6" : "#fff",
              color: activeTab === t ? "#fff" : "#64748b",
              border: activeTab === t ? "none" : "1px solid #e2e8f0",
              cursor: "pointer",
            }}>
            {t === "ytd" ? "YTD Statement" : "PF YTD Statement"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700, position: "sticky", left: 0, background: "#f1f5f9", zIndex: 2, minWidth: 160 }}>Item</th>
                <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700, position: "sticky", left: 160, background: "#f1f5f9", zIndex: 2, minWidth: 100 }}>Total ₹</th>
                {fiscalMonths.map((col) => (
                  <th key={col.key} style={{ padding: "10px 12px", textAlign: "right", color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Income section */}
              <tr style={{ background: "#f8fafc", cursor: "pointer" }} onClick={() => setExpanded((p) => ({ ...p, income: !p.income }))}>
                <td colSpan={fiscalMonths.length + 2} style={{ padding: "9px 14px", fontWeight: 700, color: "#1e293b" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {expanded.income ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Income
                  </span>
                </td>
              </tr>
              {expanded.income && [
                { key: "basic", label: "Basic Salary" },
                { key: "hra", label: "HRA" },
                { key: "special", label: "Special Allowance" },
                { key: "lta", label: "LTA" },
                { key: "telephone", label: "Telephone & Internet" },
                { key: "gross", label: "Gross", bold: true },
              ].map(({ key, label, bold }) => (
                <tr key={key} style={{ background: bold ? "#f0f9ff" : "#fff", borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 14px", fontWeight: bold ? 700 : 400, color: "#475569", position: "sticky", left: 0, background: bold ? "#f0f9ff" : "#fff" }}>{label}</td>
                  <td style={{ padding: "8px 14px", textAlign: "right", fontWeight: bold ? 700 : 500, color: "#1e293b", position: "sticky", left: 160, background: bold ? "#f0f9ff" : "#fff" }}>{fmt(totals[key])}</td>
                  {monthData.map((m, i) => (
                    <td key={i} style={{ padding: "8px 12px", textAlign: "right", color: m[key] > 0 ? "#334155" : "#cbd5e1" }}>
                      {m[key] > 0 ? fmt(m[key]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Deductions section */}
              <tr style={{ background: "#f8fafc", cursor: "pointer" }} onClick={() => setExpanded((p) => ({ ...p, deductions: !p.deductions }))}>
                <td colSpan={fiscalMonths.length + 2} style={{ padding: "9px 14px", fontWeight: 700, color: "#1e293b" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {expanded.deductions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Deductions
                  </span>
                </td>
              </tr>
              {expanded.deductions && [
                { key: "pf", label: "PF" },
                { key: "profTax", label: "Professional Tax" },
                { key: "incomeTax", label: "Income Tax" },
              ].map(({ key, label }) => (
                <tr key={key} style={{ background: "#fff", borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 14px", color: "#475569", position: "sticky", left: 0, background: "#fff" }}>{label}</td>
                  <td style={{ padding: "8px 14px", textAlign: "right", fontWeight: 500, color: "#1e293b", position: "sticky", left: 160, background: "#fff" }}>{fmt(totals[key])}</td>
                  {monthData.map((m, i) => (
                    <td key={i} style={{ padding: "8px 12px", textAlign: "right", color: m[key] > 0 ? "#334155" : "#cbd5e1" }}>
                      {m[key] > 0 ? fmt(m[key]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Net pay */}
              <tr style={{ background: "#fefce8", borderTop: "2px solid #fbbf24" }}>
                <td style={{ padding: "10px 14px", fontWeight: 800, color: "#92400e", position: "sticky", left: 0, background: "#fefce8" }}>Net Pay</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#92400e", position: "sticky", left: 160, background: "#fefce8" }}>{fmt(totals.netPay)}</td>
                {monthData.map((m, i) => (
                  <td key={i} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: m.netPay > 0 ? "#92400e" : "#d1d5db", background: "#fefce8" }}>
                    {m.netPay > 0 ? fmt(m.netPay) : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
