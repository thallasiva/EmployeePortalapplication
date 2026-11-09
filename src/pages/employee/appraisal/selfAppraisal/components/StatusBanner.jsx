import React from "react";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtDate } from "../utils/dateUtils";

const LABELS = {
  draft: "Draft",
  submitted: "Submitted — awaiting manager review",
  manager_review: "Manager review in progress",
  hr_review: "HR review in progress",
  changes_requested: "Changes requested",
  shared: "Review shared — your acknowledgment is required",
  acknowledged: "Acknowledged — awaiting final decision",
  closed: "Review closed",
};

const StatusBanner = React.memo(function StatusBanner({ appraisal, params, cycle }) {
  if (!appraisal) {
    return (
      <div className={cssClass({ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 })}>
        <AlertCircle size={16} className={cssClass({ color: "#d97706" })} />
        <p className={cssClass({ fontSize: 13, color: "#92400e", margin: 0 })}>
          Draft not started — complete your {params.length} ratings and submit before {fmtDate(cycle.deadline)}.
        </p>
      </div>
    );
  }
  const status = appraisal.status;
  const tone = status === "changes_requested"
    ? { background: "#fff7ed", border: "#fdba74", text: "#9a3412", icon: "#ea580c" }
    : ["shared", "acknowledged", "closed"].includes(status)
      ? { background: "#f0fdf4", border: "#86efac", text: "#15803d", icon: "#22c55e" }
      : { background: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", icon: "#2563eb" };
  const Icon = status === "changes_requested" ? AlertCircle : status === "closed" ? CheckCircle2 : Clock;
  return (
    <div className={cssClass({ background: tone.background, border: `1px solid ${tone.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 })}>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 9 })}>
        <Icon size={17} className={cssClass({ color: tone.icon })} />
        <p className={cssClass({ fontWeight: 700, color: tone.text, margin: 0, fontSize: 14 })}>{LABELS[status] || status}</p>
      </div>
      {status === "changes_requested" && appraisal.hr_feedback && (
        <p className={cssClass({ fontSize: 13, color: tone.text, margin: "8px 0 0 26px" })}>HR feedback: {appraisal.hr_feedback}</p>
      )}
      {appraisal.decision_type && (
        <p className={cssClass({ fontSize: 13, color: tone.text, margin: "8px 0 0 26px" })}>
          Decision: {appraisal.decision_type.replace("_", " ")}
          {appraisal.decision_effective_date ? ` · Effective ${fmtDate(appraisal.decision_effective_date)}` : ""}
        </p>
      )}
      {appraisal.decision_notes && <p className={cssClass({ fontSize: 13, color: tone.text, margin: "4px 0 0 26px" })}>{appraisal.decision_notes}</p>}
    </div>
  );
});
export default StatusBanner;
