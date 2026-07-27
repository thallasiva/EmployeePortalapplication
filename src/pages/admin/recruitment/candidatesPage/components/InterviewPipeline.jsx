import React from "react";

const PIPELINE_STEPS = ["Round 1", "Round 2", "Round 3", "HR", "Shortlisted"];

function stepState(label, ivs, candidateStatus) {
  if (label === "Shortlisted") {
    const isShortlisted = candidateStatus === "Shortlisted" || candidateStatus === "Offer Released" ||
      candidateStatus === "Offer Accepted" || candidateStatus === "Joining Formalities" || candidateStatus === "Onboarded";
    return isShortlisted ? "done" : "pending";
  }
  const iv = ivs.find((r) => r.level === label || (label === "HR" && r.level === "HR"));
  if (!iv) return "pending";
  if (iv.feedback_status === "Selected") return "done";
  if (iv.feedback_status === "Not Selected") return "failed";
  if (iv.status === "Scheduled") return "active";
  return "pending";
}

function stepLabel(label, ivs) {
  if (label === "Shortlisted") return label;
  const iv = ivs.find((r) => r.level === label || (label === "HR" && r.level === "HR"));
  if (!iv) return label;
  if (iv.feedback_status === "Selected") return label + " ✓";
  if (iv.feedback_status === "Not Selected") return label + " ✗";
  if (iv.status === "Scheduled") return label + " ●";
  return label;
}

const InterviewPipeline = React.memo(function InterviewPipeline({ ivs, candidateStatus }) {
  return (
    <div className="mb-4 px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200">
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.06em] mb-3">Interview Pipeline</div>
      <div className="flex items-center gap-0">
        {PIPELINE_STEPS.map((label, i) => {
          const state = stepState(label, ivs, candidateStatus);
          const dotCls =
            state === "done" ? "bg-green-500 border-green-500 text-white" :
            state === "failed" ? "bg-red-500 border-red-500 text-white" :
            state === "active" ? "bg-[#f18200] border-[#f18200] text-white" :
            "bg-white border-gray-300 text-gray-400";
          const lineCls =
            stepState(PIPELINE_STEPS[i + 1], ivs, candidateStatus) === "pending" && state !== "done" && state !== "failed"
              ? "bg-gray-200" : "bg-green-400";
          const textCls =
            state === "done" ? "text-green-600 font-bold" :
            state === "failed" ? "text-red-500 font-bold" :
            state === "active" ? "text-[#f18200] font-bold" :
            "text-gray-400";
          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${dotCls}`}>
                  {state === "done" ? "✓" : state === "failed" ? "✗" : state === "active" ? "●" : i + 1}
                </div>
                <span className={`text-[10px] mt-1.5 text-center leading-tight ${textCls}`} style={{ maxWidth: 52 }}>
                  {label === "HR" ? "HR Round" : label}
                </span>
                {state === "active" &&
                  <span className="text-[9px] text-[#f18200] font-semibold mt-0.5">Scheduled</span>
                }
              </div>
              {i < PIPELINE_STEPS.length - 1 &&
                <div className={`h-0.5 flex-1 mx-1 mb-4 ${state === "done" ? "bg-green-400" : "bg-gray-200"}`} />
              }
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});

export default InterviewPipeline;
