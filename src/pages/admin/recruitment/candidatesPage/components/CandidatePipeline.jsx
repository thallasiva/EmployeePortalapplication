import React from "react";
import { Check, CircleDot, X } from "lucide-react";

const STAGES = ["Applied", "Screening", "Interview", "Selected", "Offer", "Joined"];
const STATUS_STAGE = {
  "Applied": 0,
  "Work in Progress": 1,
  "Screening": 1,
  "Interview Scheduled": 2,
  "Schedule Interview": 2,
  "Shortlisted": 3,
  "Selected": 3,
  "Offer Released": 4,
  "Offer Accepted": 4,
  "Offer Rejected": 4,
  "Joining Formalities": 5,
  "Onboarded": 5,
};

const CandidatePipeline = React.memo(function CandidatePipeline({ status }) {
  const rejected = ["Rejected", "Offer Rejected", "Not Selected"].includes(status);
  const current = STATUS_STAGE[status] ?? 0;
  return (
    <section aria-label="Candidate pipeline" className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Candidate pipeline</div>
      <div className="flex items-start">
        {STAGES.map((stage, index) => {
          const complete = !rejected && index < current;
          const active = !rejected && index === current;
          const color = complete ? "text-green-600" : active ? "text-orange-600" : "text-gray-400";
          return (
            <React.Fragment key={stage}>
              <div className={`flex min-w-0 flex-col items-center ${color}`}>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${complete ? "border-green-500 bg-green-500 text-white" : active ? "border-orange-500 bg-white" : "border-gray-300 bg-white"}`}>
                  {complete ? <Check size={14} /> : active ? <CircleDot size={13} /> : index + 1}
                </span>
                <span className="mt-1 text-[10px]">{stage}</span>
              </div>
              {index < STAGES.length - 1 && <div className={`mx-1 mt-3.5 h-0.5 flex-1 ${complete ? "bg-green-400" : "bg-gray-200"}`} />}
            </React.Fragment>
          );
        })}
      </div>
      {rejected && <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-600"><X size={14} /> Rejected</div>}
    </section>
  );
});

export default CandidatePipeline;
