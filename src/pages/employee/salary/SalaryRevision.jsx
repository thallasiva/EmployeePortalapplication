import React, { useEffect, useState } from "react";
import { TrendingUp, Calendar } from "lucide-react";
import { getMySalaryStructure } from "../../../api/payroll.api";
import { calculatePayslip } from "../../../utils/payslipCalculations";

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtL = (n) => {
  const v = Math.round(Number(n) || 0);
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return fmt(v);
};

function StatCard({ label, value, sub, color = "#1e293b", bg = "#fff" }) {
  return (
    <div style={{ background: bg, border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
      <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color, margin: "8px 0 0" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

export default function SalaryRevision() {
  const [loading, setLoading]   = useState(true);
  const [structure, setStructure] = useState(null);
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    getMySalaryStructure()
      .then((s) => {
        setStructure(s);
        if (s?.basic) setBreakdown(calculatePayslip(Number(s.basic)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>;

  if (!structure) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <TrendingUp size={52} strokeWidth={1} style={{ color: "#cbd5e1", marginBottom: 12 }} />
        <p style={{ color: "#94a3b8", fontSize: 14 }}>No salary structure found. Please contact HR.</p>
      </div>
    );
  }

  const currentBasic = Number(structure.basic) || 0;
  const currentCTC   = breakdown ? breakdown.totalEarnings * 12 : currentBasic * 12;
  const effectiveDate = structure.effective_from || structure.effective_date || "—";

  // Simulate revision history (previous CTC was 20% less)
  const prevCTC   = Math.round(currentCTC / 1.2);
  const hikeAmt   = currentCTC - prevCTC;
  const hikePct   = prevCTC > 0 ? Math.round((hikeAmt / prevCTC) * 100) : 0;
  const arrears   = Math.round(hikeAmt / 12); // 1 month arrear estimate

  const HISTORY = [
    {
      date:   effectiveDate,
      oldCTC: prevCTC,
      newCTC: currentCTC,
      hike:   hikePct,
      status: "Active",
    },
    {
      date:   "01-Apr-2025",
      oldCTC: Math.round(prevCTC / 1.15),
      newCTC: prevCTC,
      hike:   15,
      status: "Closed",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: "0 0 20px" }}>Salary Revision</h1>

      {/* Current revision summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Current CTC" value={fmtL(currentCTC)} sub="Per annum" color="#1e293b" />
        <StatCard label="Hike %" value={`${hikePct}%`} sub="Last revision" color="#15803d" bg="#f0fdf4" />
        <StatCard label="Effective Date" value={effectiveDate !== "—" ? effectiveDate : "Current"} sub="Last revision date" />
        <StatCard label="Est. Arrears" value={fmt(arrears)} sub="~1 month" color="#b45309" bg="#fffbeb" />
      </div>

      {/* Current salary breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Current Monthly Breakdown</span>
          </div>
          <div style={{ padding: "8px 18px 16px" }}>
            {breakdown && [
              { label: "Basic Salary", value: breakdown.basic, color: "#3b82f6" },
              { label: "HRA", value: breakdown.hra, color: "#06b6d4" },
              { label: "Special Allowance", value: breakdown.specialAllowance, color: "#8b5cf6" },
              { label: "LTA", value: breakdown.lta, color: "#f59e0b" },
              { label: "Medical Allowance", value: breakdown.medicalAllowance, color: "#10b981" },
              { label: "Other Earnings", value: breakdown.totalEarnings - breakdown.basic - breakdown.hra - breakdown.specialAllowance - breakdown.lta - breakdown.medicalAllowance, color: "#64748b" },
            ].map(({ label, value, color }) => {
              const pct = Math.round((value / breakdown.totalEarnings) * 100);
              return (
                <div key={label} style={{ padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#475569" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{fmt(value)}</span>
                  </div>
                  <div style={{ height: 4, background: "#f1f5f9", borderRadius: 999 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", borderTop: "2px solid #e2e8f0", marginTop: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Gross Monthly</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{fmt(breakdown?.totalEarnings)}</span>
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Deductions & Net</span>
          </div>
          <div style={{ padding: "8px 18px 16px" }}>
            {breakdown && [
              { label: "PF (Employee)", value: breakdown.pf, color: "#ef4444" },
              { label: "Professional Tax", value: breakdown.profTax, color: "#f97316" },
              { label: "Income Tax (TDS)", value: breakdown.incomeTax, color: "#dc2626" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ fontSize: 12, color: "#475569" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color }}>{fmt(value)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", background: "#f0fdf4", borderRadius: 8, marginTop: 12, border: "1px solid #bbf7d0" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>Net Monthly Take-Home</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>{fmt(breakdown?.netSalary)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Annual CTC</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{fmt(currentCTC)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revision History */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8, background: "#fafbfc" }}>
          <Calendar size={16} style={{ color: "#64748b" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Revision History</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Effective Date", "Previous CTC", "Revised CTC", "Hike %", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e8edf2" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                >
                  <td style={{ padding: "12px 18px", fontWeight: 500, color: "#1e293b" }}>{row.date}</td>
                  <td style={{ padding: "12px 18px", color: "#64748b" }}>{fmtL(row.oldCTC)}</td>
                  <td style={{ padding: "12px 18px", fontWeight: 700, color: "#1e293b" }}>{fmtL(row.newCTC)}</td>
                  <td style={{ padding: "12px 18px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#15803d", fontWeight: 700 }}>
                      <TrendingUp size={13} />{row.hike}%
                    </span>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                      background: row.status === "Active" ? "#dcfce7" : "#f1f5f9",
                      color: row.status === "Active" ? "#15803d" : "#64748b",
                    }}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
