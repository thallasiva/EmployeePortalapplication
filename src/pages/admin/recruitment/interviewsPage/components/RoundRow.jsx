import React from "react";
import { STATUS_CLS, FB_CLS } from "../constants";
import RoundBadge from "./RoundBadge";

const RoundRow = React.memo(function RoundRow({
  iv,
  canFeedback,
  canRecruiterFeedback,
  onFeedback,
  onRecruiterFeedback,
  onView,
}) {
  const ss = STATUS_CLS[iv.status] ?? "bg-gray-100 text-gray-500";
  const fc = FB_CLS[iv.feedback_status];
  const rfc = FB_CLS[iv.recruiter_feedback_status];
  const isExternal = (iv.candidate_type || "External") === "External";

  return (
    <div
      className={`grid items-center gap-3 px-4 py-3 border-b border-gray-100 ${
        iv.status === "Scheduled" ? "bg-[#fafffe]" : "bg-white"
      }`}
      style={{ gridTemplateColumns: "160px 1fr 120px 1fr 160px auto" }}
    >
      <RoundBadge level={iv.level} />
      <div>
        <div className="text-[13px] font-semibold text-gray-900">
          {iv.interview_date?.slice(0, 10)}{" "}
          {iv.interview_time ? "· " + iv.interview_time.slice(0, 5) : ""}
        </div>
        <div className="text-[11px] text-gray-500">
          {iv.interviewer || "—"} · {iv.interview_type}
          {iv.duration_minutes
            ? " · " +
              (iv.duration_minutes < 60
                ? iv.duration_minutes + "min"
                : iv.duration_minutes / 60 + "hr")
            : ""}
        </div>
        {iv.to_addresses && (
          <div className="text-[10px] text-gray-500 mt-0.5">To: {iv.to_addresses}</div>
        )}
      </div>
      <span className={`text-[11px] font-bold px-2.5 py-[3px] rounded-full whitespace-nowrap ${ss}`}>
        {iv.status}
      </span>

      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 w-12 shrink-0">HR:</span>
          {iv.feedback_status && fc ? (
            <span className={`text-[10px] font-bold px-2 py-[2px] rounded-full ${fc}`}>
              {iv.feedback_status}
            </span>
          ) : (
            <span className="text-[10px] text-gray-400">
              {iv.status === "Completed" ? "No feedback" : "Pending"}
            </span>
          )}
          {iv.shortlisted === 1 && (
            <span className="text-[10px] font-bold bg-[#fff7ed] text-[#f18200] px-1.5 py-px rounded-full">
              ★
            </span>
          )}
        </div>
        {isExternal && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 w-12 shrink-0">Rec:</span>
            {iv.recruiter_feedback_status && rfc ? (
              <span className={`text-[10px] font-bold px-2 py-[2px] rounded-full ${rfc}`}>
                {iv.recruiter_feedback_status}
              </span>
            ) : (
              <span className="text-[10px] text-amber-500">Pending</span>
            )}
          </div>
        )}
      </div>

      <div className="text-[11px] text-gray-400">{iv.interview_code}</div>
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={() => onView(iv)}
          className="text-[11px] font-semibold text-gray-500 bg-transparent border border-gray-200 rounded-md px-2.5 py-[4px] cursor-pointer"
        >
          View
        </button>
        {iv.status === "Scheduled" && canFeedback && (
          <button
            onClick={() => onFeedback(iv)}
            className="text-[11px] font-semibold text-white bg-[#f18200] border-0 rounded-md px-2.5 py-[4px] cursor-pointer"
          >
            HR Feedback
          </button>
        )}
        {isExternal && canRecruiterFeedback && !iv.recruiter_feedback_status && (
          <button
            onClick={() => onRecruiterFeedback(iv)}
            className="text-[11px] font-semibold text-white border-0 rounded-md px-2.5 py-[4px] cursor-pointer"
            style={{ backgroundColor: "#6d28d9" }}
          >
            My Feedback
          </button>
        )}
      </div>
    </div>
  );
});

export default RoundRow;
