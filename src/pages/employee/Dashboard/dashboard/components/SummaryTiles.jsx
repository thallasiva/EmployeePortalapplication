import React from "react";
import { TrendingUp, Calendar, Clock } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmt } from "../utils/formatters";

const Tile = React.memo(function Tile({ icon, label, value, sub, bg, color }) {
  return (
    <div className={cssClass({
      background: "#fff", borderRadius: 10, padding: "14px 16px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 14,
    })}>
      <div className={cssClass({
        width: 42, height: 42, borderRadius: 10, background: bg || "#fff8f0",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      })}>
        {icon}
      </div>
      <div className={cssClass({ minWidth: 0 })}>
        <div className={cssClass({
          fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.05em",
        })}>{label}</div>
        <div className={cssClass({ fontSize: 18, fontWeight: 800, color: color || "#1e293b", marginTop: 2 })}>{value}</div>
        {sub && <div className={cssClass({ fontSize: 11, color: "#94a3b8", marginTop: 1 })}>{sub}</div>}
      </div>
    </div>
  );
});

const SummaryTiles = React.memo(function SummaryTiles({
  loading,
  showSal,
  sal,
  paidDays,
  workDays,
  lopDays,
  presentDays,
}) {
  return (
    <div className={cssClass({
      display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
      gap: 14, marginBottom: 20,
    })}>
      <Tile icon={<TrendingUp size={20} color="#f18200" />} label="Gross Pay" bg="#fff8f0"
        value={loading ? "…" : showSal ? `₹${fmt(sal.gross)}` : "•••••"} color="#f18200" />
      <Tile icon={<TrendingUp size={20} color="#e11d48" />} label="Deductions" bg="#fff1f2"
        value={loading ? "…" : showSal ? `₹${fmt(sal.deductions)}` : "•••••"} color="#e11d48" />
      <Tile icon={<TrendingUp size={20} color="#16a34a" />} label="Net Pay" bg="#f0fdf4"
        value={loading ? "…" : showSal ? `₹${fmt(sal.net)}` : "•••••"} color="#16a34a" />
      <Tile icon={<Calendar size={20} color="#f18200" />} label="Paid Days" bg="#fff8f0"
        value={loading ? "…" : `${paidDays}/${workDays}`}
        sub={lopDays > 0 ? `LOP: ${lopDays} days` : undefined} />
      <Tile icon={<Clock size={20} color="#6366f1" />} label="Present This Month" bg="#f5f3ff"
        value={loading ? "…" : presentDays || paidDays} color="#6366f1" />
    </div>
  );
});

export default SummaryTiles;
