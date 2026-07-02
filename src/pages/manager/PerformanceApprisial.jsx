import React, { useEffect, useState } from "react";
import {
  Star, CheckCircle2, Clock, Lock, Users, ChevronDown, ChevronUp,
  AlertCircle, Save, RefreshCw, User } from
"lucide-react";
import { getTeamAppraisals, saveManagerRating } from "../../api/appraisal.api";
import ManagerTabs from "./ManagerTabs";import { cssClass, joinClasses } from "../../utils/classStyles";

const BRAND = "#f18200";

function fmtDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }) {
  const cfg = {
    submitted: { bg: "#dcfce7", color: "#15803d", label: "Submitted" },
    draft: { bg: "#fef9c3", color: "#ca8a04", label: "Draft" },
    not_started: { bg: "#f1f5f9", color: "#64748b", label: "Not Started" },
    approved: { bg: "#dbeafe", color: "#1d4ed8", label: "Approved" }
  }[status] || { bg: "#f1f5f9", color: "#64748b", label: status || "Pending" };
  return (
    <span className={cssClass({ fontSize: 11, fontWeight: 600, padding: "2px 10px",
      borderRadius: 999, background: cfg.bg, color: cfg.color })}>{cfg.label}</span>);

}

function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  return (
    <span className={cssClass({ display: "flex", gap: 3 })}>
      {[1, 2, 3, 4, 5].map((n) =>
      <Star key={n} size={18}
      onClick={() => !disabled && onChange(n)}
      onMouseEnter={() => !disabled && setHover(n)}
      onMouseLeave={() => setHover(0)} className={cssClass(
        { cursor: disabled ? "default" : "pointer",
          color: (hover || value) >= n ? "#6366f1" : "#e2e8f0",
          fill: (hover || value) >= n ? "#6366f1" : "#e2e8f0" })} />
      )}
    </span>);

}

/* ── Member detail card ───────────────────────────────────────────────── */
function MemberCard({ member, appraisalId, onSaved }) {
  const [open, setOpen] = useState(false);
  const [mgRatings, setMgRatings] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Init manager ratings from existing data
  useEffect(() => {
    const map = {};
    (member.ratings || []).forEach((r) => {
      map[r.parameter_key] = { manager_rating: r.manager_rating || 0, manager_comments: r.manager_comments || "" };
    });
    setMgRatings(map);
  }, [member.ratings]);

  const hasSubmission = member.appraisal_status === "submitted" || member.appraisal_status === "approved";
  const hasDraft = member.appraisal_status === "draft";
  const canReview = hasSubmission; // manager can rate only submitted appraisals
  const canExpand = hasSubmission || hasDraft; // can view draft too (read-only)

  const notify = (msg, type = "success") => {
    setToast({ msg, type });setTimeout(() => setToast(null), 2500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ratingsArr = (member.ratings || []).map((r) => ({
        parameter_key: r.parameter_key,
        manager_rating: mgRatings[r.parameter_key]?.manager_rating || null,
        manager_comments: mgRatings[r.parameter_key]?.manager_comments || null
      }));
      await saveManagerRating(appraisalId, { ratings: ratingsArr });
      notify("Ratings saved!");
      onSaved && onSaved();
    } catch (e) {
      notify(e?.response?.data?.message || "Failed.", "error");
    }
    setSaving(false);
  };

  const avgSelf = member.ratings?.length ?
  (member.ratings.reduce((s, r) => s + (r.self_rating || 0), 0) / member.ratings.length).toFixed(1) :
  null;

  const initials = (member.employee_name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
      overflow: "hidden", marginBottom: 12 })}>
      {toast &&
      <div className={cssClass({ position: "fixed", top: 20, right: 20, zIndex: 999,
        background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
        border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
        borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600,
        color: toast.type === "error" ? "#dc2626" : "#15803d" })}>
          {toast.msg}
        </div>
      }

      {/* Row header */}
      <button type="button" onClick={() => canExpand && setOpen((o) => !o)} className={cssClass(
        { width: "100%", display: "flex", alignItems: "center", padding: "14px 18px",
          background: "none", border: "none", cursor: canExpand ? "pointer" : "default", textAlign: "left", gap: 14 })}>
        {/* Avatar */}
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
          {avgSelf &&
          <div className={cssClass({ marginBottom: 4 })}>
              <span className={cssClass({ fontSize: 11, color: "#64748b" })}>Self avg </span>
              <span className={cssClass({ fontSize: 14, fontWeight: 800, color: BRAND })}>{avgSelf}</span>
              <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>/5</span>
            </div>
          }
          {member.submitted_at &&
          <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: 0 })}>
              Submitted {fmtDate(member.submitted_at)}
            </p>
          }
        </div>
        {canExpand &&
        <div className={cssClass({ marginLeft: 8 })}>
            {open ? <ChevronUp size={15} className={cssClass({ color: "#94a3b8" })} /> : <ChevronDown size={15} className={cssClass({ color: "#94a3b8" })} />}
          </div>
        }
      </button>

      {!canReview &&
      <div className={cssClass({ padding: "0 18px 12px" })}>
          <p className={cssClass({ fontSize: 12, color: "#94a3b8", margin: 0, fontStyle: "italic" })}>
            {member.appraisal_status === "draft" ?
          "Employee has saved a draft but not submitted yet." :
          "Employee hasn't started their appraisal yet."}
          </p>
        </div>
      }

      {/* Expanded ratings */}
      {open && canExpand &&
      <div className={cssClass({ borderTop: "1px solid #f1f5f9", padding: "16px 18px" })}>
          <p className={cssClass({ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase",
          letterSpacing: "0.06em", margin: "0 0 14px" })}>Parameter-wise Ratings</p>

          <div className={cssClass({ display: "grid", gap: 10 })}>
            {(member.ratings || []).map((r) =>
          <div key={r.parameter_key} className={cssClass(
            { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" })}>
                <p className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "0 0 10px" })}>
                  {r.parameter_label}
                </p>
                <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
                  {/* Employee self rating */}
                  <div>
                    <p className={cssClass({ fontSize: 11, color: "#94a3b8", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" })}>
                      Employee Self Rating
                    </p>
                    <div className={cssClass({ display: "flex", alignItems: "center", gap: 4 })}>
                      {[1, 2, 3, 4, 5].map((n) =>
                  <Star key={n} size={16} className={cssClass({
                    color: (r.self_rating || 0) >= n ? BRAND : "#e2e8f0",
                    fill: (r.self_rating || 0) >= n ? BRAND : "#e2e8f0" })} />
                  )}
                      <span className={cssClass({ fontSize: 12, color: "#64748b", marginLeft: 4 })}>{r.self_rating || 0}/5</span>
                    </div>
                    {r.self_comments &&
                <p className={cssClass({ fontSize: 11, color: "#64748b", margin: "6px 0 0", fontStyle: "italic" })}>
                        "{r.self_comments}"
                      </p>
                }
                  </div>
                  {/* Manager rating */}
                  <div>
                    <p className={cssClass({ fontSize: 11, color: "#6366f1", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" })}>
                      Your Rating
                    </p>
                    <StarPicker
                  value={mgRatings[r.parameter_key]?.manager_rating || 0}
                  onChange={(v) => setMgRatings((prev) => ({
                    ...prev, [r.parameter_key]: { ...(prev[r.parameter_key] || {}), manager_rating: v }
                  }))}
                  disabled={!canReview} />
                
                    <textarea
                  value={mgRatings[r.parameter_key]?.manager_comments || ""}
                  onChange={(e) => setMgRatings((prev) => ({
                    ...prev, [r.parameter_key]: { ...(prev[r.parameter_key] || {}), manager_comments: e.target.value }
                  }))}
                  placeholder="Add your feedback…" rows={2} className={cssClass(
                    { width: "100%", marginTop: 6, border: "1px solid #e2e8f0", borderRadius: 6,
                      padding: "6px 10px", fontSize: 12, outline: "none", resize: "vertical",
                      boxSizing: "border-box", color: "#374151" })} />
                  </div>
                </div>
              </div>
          )}
          </div>

          {/* Overall employee comment */}
          {member.overall_comments &&
        <div className={cssClass({ marginTop: 12, background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 8, padding: "10px 14px" })}>
              <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#92400e", margin: "0 0 4px" })}>Employee's Overall Comments</p>
              <p className={cssClass({ fontSize: 13, color: "#78350f", margin: 0 })}>{member.overall_comments}</p>
            </div>
        }

          {canReview &&
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", marginTop: 14 })}>
              <button onClick={handleSave} disabled={saving} className={cssClass(
            { padding: "9px 22px", borderRadius: 8, border: "none",
              background: BRAND, color: "#fff", fontWeight: 600, fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6 })}>
                <Save size={14} />{saving ? "Saving…" : "Save My Ratings"}
              </button>
            </div>
        }
          {hasDraft && !canReview &&
        <div className={cssClass({ marginTop: 12, background: "#fefce8", border: "1px solid #fde68a",
          borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#92400e" })}>
              Employee has saved a draft but not submitted yet. Ratings will be enabled after submission.
            </div>
        }
        </div>
      }
    </div>);

}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function PerformanceApprisial() {
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState(null);
  const [team, setTeam] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const d = await getTeamAppraisals();
      setCycle(d.cycle);
      setTeam(d.team || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => {load();}, []);

  const submitted = team.filter((m) => m.appraisal_status === "submitted" || m.appraisal_status === "approved");
  const pending = team.filter((m) => m.appraisal_status === "draft" || !m.appraisal_status);
  const isActive = cycle?.status === "active";

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: 24 })}>
      <ManagerTabs />

      {/* Header */}
      <div className={cssClass({ marginBottom: 20 })}>
        <h1 className={cssClass({ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" })}>
          Performance Appraisal
        </h1>
        <p className={cssClass({ fontSize: 13, color: "#64748b", margin: 0 })}>
          {cycle ? `${cycle.fy_label} · Deadline: ${fmtDate(cycle.deadline)}` : "Loading cycle…"}
        </p>
      </div>

      {/* Cycle inactive notice */}
      {!loading && (!cycle || !isActive) &&
      <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
        padding: 40, textAlign: "center" })}>
          <Lock size={48} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
          <h2 className={cssClass({ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 8px" })}>
            No Active Appraisal Cycle
          </h2>
          <p className={cssClass({ fontSize: 13, color: "#94a3b8", margin: 0 })}>
            HR hasn't rolled out a performance appraisal yet.<br />
            You'll see your team's submissions here once it's active.
          </p>
        </div>
      }

      {loading ?
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8" })}>Loading team appraisals…</div> :
      isActive &&
      <>
          {/* Stats */}
          <div className={cssClass({ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" })}>
            {[
          { label: "Team Size", value: team.length, color: BRAND },
          { label: "Submitted", value: submitted.length, color: "#22c55e" },
          { label: "Pending", value: pending.length, color: "#f59e0b" }].
          map((s) =>
          <div key={s.label} className={cssClass({ background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 10, padding: "12px 20px", textAlign: "center", minWidth: 110,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)" })}>
                <p className={cssClass({ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 })}>{s.value}</p>
                <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: 0 })}>{s.label}</p>
              </div>
          )}
            <button onClick={load} className={cssClass(
            { marginLeft: "auto", height: 48, padding: "0 16px", background: "#fff",
              border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, color: "#64748b",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6 })}>
              <RefreshCw size={13} />Refresh
            </button>
          </div>

          {/* Submitted section */}
          {submitted.length > 0 &&
        <>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 })}>
                <CheckCircle2 size={16} className={cssClass({ color: "#22c55e" })} />
                <p className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 })}>
                  Submitted ({submitted.length}) — Click to review & add your ratings
                </p>
              </div>
              {submitted.map((m) =>
          <MemberCard key={m.employee_id} member={m}
          appraisalId={m.appraisal_id} onSaved={load} />
          )}
            </>
        }

          {/* Pending section */}
          {pending.length > 0 &&
        <>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 10px" })}>
                <Clock size={16} className={cssClass({ color: "#f59e0b" })} />
                <p className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 })}>
                  Awaiting Submission ({pending.length})
                </p>
              </div>
              {pending.map((m) =>
          <MemberCard key={m.employee_id} member={m}
          appraisalId={m.appraisal_id} onSaved={load} />
          )}
            </>
        }

          {team.length === 0 &&
        <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
          padding: 48, textAlign: "center" })}>
              <Users size={48} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
              <p className={cssClass({ fontSize: 14, color: "#94a3b8" })}>
                No team members found. Ensure employees have you set as their reporting manager.
              </p>
            </div>
        }
        </>
      }
    </div>);

}
