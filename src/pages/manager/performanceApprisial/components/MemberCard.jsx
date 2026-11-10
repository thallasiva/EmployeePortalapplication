import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, ChevronUp, Save, Send } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { saveManagerRating } from "../../../../api/appraisal.api";
import { BRAND } from "../constants";
import { fmtDate } from "../utils";
import StatusBadge from "./StatusBadge";
import ParameterRatingRow from "./ParameterRatingRow";
function MemberCard({ member, appraisalId, onSaved }) {
  const [open, setOpen] = useState(false);
  const [mgRatings, setMgRatings] = useState({});
  const [goalFeedback, setGoalFeedback] = useState({});
  const [managerFeedback, setManagerFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  useEffect(() => {
    const map = {};
    (member.ratings || []).forEach((r) => {
      map[r.parameter_key] = {
        manager_rating: r.manager_rating || 0,
        manager_comments: r.manager_comments || "",
      };
    });
    setMgRatings(map);
    setGoalFeedback(Object.fromEntries((member.goals || []).map((goal) => [goal.goal_id, goal.manager_feedback || ""])));
    setManagerFeedback(member.manager_feedback || "");
  }, [member.ratings, member.goals, member.manager_feedback]);
  const hasSubmission = member.appraisal_status === "submitted" || member.appraisal_status === "manager_review";
  const hasDraft = member.appraisal_status === "draft";
  const canReview = hasSubmission;
  const canExpand = Boolean(appraisalId);
  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);
  const handleSave = useCallback(async (submit = false) => {
    setSaving(true);
    try {
      const ratingsArr = (member.ratings || []).map((r) => ({
        parameter_key: r.parameter_key,
        manager_rating: mgRatings[r.parameter_key]?.manager_rating || null,
        manager_comments: mgRatings[r.parameter_key]?.manager_comments || null,
      }));
      const goals = (member.goals || []).map((goal) => ({
        goal_id: goal.goal_id,
        manager_feedback: goalFeedback[goal.goal_id] || "",
      }));
      await saveManagerRating(appraisalId, { ratings: ratingsArr, goals, manager_feedback: managerFeedback, submit });
      notify(submit ? "Review submitted to HR." : "Ratings saved.");
      onSaved && onSaved();
    } catch (e) {
      notify(e?.response?.data?.message || "Failed.", "error");
    }
    setSaving(false);
  }, [member.ratings, member.goals, mgRatings, goalFeedback, managerFeedback, appraisalId, onSaved, notify]);
  const handleRatingChange = useCallback((key, v) => {
    setMgRatings((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), manager_rating: v } }));
  }, []);
  const handleCommentChange = useCallback((key, value) => {
    setMgRatings((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), manager_comments: value } }));
  }, []);
  const avgSelf = useMemo(() => {
    if (!member.ratings?.length) return null;
    return (member.ratings.reduce((s, r) => s + (r.self_rating || 0), 0) / member.ratings.length).toFixed(1);
  }, [member.ratings]);
  const initials = useMemo(
    () => (member.employee_name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
    [member.employee_name]
  );
  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 12 })}>
      {toast && (
        <div className={cssClass({ position: "fixed", top: 20, right: 20, zIndex: 999,
          background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
          borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600,
          color: toast.type === "error" ? "#dc2626" : "#15803d" })}>
          {toast.msg}
        </div>
      )}
      <button type="button" onClick={() => canExpand && setOpen((o) => !o)}
        className={cssClass({ width: "100%", display: "flex", alignItems: "center", padding: "14px 18px",
          background: "none", border: "none", cursor: canExpand ? "pointer" : "default", textAlign: "left", gap: 14 })}>
        <div className={cssClass({ width: 42, height: 42, borderRadius: "50%", background: `${BRAND}18`, color: BRAND,
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 })}>
          {initials}
        </div>
        <div className={cssClass({ flex: 1, minWidth: 0 })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" })}>
            <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b" })}>{member.employee_name}</span>
            <StatusBadge status={member.appraisal_status || "not_started"} />
          </div>
          <p className={cssClass({ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" })}>
            {member.emp_job_title || "—"} · {member.department_name || "—"}
          </p>
        </div>
        <div className={cssClass({ textAlign: "right", flexShrink: 0 })}>
          {avgSelf && (
            <div className={cssClass({ marginBottom: 4 })}>
              <span className={cssClass({ fontSize: 11, color: "#64748b" })}>Self avg </span>
              <span className={cssClass({ fontSize: 14, fontWeight: 800, color: BRAND })}>{avgSelf}</span>
              <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>/5</span>
            </div>
          )}
          {member.submitted_at && (
            <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: 0 })}>
              Submitted {fmtDate(member.submitted_at)}
            </p>
          )}
        </div>
        {canExpand && (
          <div className={cssClass({ marginLeft: 8 })}>
            {open
              ? <ChevronUp size={15} className={cssClass({ color: "#94a3b8" })} />
              : <ChevronDown size={15} className={cssClass({ color: "#94a3b8" })} />}
          </div>
        )}
      </button>
      {!canExpand && (
        <div className={cssClass({ padding: "0 18px 12px" })}>
          <p className={cssClass({ fontSize: 12, color: "#94a3b8", margin: 0, fontStyle: "italic" })}>
            {hasDraft
              ? "Employee has saved a draft but not submitted yet."
              : "Employee hasn't started their appraisal yet."}
          </p>
        </div>
      )}
      {open && canExpand && (
        <div className={cssClass({ borderTop: "1px solid #f1f5f9", padding: "16px 18px" })}>
          <p className={cssClass({ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase",
            letterSpacing: "0.06em", margin: "0 0 14px" })}>Parameter-wise Ratings</p>
          <div className={cssClass({ display: "grid", gap: 10 })}>
            {(member.ratings || []).map((r) => (
              <ParameterRatingRow
                key={r.parameter_key}
                rating={r}
                mgRating={mgRatings[r.parameter_key]}
                onRatingChange={handleRatingChange}
                onCommentChange={handleCommentChange}
                canReview={canReview}
              />
            ))}
          </div>
          {member.overall_comments && (
            <div className={cssClass({ marginTop: 12, background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 8, padding: "10px 14px" })}>
              <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#92400e", margin: "0 0 4px" })}>Employee's Overall Comments</p>
              <p className={cssClass({ fontSize: 13, color: "#78350f", margin: 0 })}>{member.overall_comments}</p>
            </div>
          )}
          {member.goals?.length > 0 && (
            <div className={cssClass({ marginTop: 16 })}>
              <p className={cssClass({ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", margin: "0 0 8px" })}>Employee goals and evidence</p>
              <div className={cssClass({ display: "grid", gap: 8 })}>
                {member.goals.map((goal) => (
                  <div key={goal.goal_id} className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 })}>
                    <p className={cssClass({ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: "#1e293b" })}>{goal.title}</p>
                    {goal.description && <p className={cssClass({ margin: "0 0 4px", fontSize: 12, color: "#475569" })}>{goal.description}</p>}
                    {goal.success_metrics && <p className={cssClass({ margin: "0 0 4px", fontSize: 12, color: "#475569" })}>Success measures: {goal.success_metrics}</p>}
                    {goal.self_progress && <p className={cssClass({ margin: "0 0 4px", fontSize: 12, color: "#475569" })}>Progress: {goal.self_progress}</p>}
                    {goal.evidence_url && <a href={goal.evidence_url} target="_blank" rel="noreferrer" className={cssClass({ fontSize: 12, color: BRAND })}>Open evidence</a>}
                    {canReview && <textarea value={goalFeedback[goal.goal_id] || ""} onChange={(event) => setGoalFeedback((current) => ({ ...current, [goal.goal_id]: event.target.value }))} rows={2} placeholder="Feedback on this goal"
                      className={cssClass({ display: "block", width: "100%", boxSizing: "border-box", marginTop: 7, border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 9px", fontSize: 12 })} />}
                    {!canReview && goal.manager_feedback && <p className={cssClass({ fontSize: 12, color: "#e87500", margin: "5px 0 0" })}>Manager: {goal.manager_feedback}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {canReview && (
            <div className={cssClass({ marginTop: 14 })}>
              <label className={cssClass({ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 })}>Overall manager feedback</label>
              <textarea value={managerFeedback} onChange={(event) => setManagerFeedback(event.target.value)} rows={3}
                placeholder="Summarize strengths, opportunities, and next steps"
                className={cssClass({ width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", borderRadius: 7, padding: "8px 10px", fontSize: 13 })} />
              <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 })}>
              <button onClick={() => handleSave(false)} disabled={saving}
                className={cssClass({ padding: "9px 22px", borderRadius: 8, border: "none",
                  background: "#fff7ed", color: "#9b4c00", fontWeight: 600, fontSize: 13,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6 })}>
                <Save size={14} />{saving ? "Saving…" : "Save Draft"}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving || !managerFeedback.trim() || (member.ratings || []).some((rating) => !mgRatings[rating.parameter_key]?.manager_rating)}
                className={cssClass({ padding: "9px 22px", borderRadius: 8, border: "none",
                  background: BRAND, color: "#fff", fontWeight: 600, fontSize: 13,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6 })}>
                <Send size={14} />{saving ? "Submitting…" : "Submit to HR"}
              </button>
              </div>
            </div>
          )}
          {hasDraft && !canReview && (
            <div className={cssClass({ marginTop: 12, background: "#fefce8", border: "1px solid #fde68a",
              borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#92400e" })}>
              Employee has saved a draft but not submitted yet. Ratings will be enabled after submission.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default React.memo(MemberCard);
