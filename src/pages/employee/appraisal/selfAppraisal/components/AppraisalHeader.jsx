import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";
import { fmtDate } from "../utils/dateUtils";
import CycleTypeBadge from "./CycleTypeBadge";

const AppraisalHeader = React.memo(function AppraisalHeader({ cycle }) {
  return (
    <div className={cssClass({
      background: `linear-gradient(135deg,${BRAND},#e07000)`,
      borderRadius: 14, padding: "18px 22px", color: "#fff", marginBottom: 20,
    })}>
      <div className={cssClass({
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 12,
      })}>
        <div>
          <h1 className={cssClass({ fontSize: 18, fontWeight: 700, margin: "0 0 4px" })}>
            Self Performance Appraisal
          </h1>
          <p className={cssClass({ fontSize: 13, opacity: 0.85, margin: 0 })}>
            {cycle.fy_label}
            {cycle.deadline ? ` · Deadline: ${fmtDate(cycle.deadline)}` : ""}
          </p>
        </div>
        {cycle.cycle_type && (
          <div className={cssClass({ flexShrink: 0 })}>
            <CycleTypeBadge type={cycle.cycle_type} />
          </div>
        )}
      </div>
    </div>
  );
});

export default AppraisalHeader;
