import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtTime } from "../utils/formatters";
import { MapPin, Check, Play, Pause } from "lucide-react";
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
  checkinLocation,
  checkoutLocation,
  onBreak,
}) {
  return (
    <div className={cssClass({
      background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      padding: 12, border: "1px solid #e2e8f0",
    })}>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 })}>
        <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#1e293b" })}>Today's Attendance</span>
        {todayAtt?.status && (
          <span className={cssClass({
            fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
            background: todayAtt.status === "Present" ? "#dcfce7" : "#fff3e0",
            color: todayAtt.status === "Present" ? "#15803d" : "#e07000",
          })}>{todayAtt.status}</span>
        )}
      </div>
      <div className={cssClass({ fontSize: 9, color: "#94a3b8", marginBottom: 8 })}>{todayLabel}</div>
      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 8 })}>
        {/* Check In box */}
        <div className={cssClass({
          background: checkIn ? "#f0fdf4" : "#f8fafc", borderRadius: 9, padding: "8px 5px",
          textAlign: "center", border: checkIn ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
        })}>
          <div className={cssClass({ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: checkIn ? "#16a34a" : "#94a3b8", marginBottom: 3 })}>
            Check In
          </div>
          <div className={cssClass({ fontSize: 16, fontWeight: 800, color: checkIn ? "#15803d" : "#cbd5e1", letterSpacing: "-0.02em" })}>
            {loading ? "…" : checkIn ? fmtTime(checkIn) : "—"}
          </div>
          {checkIn && (
            <div className={cssClass({ marginTop: 4, fontSize: 10, color: "#16a34a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 })}>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                Recorded
              </div>
              {(checkinLocation || todayAtt?.checkin_location) && (
                <div style={{ fontSize: 9, color: "#4ade80", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }} title={checkinLocation || todayAtt?.checkin_location}>
                  <MapPin size={11} className="inline -mt-0.5" /> {checkinLocation || todayAtt?.checkin_location}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Check Out box */}
        <div className={cssClass({
          background: checkOut ? "#fff8f0" : "#f8fafc", borderRadius: 9, padding: "8px 5px",
          textAlign: "center", border: checkOut ? "1px solid #fde8c8" : "1px solid #e2e8f0",
        })}>
          <div className={cssClass({ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: checkOut ? "#e87500" : "#94a3b8", marginBottom: 3 })}>
            Check Out
          </div>
          <div className={cssClass({ fontSize: 16, fontWeight: 800, color: checkOut ? "#e87500" : "#cbd5e1", letterSpacing: "-0.02em" })}>
            {loading ? "…" : checkOut ? fmtTime(checkOut) : "—"}
          </div>
          {checkOut && (
            <div className={cssClass({ marginTop: 4, fontSize: 10, color: "#e87500", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 })}>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e87500", display: "inline-block" }} />
                Recorded
              </div>
              {(checkoutLocation || todayAtt?.checkout_location) && (
                <div style={{ fontSize: 9, color: "#fb923c", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }} title={checkoutLocation || todayAtt?.checkout_location}>
                  <MapPin size={11} className="inline -mt-0.5" /> {checkoutLocation || todayAtt?.checkout_location}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {(elapsed || workHours) && (
        <div className="flex items-center justify-between bg-orange-50 rounded-lg px-2.5 py-1.5 mb-2">
          <span className="text-[10px] text-[#e87500] font-semibold">
            {elapsed && !checkOut ? "Time Elapsed" : "Work Duration"}
          </span>
          <span className="text-xs font-extrabold text-[#e87500] tabular-nums">
            {elapsed && !checkOut ? elapsed : workHours}
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={handleCheckIn}
          disabled={(!!checkIn && !onBreak) || checkingIn || loading}
          className={`h-8 rounded-lg text-[10px] font-bold border-0 transition-all ${
            checkIn && !onBreak
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : onBreak
              ? "bg-[#e87500] text-white cursor-pointer hover:bg-blue-700"
              : "bg-green-600 text-white cursor-pointer hover:bg-green-700"
          }`}
        >
          {checkingIn ? "…" : checkIn && !onBreak ? <span className="inline-flex items-center gap-1"><Check size={13} /> Checked In</span> : onBreak ? <span className="inline-flex items-center gap-1"><Play size={13} /> Resume</span> : "Check In"}
        </button>
        <button
          onClick={handleCheckOut}
          disabled={!checkIn || onBreak || checkingOut || loading}
          className={`h-8 rounded-lg text-[10px] font-bold border-0 transition-all ${
            onBreak
              ? "bg-amber-100 text-amber-500 cursor-not-allowed"
              : !checkIn
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-[#e87500] text-white cursor-pointer hover:bg-orange-600"
          }`}
        >
          {checkingOut ? "…" : onBreak ? <span className="inline-flex items-center gap-1"><Pause size={13} /> On Break</span> : "Check Out"}
        </button>
      </div>
    </div>
  );
});
export default AttendanceCard;
