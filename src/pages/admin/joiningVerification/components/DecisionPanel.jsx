import React from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const DECISION_OPTIONS = [
  { key: "approve", label: "Approve", cls: "text-emerald-700 bg-emerald-50 border-emerald-200", ring: "ring-emerald-400", icon: CheckCircle },
  { key: "request_changes", label: "Request Changes", cls: "text-amber-700 bg-amber-50 border-amber-200", ring: "ring-amber-400", icon: AlertTriangle },
  { key: "reject", label: "Reject", cls: "text-red-700 bg-red-50 border-red-200", ring: "ring-red-400", icon: XCircle },
];

const DecisionPanel = React.memo(function DecisionPanel({
  detail,
  decision,
  remarks,
  onSetDecision,
  onSetRemarks,
}) {
  const canDecide = ["submitted", "pending_verification", "changes_requested"].includes(
    detail.formality_status
  );

  return (
    <>
      {canDecide && (
        <div className="border-t border-amber-100 pt-4 space-y-3">
          <p className="text-[13px] font-semibold text-gray-700">HR Decision</p>
          <div className="flex flex-wrap gap-2">
            {DECISION_OPTIONS.map(({ key, label, cls, ring, icon: Icon }) => (
              <button
                key={key}
                onClick={() => onSetDecision(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${cls} ${
                  decision === key ? `ring-2 ring-offset-1 ${ring}` : ""
                }`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
          <textarea
            value={remarks}
            onChange={(e) => onSetRemarks(e.target.value)}
            rows={3}
            placeholder={
              decision === "request_changes"
                ? "Specify which fields need correction..."
                : "Remarks (optional)"
            }
            className="w-full border border-amber-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 resize-none"
            style={{ "--tw-ring-color": "#d97706" }}
          />
        </div>
      )}

      {detail.formality_status === "approved" && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-3">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <p className="text-[13px] text-emerald-700 font-medium">
            Formality approved. Employee onboarding complete.
          </p>
        </div>
      )}

      {detail.formality_status === "rejected" && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
          <XCircle size={18} className="text-red-600 flex-shrink-0" />
          <p className="text-[13px] text-red-700 font-medium">
            Formality rejected.
            {detail.hr_remarks ? ` Reason: ${detail.hr_remarks}` : ""}
          </p>
        </div>
      )}
    </>
  );
});

export default DecisionPanel;
