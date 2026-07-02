import { useState, useEffect, useCallback } from "react";
import {
  LogOut, CheckCircle2, XCircle, Clock, Search,
  ChevronDown, Paperclip, User, AlertTriangle } from
"lucide-react";
import apiClient from "../../api/client";
import ManagerTabs from "./ManagerTabs";import { cssClass, joinClasses } from "../../utils/classStyles";

const BRAND = "#f18200";

const STATUS_CFG = {
  pending: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Pending Review" },
  rm_approved: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "You Approved" },
  rm_rejected: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "You Rejected" },
  accepted: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "HR Accepted" },
  rejected: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "HR Rejected" },
  withdrawn: { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", label: "Withdrawn" }
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtDT = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function Avatar({ name, size = 38, color = BRAND }) {
  const initials = (name || "?").split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();
  return (
    <div className={cssClass({ width: size, height: size, borderRadius: "50%", background: color,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.35, flexShrink: 0 })}>
      {initials}
    </div>);

}

/* ── Review Modal ─────────────────────────────────────────────────────── */
function ReviewModal({ row, onClose, onDone }) {
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // Pass action directly — never rely on state being updated before the call
  const submit = async (act) => {
    setSaving(true);
    setErr(null);
    try {
      await apiClient.put(`/resignations/manager/${row.resignation_id}/review`, {
        status: act,
        manager_remarks: remarks
      });
      onDone();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to submit review");
      setSaving(false);
    }
  };

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 })}>
      <div className={cssClass({ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" })}>

        {/* Header */}
        <div className={cssClass({ padding: "18px 24px", borderBottom: "1px solid #f1f5f9",
          background: "linear-gradient(135deg,#fff7ed,#fff)",
          display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0 })}>
          <div className={cssClass({ width: 40, height: 40, borderRadius: 10, background: `${BRAND}15`,
            display: "flex", alignItems: "center", justifyContent: "center" })}>
            <LogOut size={18} color={BRAND} />
          </div>
          <div>
            <p className={cssClass({ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" })}>Review Resignation</p>
            <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>{row.employee_name}</p>
          </div>
          <button onClick={onClose} className={cssClass({ marginLeft: "auto", background: "none", border: "none",
            cursor: "pointer", color: "#94a3b8", fontSize: 20, lineHeight: 1 })}>×</button>
        </div>

        {/* Info strip */}
        <div className={cssClass({ padding: "14px 24px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 })}>
          {[
          ["Start Date", fmtDate(row.start_date)],
          ["End Date", fmtDate(row.end_date)],
          ["Shortfall", row.shortfall_days > 0 ? `${row.shortfall_days} days` : "None ✓"],
          ["Department", row.department_name || "—"],
          ["Job Title", row.job_title || "—"],
          ["Applied On", fmtDate(row.created_at)]].
          map(([l, v]) =>
          <div key={l}>
              <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8", fontWeight: 700,
              textTransform: "uppercase" })}>{l}</p>
              <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{v}</p>
            </div>
          )}
        </div>

        {/* Reason */}
        <div className={cssClass({ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" })}>
          <p className={cssClass({ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: BRAND,
            textTransform: "uppercase", letterSpacing: "0.06em" })}>Reason for Resignation</p>
          <p className={cssClass({ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 })}>{row.reason}</p>
        </div>

        {/* Contact info */}
        <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
          <div>
            <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8", fontWeight: 700,
              textTransform: "uppercase" })}>Alternate Email</p>
            <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{row.alternate_email || "—"}</p>
          </div>
          <div>
            <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8", fontWeight: 700,
              textTransform: "uppercase" })}>Alternate Mobile</p>
            <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{row.alternate_mobile || "—"}</p>
          </div>
        </div>

        {/* Remarks textarea */}
        <div className={cssClass({ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" })}>
          <label className={cssClass({ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 })}>
            Your Comments <span className={cssClass({ color: "#94a3b8", fontWeight: 400 })}>(optional)</span>
          </label>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add comments visible to the employee and HR…"
          rows={3} className={cssClass(
            { width: "100%", boxSizing: "border-box", padding: "10px 12px",
              border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13,
              fontFamily: "inherit", resize: "vertical", outline: "none" })} />
        </div>

        {err &&
        <div className={cssClass({ padding: "10px 24px", background: "#fef2f2", borderBottom: "1px solid #fecaca" })}>
            <p className={cssClass({ margin: 0, fontSize: 13, color: "#dc2626" })}>{err}</p>
          </div>
        }

        {/* Action buttons */}
        <div className={cssClass({ padding: "16px 24px", display: "flex", gap: 10 })}>
          <button onClick={() => submit("rm_approved")} disabled={saving} className={cssClass(
            { flex: 1, padding: "11px", borderRadius: 9, fontWeight: 700, fontSize: 14,
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              background: "#16a34a", color: "#fff", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6, opacity: saving ? 0.7 : 1 })}>
            <CheckCircle2 size={16} /> {saving ? "Saving…" : "Approve"}
          </button>
          <button onClick={() => submit("rm_rejected")} disabled={saving} className={cssClass(
            { flex: 1, padding: "11px", borderRadius: 9, fontWeight: 700, fontSize: 14,
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              background: "#dc2626", color: "#fff", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6, opacity: saving ? 0.7 : 1 })}>
            <XCircle size={16} /> {saving ? "Saving…" : "Reject"}
          </button>
          <button onClick={onClose} disabled={saving} className={cssClass(
            { padding: "11px 18px", borderRadius: 9, fontWeight: 600, fontSize: 14,
              border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" })}>
            Cancel
          </button>
        </div>
      </div>
    </div>);

}

/* ── Row card ─────────────────────────────────────────────────────────── */
function ResignRow({ row, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[row.status] || STATUS_CFG.pending;
  const attachUrl = row.attachment_path ?
  `${apiClient.defaults.baseURL}/resignations/my/${row.resignation_id}/attachment` : null;

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)", overflow: "hidden" })}>

      {/* Header row */}
      <div
        onClick={() => setExpanded((e) => !e)} className={cssClass({ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" })}>
        <Avatar name={row.employee_name} />
        <div className={cssClass({ flex: 1, minWidth: 0 })}>
          <p className={cssClass({ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" })}>{row.employee_name}</p>
          <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>
            {row.job_title || "—"} · {row.department_name || "—"}
          </p>
        </div>
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>START DATE</p>
          <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{fmtDate(row.start_date)}</p>
        </div>
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>END DATE</p>
          <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{fmtDate(row.end_date)}</p>
        </div>
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>SHORTFALL</p>
          <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700,
            color: row.shortfall_days > 0 ? "#dc2626" : "#16a34a" })}>
            {row.shortfall_days > 0 ? `${row.shortfall_days}d` : "None"}
          </p>
        </div>
        <span className={cssClass({ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" })}>
          {cfg.label}
        </span>
        <ChevronDown size={16} color="#94a3b8" className={cssClass(
          { transform: expanded ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0 })} />
      </div>

      {/* Expanded details */}
      {expanded &&
      <div className={cssClass({ borderTop: "1px solid #f1f5f9" })}>
          <div className={cssClass({ padding: "16px 20px", display: "grid",
          gridTemplateColumns: "repeat(3,1fr)", gap: "14px 24px",
          borderBottom: "1px solid #f1f5f9" })}>
            <div className={cssClass({ gridColumn: "1/-1" })}>
              <p className={cssClass({ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: BRAND,
              textTransform: "uppercase" })}>Reason</p>
              <p className={cssClass({ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 })}>{row.reason}</p>
            </div>
            {[
          ["Alternate Email", row.alternate_email],
          ["Alternate Mobile", row.alternate_mobile],
          ["Submitted On", fmtDT(row.created_at)],
          ["Tentative LWD", fmtDate(row.tentative_lwd)],
          ...(row.remarks ? [["Remarks", row.remarks]] : [])].
          map(([l, v]) =>
          <div key={l}>
                <p className={cssClass({ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#94a3b8",
              textTransform: "uppercase" })}>{l}</p>
                <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{v || "—"}</p>
              </div>
          )}
          </div>

          {/* Manager remarks (if reviewed) */}
          {row.manager_remarks &&
        <div className={cssClass({ padding: "12px 20px", background: "#f0fdf4",
          borderBottom: "1px solid #f1f5f9", display: "flex", gap: 8 })}>
              <CheckCircle2 size={15} color="#16a34a" className={cssClass({ flexShrink: 0, marginTop: 1 })} />
              <div>
                <p className={cssClass({ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#16a34a",
              textTransform: "uppercase" })}>Your Remarks</p>
                <p className={cssClass({ margin: 0, fontSize: 13, color: "#15803d" })}>{row.manager_remarks}</p>
              </div>
            </div>
        }

          {/* Attachment */}
          {attachUrl &&
        <div className={cssClass({ padding: "10px 20px", borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", gap: 8 })}>
              <Paperclip size={14} color={BRAND} />
              <a href={attachUrl} target="_blank" rel="noreferrer" className={cssClass(
            { fontSize: 13, color: BRAND, fontWeight: 600, textDecoration: "none" })}>
                {row.attachment_name || "View Attachment"}
              </a>
            </div>
        }

          {/* Action */}
          <div className={cssClass({ padding: "12px 20px", display: "flex", justifyContent: "flex-end" })}>
            {row.status === "pending" ?
          <button onClick={() => onReview(row)} className={cssClass(
            { padding: "9px 24px", borderRadius: 8, fontWeight: 700, fontSize: 13,
              border: "none", cursor: "pointer", background: BRAND, color: "#fff",
              boxShadow: "0 2px 8px rgba(241,130,0,0.3)" })}>
                Review & Decide
              </button> :

          <span className={cssClass({ fontSize: 12, color: "#94a3b8" })}>
                Reviewed on {fmtDT(row.manager_reviewed_at)}
              </span>
          }
          </div>
        </div>
      }
    </div>);

}

/* ══ Main Page ════════════════════════════════════════════════════════ */
export default function TeamResignations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [reviewing, setReviewing] = useState(null);

  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/resignations/manager/team");
      const data = res.data;
      setRows(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load resignations");
    }
    setLoading(false);
  }, []);

  useEffect(() => {load();}, [load]);

  const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "rm_approved", label: "Approved by Me" },
  { key: "rm_rejected", label: "Rejected by Me" },
  { key: "accepted", label: "HR Accepted" }];


  const visible = rows.filter((r) => {
    const matchStatus = filter === "all" || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.employee_name?.toLowerCase().includes(q) ||
    r.department_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <div className={cssClass({ padding: "24px", fontFamily: "inherit", minHeight: "100vh", background: "#f5f7fb" })}>
      <ManagerTabs />

      {/* Header */}
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 })}>
        <div className={cssClass({ width: 40, height: 40, borderRadius: 10, background: `${BRAND}15`,
          display: "flex", alignItems: "center", justifyContent: "center" })}>
          <LogOut size={18} color={BRAND} />
        </div>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" })}>Team Resignations</h1>
          <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>Review and approve your team's exit requests</p>
        </div>
        {pending > 0 &&
        <span className={cssClass({ marginLeft: "auto", padding: "6px 16px", borderRadius: 999,
          background: "#fff7ed", border: "1.5px solid #fed7aa",
          fontSize: 13, fontWeight: 700, color: BRAND })}>
            {pending} pending review{pending !== 1 ? "s" : ""}
          </span>
        }
      </div>

      {/* Filters */}
      <div className={cssClass({ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" })}>
        <div className={cssClass({ position: "relative", flex: 1, minWidth: 200 })}>
          <Search size={14} className={cssClass({ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" })} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or department…" className={cssClass(
            { width: "100%", boxSizing: "border-box", height: 38, paddingLeft: 34, paddingRight: 12,
              border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none",
              background: "#fff", fontFamily: "inherit" })} />
        </div>
        <div className={cssClass({ display: "flex", gap: 4, padding: 3, background: "#f1f5f9", borderRadius: 10 })}>
          {FILTERS.map((f) =>
          <button key={f.key} onClick={() => setFilter(f.key)} className={cssClass(
            { padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer",
              background: filter === f.key ? "#fff" : "transparent",
              color: filter === f.key ? "#1e293b" : "#64748b",
              boxShadow: filter === f.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" })}>
              {f.label}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ?
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8" })}>Loading…</div> :
      error ?
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#dc2626" })}>
          <AlertTriangle size={40} color="#fca5a5" className={cssClass({ marginBottom: 12 })} />
          <p className={cssClass({ margin: 0 })}>{error}</p>
        </div> :
      visible.length === 0 ?
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8" })}>
          <LogOut size={40} color="#e2e8f0" className={cssClass({ marginBottom: 12 })} />
          <p className={cssClass({ margin: 0 })}>No resignation requests found.</p>
        </div> :

      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
          {visible.map((r) =>
        <ResignRow key={r.resignation_id} row={r} onReview={setReviewing} />
        )}
        </div>
      }

      {/* Review Modal */}
      {reviewing &&
      <ReviewModal
        row={reviewing}
        onClose={() => setReviewing(null)}
        onDone={() => {setReviewing(null);load();}} />

      }
    </div>);

}
