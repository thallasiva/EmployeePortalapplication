import { useState, useEffect, useCallback } from "react";
import Pagination, { usePagination } from "../../components/Pagination";
import {
  LogOut, Search, CheckCircle2, XCircle, ChevronDown,
  Paperclip, Clock, User, AlertTriangle, MessageSquare } from
"lucide-react";
import apiClient from "../../api/client";import { cssClass, joinClasses } from "../../utils/classStyles";

const BRAND = "#f18200";

const STATUS_CFG = {
  pending: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Awaiting Manager" },
  rm_approved: { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", label: "Manager Approved" },
  rm_rejected: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Manager Rejected" },
  accepted: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Accepted" },
  rejected: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Rejected" },
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

/* ── Review Modal ─────────────────────────────────────────────────────── */
function ReviewModal({ row, onClose, onDone }) {
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState(null);

  const submit = async (act) => {
    setSaving(true);
    try {
      await apiClient.put(`/resignations/admin/${row.resignation_id}/review`, {
        status: act,
        admin_remarks: remarks
      });
      onDone();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to submit review");
    }
    setSaving(false);
  };

  const mgr = row.manager_reviewed_by_name;

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 })}>
      <div className={cssClass({ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
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
            <p className={cssClass({ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" })}>Final Review</p>
            <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>{row.employee_name}</p>
          </div>
          <button onClick={onClose} className={cssClass({ marginLeft: "auto", background: "none", border: "none",
            cursor: "pointer", color: "#94a3b8", fontSize: 22, lineHeight: 1 })}>×</button>
        </div>

        {/* Employee info */}
        <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9",
          display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, background: "#fafafa" })}>
          {[
          ["Employee", row.employee_name],
          ["Department", row.department_name || "—"],
          ["Job Title", row.job_title || "—"],
          ["Start Date", fmtDate(row.start_date)],
          ["End Date", fmtDate(row.end_date)],
          ["Shortfall", row.shortfall_days > 0 ? `${row.shortfall_days} days` : "None ✓"]].
          map(([l, v]) =>
          <div key={l}>
              <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8", fontWeight: 700,
              textTransform: "uppercase" })}>{l}</p>
              <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{v}</p>
            </div>
          )}
        </div>

        {/* Reason */}
        <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9" })}>
          <p className={cssClass({ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: BRAND,
            textTransform: "uppercase", letterSpacing: "0.06em" })}>Reason</p>
          <p className={cssClass({ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 })}>{row.reason}</p>
        </div>

        {/* Manager review */}
        {mgr &&
        <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9",
          background: row.status === "rm_approved" ? "#f0fdf4" : "#fef2f2" })}>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 })}>
              <MessageSquare size={13} color={row.status === "rm_approved" ? "#16a34a" : "#dc2626"} />
              <p className={cssClass({ margin: 0, fontSize: 10, fontWeight: 700,
              color: row.status === "rm_approved" ? "#16a34a" : "#dc2626",
              textTransform: "uppercase", letterSpacing: "0.06em" })}>
                Manager Review — {row.status === "rm_approved" ? "Approved" : "Rejected"}
              </p>
            </div>
            <p className={cssClass({ margin: "0 0 4px", fontSize: 13, fontWeight: 600,
            color: row.status === "rm_approved" ? "#15803d" : "#991b1b" })}>
              {row.manager_remarks || "No remarks added"}
            </p>
            <p className={cssClass({ margin: 0, fontSize: 11, color: "#94a3b8" })}>
              by {mgr} on {fmtDT(row.manager_reviewed_at)}
            </p>
          </div>
        }

        {/* Contact */}
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

        {/* Attachment */}
        {row.attachment_path &&
        <div className={cssClass({ padding: "10px 24px", borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", gap: 8 })}>
            <Paperclip size={14} color={BRAND} />
            <a href={`${apiClient.defaults.baseURL}/resignations/admin/${row.resignation_id}/attachment`}
          target="_blank" rel="noreferrer" className={cssClass(
            { fontSize: 13, color: BRAND, fontWeight: 600, textDecoration: "none" })}>
              {row.attachment_name || "Download Attachment"}
            </a>
          </div>
        }

        {/* Final remarks */}
        {!["accepted", "rejected"].includes(row.status) &&
        <>
            <div className={cssClass({ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" })}>
              <label className={cssClass({ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 })}>
                HR Remarks <span className={cssClass({ color: "#94a3b8", fontWeight: 400 })}>(optional)</span>
              </label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add final HR remarks for the employee…"
            rows={3} className={cssClass(
              { width: "100%", boxSizing: "border-box", padding: "10px 12px",
                border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13,
                fontFamily: "inherit", resize: "vertical", outline: "none" })} />
            </div>

            <div className={cssClass({ padding: "16px 24px", display: "flex", gap: 10 })}>
              <button onClick={() => submit("accepted")} disabled={saving} className={cssClass(
              { flex: 1, padding: "11px", borderRadius: 9, fontWeight: 700, fontSize: 14,
                border: "none", cursor: saving ? "not-allowed" : "pointer",
                background: "#16a34a", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6 })}>
                <CheckCircle2 size={16} /> Final Accept
              </button>
              <button onClick={() => submit("rejected")} disabled={saving} className={cssClass(
              { flex: 1, padding: "11px", borderRadius: 9, fontWeight: 700, fontSize: 14,
                border: "none", cursor: saving ? "not-allowed" : "pointer",
                background: "#dc2626", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6 })}>
                <XCircle size={16} /> Reject
              </button>
              <button onClick={onClose} disabled={saving} className={cssClass(
              { padding: "11px 18px", borderRadius: 9, fontWeight: 600, fontSize: 14,
                border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" })}>
                Cancel
              </button>
            </div>
          </>
        }
        {["accepted", "rejected"].includes(row.status) &&
        <div className={cssClass({ padding: "16px 24px" })}>
            {row.admin_remarks &&
          <div className={cssClass({ marginBottom: 12, padding: "12px 14px",
            background: row.status === "accepted" ? "#f0fdf4" : "#fef2f2",
            borderRadius: 8 })}>
                <p className={cssClass({ margin: "0 0 3px", fontSize: 10, fontWeight: 700,
              color: row.status === "accepted" ? "#16a34a" : "#dc2626",
              textTransform: "uppercase" })}>HR Remarks</p>
                <p className={cssClass({ margin: 0, fontSize: 13, color: "#374151" })}>{row.admin_remarks}</p>
              </div>
          }
            <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8", textAlign: "center" })}>
              Reviewed on {fmtDT(row.reviewed_at)}
            </p>
            <button onClick={onClose} className={cssClass({ marginTop: 12, width: "100%", padding: "10px",
            borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff",
            color: "#64748b", fontWeight: 600, cursor: "pointer" })}>
              Close
            </button>
          </div>
        }
      </div>
    </div>);

}

/* ── Row ──────────────────────────────────────────────────────────────── */
function ResignRow({ row, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[row.status] || STATUS_CFG.pending;

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" })}>
      <div
        onClick={() => setExpanded((e) => !e)} className={cssClass({ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" })}>
        <div className={cssClass({ width: 38, height: 38, borderRadius: "50%", background: BRAND,
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 13, flexShrink: 0 })}>
          {(row.employee_name || "?").split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase()}
        </div>
        <div className={cssClass({ flex: 1, minWidth: 0 })}>
          <p className={cssClass({ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" })}>{row.employee_name}</p>
          <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>
            {row.emp_code} · {row.department_name || "—"}
          </p>
        </div>
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>START</p>
          <p className={cssClass({ margin: 0, fontSize: 12, fontWeight: 700, color: "#1e293b" })}>{fmtDate(row.start_date)}</p>
        </div>
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>END DATE</p>
          <p className={cssClass({ margin: 0, fontSize: 12, fontWeight: 700, color: "#1e293b" })}>{fmtDate(row.end_date)}</p>
        </div>
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>MANAGER</p>
          <p className={cssClass({ margin: 0, fontSize: 12, fontWeight: 600, color: "#64748b" })}>
            {row.manager_reviewed_by_name || "—"}
          </p>
        </div>
        <span className={cssClass({ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" })}>
          {cfg.label}
        </span>
        <button onClick={(e) => {e.stopPropagation();onReview(row);}} className={cssClass(
          { padding: "7px 16px", borderRadius: 7, fontWeight: 700, fontSize: 12,
            border: "none", cursor: "pointer", flexShrink: 0,
            background: ["accepted", "rejected"].includes(row.status) ? "#f1f5f9" : BRAND,
            color: ["accepted", "rejected"].includes(row.status) ? "#64748b" : "#fff" })}>
          {["accepted", "rejected"].includes(row.status) ? "View" : "Review"}
        </button>
        <ChevronDown size={14} color="#94a3b8" className={cssClass(
          { transform: expanded ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0 })} />
      </div>

      {expanded &&
      <div className={cssClass({ borderTop: "1px solid #f1f5f9", padding: "14px 20px",
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px 20px",
        background: "#fafafa" })}>
          {[
        ["Reason", row.reason],
        ["Shortfall", row.shortfall_days > 0 ? `${row.shortfall_days} days` : "None"],
        ["Tentative LWD", fmtDate(row.tentative_lwd)],
        ["Applied On", fmtDT(row.created_at)],
        ["Mgr Remarks", row.manager_remarks || "—"],
        ["HR Remarks", row.admin_remarks || "—"]].
        map(([l, v]) =>
        <div key={l}>
              <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8",
            fontWeight: 700, textTransform: "uppercase" })}>{l}</p>
              <p className={cssClass({ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b" })}>{v || "—"}</p>
            </div>
        )}
        </div>
      }
    </div>);

}

/* ── Stats card ───────────────────────────────────────────────────────── */
function Stat({ label, value, color }) {
  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
      padding: "16px 20px", borderLeft: `3px solid ${color}` })}>
      <p className={cssClass({ margin: "0 0 4px", fontSize: 11, color: "#94a3b8", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</p>
      <p className={cssClass({ margin: 0, fontSize: 26, fontWeight: 900, color: "#1e293b" })}>{value}</p>
    </div>);

}

/* ══ Main Page ════════════════════════════════════════════════════════ */
export default function AdminResignations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [reviewing, setReviewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/resignations/admin/all");
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
  { key: "pending", label: "Awaiting Manager" },
  { key: "rm_approved", label: "Manager Approved" },
  { key: "rm_rejected", label: "Manager Rejected" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "withdrawn", label: "Withdrawn" }];


  const visible = rows.filter((r) => {
    const matchStatus = filter === "all" || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
    r.employee_name?.toLowerCase().includes(q) ||
    r.emp_code?.toLowerCase().includes(q) ||
    r.department_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const { paged, page, setPage, totalPages, from, to, total, pageSize, setPageSize } = usePagination(visible);

  const counts = {
    pending: rows.filter((r) => r.status === "pending").length,
    rm_approved: rows.filter((r) => r.status === "rm_approved").length,
    accepted: rows.filter((r) => r.status === "accepted").length,
    rejected: rows.filter((r) => ["rejected", "rm_rejected"].includes(r.status)).length
  };

  return (
    <div className={cssClass({ padding: "24px", fontFamily: "inherit", minHeight: "100vh", background: "#f5f7fb" })}>

      {/* Header */}
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 })}>
        <div className={cssClass({ width: 40, height: 40, borderRadius: 10, background: `${BRAND}15`,
          display: "flex", alignItems: "center", justifyContent: "center" })}>
          <LogOut size={18} color={BRAND} />
        </div>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" })}>Resignation Management</h1>
          <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>All employee resignation requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 })}>
        <Stat label="Awaiting Manager" value={counts.pending} color="#d97706" />
        <Stat label="Manager Approved" value={counts.rm_approved} color="#3b82f6" />
        <Stat label="Accepted" value={counts.accepted} color="#16a34a" />
        <Stat label="Rejected" value={counts.rejected} color="#dc2626" />
      </div>

      {/* Filters */}
      <div className={cssClass({ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" })}>
        <div className={cssClass({ position: "relative", flex: 1, minWidth: 220 })}>
          <Search size={14} className={cssClass({ position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8" })} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee, code, department…" className={cssClass(
            { width: "100%", boxSizing: "border-box", height: 38, paddingLeft: 34,
              paddingRight: 12, border: "1px solid #e2e8f0", borderRadius: 8,
              fontSize: 13, outline: "none", background: "#fff", fontFamily: "inherit" })} />
        </div>
        <div className={cssClass({ display: "flex", gap: 4, padding: 3, background: "#f1f5f9", borderRadius: 10,
          flexWrap: "wrap" })}>
          {FILTERS.map((f) =>
          <button key={f.key} onClick={() => setFilter(f.key)} className={cssClass(
            { padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
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
          <p className={cssClass({ margin: 0 })}>No resignations found.</p>
        </div> :

      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
          {paged.map((r) =>
        <ResignRow key={r.resignation_id} row={r} onReview={setReviewing} />
        )}
        </div>
      }
      {total > 0 && (
        <div className="mt-4">
          <Pagination page={page} setPage={setPage} totalPages={totalPages} from={from} to={to} total={total} pageSize={pageSize} setPageSize={setPageSize} />
        </div>
      )}

      {reviewing &&
      <ReviewModal
        row={reviewing}
        onClose={() => setReviewing(null)}
        onDone={() => {setReviewing(null);load();}} />

      }
    </div>);

}
