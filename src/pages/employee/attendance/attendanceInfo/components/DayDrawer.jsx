import React, { useMemo } from "react";
import { X, Clock, Coffee, AlertCircle, LogIn, LogOut } from "lucide-react";

function fmtTime(t) {
  if (!t) return "—";
  const s = String(t);
  const time = s.includes("T") ? s.slice(11, 16) : s.slice(0, 5);
  const [h, m] = time.split(":").map(Number);
  return `${((h % 12) || 12)}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function minsToHM(m) {
  if (!m || m <= 0) return "0m";
  const h = Math.floor(m / 60), mn = m % 60;
  return h > 0 ? `${h}h ${mn}m` : `${mn}m`;
}
function hoursToHM(hrs) {
  if (!hrs || hrs <= 0) return "—";
  const h = Math.floor(hrs), m = Math.round((hrs - h) * 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

const STATUS_COLOR = {
  P: "#16a34a", L: "#ea580c", "P:A": "#0284c7",
  A: "#dc2626", H: "#3b82f6", LV: "#9333ea", WO: "#94a3b8",
};

const PUNCH_CFG = {
  CHECK_IN:    { icon: LogIn,   color: "#16a34a", bg: "#f0fdf4", label: "Check In"    },
  BREAK_START: { icon: Coffee,  color: "#d97706", bg: "#fffbeb", label: "Break Start" },
  BREAK_END:   { icon: Coffee,  color: "#f18200", bg: "#fff7ed", label: "Break End"   },
  CHECK_OUT:   { icon: LogOut,  color: "#dc2626", bg: "#fef2f2", label: "Check Out"   },
  // legacy punch types
  IN:  { icon: LogIn,  color: "#16a34a", bg: "#f0fdf4", label: "Check In"  },
  OUT: { icon: LogOut, color: "#dc2626", bg: "#fef2f2", label: "Check Out" },
};

export default function DayDrawer({ entry, swipesLoading, onClose }) {
  const punches = useMemo(() => entry?.raw?.punches || [], [entry]);

  if (!entry) return null;

  const { raw, processed, status } = entry;
  const code       = status?.code;
  const accentColor = STATUS_COLOR[code] || "#f18200";
  const checkIn    = fmtTime(raw?.check_in);
  const checkOut   = fmtTime(raw?.check_out);
  const worked     = hoursToHM(raw?.work_hours);
  const breakTime  = minsToHM(raw?.break_minutes);
  const lateBy     = raw?.late_by_minutes > 0 ? minsToHM(raw.late_by_minutes) : null;

  // Format display date
  const dt = new Date(entry.date + "T00:00:00");
  const dateLabel = dt.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,.08)", overflow: "hidden" }}>

      {/* ── Gradient header ── */}
      <div style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, padding: "16px 16px 14px", position: "relative" }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(255,255,255,.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
        >
          <X size={14} />
        </button>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
          {dateLabel}
        </p>

        {/* IN / OUT big display */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Check In</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{checkIn}</p>
          </div>
          <div style={{ width: 1, height: 36, background: "rgba(255,255,255,.3)" }} />
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Check Out</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{checkOut}</p>
          </div>
          {code && (
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, background: "rgba(255,255,255,.2)", color: "#fff", padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em" }}>
              {code}
            </span>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderBottom: "1px solid #f1f5f9" }}>
        {[
          { icon: Clock,        color: "#16a34a", label: "Work",  value: worked   },
          { icon: Coffee,       color: "#d97706", label: "Break", value: breakTime },
          { icon: AlertCircle,  color: "#ef4444", label: "Late",  value: lateBy || "—" },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} style={{ padding: "12px 0", textAlign: "center", borderRight: "1px solid #f1f5f9" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px" }}>
              <Icon size={13} color={color} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>{value}</p>
            <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Punch timeline ── */}
      <div style={{ padding: "14px 16px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Punch Timeline
        </p>

        {swipesLoading ? (
          <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>Loading swipe details...</p>
        ) : punches.length === 0 ? (
          <p style={{ fontSize: 12, color: "#cbd5e1", textAlign: "center", padding: "12px 0" }}>No punch records for this day</p>
        ) : (
          <div style={{ position: "relative" }}>
            {/* vertical line */}
            <div style={{ position: "absolute", left: 17, top: 0, bottom: 0, width: 2, background: "#f1f5f9", borderRadius: 2 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {punches.map((p, i) => {
                const cfg = PUNCH_CFG[p.punch_type] || PUNCH_CFG.IN;
                const Icon = cfg.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
                    {/* dot */}
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: cfg.bg, border: `2px solid ${cfg.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                      <Icon size={13} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, background: cfg.bg, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#374151", fontVariantNumeric: "tabular-nums" }}>
                        {p.punch_time || "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
