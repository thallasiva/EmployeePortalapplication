import React, { useState, useEffect } from "react";
import { listInterviews, submitFeedback, getErrorMessage } from "../../../../../api/recruitment.api";
import { apiErrorToast, successToast, errorToast } from "../../../../../utils/ToastControllers";
import { LEVEL_ORDER, NO_NEXT_STATUSES } from "../constants";
import InterviewPipeline from "./InterviewPipeline";

const TYPE_ICON = { "Video Call": "Video", "Phone": "Phone", "In-Person": "Office", "Teams": "Teams" };

function dotBgCls(iv) {
  if (iv.status === "Scheduled") return "bg-[#f18200]";
  if (iv.feedback_status === "Selected") return "bg-green-600";
  if (iv.feedback_status === "Not Selected") return "bg-red-600";
  if (iv.feedback_status === "Hold") return "bg-amber-500";
  return "bg-gray-400";
}

function cardCls(iv) {
  if (iv.status === "Scheduled") return { wrap: "border-orange-200 bg-amber-50", badge: "text-[#f18200] border-orange-200 bg-white" };
  if (iv.feedback_status === "Selected") return { wrap: "border-green-200 bg-green-50", badge: "text-green-600 border-green-200 bg-white" };
  if (iv.feedback_status === "Not Selected") return { wrap: "border-red-200 bg-red-50", badge: "text-red-600 border-red-200 bg-white" };
  return { wrap: "border-gray-200 bg-gray-50", badge: "text-gray-500 border-gray-200 bg-white" };
}

const InterviewHistory = React.memo(function InterviewHistory({ candidateId, role, candidateStatus }) {
  const [ivs, setIvs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cs, setCs] = useState({});
  const canComment = role === 4;
  const canMoveNext = (role === 1 || role === 3 || role === 5) && !NO_NEXT_STATUSES.includes(candidateStatus);

  useEffect(() => {
    if (!candidateId) return;
    setLoading(true);
    listInterviews({ candidateId, limit: 20 })
      .then((r) => setIvs(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [candidateId]);

  function startEdit(iv) { setCs((s) => ({ ...s, [iv.interview_id]: { text: iv.feedback_comments || "", editing: true, saving: false } })); }
  function cancelEdit(id) { setCs((s) => { const n = { ...s }; delete n[id]; return n; }); }

  async function saveComment(iv) {
    const c = cs[iv.interview_id];
    if (!c) return;
    setCs((s) => ({ ...s, [iv.interview_id]: { ...c, saving: true } }));
    try {
      await submitFeedback(iv.interview_id, { feedbackStatus: iv.feedback_status || "Hold", feedbackComments: c.text, shortlisted: iv.shortlisted || false });
      setIvs((prev) => prev.map((r) => r.interview_id === iv.interview_id ? { ...r, feedback_comments: c.text } : r));
      successToast("Comment saved");
      cancelEdit(iv.interview_id);
    } catch (err) {
      apiErrorToast(err, "Failed to save comment");
      setCs((s) => ({ ...s, [iv.interview_id]: { ...c, saving: false } }));
    }
  }

  if (loading) return <div className="mt-4 text-sm text-gray-400">Loading interview history...</div>;
  if (!ivs.length) return null;

  return (
    <div className="mt-5">
      <InterviewPipeline ivs={ivs} candidateStatus={candidateStatus} />

      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-[3px] h-4 bg-[#f18200] rounded-sm" />
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-[0.06em]">Interview History</span>
        <span className="text-[11px] font-semibold bg-amber-50 text-[#f18200] border border-orange-200 rounded-full px-2 py-px">
          {ivs.length} round{ivs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {ivs.map((iv, i) => {
          const sc = cardCls(iv);
          const num = LEVEL_ORDER.indexOf(iv.level) + 1 || i + 1;
          const isScheduled = iv.status === "Scheduled";
          const hasComment = !!(iv.feedback_comments && iv.feedback_comments.trim());
          const cState = cs[iv.interview_id];

          return (
            <div key={iv.interview_id} className={`rounded-xl border overflow-hidden ${sc.wrap}`}>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white flex-shrink-0 ${dotBgCls(iv)}`}>{num}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">
                    {iv.level}{" "}
                    {iv.interview_type && <span className="text-[11px] text-gray-500 font-normal">{TYPE_ICON[iv.interview_type] || ""} {iv.interview_type}</span>}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 flex gap-2 flex-wrap">
                    {iv.interview_date && <span>Date: {iv.interview_date.slice(0, 10)}</span>}
                    {iv.interview_time && <span>Time: {iv.interview_time.slice(0, 5)}</span>}
                    {iv.interviewer && <span>Interviewer: {iv.interviewer}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badge}`}>{isScheduled ? "Scheduled" : iv.status}</span>
                  {iv.feedback_status && !isScheduled &&
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badge}`}>{iv.feedback_status}</span>
                  }
                </div>
              </div>

              {cState?.editing ? (
                <div className="mx-3.5 mb-3">
                  <textarea
                    value={cState.text}
                    onChange={(e) => setCs((s) => ({ ...s, [iv.interview_id]: { ...cState, text: e.target.value } }))}
                    rows={3} placeholder="Enter feedback..." autoFocus
                    className="w-full box-border px-2.5 py-2 text-xs leading-relaxed border border-orange-200 rounded-md bg-[#fffbf5] text-gray-700 resize-y outline-none font-[inherit]" />
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => saveComment(iv)} disabled={cState.saving}
                      className="text-[11px] font-bold px-3.5 py-1 bg-[#f18200] text-white border-0 rounded-md cursor-pointer">
                      {cState.saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => cancelEdit(iv.interview_id)}
                      className="text-[11px] px-3 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-md cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : hasComment ? (
                <div className="mx-3.5 mb-3 px-3 py-2.5 bg-[#fffbf5] border border-l-[3px] border-orange-200 border-l-[#f18200] rounded-md">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#f18200] uppercase">Interviewer Comments</span>
                    {canComment &&
                      <button onClick={() => startEdit(iv)} className="text-[10px] text-[#f18200] bg-transparent border-0 cursor-pointer font-semibold">Edit</button>
                    }
                  </div>
                  <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{iv.feedback_comments}</div>
                </div>
              ) : canComment && !isScheduled ? (
                <div className="mx-3.5 mb-2.5">
                  <button onClick={() => startEdit(iv)}
                    className="text-[11px] font-semibold text-[#f18200] bg-amber-50 border border-dashed border-orange-200 rounded-md px-3 py-1.5 cursor-pointer">
                    + Add Comments
                  </button>
                </div>
              ) : isScheduled ? (
                <div className="mx-3.5 mb-2.5 text-[11px] text-gray-400 italic">Feedback pending after interview</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default InterviewHistory;
