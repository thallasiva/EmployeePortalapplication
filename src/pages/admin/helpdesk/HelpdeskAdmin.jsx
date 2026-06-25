/**
 * HelpdeskAdmin — shared view for Admin (all tickets) and Reporting Managers (team tickets).
 * Admin sees every ticket; Manager sees only tickets raised by their direct reports.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  Headphones, RefreshCw, Search, ChevronDown, MessageSquare,
  UserCheck, Clock, CheckCircle, XCircle, AlertCircle, Filter,
} from "lucide-react";
import { allTickets, teamTickets, updateTicketStatus, assignTicket, addComment } from "../../../api/helpdesk.api";
import { getStoredUser, isAdmin } from "../../../data/auth";

/* ── Constants ──────────────────────────────────────────────────── */
const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITY_COLOR = {
  Low:    { bg: "#f0fdf4", color: "#15803d" },
  Medium: { bg: "#fff7ed", color: "#c2410c" },
  High:   { bg: "#fef2f2", color: "#b91c1c" },
  Urgent: { bg: "#fdf4ff", color: "#7e22ce" },
};
const STATUS_COLOR = {
  "Open":       { bg: "#eff6ff", color: "#2563eb", icon: AlertCircle },
  "In Progress":{ bg: "#fff7ed", color: "#c2410c", icon: Clock },
  "Resolved":   { bg: "#f0fdf4", color: "#15803d", icon: CheckCircle },
  "Closed":     { bg: "#f8fafc", color: "#64748b", icon: XCircle },
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

/* ── Ticket Detail Panel ─────────────────────────────────────────── */
function TicketDetail({ ticket, onClose, onUpdated }) {
  const [status,    setStatus]    = useState(ticket.status);
  const [comment,   setComment]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [commenting, setCommenting] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      await updateTicketStatus(ticket.ticket_id, newStatus);
      setStatus(newStatus);
      onUpdated();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      await addComment(ticket.ticket_id, comment.trim());
      setComment("");
      onUpdated();
    } catch { /* ignore */ }
    finally { setCommenting(false); }
  };

  const sc = STATUS_COLOR[status] || STATUS_COLOR["Open"];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
      display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
    }} onClick={onClose}>
      <div style={{
        width: 480, height: "100vh", background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, background: sc.bg, color: sc.color,
                  padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{status}</span>
                {ticket.priority && (
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500,
                    ...(PRIORITY_COLOR[ticket.priority] || {}) }}>{ticket.priority}</span>
                )}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>{ticket.subject}</h3>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none",
              fontSize: 18, color: "#94a3b8", cursor: "pointer", padding: 4, flexShrink: 0 }}>✕</button>
          </div>
        </div>

        {/* Meta */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
          {[
            { label: "Raised by", value: ticket.employee_name || "—" },
            { label: "Employee Code", value: ticket.emp_code || "—" },
            { label: "Category", value: ticket.category || "—" },
            { label: "Created", value: `${fmtDate(ticket.created_at)} ${fmtTime(ticket.created_at)}` },
            { label: "Assigned to", value: ticket.assigned_to_name || "Unassigned" },
            { label: "Resolved at", value: ticket.resolved_at ? fmtDate(ticket.resolved_at) : "—" },
          ].map(m => (
            <div key={m.label}>
              <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>{m.label}</p>
              <p style={{ fontSize: 13, color: "#1e293b", margin: 0, fontWeight: 500 }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        {ticket.description && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Description</p>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{ticket.description}</p>
          </div>
        )}

        {/* Status update */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Update Status</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map(s => {
              const sc2 = STATUS_COLOR[s] || {};
              return (
                <button key={s} onClick={() => handleStatusChange(s)} disabled={saving || status === s}
                  style={{
                    padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                    cursor: status === s || saving ? "not-allowed" : "pointer",
                    border: status === s ? `1.5px solid ${sc2.color}` : "1px solid #e2e8f0",
                    background: status === s ? sc2.bg : "#fff",
                    color: status === s ? sc2.color : "#64748b",
                  }}>{s}</button>
              );
            })}
          </div>
        </div>

        {/* Comments */}
        <div style={{ padding: "16px 24px", flex: 1 }}>
          <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
            Comments {ticket.comments?.length ? `(${ticket.comments.length})` : ""}
          </p>
          {ticket.comments?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {ticket.comments.map((c, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#f18200" }}>{c.commented_by_name}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(c.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5 }}>{c.comment}</p>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment or update the employee…"
              rows={3}
              style={{
                flex: 1, padding: "8px 12px", border: "1px solid #dbe2ea",
                borderRadius: 8, fontSize: 13, outline: "none", resize: "none",
                fontFamily: "inherit", lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor = "#f18200"}
              onBlur={e => e.target.style.borderColor = "#dbe2ea"}
            />
            <button onClick={handleComment} disabled={commenting || !comment.trim()}
              style={{
                background: "#f18200", color: "#fff", border: "none", borderRadius: 8,
                padding: "0 14px", cursor: "pointer", flexShrink: 0, opacity: (!comment.trim() || commenting) ? 0.5 : 1,
              }}>
              <MessageSquare size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function HelpdeskAdmin() {
  const user    = getStoredUser();
  const isAdminUser = isAdmin(user);

  const [tickets,  setTickets]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState("");
  const [priorityF,setPriorityF]= useState("");
  const [page,     setPage]     = useState(1);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit: LIMIT, offset: (page - 1) * LIMIT,
        ...(search    ? { search }   : {}),
        ...(statusF   ? { status: statusF }   : {}),
        ...(priorityF ? { priority: priorityF } : {}),
      };
      const fn = isAdminUser ? allTickets : teamTickets;
      const data = await fn(params);
      setTickets(Array.isArray(data) ? data : (data?.rows || []));
      setTotal(data?.total || 0);
    } catch { setTickets([]); setTotal(0); }
    finally { setLoading(false); }
  }, [isAdminUser, page, search, statusF, priorityF]);

  useEffect(() => { load(); }, [load]);

  // Summary counts
  const counts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const summaryCards = [
    { label: "Open",        value: counts["Open"]        || 0, color: "#2563eb", bg: "#eff6ff" },
    { label: "In Progress", value: counts["In Progress"] || 0, color: "#c2410c", bg: "#fff7ed" },
    { label: "Resolved",    value: counts["Resolved"]    || 0, color: "#15803d", bg: "#f0fdf4" },
    { label: "Total",       value: total,                       color: "#f18200", bg: "#fff7ed" },
  ];

  return (
    <div style={{
      height: "calc(100vh - 4.25rem)", background: "#f5f7fb",
      display: "flex", flexDirection: "column", padding: "16px 20px 12px", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Headphones size={20} color="#f18200" />
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>
              {isAdminUser ? "Helpdesk — All Tickets" : "Helpdesk — My Team's Tickets"}
            </h1>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              {isAdminUser
                ? "View and manage all employee support requests"
                : "Support requests raised by your direct reports"}
            </p>
          </div>
        </div>
        <button onClick={load}
          style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
            padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center",
            gap: 5, fontSize: 12, color: "#64748b" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexShrink: 0, flexWrap: "wrap" }}>
        {summaryCards.map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.color}22`,
            borderRadius: 10, padding: "10px 18px", minWidth: 100,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 9, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tickets…"
            style={{ height: 34, width: 200, paddingLeft: 28, paddingRight: 10,
              border: "1px solid #dbe2ea", borderRadius: 8, fontSize: 12,
              outline: "none", background: "#fff" }} />
        </div>

        <div style={{ position: "relative" }}>
          <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}
            style={{ height: 34, paddingLeft: 10, paddingRight: 28, border: "1px solid #dbe2ea",
              borderRadius: 8, fontSize: 12, background: "#fff", outline: "none",
              cursor: "pointer", appearance: "none" }}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        </div>

        <div style={{ position: "relative" }}>
          <select value={priorityF} onChange={e => { setPriorityF(e.target.value); setPage(1); }}
            style={{ height: 34, paddingLeft: 10, paddingRight: 28, border: "1px solid #dbe2ea",
              borderRadius: 8, fontSize: 12, background: "#fff", outline: "none",
              cursor: "pointer", appearance: "none" }}>
            <option value="">All Priority</option>
            {["Low","Medium","High","Urgent"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        </div>

        {(search || statusF || priorityF) && (
          <button onClick={() => { setSearch(""); setStatusF(""); setPriorityF(""); setPage(1); }}
            style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Filter size={12} /> Clear
          </button>
        )}
      </div>

      {/* Ticket table */}
      <div style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 12, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 0.8fr",
          padding: "10px 16px",
          background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
          fontSize: 11, fontWeight: 700, color: "#64748b",
          textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0,
        }}>
          <span>Subject</span>
          <span>Employee</span>
          <span>Category</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              Loading tickets…
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <Headphones size={36} strokeWidth={1.2} color="#e2e8f0" />
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 12 }}>
                {isAdminUser ? "No tickets found." : "No tickets from your team yet."}
              </p>
            </div>
          ) : (
            tickets.map((t, i) => {
              const sc = STATUS_COLOR[t.status] || STATUS_COLOR["Open"];
              const pc = PRIORITY_COLOR[t.priority] || {};
              return (
                <div key={t.ticket_id}
                  onClick={() => setSelected(t)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 0.8fr",
                    padding: "12px 16px",
                    borderBottom: i < tickets.length - 1 ? "1px solid #f1f5f9" : "none",
                    cursor: "pointer", transition: "background 0.12s",
                    alignItems: "center",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.subject}
                    </p>
                    {t.description && (
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: "#374151", fontWeight: 500, margin: 0 }}>{t.employee_name || "—"}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{t.emp_code || ""}</p>
                  </div>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{t.category || "—"}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20,
                    ...pc, alignSelf: "start" }}>{t.priority || "—"}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                    background: sc.bg, color: sc.color, alignSelf: "start" }}>{t.status}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(t.created_at)}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 12, color: "#64748b", flexShrink: 0 }}>
            <span>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
                  background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer",
                  opacity: page === 1 ? 0.5 : 1, fontSize: 12 }}>← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total}
                style={{ padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
                  background: "#fff", cursor: page * LIMIT >= total ? "not-allowed" : "pointer",
                  opacity: page * LIMIT >= total ? 0.5 : 1, fontSize: 12 }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over detail */}
      {selected && (
        <TicketDetail
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}
