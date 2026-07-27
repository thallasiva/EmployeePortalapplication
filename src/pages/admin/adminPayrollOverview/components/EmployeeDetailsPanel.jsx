import React from "react";
import { Users, TrendingUp, TrendingDown, Briefcase, Shield } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND, MONTHS } from "../constants";

const EmployeeDetailsPanel = React.memo(function EmployeeDetailsPanel({
  employees, payslips, selected, isProcessed,
}) {
  const totalEmp = employees.length;
  const selLabel = `${MONTHS[selected.month - 1]} ${selected.year}`;

  const additions = employees.filter((e) => {
    if (!e.date_of_joining) return false;
    const j = new Date(e.date_of_joining);
    return j.getMonth() + 1 === selected.month && j.getFullYear() === selected.year;
  }).length;

  const separations = employees.filter((e) => {
    const d = e.date_of_leaving || e.last_working_day;
    if (!d) return false;
    const dt = new Date(d);
    return dt.getMonth() + 1 === selected.month && dt.getFullYear() === selected.year;
  }).length;

  const stats = [
    { label: "New Joinees", value: additions,            icon: <TrendingUp size={14} color="#16a34a" />, bg: "#f0fdf4", border: "#bbf7d0", valColor: "#16a34a" },
    { label: "Separations", value: separations,          icon: <TrendingDown size={14} color="#dc2626" />, bg: "#fff1f2", border: "#fecdd3", valColor: "#dc2626" },
    { label: "Payslips",    value: payslips.length,      icon: <Briefcase size={14} color={BRAND} />,     bg: "#fff8f0", border: "#fed7aa", valColor: BRAND },
    { label: "Processed",   value: isProcessed(selected.month, selected.year) ? "Yes" : "No",
      icon: <Shield size={14} color="#7c3aed" />, bg: "#f5f3ff", border: "#ddd6fe", valColor: "#7c3aed" },
  ];

  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e9eaec", borderRadius: 14,
      padding: "22px 24px", boxShadow: "0 2px 8px #0000000d",
    })}>
      <div className={cssClass({ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 4 })}>Employee Details</div>
      <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginBottom: 16 })}>Movement — {selLabel}</div>

      <div className={cssClass({
        background: "linear-gradient(135deg,#fff8f0,#fff3e6)",
        border: `1px solid ${BRAND}25`, borderRadius: 10, padding: "16px 18px",
        display: "flex", alignItems: "center", gap: 14, marginBottom: 14,
      })}>
        <div className={cssClass({
          width: 48, height: 48, borderRadius: 10, background: BRAND,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        })}>
          <Users size={22} color="#fff" />
        </div>
        <div>
          <div className={cssClass({ fontSize: 30, fontWeight: 900, color: "#111827", lineHeight: 1 })}>{totalEmp}</div>
          <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginTop: 2 })}>Total Active Employees</div>
        </div>
      </div>

      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 })}>
        {stats.map((s) => (
          <div key={s.label} className={cssClass({
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 9, padding: "12px 14px",
          })}>
            <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 })}>
              {s.icon}
              <span className={cssClass({ fontSize: 20, fontWeight: 900, color: s.valColor })}>{s.value}</span>
            </div>
            <div className={cssClass({ fontSize: 11, color: "#6b7280", fontWeight: 600 })}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default EmployeeDetailsPanel;
