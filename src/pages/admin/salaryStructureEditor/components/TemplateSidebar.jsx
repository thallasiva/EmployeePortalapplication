import React from "react";
import { fmtINR } from "../../salary/salaryHelpers";

const Row = React.memo(function Row({ label, value, color }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "5px 0",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: color || "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
});

const TemplateSidebar = React.memo(function TemplateSidebar({
  computed,
  previewCtc = 100000,
}) {
  const components = computed?.components ?? [];
  const earnings = components.filter((c) => c.category === "Earning");
  const deductions = components.filter((c) => c.category === "Deduction");
  const employer = components.filter((c) => c.category === "Employer Contribution");

  const fixedEarnings = earnings.filter((e) => (e.frequency || "Monthly") === "Monthly");
  const variableEarnings = earnings.filter((e) => (e.frequency || "Monthly") !== "Monthly");

  const totalFixed = fixedEarnings.reduce((s, c) => s + (c.monthly_amount || 0), 0);
  const totalVarMon = variableEarnings.reduce(
    (s, c) => s + Math.round((c.annual_amount || 0) / 12),
    0
  );
  const grossMonthly = totalFixed + totalVarMon;
  const totalDeduct = deductions.reduce((s, c) => s + (c.monthly_amount || 0), 0);
  const net = Math.max(0, grossMonthly - totalDeduct);
  const empTotal = employer.reduce((s, c) => s + (c.annual_amount || 0), 0);
  const varAnnual = variableEarnings.reduce((s, c) => s + (c.annual_amount || 0), 0);
  const totalCtcAnn = previewCtc * 12;

  return (
    <div
      style={{
        width: 272,
        flexShrink: 0,
        borderLeft: "0.5px solid var(--border)",
        background: "var(--surface-2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{ padding: "14px 16px 10px", borderBottom: "0.5px solid var(--border)" }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
          Template Summary (Monthly)
        </p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        <div
          style={{
            borderBottom: "0.5px solid var(--border)",
            paddingBottom: 10,
            marginBottom: 10,
          }}
        >
          <Row label="Total Fixed Pay" value={fmtINR(totalFixed)} />
          <Row
            label="Total Variable Pay (Monthly Equiv.)"
            value={fmtINR(totalVarMon)}
          />
        </div>
        <Row label="Gross Salary" value={fmtINR(grossMonthly)} />
        <Row label="Total Deductions" value={fmtINR(totalDeduct)} color="#dc2626" />
        <div
          style={{
            margin: "10px 0",
            padding: "10px 12px",
            background: "#f0fdf4",
            borderRadius: 8,
            border: "0.5px solid #bbf7d0",
          }}
        >
          <p style={{ fontSize: 11, color: "#15803d", marginBottom: 2 }}>
            Net Salary (Take Home)
          </p>
          <p
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "#15803d",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fmtINR(net)}
          </p>
        </div>

        <div style={{ marginTop: 14 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            CTC Summary (Annual)
          </p>
          <Row label="Total Fixed Pay (Annual)" value={fmtINR(totalFixed * 12)} />
          <Row label="Total Variable Pay (Annual)" value={fmtINR(varAnnual)} />
          <Row label="Employer Contributions (Annual)" value={fmtINR(empTotal)} />
        </div>
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            background: "#eff6ff",
            borderRadius: 8,
            border: "0.5px solid #bfdbfe",
          }}
        >
          <p style={{ fontSize: 11, color: "#1d4ed8", marginBottom: 2 }}>
            Total CTC (Annual)
          </p>
          <p
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "#1d4ed8",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fmtINR(totalCtcAnn)}
          </p>
        </div>

        {components.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              ["Earnings", earnings.length, "#e0e7ff", "#3730a3"],
              ["Deductions", deductions.length, "#fee2e2", "#991b1b"],
              ["Employer", employer.length, "#dbeafe", "#1e40af"],
            ].map(([label, count, bg, fg]) => (
              <span
                key={label}
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 20,
                  background: bg,
                  color: fg,
                  fontWeight: 500,
                }}
              >
                {label}: {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default TemplateSidebar;
