import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtDate } from "../utils/dateUtils";

const StatusBanner = React.memo(function StatusBanner({ appraisal, params, cycle }) {
  const isSubmitted = appraisal?.status === "submitted";
  const isDraft     = !isSubmitted && appraisal?.status === "draft";

  if (isSubmitted) {
    return (
      <div className={cssClass({
        background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
      })}>
        <CheckCircle2 size={20} className={cssClass({ color: "#22c55e" })} />
        <div>
          <p className={cssClass({ fontWeight: 700, color: "#15803d", margin: 0, fontSize: 14 })}>
            Submitted
          </p>
          <p className={cssClass({ fontSize: 12, color: "#16a34a", margin: 0 })}>
            Submitted {fmtDate(appraisal.submitted_at)} · Your manager will review shortly.
          </p>
        </div>
      </div>
    );
  }

  if (isDraft) {
    return (
      <div className={cssClass({
        background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
      })}>
        <AlertCircle size={16} className={cssClass({ color: "#d97706" })} />
        <p className={cssClass({ fontSize: 13, color: "#92400e", margin: 0 })}>
          Draft saved — complete all {params.length} ratings and submit before{" "}
          {fmtDate(cycle.deadline)}.
        </p>
      </div>
    );
  }

  return null;
});

export default StatusBanner;
