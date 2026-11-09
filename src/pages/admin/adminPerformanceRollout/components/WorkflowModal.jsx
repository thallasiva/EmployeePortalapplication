import React, { useState } from "react";
import { processAppraisalWorkflow } from "../../../../api/appraisal.api";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";
import Modal from "./Modal";

const FIELD = { width: "100%", boxSizing: "border-box", padding: "9px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13 };

export default function WorkflowModal({ appraisal, onClose, onUpdated }) {
  const [feedback, setFeedback] = useState("");
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState(appraisal.decision_type || "development");
  const [notes, setNotes] = useState(appraisal.decision_notes || "");
  const [annualCtc, setAnnualCtc] = useState(appraisal.decision_ctc_annual || "");
  const [effectiveDate, setEffectiveDate] = useState(appraisal.decision_effective_date?.slice(0, 10) || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const runAction = async (action, extra = {}) => {
    setSaving(true);
    setError("");
    try {
      await processAppraisalWorkflow(appraisal.appraisal_id, { action, ...extra });
      await onUpdated();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to update this appraisal.");
    } finally {
      setSaving(false);
    }
  };

  const status = appraisal.appraisal_status;
  return (
    <Modal title={`Review workflow · ${appraisal.employee_name}`} onClose={onClose} width={640}>
      <div className={cssClass({ display: "grid", gap: 14 })}>
        <div className={cssClass({ background: "#f8fafc", borderRadius: 8, padding: 12, fontSize: 13, color: "#475569" })}>
          <strong>Status:</strong> {status?.replaceAll("_", " ")}
          {appraisal.manager_feedback && <p className={cssClass({ whiteSpace: "pre-wrap", margin: "8px 0 0" })}><strong>Manager feedback:</strong> {appraisal.manager_feedback}</p>}
          {appraisal.hr_feedback && <p className={cssClass({ whiteSpace: "pre-wrap", margin: "8px 0 0" })}><strong>Previous HR feedback:</strong> {appraisal.hr_feedback}</p>}
          {appraisal.overall_comments && <p className={cssClass({ whiteSpace: "pre-wrap", margin: "8px 0 0" })}><strong>Employee comments:</strong> {appraisal.overall_comments}</p>}
        </div>
        {appraisal.goals?.length > 0 && (
          <section>
            <h3 className={cssClass({ margin: "0 0 8px", fontSize: 13, color: "#334155" })}>Goals and evidence</h3>
            <div className={cssClass({ display: "grid", gap: 7 })}>
              {appraisal.goals.map((goal) => (
                <div key={goal.goal_id} className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, fontSize: 12, color: "#475569" })}>
                  <strong>{goal.title}</strong>
                  {goal.self_progress && <p className={cssClass({ margin: "4px 0" })}>Progress: {goal.self_progress}</p>}
                  {goal.evidence_url && <a href={goal.evidence_url} target="_blank" rel="noreferrer" className={cssClass({ color: BRAND })}>Open evidence</a>}
                  {goal.manager_feedback && <p className={cssClass({ margin: "4px 0" })}>Manager: {goal.manager_feedback}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
        {appraisal.ratings?.length > 0 && (
          <section>
            <h3 className={cssClass({ margin: "0 0 8px", fontSize: 13, color: "#334155" })}>Ratings and comments</h3>
            <div className={cssClass({ display: "grid", gap: 6 })}>
              {appraisal.ratings.map((rating) => (
                <div key={rating.parameter_key} className={cssClass({ display: "grid", gridTemplateColumns: "minmax(120px, 1fr) auto auto", gap: 12, alignItems: "start", borderBottom: "1px solid #f1f5f9", padding: "6px 0", fontSize: 12, color: "#475569" })}>
                  <strong>{rating.parameter_label || rating.parameter_key}</strong>
                  <span>Self: {rating.self_rating || "—"}/5</span>
                  <span>Manager: {rating.manager_rating || "—"}/5</span>
                  {rating.manager_comments && <span className={cssClass({ gridColumn: "1 / -1" })}>{rating.manager_comments}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {status === "hr_review" && (
          <>
            <label className={cssClass({ display: "grid", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569" })}>
              HR / calibration feedback
              <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} style={FIELD} placeholder="Summarize calibration notes or feedback to share." />
            </label>
            <label className={cssClass({ display: "grid", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569" })}>
              Return reason (required only when requesting changes)
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} style={FIELD} />
            </label>
            <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 8 })}>
              <button type="button" disabled={saving || !reason.trim()} onClick={() => runAction("request_changes", { reason })}
                className={cssClass({ padding: "9px 13px", border: "1px solid #f59e0b", color: "#92400e", background: "#fffbeb", borderRadius: 7, cursor: "pointer", fontWeight: 600 })}>
                Request changes
              </button>
              <button type="button" disabled={saving} onClick={() => runAction("share", { hr_feedback: feedback })}
                className={cssClass({ padding: "9px 14px", border: "none", color: "#fff", background: BRAND, borderRadius: 7, cursor: "pointer", fontWeight: 600 })}>
                {saving ? "Sharing…" : "Share with employee"}
              </button>
            </div>
          </>
        )}

        {status === "shared" && <p className={cssClass({ margin: 0, color: "#475569", fontSize: 13 })}>The review is visible to the employee and is waiting for acknowledgment.</p>}

        {status === "acknowledged" && (
          <>
            <label className={cssClass({ display: "grid", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569" })}>
              Outcome
              <select value={decision} onChange={(event) => {
                const nextDecision = event.target.value;
                setDecision(nextDecision);
                if (!["increment", "promotion"].includes(nextDecision)) {
                  setAnnualCtc("");
                  setEffectiveDate("");
                }
              }} style={FIELD}>
                <option value="development">Development plan</option>
                <option value="promotion">Promotion</option>
                <option value="increment">Compensation increment</option>
                <option value="no_change">No change</option>
              </select>
            </label>
            {["increment", "promotion"].includes(decision) && (
              <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 })}>
                <label className={cssClass({ display: "grid", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569" })}>
                  New annual CTC (optional for promotion)
                  <input type="number" min="0.01" step="0.01" value={annualCtc} onChange={(event) => setAnnualCtc(event.target.value)} style={FIELD} />
                </label>
                <label className={cssClass({ display: "grid", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569" })}>
                  Effective date
                  <input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} style={FIELD} />
                </label>
              </div>
            )}
            <label className={cssClass({ display: "grid", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569" })}>
              Decision notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} style={FIELD} />
            </label>
            <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 8 })}>
              {appraisal.decision_type && (
                <button type="button" disabled={saving} onClick={() => runAction("close")}
                  className={cssClass({ padding: "9px 13px", border: "1px solid #cbd5e1", color: "#334155", background: "#fff", borderRadius: 7, cursor: "pointer", fontWeight: 600 })}>
                  Close review
                </button>
              )}
              <button type="button" disabled={saving || Boolean(appraisal.decision_type) || (decision === "increment" && (!annualCtc || !effectiveDate))} onClick={() => runAction("decision", {
                decision_type: decision,
                decision_notes: notes,
                decision_ctc_annual: annualCtc || null,
                decision_effective_date: effectiveDate || null,
              })}
                className={cssClass({ padding: "9px 14px", border: "none", color: "#fff", background: BRAND, borderRadius: 7, cursor: "pointer", fontWeight: 600 })}>
                {saving ? "Saving…" : appraisal.decision_type ? "Decision recorded" : "Record decision"}
              </button>
            </div>
          </>
        )}

        {status === "closed" && (
          <>
            <label className={cssClass({ display: "grid", gap: 6, fontSize: 12, fontWeight: 700, color: "#475569" })}>
              Reopen reason (required)
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} style={FIELD} />
            </label>
            <button type="button" disabled={saving || !reason.trim()} onClick={() => runAction("reopen", { reason })}
              className={cssClass({ justifySelf: "end", padding: "9px 14px", border: "none", color: "#fff", background: BRAND, borderRadius: 7, cursor: "pointer", fontWeight: 600 })}>
              Reopen for HR review
            </button>
          </>
        )}
        {["submitted", "manager_review", "changes_requested"].includes(status) && (
          <p className={cssClass({ margin: 0, color: "#64748b", fontSize: 13 })}>
            {status === "changes_requested" ? "The employee must revise and resubmit before HR review." : "This stage must be completed by the employee or reporting manager before HR can act."}
          </p>
        )}
        {error && <p role="alert" className={cssClass({ margin: 0, color: "#b91c1c", fontSize: 13 })}>{error}</p>}
      </div>
    </Modal>
  );
}
