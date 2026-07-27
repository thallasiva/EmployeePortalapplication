import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { saveManagerRating } from "../../../../api/appraisal.api";
import { BRAND } from "../constants";
import { fmtDate } from "../utils";
import StatusBadge from "./StatusBadge";
import ParameterRatingRow from "./ParameterRatingRow";

function MemberCard({ member, appraisalId, onSaved }) {
  const [open, setOpen] = useState(false);
  const [mgRatings, setMgRatings] = useState({});
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
  }, [member.ratings]);

  const hasSubmission = member.appraisal_status === "submitted" || member.appraisal_status === "approved";
  const hasDraft = member.appraisal_status === "draft";
  const canReview = hasSubmission;
  const canExpand = hasSubmission || hasDraft;

  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const ratingsArr = (member.ratings || []).map((r) => ({
        parameter_key: r.parameter_key,
        manager_rating: mgRatings[r.parameter_key]?.manager_rating || null,
        manager_comments: mgRatings[r.parameter_key]?.manager_comments || null,
      }));
      await saveManagerRating(appraisalId, { ratings: ratingsArr });
      notify("Ratings saved!");
      onSaved && onSaved();
    } catch (e) {
      notify(e?.response?.data?.message || "Failed.", "error");
    }
    setSaving(false);
  }, [member.ratings, mgRatings, appraisalId, onSaved, notify]);

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

      {!canReview && (
        <div className={cssClass({ padding: "0 18px 12px" })}>
          <p className={cssClass({ fontSize: 12, color: "#94a3b8", margin: 0, fontStyle: "italic" })}>
            {member.appraisal_status === "draft"
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
          {canReview && (
            <div className={cssClass({ display: "flex", justifyContent: "flex-end", marginTop: 14 })}>
              <button onClick={handleSave} disabled={saving}
                className={cssClass({ padding: "9px 22px", borderRadius: 8, border: "none",
                  background: BRAND, color: "#fff", fontWeight: 600, fontSize: 13,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6 })}>
                <Save size={14} />{saving ? "Saving…" : "Save My Ratings"}
              </button>
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
