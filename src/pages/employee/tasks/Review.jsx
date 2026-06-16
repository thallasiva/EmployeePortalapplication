import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar, Search, User, Clock, Settings, MailOpen,
  Briefcase, DollarSign, ChevronRight, Construction,
  CalendarClock, XCircle, CheckCircle2, Hourglass, ListFilter,
} from "lucide-react";
import { REVIEW_NAV_SECTIONS, findReviewNavItem } from "../../../data/reviewHub";
import { getMyLeaveRequests, listLeaveRequests } from "../../../api/leaveRequest.api";
import { listRegularizations } from "../../../api/attendance.api";
import { getStoredUser, isAdmin, isReportingManager } from "../../../data/auth";
import "./reviewHub.css";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const toArr = (res) =>
  Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function empName(r) {
  if (r.employee_name) return r.employee_name;
  const p = [r.first_name, r.last_name].filter(Boolean);
  return p.length ? p.join(" ") : r.emp_code || `#${r.employee_id}`;
}

/* ─── status config ───────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  approved:  { bg: "#dcfce7", color: "#15803d", border: "#22c55e", icon: <CheckCircle2 size={12} /> },
  rejected:  { bg: "#fee2e2", color: "#dc2626", border: "#ef4444", icon: <XCircle size={12} /> },
  pending:   { bg: "#fef9c3", color: "#ca8a04", border: "#facc15", icon: <Hourglass size={12} /> },
  cancelled: { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1", icon: <XCircle size={12} /> },
  Approved:  { bg: "#dcfce7", color: "#15803d", border: "#22c55e", icon: <CheckCircle2 size={12} /> },
  Rejected:  { bg: "#fee2e2", color: "#dc2626", border: "#ef4444", icon: <XCircle size={12} /> },
  Pending:   { bg: "#fef9c3", color: "#ca8a04", border: "#facc15", icon: <Hourglass size={12} /> },
  Cancelled: { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1", icon: <XCircle size={12} /> },
};
const sc = (s) => STATUS_CONFIG[(s || "pending")] || STATUS_CONFIG["pending"];

/* ─── section icons ───────────────────────────────────────────────────────── */

const SECTION_ICONS = {
  attendance:           <Clock size={12} />,
  "custom-workflows":   <Settings size={12} />,
  empinfo:              <Briefcase size={12} />,
  leave:                <Calendar size={12} />,
  letter:               <MailOpen size={12} />,
  payroll:              <DollarSign size={12} />,
};

/* ─── Status badge ────────────────────────────────────────────────────────── */

function Badge({ status }) {
  const cfg = sc(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 999, background: cfg.bg, color: cfg.color,
      textTransform: "capitalize", whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {cfg.icon}{status}
    </span>
  );
}

/* ─── Stat chip ───────────────────────────────────────────────────────────── */

function StatChip({ color, label, count }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 14px", borderRadius: 8,
      background: "#f8fafc", border: "1px solid #e8edf2",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      <span style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2233" }}>{count}</span>
    </div>
  );
}

/* ─── Leave card ──────────────────────────────────────────────────────────── */

function LeaveCard({ r, isPrivileged }) {
  const cfg  = sc(r.status);
  const days = Number(r.total_days ?? r.days ?? 0);
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e8edf2",
      borderLeft: `4px solid ${cfg.border}`,
      borderRadius: 10,
      padding: "14px 18px",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 14,
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {isPrivileged && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <User size={13} style={{ color: "#0369a1" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{empName(r)}</span>
            {r.emp_code && <span style={{ fontSize: 11, color: "#94a3b8", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>{r.emp_code}</span>}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
            {r.leave_type_name || "Leave"}
          </span>
          <span style={{
            fontSize: 11, background: "#f0f9ff", color: "#0369a1",
            padding: "1px 8px", borderRadius: 4, fontWeight: 600,
          }}>
            {days} day{days !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
          <Calendar size={12} style={{ color: "#94a3b8" }} />
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {fmtDate(r.from_date)} – {fmtDate(r.to_date)}
          </span>
        </div>

        {r.reason && (
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
            <span style={{ color: "#94a3b8" }}>Reason: </span>{r.reason}
          </p>
        )}

        {r.remarks && (
          <p style={{ fontSize: 12, color: "#475569", margin: "3px 0 0" }}>
            <span style={{ color: "#94a3b8" }}>Remarks: </span>{r.remarks}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
          {r.reviewer_name?.trim() && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Reviewed by <span style={{ color: "#475569", fontWeight: 600 }}>{r.reviewer_name.trim()}</span>
              {r.reviewed_on ? ` on ${fmtDate(r.reviewed_on)}` : ""}
            </span>
          )}
          {(r.applied_on || r.created_at) && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Applied {fmtDate(r.applied_on || r.created_at)}
            </span>
          )}
        </div>
      </div>

      <Badge status={r.status} />
    </div>
  );
}

/* ─── Regularization card ─────────────────────────────────────────────────── */

function RegCard({ r, isPrivileged, idx }) {
  const cfg = sc(r.status);
  return (
    <div style={{
      background: "#fff", border: "1px solid #e8edf2",
      borderLeft: `4px solid ${cfg.border}`,
      borderRadius: 10, padding: "14px 18px",
      display: "flex", alignItems: "flex-start",
      justifyContent: "space-between", gap: 14,
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {isPrivileged && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={13} style={{ color: "#0369a1" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{empName(r)}</span>
          </div>
        )}
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
          Attendance Regularization
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
          <CalendarClock size={12} style={{ color: "#94a3b8" }} />
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {fmtDate(r.attendance_date ?? r.date)}
            {r.check_in  && <>&nbsp;·&nbsp;In: <strong>{r.check_in}</strong></>}
            {r.check_out && <>&nbsp;·&nbsp;Out: <strong>{r.check_out}</strong></>}
          </span>
        </div>
        {r.reason && (
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
            <span style={{ color: "#94a3b8" }}>Reason: </span>{r.reason}
          </p>
        )}
        {r.remarks && (
          <p style={{ fontSize: 12, color: "#475569", margin: "3px 0 0" }}>
            <span style={{ color: "#94a3b8" }}>Remarks: </span>{r.remarks}
          </p>
        )}
        {(r.applied_on || r.created_at) && (
          <span style={{ fontSize: 11, color: "#94a3b8", display: "block", marginTop: 5 }}>
            Applied {fmtDate(r.applied_on || r.created_at)}
          </span>
        )}
      </div>
      <Badge status={r.status} />
    </div>
  );
}

/* ═══ Panel: Leave ════════════════════════════════════════════════════════ */

function LeaveDecisionsPanel({ search, statusFilter }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  const user         = getStoredUser();
  const isPrivileged = isAdmin(user) || isReportingManager(user);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    Promise.resolve(isPrivileged ? listLeaveRequests({ limit: 200 }) : getMyLeaveRequests({ limit: 100 }))
      .then((res) => { if (!dead) setRows(toArr(res)); })
      .catch(() => { if (!dead) setRows([]); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [isPrivileged]);

  const isPending = (r) => ["pending", "Pending"].includes(r.status);

  const byTab = useMemo(() => {
    if (statusFilter === "pending")  return rows.filter(isPending);
    if (statusFilter === "decided")  return rows.filter((r) => !isPending(r));
    return rows; // "all"
  }, [rows, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((r) =>
      [r.leave_type_name, r.status, r.reason, r.remarks, empName(r)]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [byTab, search]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 90, borderRadius: 10, background: "linear-gradient(90deg,#f1f5f9 25%,#e8edf2 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        ))}
      </div>
    );
  }

  const pendingCount = rows.filter(isPending).length;

  return (
    <>
      {rows.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <StatChip color="#64748b" label="Total" count={rows.length} />
          <StatChip color="#facc15" label="Pending" count={pendingCount} />
          <StatChip color="#22c55e" label="Approved" count={rows.filter((r) => ["approved","Approved"].includes(r.status)).length} />
          <StatChip color="#ef4444" label="Rejected" count={rows.filter((r) => ["rejected","Rejected"].includes(r.status)).length} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <Calendar size={52} strokeWidth={1} style={{ color: "#cbd5e1", marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>
            {statusFilter === "pending"
              ? isPrivileged ? "No pending requests to review." : "You have no pending leave requests."
              : statusFilter === "decided"
              ? isPrivileged ? "No decided requests found." : "No approved or rejected requests yet."
              : isPrivileged ? "No leave requests found." : "You haven't applied any leaves yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((r) => (
            <LeaveCard key={r.leave_request_id} r={r} isPrivileged={isPrivileged} />
          ))}
        </div>
      )}
    </>
  );
}

/* ═══ Panel: Leave Cancel ═════════════════════════════════════════════════ */

function LeaveCancelPanel({ search }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  const user         = getStoredUser();
  const isPrivileged = isAdmin(user) || isReportingManager(user);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    Promise.resolve(isPrivileged ? listLeaveRequests({ limit: 200 }) : getMyLeaveRequests({ limit: 100 }))
      .then((res) => {
        if (dead) return;
        const all = toArr(res);
        setRows(all.filter((r) => ["cancelled","Cancelled","cancel_pending","approved_pending_cancel"].includes(r.status)));
      })
      .catch(() => { if (!dead) setRows([]); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [isPrivileged]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.leave_type_name, r.status, r.reason, empName(r)]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading…</div>;

  if (!filtered.length) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <XCircle size={52} strokeWidth={1} style={{ color: "#cbd5e1", marginBottom: 12 }} />
        <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>No leave cancellation records found.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {filtered.map((r) => (
        <LeaveCard key={r.leave_request_id} r={r} isPrivileged={isPrivileged} />
      ))}
    </div>
  );
}

/* ═══ Panel: Regularization ═══════════════════════════════════════════════ */

function RegularizationPanel({ search, statusFilter }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  const user         = getStoredUser();
  const isPrivileged = isAdmin(user) || isReportingManager(user);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    Promise.resolve(listRegularizations({ limit: 200 }))
      .then((res) => { if (!dead) setRows(toArr(res)); })
      .catch(() => { if (!dead) setRows([]); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, []);

  const isPending = (r) => ["pending", "Pending"].includes(r.status);

  const byTab = useMemo(() => {
    if (statusFilter === "pending") return rows.filter(isPending);
    if (statusFilter === "decided") return rows.filter((r) => !isPending(r));
    return rows;
  }, [rows, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((r) =>
      [r.status, r.reason, r.remarks, fmtDate(r.attendance_date), empName(r)]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [byTab, search]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading…</div>;

  if (!filtered.length) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <CalendarClock size={52} strokeWidth={1} style={{ color: "#cbd5e1", marginBottom: 12 }} />
        <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>
          {statusFilter === "pending" ? "No pending regularization requests." : "No regularization records found."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {filtered.map((r, i) => (
        <RegCard key={r.regularization_id ?? r.id ?? i} r={r} isPrivileged={isPrivileged} idx={i} />
      ))}
    </div>
  );
}

/* ═══ Panel: Coming Soon ══════════════════════════════════════════════════ */

function ComingSoonPanel({ label }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <Construction size={52} strokeWidth={1} style={{ color: "#cbd5e1", marginBottom: 12 }} />
      <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>
        <strong style={{ color: "#64748b" }}>{label}</strong> will be available here soon.
      </p>
    </div>
  );
}

/* ─── router ──────────────────────────────────────────────────────────────── */

function PanelRouter({ item, search, statusFilter }) {
  if (!item) return null;
  switch (item.dataType) {
    case "leave-decisions":  return <LeaveDecisionsPanel search={search} statusFilter={statusFilter} />;
    case "leave-cancel":     return <LeaveCancelPanel search={search} />;
    case "regularization":   return <RegularizationPanel search={search} statusFilter={statusFilter} />;
    default:                 return <ComingSoonPanel label={item.label} />;
  }
}

/* ═══ Main page ═══════════════════════════════════════════════════════════ */

const TABS = [
  { key: "all",     label: "All",      icon: <ListFilter size={13} /> },
  { key: "pending", label: "Pending",  icon: <Hourglass size={13} /> },
  { key: "decided", label: "Decided",  icon: <CheckCircle2 size={13} /> },
];

const showTabs = (dataType) => ["leave-decisions", "regularization"].includes(dataType);

export default function Review() {
  const [activeItemId,  setActiveItemId]  = useState("leave");
  const [statusFilter,  setStatusFilter]  = useState("all");   // default = All
  const [search,        setSearch]        = useState("");

  const user         = getStoredUser();
  const isPrivileged = isAdmin(user) || isReportingManager(user);
  const activeItem   = useMemo(() => findReviewNavItem(activeItemId), [activeItemId]);

  const handleNavClick = (id) => {
    setActiveItemId(id);
    setStatusFilter("all");
    setSearch("");
  };

  return (
    <>
      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .rv-nav-btn:hover { background: #eef6ff !important; color: #1890ff !important; }
      `}</style>

      <div className="review-hub">
        <div className="review-hub__layout">

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          <aside style={{
            width: 235, flexShrink: 0,
            background: "#fff",
            borderRight: "1px solid #e8edf2",
            display: "flex", flexDirection: "column",
            minHeight: "calc(100vh - 4.5rem)",
          }}>
            {/* Header */}
            <div style={{
              padding: "16px 18px 12px",
              fontSize: 14, fontWeight: 700, color: "#1e293b",
              borderBottom: "1px solid #f0f4f8",
            }}>
              Review Center
            </div>

            {/* Nav */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {REVIEW_NAV_SECTIONS.map((section) => (
                <div key={section.id} style={{ marginBottom: 2 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 18px 4px",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    color: "#94a3b8", textTransform: "uppercase",
                  }}>
                    <span style={{ opacity: 0.7 }}>{SECTION_ICONS[section.id]}</span>
                    {section.label}
                  </div>

                  {section.items.map((item) => {
                    const active = activeItemId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="rv-nav-btn"
                        onClick={() => handleNavClick(item.id)}
                        style={{
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%", textAlign: "left",
                          padding: "9px 14px 9px 24px",
                          fontSize: 13,
                          fontWeight: active ? 600 : 400,
                          color:  active ? "#1890ff" : "#475569",
                          background: active ? "#eef6ff" : "transparent",
                          border: "none",
                          borderLeft: active ? "3px solid #1890ff" : "3px solid transparent",
                          cursor: "pointer", transition: "all 0.12s",
                        }}
                      >
                        {item.label}
                        {active && <ChevronRight size={13} style={{ color: "#1890ff" }} />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>

          {/* ── Main ───────────────────────────────────────────────────────── */}
          <main style={{ flex: 1, padding: "24px 28px", minWidth: 0, background: "#f8fafc" }}>

            {/* Page header */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                {activeItem?.label || "Review"}
              </h2>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "3px 0 0" }}>
                {activeItem?.sectionLabel}
                {isPrivileged && ["leave-decisions","leave-cancel","regularization"].includes(activeItem?.dataType)
                  ? " · All employees"
                  : " · Your requests"}
              </p>
            </div>

            {/* Toolbar */}
            {activeItem?.dataType !== "coming-soon" && (
              <div style={{
                display: "flex", alignItems: "center",
                gap: 12, marginBottom: 20, flexWrap: "wrap",
              }}>
                {/* Tab pills */}
                {showTabs(activeItem?.dataType) && (
                  <div style={{
                    display: "inline-flex", background: "#fff",
                    border: "1px solid #e2e8f0", borderRadius: 10,
                    padding: 4, gap: 2,
                  }}>
                    {TABS.map(({ key, label, icon }) => {
                      const active = statusFilter === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setStatusFilter(key)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "6px 14px",
                            fontSize: 12, fontWeight: active ? 700 : 500,
                            color:  active ? "#fff" : "#64748b",
                            background: active ? "#1890ff" : "transparent",
                            border: "none", borderRadius: 7,
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                        >
                          {icon}{label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Search */}
                <div style={{
                  display: "flex", alignItems: "center",
                  background: "#fff", border: "1px solid #e2e8f0",
                  borderRadius: 10, padding: "0 12px", gap: 8,
                  height: 38, minWidth: 220,
                }}>
                  <Search size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                  <input
                    type="search"
                    placeholder={isPrivileged ? "Search employee, type…" : "Search type, reason…"}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      border: "none", outline: "none", background: "transparent",
                      fontSize: 13, color: "#334155", width: "100%",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Content card */}
            <div style={{
              background: "#fff",
              border: "1px solid #e8edf2",
              borderRadius: 12,
              minHeight: 400,
              padding: activeItem?.dataType === "coming-soon" ? 0 : 20,
              display: activeItem?.dataType === "coming-soon" ? "flex" : "block",
              alignItems: "center",
              justifyContent: "center",
              overflowY: "auto",
            }}>
              <PanelRouter item={activeItem} search={search} statusFilter={statusFilter} />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
