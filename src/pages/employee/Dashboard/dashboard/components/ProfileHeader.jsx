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

      {/* Attendance info — display only, no action buttons */}
     

      {/* Greeting */}
      <div className={cssClass({ textAlign: "right" })}>
        <div className={cssClass({ fontSize: 14, opacity: 0.85 })}>{greeting()}</div>
        <div className={cssClass({ fontSize: 11, opacity: 0.65, marginTop: 2 })}>{payslipLabel}</div>
      </div>
    </div>
  );
});

export default ProfileHeader;
