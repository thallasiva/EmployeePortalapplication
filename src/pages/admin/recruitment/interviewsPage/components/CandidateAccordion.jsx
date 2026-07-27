import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LEVEL_ORDER } from "../constants";
import RoundRow from "./RoundRow";

const CandidateAccordion = React.memo(function CandidateAccordion({
  candidateName,
  jobTitle,
  rounds,
  canFeedback,
  canRecruiterFeedback,
  canRaiseOffer,
  onFeedback,
  onRecruiterFeedback,
  onView,
  onScheduleNext,
  defaultOpen,
}) {
  const [open, setOpen] = useState(defaultOpen || false);

  const candidateType = rounds[0]?.candidate_type || "External";
  const isExternal = candidateType === "External";
  const scheduledRounds = rounds.filter((r) => r.status === "Scheduled");
  const completedRounds = rounds.filter((r) => r.status === "Completed");
  const selectedRounds = completedRounds.filter((r) => r.feedback_status === "Selected");
  const rejectedRound = completedRounds.find((r) => r.feedback_status === "Not Selected");
  const sortedCompleted = [...completedRounds].sort(
    (a, b) => LEVEL_ORDER.indexOf(b.level) - LEVEL_ORDER.indexOf(a.level)
  );
  const lastCompleted = sortedCompleted[0];
  const lastIsSelected = lastCompleted?.feedback_status === "Selected";
  const recruiterFeedbackDone = !isExternal || !!lastCompleted?.recruiter_feedback_status;
  const nextRoundReady = lastIsSelected && recruiterFeedbackDone;
  const offerReady =
    selectedRounds.length > 0 && scheduledRounds.length === 0 && !rejectedRound && nextRoundReady;

  let pipelineLabel, pipelineColor, pipelineBg;
  if (rejectedRound) {
    pipelineLabel = "Rejected";
    pipelineColor = "#dc2626";
    pipelineBg = "#fee2e2";
  } else if (scheduledRounds.length > 0) {
    const nextLvl = scheduledRounds.sort(
      (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
    )[0].level;
    pipelineLabel = nextLvl + " Scheduled";
    pipelineColor = "#1d4ed8";
    pipelineBg = "#dbeafe";
  } else if (offerReady) {
    pipelineLabel = "Offer Ready";
    pipelineColor = "#f18200";
    pipelineBg = "#fff7ed";
  } else if (completedRounds.length > 0) {
    pipelineLabel = "In Progress";
    pipelineColor = "#d97706";
    pipelineBg = "#fef3c7";
  } else {
    pipelineLabel = rounds.length + " Round" + (rounds.length !== 1 ? "s" : "");
    pipelineColor = "#6b7280";
    pipelineBg = "#f3f4f6";
  }

  return (
    <div className="border border-gray-200 rounded-[12px] overflow-hidden mb-2.5">
      <div
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-3.5 px-[18px] py-[14px] cursor-pointer transition-colors ${
          open ? "bg-gray-50 border-b border-gray-200" : "bg-white"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-[#1a2535] text-white flex items-center justify-center text-[15px] font-bold shrink-0">
          {(candidateName || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-gray-900">{candidateName}</span>
            {rounds[0]?.candidate_type && (
              <span
                className={`text-[10px] font-bold px-1.5 py-px rounded-full ${
                  rounds[0].candidate_type === "Internal"
                    ? "bg-violet-100 text-violet-700"
                    : "bg-sky-100 text-sky-700"
                }`}
              >
                {rounds[0].candidate_type}
              </span>
            )}
          </div>
          <div className="text-[12px] text-gray-500">{jobTitle}</div>
        </div>
        <div className="flex gap-1 items-center">
          {LEVEL_ORDER.map((lvl) => {
            const round = rounds.find((r) => r.level === lvl);
            if (!round)
              return <div key={lvl} title={lvl} className="w-2.5 h-2.5 rounded-full bg-gray-200" />;
            const dc =
              round.status === "Scheduled"
                ? "#1d4ed8"
                : round.feedback_status === "Selected"
                ? "#f18200"
                : round.feedback_status === "Not Selected"
                ? "#dc2626"
                : round.feedback_status === "Hold"
                ? "#d97706"
                : "#6b7280";
            return (
              <div
                key={lvl}
                title={lvl + ": " + round.status}
                className="w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{ background: dc, boxShadow: "0 0 0 1px " + dc }}
              />
            );
          })}
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-[3px] rounded-full whitespace-nowrap shrink-0"
          style={{ background: pipelineBg, color: pipelineColor }}
        >
          {pipelineLabel}
        </span>
        <span className="text-[11px] text-gray-400 whitespace-nowrap">
          {completedRounds.length}/{rounds.length} done
        </span>
        {open ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </div>
      {open && (
        <div>
          <div
            className="grid gap-3 px-4 py-1.5 bg-gray-50 border-b border-gray-100"
            style={{ gridTemplateColumns: "160px 1fr 120px 1fr 160px auto" }}
          >
            {["Round", "Date & Interviewer", "Status", "Feedback (HR / Recruiter)", "ID", ""].map(
              (h) => (
                <div
                  key={h}
                  className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.05em]"
                >
                  {h}
                </div>
              )
            )}
          </div>
          {[...rounds]
            .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level))
            .map((iv) => (
              <RoundRow
                key={iv.interview_id}
                iv={iv}
                canFeedback={canFeedback}
                canRecruiterFeedback={canRecruiterFeedback}
                onFeedback={onFeedback}
                onRecruiterFeedback={onRecruiterFeedback}
                onView={onView}
              />
            ))}

          {lastIsSelected &&
            scheduledRounds.length === 0 &&
            !rejectedRound &&
            isExternal &&
            !recruiterFeedbackDone && (
              <div className="flex items-center gap-3 px-[18px] py-3 bg-violet-50 border-t border-dashed border-violet-200">
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-violet-700">
                    {lastCompleted?.level} — HR: Selected · Recruiter: Pending
                  </div>
                  <div className="text-[11px] text-violet-600">
                    Recruiter must submit their feedback before the next round can be scheduled.
                  </div>
                </div>
              </div>
            )}

          {nextRoundReady && scheduledRounds.length === 0 && !rejectedRound && canRaiseOffer && (
            <div className="flex items-center gap-3 px-[18px] py-3 bg-[#fff7ed] border-t border-dashed border-[#fed7aa]">
              <div className="flex-1">
                <div className="text-[12px] font-bold text-[#f18200]">
                  {lastCompleted?.level} — Selected
                  {isExternal ? " (Both feedbacks received)" : ""}
                </div>
                <div className="text-[11px] text-[#92400e]">
                  All interview levels are optional. You can raise an offer now or schedule another
                  round.
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onScheduleNext && onScheduleNext(rounds[0]);
                }}
                className="text-[12px] font-semibold text-blue-700 bg-blue-100 border-0 rounded-lg px-3.5 py-1.5 cursor-pointer whitespace-nowrap"
              >
                + Schedule Next Round
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href =
                    window.location.pathname.replace(/\?.*$/, "") + "?page=offers";
                }}
                className="text-[12px] font-semibold text-white bg-[#f18200] border-0 rounded-lg px-3.5 py-1.5 cursor-pointer whitespace-nowrap"
              >
                Raise Offer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default CandidateAccordion;
