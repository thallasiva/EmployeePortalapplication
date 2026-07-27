import React from "react";
import { CalendarDays, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND, NOTICE } from "../constants";
import { fmtDate } from "../utils";
import Chip from "./Chip";

const NoticeSidebar = React.memo(function NoticeSidebar({ startDate, endDate, tentative, noticeDays, shortfall, today }) {
  return (
    <div className={cssClass({ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 12 })}>
      <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" })}>
        <div className={cssClass({ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #fff7ed 0%, #fff 100%)", display: "flex", alignItems: "center", gap: 8 })}>
          <CalendarDays size={15} color={BRAND} />
          <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#374151" })}>Notice Period Summary</span>
        </div>
        <div className={cssClass({ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 })}>
          <Chip label="Start Date"    value={fmtDate(startDate || today)} color="#64748b" icon={CalendarDays} />
          <Chip label="End Date"      value={endDate ? fmtDate(endDate) : "Not set"} color={BRAND} icon={CalendarDays} />
          <Chip label="Tentative LWD" value={fmtDate(tentative)} sub={`Start + ${NOTICE} days`} color="#3b82f6" icon={CalendarDays} />

          {noticeDays !== null && (
            <>
              <div className={cssClass({ height: 1, background: "#f1f5f9" })} />
              <Chip
                label="Total Days (Start → End)"
                value={`${noticeDays} day${noticeDays !== 1 ? "s" : ""}`}
                color={noticeDays >= NOTICE ? "#16a34a" : "#d97706"}
                icon={Info}
              />
              <Chip
                label="Shortfall"
                value={shortfall === 0 ? "None ✓" : `${shortfall} day${shortfall !== 1 ? "s" : ""}`}
                sub={shortfall === 0 ? "Full notice served" : `${shortfall} short of ${NOTICE} days`}
                color={shortfall === 0 ? "#16a34a" : "#dc2626"}
                icon={shortfall === 0 ? CheckCircle2 : AlertTriangle}
              />
            </>
          )}
        </div>
      </div>

      <div className={cssClass({ padding: "12px 14px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, display: "flex", gap: 8, alignItems: "flex-start" })}>
        <Info size={14} color="#0284c7" className={cssClass({ flexShrink: 0, marginTop: 1 })} />
        <p className={cssClass({ margin: 0, fontSize: 11, color: "#0369a1", lineHeight: 1.5 })}>
          Shortfall days may result in salary recovery or loss of pay as per company policy.
        </p>
      </div>
    </div>
  );
});

export default NoticeSidebar;
