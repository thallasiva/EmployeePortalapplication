import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { greeting, fmtTime } from "../utils/formatters";

const ProfileHeader = React.memo(function ProfileHeader({
  loading,
  initials,
  empName,
  empCode,
  designation,
  department,
  joinDate,
  payslipLabel,
  checkIn,
  checkOut,
  elapsed,
  checkingIn,
  checkingOut,
  handleCheckIn,
  handleCheckOut,
  todayAtt,
}) {
  return (
    <div className={cssClass({
      background: "linear-gradient(135deg,#f18200 0%,#e07000 100%)", borderRadius: 12,
      padding: "20px 24px", marginBottom: 20, display: "flex", flexWrap: "wrap",
      alignItems: "center", gap: 20, color: "#fff",
    })}>
      {/* Avatar */}
      <div className={cssClass({
        width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0,
      })}>
        {loading ? "…" : initials}
      </div>

      {/* Employee info */}
      <div className={cssClass({ flex: 1, minWidth: 200 })}>
        <div className={cssClass({ fontSize: 20, fontWeight: 800 })}>
          {loading ? "Loading…" : empName || "Employee"}
        </div>
        <div className={cssClass({ fontSize: 13, opacity: 0.85, marginTop: 3 })}>
          {empCode} &nbsp;·&nbsp; {designation} &nbsp;·&nbsp; {department}
        </div>
        <div className={cssClass({ fontSize: 12, opacity: 0.7, marginTop: 2 })}>
          Joined: {joinDate}
        </div>
      </div>

      {/* Attendance mini-widget */}
      <div className={cssClass({
        background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "14px 20px",
        minWidth: 220, textAlign: "center",
      })}>
        <div className={cssClass({ fontSize: 11, opacity: 0.8, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
          Today's Attendance
        </div>
        <div className="flex justify-center gap-4 mb-2">
          <div className="text-center">
            <div className="text-[10px] opacity-70 mb-0.5 uppercase tracking-widest">Check In</div>
            <div className="text-sm font-bold">{loading ? "…" : fmtTime(checkIn)}</div>
          </div>
          <div className="w-px bg-white/30 self-stretch" />
          <div className="text-center">
            <div className="text-[10px] opacity-70 mb-0.5 uppercase tracking-widest">Check Out</div>
            <div className="text-sm font-bold">{loading ? "…" : fmtTime(checkOut)}</div>
          </div>
        </div>
        {elapsed && (
          <div className="text-center mb-2">
            <div className="text-[10px] opacity-60 uppercase tracking-widest mb-0.5">Time Elapsed</div>
            <div className="text-[22px] font-black tracking-widest text-white tabular-nums">{elapsed}</div>
          </div>
        )}
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleCheckIn}
            disabled={!!checkIn || checkingIn || loading}
            className={`flex-1 h-8 rounded-lg text-xs font-bold border-0 transition-all ${
              checkIn ? "bg-white/10 text-white/40 cursor-not-allowed" : "bg-white/95 text-[#f18200] cursor-pointer hover:bg-white"
            }`}
          >
            {checkingIn ? "…" : checkIn ? "✓ Checked In" : "Check In"}
          </button>
          <button
            onClick={handleCheckOut}
            disabled={!checkIn || !!checkOut || checkingOut || loading}
            className={`flex-1 h-8 rounded-lg text-xs font-bold border-0 transition-all ${
              checkOut ? "bg-white/10 text-white/40 cursor-not-allowed" :
              !checkIn ? "bg-white/10 text-white/30 cursor-not-allowed" :
              "bg-white/95 text-[#f18200] cursor-pointer hover:bg-white"
            }`}
          >
            {checkingOut ? "…" : checkOut ? "✓ Checked Out" : "Check Out"}
          </button>
        </div>
        {todayAtt?.status && (
          <div className={cssClass({ fontSize: 11, marginTop: 6, opacity: 0.7 })}>{todayAtt.status}</div>
        )}
      </div>

      {/* Greeting */}
      <div className={cssClass({ textAlign: "right" })}>
        <div className={cssClass({ fontSize: 14, opacity: 0.85 })}>{greeting()}</div>
        <div className={cssClass({ fontSize: 11, opacity: 0.65, marginTop: 2 })}>{payslipLabel}</div>
      </div>
    </div>
  );
});

export default ProfileHeader;
