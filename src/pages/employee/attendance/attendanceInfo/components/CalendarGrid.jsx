import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Each status: cell background, pill background, pill text color, label
const STATUS_CFG = {
  P:    { cellBg: "#f0fdf4", pillBg: "#16a34a", pillColor: "#fff", label: "Present",  pill: "PRESENT"  },
  L:    { cellBg: "#fff7ed", pillBg: "#ea580c", pillColor: "#fff", label: "Late",     pill: "LATE"     },
  "P:A":{ cellBg: "#f0f9ff", pillBg: "#0284c7", pillColor: "#fff", label: "Half Day", pill: "HALF DAY" },
  A:    { cellBg: "#fef2f2", pillBg: "#dc2626", pillColor: "#fff", label: "Absent",   pill: "ABSENT"   },
  H:    { cellBg: "#eff6ff", pillBg: "#3b82f6", pillColor: "#fff", label: "Holiday",  pill: "HOLIDAY"  },
  LV:   { cellBg: "#faf5ff", pillBg: "#9333ea", pillColor: "#fff", label: "Leave",    pill: "LEAVE"    },
  WO:   { cellBg: "#f8fafc", pillBg: null,       pillColor: null,   label: "Weekend",  pill: null       },
};

export default function CalendarGrid({ month, year, dayMap, selectedDate, onSelect, onPrevMonth, onNextMonth, loading }) {
  const firstDow    = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr    = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const pad = String(d).padStart(2, "0");
    const mon = String(month).padStart(2, "0");
    cells.push(`${year}-${mon}-${pad}`);
  }

  const monthName = new Date(year, month - 1, 1)
    .toLocaleString("default", { month: "long" });

  function resolveCode(dateStr, rec) {
    const dow = new Date(dateStr).getDay();
    if (dow === 0 || dow === 6) return "WO";
    const raw = rec?.status?.code;
    if (raw === "L" || raw === "LV") return "LV";
    if (raw) return raw;                    // P, A, P:A, H, late → L
    if (dateStr < todayStr) return "A";     // past weekday, no record = absent
    return null;                            // future
  }

  const CELL_BORDER = "1px solid #e2e8f0";

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>

      {/* ── Month nav ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: CELL_BORDER }}>
        <button onClick={onPrevMonth} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
          <ChevronLeft size={17} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{monthName} {year}</span>
        <button onClick={onNextMonth} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
          <ChevronRight size={17} />
        </button>
      </div>

      {/* ── DOW row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f8fafc", borderBottom: CELL_BORDER }}>
        {DOW.map((d, i) => (
          <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: i === 0 || i === 6 ? "#cbd5e1" : "#94a3b8" }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Day cells ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {cells.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`b-${idx}`} style={{ minHeight: 80, background: "#f8fafc", borderBottom: CELL_BORDER, borderRight: CELL_BORDER }} />;
          }

          const rec        = dayMap?.get(dateStr);
          const code       = resolveCode(dateStr, rec);
          const cfg        = STATUS_CFG[code] || {};
          const isSelected = dateStr === selectedDate;
          const isToday    = dateStr === todayStr;
          const isFuture   = dateStr > todayStr;
          const dayNum     = parseInt(dateStr.slice(8), 10);
          const checkIn    = rec?.processed?.firstIn;
          const hasCheckIn = checkIn && checkIn !== "—";
          const canReg     = rec?.canRegularize;

          const cellStyle = {
            minHeight: 80,
            padding: "8px 8px 6px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            textAlign: "left",
            border: "none",
            borderBottom: CELL_BORDER,
            borderRight: CELL_BORDER,
            cursor: isFuture ? "default" : "pointer",
            transition: "filter .15s",
            background: isSelected
              ? "linear-gradient(135deg,#f18200,#d97000)"
              : isToday
              ? "#fff7ed"
              : cfg.cellBg || "#fff",
          };

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onSelect(dateStr)}
              disabled={loading || isFuture}
              style={cellStyle}
              onMouseEnter={e => { if (!isFuture && !isSelected) e.currentTarget.style.filter = "brightness(.96)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
            >
              {/* Day number */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  background: isSelected ? "#fff" : isToday ? "#fff7ed" : "transparent",
                  color: isSelected ? "#f18200" : isToday ? "#f18200" : isFuture ? "#cbd5e1" : code === "WO" ? "#cbd5e1" : "#374151",
                  outline: isToday && !isSelected ? "2px solid #f18200" : "none",
                }}>
                  {dayNum}
                </span>
                {canReg && !isSelected && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24" }} title="Can regularize" />
                )}
              </div>

              {/* Status pill */}
              {cfg.pill && cfg.pillBg && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
                  padding: "2px 5px", borderRadius: 5, display: "inline-block", lineHeight: 1.4,
                  background: isSelected ? "rgba(255,255,255,.25)" : cfg.pillBg,
                  color: isSelected ? "#fff" : cfg.pillColor,
                }}>
                  {cfg.pill}
                </span>
              )}

              {/* Check-in time */}
              {hasCheckIn && (
                <span style={{ fontSize: 9, fontWeight: 600, color: isSelected ? "rgba(255,255,255,.85)" : cfg.pillBg || "#94a3b8", lineHeight: 1 }}>
                  {checkIn}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", padding: "10px 20px", borderTop: CELL_BORDER, background: "#f8fafc" }}>
        {[
          { label: "Present",  color: "#16a34a" },
          { label: "Late",     color: "#ea580c" },
          { label: "Half Day", color: "#0284c7" },
          { label: "Absent",   color: "#dc2626" },
          { label: "Holiday",  color: "#3b82f6" },
          { label: "Leave",    color: "#9333ea" },
        ].map(({ label, color }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
