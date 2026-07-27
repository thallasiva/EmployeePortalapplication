import React from "react";
import { Modal, DetailRow, Btn } from "../shared";

const ViewInterviewModal = React.memo(function ViewInterviewModal({
  viewIv,
  canFeedback,
  onClose,
  onOpenFeedback,
}) {
  return (
    <Modal
      open={!!viewIv}
      onClose={onClose}
      title={"Interview - " + (viewIv?.candidate_name || "")}
      width={480}
      footer={
        <div className="flex gap-2.5 w-full justify-end">
          {viewIv?.status === "Scheduled" && canFeedback && (
            <Btn onClick={() => { onOpenFeedback(viewIv); onClose(); }}>Submit Feedback</Btn>
          )}
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
        </div>
      }
    >
      {viewIv && (
        <div>
          <div className="grid grid-cols-2 gap-x-5">
            <DetailRow label="Level" value={viewIv.level} />
            <DetailRow label="Type" value={viewIv.interview_type} />
            <DetailRow label="Date" value={viewIv.interview_date?.slice(0, 10)} />
            <DetailRow label="Time" value={viewIv.interview_time?.slice(0, 5)} />
            <DetailRow label="Interviewer" value={viewIv.interviewer || "N/A"} />
            <DetailRow
              label="Duration"
              value={viewIv.duration_minutes ? viewIv.duration_minutes + " min" : "N/A"}
            />
            <DetailRow
              label="Candidate Type"
              value={
                <span
                  className={`text-[11px] font-bold px-2 py-px rounded-full ${
                    viewIv.candidate_type === "Internal"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {viewIv.candidate_type || "External"}
                </span>
              }
            />
            <DetailRow label="Status" value={viewIv.status} />
            <DetailRow label="Outcome" value={viewIv.feedback_status || "Pending"} />
          </div>
          {viewIv.to_addresses && (
            <div className="mt-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-[11px] font-bold text-gray-500 mb-1">PARTICIPANTS (TO)</div>
              <p className="text-[12px] text-gray-700 m-0">{viewIv.to_addresses}</p>
            </div>
          )}
          {viewIv.feedback_comments && (
            <div className="mt-3 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-[11px] font-bold text-gray-500 mb-1.5">HR FEEDBACK</div>
              <p className="text-[13px] text-gray-700 m-0 leading-relaxed">
                {viewIv.feedback_comments}
              </p>
            </div>
          )}
          {viewIv.recruiter_feedback_comments && (
            <div className="mt-2 px-3.5 py-2.5 bg-violet-50 border border-violet-200 rounded-lg">
              <div className="text-[11px] font-bold text-violet-600 mb-1.5">
                RECRUITER FEEDBACK
                {viewIv.recruiter_feedback_status && (
                  <span className="ml-2 font-normal normal-case">
                    (Outcome: {viewIv.recruiter_feedback_status})
                  </span>
                )}
              </div>
              <p className="text-[13px] text-gray-700 m-0 leading-relaxed">
                {viewIv.recruiter_feedback_comments}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
});

export default ViewInterviewModal;
