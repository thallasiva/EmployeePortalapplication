import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtTime } from "../utils/formatters";

const AttendanceCard = React.memo(function AttendanceCard({
  loading,
  todayAtt,
  checkIn,
  checkOut,
  elapsed,
  workHours,
  checkingIn,
  checkingOut,
  handleCheckIn,
  handleCheckOut,
  todayLabel,
}) {
  return (
    <div className={cssClass({
      background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      padding: 20, borderTop: "3px solid #f18200",
    })}>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 })}>
        <span className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b" })}>Today's Attendance</span>
        {todayAtt?.status && (
          <span className={cssClass({
            fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
            background: todayAtt.status === "Present" ? "#dcfce7" : "#fff3e0",
            color: todayAtt.status === "Present" ? "#15803d" : "#e07000",
          })}>{todayAtt.status}</span>
        )}
      </div>
      <div className={cssClass({ fontSize: 11, color: "#94a3b8", marginBottom: 18 })}>{todayLabel}</div>

      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 })}>
        {/* Check In box */}
        <div className={cssClass({
          background: checkIn ? "#f0fdf4" : "#f8fafc", borderRadius: 10, padding: "14px 12px",
          textAlign: "center", border: checkIn ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
        })}>
          <div className={cssClass({ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: checkIn ? "#16a34a" : "#94a3b8", marginBottom: 6 })}>
            Check In
          </div>
          <div className={cssClass({ fontSize: 22, fontWeight: 800, color: checkIn ? "#15803d" : "#cbd5e1", letterSpacing: "-0.02em" })}>
            {loading ? "…" : checkIn ? fmtTime(checkIn) : "—"}
          </div>
          {checkIn && (
            <div className={cssClass({ marginTop: 4, fontSize: 10, color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 })}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              Recorded
            </div>
          )}
        </div>

        {/* Check Out box */}
        <div className={cssClass({
          background: checkOut ? "#fff8f0" : "#f8fafc", borderRadius: 10, padding: "14px 12px",
          textAlign: "center", border: checkOut ? "1px solid #fde8c8" : "1px solid #e2e8f0",
        })}>
          <div className={cssClass({ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: checkOut ? "#f18200" : "#94a3b8", marginBottom: 6 })}>
            Check Out
          </div>
          <div className={cssClass({ fontSize: 22, fontWeight: 800, color: checkOut ? "#e07000" : "#cbd5e1", letterSpacing: "-0.02em" })}>
            {loading ? "…" : checkOut ? fmtTime(checkOut) : "—"}
          </div>
          {checkOut && (
            <div className={cssClass({ marginTop: 4, fontSize: 10, color: "#f18200", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 })}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f18200", display: "inline-block" }} />
              Recorded
            </div>
          )}
        </div>
      </div>

      {(elapsed || workHours) && (
        <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3.5 py-2 mb-3.5">
          <span className="text-xs text-purple-700 font-semibold">
            {elapsed && !checkOut ? "Time Elapsed" : "Work Duration"}
          </span>
          <span className="text-base font-extrabold text-purple-800 tabular-nums">
            {elapsed && !checkOut ? elapsed : workHours}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={handleCheckIn}
          disabled={!!checkIn || checkingIn || loading}
          className={`h-10 rounded-lg text-sm font-bold border-0 transition-all ${
            checkIn ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-green-600 text-white cursor-pointer hover:bg-green-700"
          }`}
        >
          {checkingIn ? "…" : checkIn ? "✓ Checked In" : "Check In"}
        </button>
        <button
          onClick={handleCheckOut}
          disabled={!checkIn || !!checkOut || checkingOut || loading}
          className={`h-10 rounded-lg text-sm font-bold border-0 transition-all ${
            checkOut ? "bg-slate-100 text-slate-400 cursor-not-allowed" :
            !checkIn ? "bg-slate-100 text-slate-400 cursor-not-allowed" :
            "bg-[#f18200] text-white cursor-pointer hover:bg-orange-600"
          }`}
        >
          {checkingOut ? "…" : checkOut ? "✓ Checked Out" : "Check Out"}
        </button>
      </div>
    </div>
  );
});

export default AttendanceCard;
