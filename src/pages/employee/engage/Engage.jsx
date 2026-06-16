import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, MessageCircle, Search, ChevronDown, ChevronRight,
  Calendar, HandCoins, SquareCheck, Radio, Info,
  LayoutGrid, UserRoundPlus, BookOpen,
  CheckCircle2, XCircle, AlertCircle, FileText, Cake,
} from "lucide-react";
import { getUserGreetingName, getLoggedInUser } from "../../../lib/dateUtils";
import { listEmployees } from "../../../api/employee.api";
import { getMyLeaveRequests } from "../../../api/leaveRequest.api";
import { getMyPayslips } from "../../../api/payroll.api";
import { listHolidays } from "../../../api/holiday.api";
import { listRegularizations } from "../../../api/attendance.api";

/* ─── helpers ────────────────────────────────────────────────────────────── */

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(iso);
}

function fullName(emp) {
  return [emp.first_name, emp.last_name].filter(Boolean).join(" ").trim() || emp.email;
}

const AVATAR_COLORS = [
  ["#E6F1FB", "#185FA5"], ["#FAEEDA", "#854F0B"], ["#EEEDFE", "#534AB7"],
  ["#E1F5EE", "#0F6E56"], ["#FBEAF0", "#993556"], ["#FFF3E0", "#8B5E04"],
];
function avatarColor(name = "") {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name = "") {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0][0] + p[1][0] : name.slice(0, 2)).toUpperCase();
}
function Avatar({ name, size = 32 }) {
  const [bg, fg] = avatarColor(name);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: fg,
      fontWeight: 700, fontSize: size * 0.36, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0, userSelect: "none" }}>
      {initials(name)}
    </div>
  );
}

/* ─── Birthday / Anniversary helpers ─────────────────────────────────────── */

function anniversaryThisYear(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const now = new Date();
  return new Date(now.getFullYear(), d.getMonth(), d.getDate());
}
function daysFromToday(target) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const t = new Date(target); t.setHours(0, 0, 0, 0);
  return Math.round((t - now) / 86_400_000);
}
function labelForDays(offset) {
  if (offset === 0) return "Today 🎉";
  if (offset === 1) return "Tomorrow";
  if (offset === -1) return "Yesterday";
  if (offset > 0) return `In ${offset} days`;
  return `${Math.abs(offset)} days ago`;
}
function yearsCompleted(dateStr) {
  if (!dateStr) return 0;
  const then = new Date(dateStr); const now = new Date();
  let y = now.getFullYear() - then.getFullYear();
  const m = now.getMonth() - then.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < then.getDate())) y--;
  return Math.max(0, y);
}

function buildEventItems(employees) {
  const items = [];
  for (const emp of employees) {
    const name = fullName(emp);
    const bd = anniversaryThisYear(emp.dob);
    if (bd) {
      const off = daysFromToday(bd);
      if (off >= -3 && off <= 30) items.push({
        id: `bday-${emp.employee_id}`, section: "events", type: "birthday",
        name, emp, offset: off, label: labelForDays(off),
        title: off === 0 ? `Happy Birthday, ${name}! 🎂` : `${name}'s Birthday`,
        content: off === 0
          ? `🎂 ${name} is celebrating their birthday today! Wish them a great year!`
          : `🎂 ${name}'s birthday is ${labelForDays(off).toLowerCase()}.`,
        timestamp: anniversaryThisYear(emp.dob)?.toISOString(),
        sortKey: off >= 0 ? off : 1000 + Math.abs(off),
      });
    }
    const an = anniversaryThisYear(emp.emp_joining_date);
    const yrs = yearsCompleted(emp.emp_joining_date);
    if (an && yrs >= 1) {
      const off = daysFromToday(an);
      if (off >= -3 && off <= 30) items.push({
        id: `anniv-${emp.employee_id}`, section: "events", type: "anniversary",
        name, emp, offset: off, label: labelForDays(off),
        title: off === 0 ? `${yrs}-Year Anniversary — ${name}! 🏆` : `${name}'s Work Anniversary`,
        content: off === 0
          ? `🏆 ${name} completes ${yrs} year${yrs > 1 ? "s" : ""} today. Congratulations! 🎊`
          : `🏆 ${name}'s ${yrs}-year milestone is ${labelForDays(off).toLowerCase()}.`,
        timestamp: an?.toISOString(),
        sortKey: off >= 0 ? off : 1000 + Math.abs(off),
        years: yrs,
      });
    }
  }
  return items.sort((a, b) => a.sortKey - b.sortKey);
}

/* ─── Section config (matches sidebar menu) ──────────────────────────────── */

const SECTIONS = [
  { key: "all",         label: "All Activities",       icon: <Radio size={16} />,         color: "#6b7a8d" },
  { key: "leave",       label: "Leave",                icon: <Calendar size={16} />,       color: "#185FA5", bg: "#E6F1FB" },
  { key: "attendance",  label: "Attendance",           icon: <SquareCheck size={16} />,    color: "#0F6E56", bg: "#E1F5EE" },
  { key: "salary",      label: "Salary & Payslips",   icon: <HandCoins size={16} />,      color: "#854F0B", bg: "#FAEEDA" },
  { key: "events",      label: "Birthdays & Annivs",  icon: <Cake size={16} />,           color: "#993556", bg: "#FBEAF0" },
  { key: "holidays",    label: "Holidays",             icon: <BookOpen size={16} />,       color: "#534AB7", bg: "#EEEDFE" },
  { key: "worklife",    label: "My Worklife",          icon: <LayoutGrid size={16} />,     color: "#3B5FC0", bg: "#F0F4FF" },
  { key: "hiring",      label: "Hiring",               icon: <UserRoundPlus size={16} />,  color: "#7a6210", bg: "#FEF9E6" },
  { key: "helpdesk",    label: "Helpdesk",             icon: <Info size={16} />,           color: "#7a1e1e", bg: "#FDEDED" },
];

function sectionCfg(key) {
  return SECTIONS.find((s) => s.key === key) || SECTIONS[0];
}

/* ─── Status badge ───────────────────────────────────────────────────────── */

const STATUS_CFG = {
  approved:  { label: "Approved",  bg: "#E1F5EE", color: "#0F6E56", Icon: CheckCircle2 },
  rejected:  { label: "Rejected",  bg: "#FCEBEB", color: "#A32D2D", Icon: XCircle },
  pending:   { label: "Pending",   bg: "#FAEEDA", color: "#854F0B", Icon: AlertCircle },
  cancelled: { label: "Cancelled", bg: "#F0F3F8", color: "#6b7a8d", Icon: XCircle },
  generated: { label: "Generated", bg: "#E6F1FB", color: "#185FA5", Icon: FileText },
  upcoming:  { label: "Upcoming",  bg: "#EEEDFE", color: "#534AB7", Icon: Calendar },
  general:   { label: "General",   bg: "#EEEDFE", color: "#534AB7", Icon: Calendar },
  restricted:{ label: "Restricted",bg: "#FBEAF0", color: "#993556", Icon: Calendar },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG["pending"];
  const { label, bg, color, Icon } = cfg;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11,
      fontWeight: 600, background: bg, color, padding: "3px 9px", borderRadius: 20 }}>
      <Icon size={11} />
      {label}
    </span>
  );
}

/* ─── Activity card ──────────────────────────────────────────────────────── */

function ActivityCard({ item, navigate }) {
  const sec = sectionCfg(item.section);
  const isToday = item.offset === 0;
  const isPast = (item.offset ?? 1) < -1;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8edf2",
        borderRadius: 12,
        padding: 20,
        opacity: isPast ? 0.76 : 1,
        borderLeft: isToday && item.section === "events" ? `4px solid ${sec.color}` : undefined,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Section icon */}
          <div style={{ width: 40, height: 40, borderRadius: 12, background: sec.bg || "#f0f3f8",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            {item.emoji || (
              <span style={{ color: sec.color, display: "flex" }}>{sec.icon}</span>
            )}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2233" }}>{item.title}</span>
              {item.status && <StatusBadge status={item.status} />}
              {isToday && item.section === "events" && (
                <span style={{ fontSize: 10, fontWeight: 700, background: sec.bg, color: sec.color,
                  padding: "2px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  TODAY
                </span>
              )}
            </div>
            <span style={{ fontSize: 11, color: "#9ca8b5" }}>
              {sec.label}  ·  {item.label || (item.timestamp && timeAgo(item.timestamp))}
            </span>
          </div>
        </div>
        {/* CTA link */}
        {item.link && (
          <button
            onClick={() => navigate(item.link)}
            style={{ fontSize: 11, fontWeight: 600, color: sec.color, background: "none",
              border: "none", cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}
          >
            View →
          </button>
        )}
      </div>

      {/* Content */}
      <p style={{ fontSize: 13, color: "#374151", margin: "0 0 12px", lineHeight: 1.55 }}>{item.content}</p>

      {/* Extra chips row */}
      {item.chips && item.chips.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {item.chips.map((chip, i) => (
            <span key={i} style={{ fontSize: 11, background: "#f5f7fb", color: "#6b7a8d",
              padding: "3px 10px", borderRadius: 20, border: "1px solid #e8edf2" }}>
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Message highlight (for events) */}
      {item.message && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: sec.bg || "#f0f3f8",
          borderRadius: 8, padding: "6px 12px", marginBottom: 12 }}>
          {item.name && <Avatar name={item.name} size={22} />}
          <span style={{ fontSize: 12, fontWeight: 600, color: sec.color }}>{item.message}</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, borderTop: "1px solid #f0f3f8", paddingTop: 10 }}>
        <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca8b5",
          background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Heart size={13} /><span>React</span>
        </button>
        <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca8b5",
          background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <MessageCircle size={13} /><span>Comment</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Upcoming sidebar ───────────────────────────────────────────────────── */

function UpcomingPanel({ employees, holidays }) {
  const upcoming = useMemo(() => {
    const list = [];
    for (const emp of employees) {
      const name = fullName(emp);
      const bd = anniversaryThisYear(emp.dob);
      if (bd) { const off = daysFromToday(bd); if (off >= 0 && off <= 14) list.push({ name, off, emoji: "🎂" }); }
      const an = anniversaryThisYear(emp.emp_joining_date);
      if (an && yearsCompleted(emp.emp_joining_date) >= 1) {
        const off = daysFromToday(an); if (off >= 0 && off <= 14) list.push({ name, off, emoji: "🏆" });
      }
    }
    for (const h of holidays) {
      const off = daysFromToday(h.holiday_date);
      if (off >= 0 && off <= 14) list.push({ name: h.holiday_name, off, emoji: h.is_restricted ? "🔒" : "📅", isHoliday: true });
    }
    return list.sort((a, b) => a.off - b.off).slice(0, 8);
  }, [employees, holidays]);

  return (
    <div style={{ background: "#fff", border: "1px solid #e8edf2", borderRadius: 12, padding: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#1a2233", margin: "0 0 12px" }}>
        📅 Coming up (14 days)
      </p>
      {upcoming.length === 0 ? (
        <p style={{ fontSize: 12, color: "#9ca8b5", margin: 0 }}>Nothing upcoming.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {upcoming.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{it.emoji}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1a2233", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {it.isHoliday ? it.name : it.name.split(" ")[0]}
                </p>
                <p style={{ fontSize: 11, color: "#9ca8b5", margin: 0 }}>
                  {it.off === 0 ? "Today!" : labelForDays(it.off)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

const Engage = () => {
  const navigate = useNavigate();
  const greetingName = getUserGreetingName();
  const loggedUser = getLoggedInUser();
  const myName = loggedUser?.name || greetingName;

  const [activeFilter, setActiveFilter]   = useState("all");
  const [sortBy, setSortBy]               = useState("newest");
  const [search, setSearch]               = useState("");
  const [loading, setLoading]             = useState(true);

  const [employees, setEmployees]         = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [payslips, setPayslips]           = useState([]);
  const [holidays, setHolidays]           = useState([]);
  const [regularizations, setRegularizations] = useState([]);

  /* ── Fetch all data in parallel ── */
  useEffect(() => {
    const yr = new Date().getFullYear();
    setLoading(true);
    Promise.allSettled([
      listEmployees({ limit: 500, status: "active" }),
      getMyLeaveRequests({ limit: 30 }),
      getMyPayslips({ limit: 12 }),
      listHolidays({ year: yr, limit: 50 }),
      listRegularizations({ limit: 20 }),
    ]).then(([emp, leave, pay, hol, reg]) => {
      // unwrapList returns { data, meta } — extract .data (or [] if error/empty)
      const arr = (v) => (v.status === "fulfilled" ? (Array.isArray(v.value) ? v.value : v.value?.data ?? []) : []);
      setEmployees(arr(emp));
      setLeaveRequests(arr(leave));
      setPayslips(arr(pay));
      setHolidays(arr(hol));
      setRegularizations(arr(reg));
    }).finally(() => setLoading(false));
  }, []);

  /* ── Build unified feed ── */
  const allItems = useMemo(() => {
    const items = [];

    /* Leave requests */
    for (const lr of leaveRequests) {
      const from = fmtDate(lr.from_date);
      const to   = fmtDate(lr.to_date);
      const days = lr.total_days ?? lr.duration ?? "?";
      items.push({
        id: `leave-${lr.leave_request_id}`, section: "leave",
        status: lr.status,
        title: `${lr.leave_type_name || "Leave"} Request`,
        content: `You applied for ${lr.leave_type_name || "leave"} from ${from} to ${to} (${days} day${days !== 1 ? "s" : ""}).`,
        chips: [`${days} day${days !== 1 ? "s" : ""}`, `${from} → ${to}`],
        emoji: lr.status === "approved" ? "✅" : lr.status === "rejected" ? "❌" : "⏳",
        timestamp: lr.applied_on || lr.created_at,
        link: "/employee/leave/balance",
        sortTs: new Date(lr.applied_on || lr.created_at || Date.now()).getTime(),
      });
    }

    /* Payslips */
    for (const ps of payslips) {
      const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const mon = MONTHS[(ps.month || 1) - 1];
      items.push({
        id: `payslip-${ps.payslip_id}`, section: "salary",
        status: "generated",
        title: `Payslip — ${mon} ${ps.year}`,
        content: `Your payslip for ${mon} ${ps.year} has been generated. Net Pay: ₹${Number(ps.net_pay || 0).toLocaleString("en-IN")}.`,
        chips: ps.ctc ? [`CTC ₹${Number(ps.ctc).toLocaleString("en-IN")}`] : [],
        emoji: "💰",
        timestamp: ps.created_at,
        link: `/payslip/${ps.payslip_id}/print`,
        sortTs: new Date(ps.created_at || `${ps.year}-${String(ps.month).padStart(2,"0")}-01`).getTime(),
      });
    }

    /* Holidays */
    for (const h of holidays) {
      const off = daysFromToday(h.holiday_date);
      if (off < -1 || off > 30) continue;
      items.push({
        id: `holiday-${h.holiday_id}`, section: "holidays",
        status: h.is_restricted ? "restricted" : "general",
        title: h.holiday_name,
        content: `${h.is_restricted ? "Restricted holiday" : "Public holiday"} on ${fmtDate(h.holiday_date)}.${off === 0 ? " 🎉 Today!" : ""}`,
        chips: [h.is_restricted ? "Restricted" : "General", fmtDate(h.holiday_date)],
        emoji: h.is_restricted ? "🔒" : "📅",
        timestamp: h.holiday_date,
        sortTs: new Date(h.holiday_date).getTime(),
      });
    }

    /* Attendance regularizations */
    for (const r of regularizations) {
      items.push({
        id: `reg-${r.regularization_id}`, section: "attendance",
        status: r.status,
        title: `Regularization — ${fmtDate(r.attendance_date)}`,
        content: `Regularization request for ${fmtDate(r.attendance_date)}. Reason: ${r.reason || "—"}.`,
        chips: r.shift_in ? [`In: ${r.shift_in}`, `Out: ${r.shift_out || "—"}`] : [],
        emoji: r.status === "approved" ? "✅" : r.status === "rejected" ? "❌" : "⏳",
        timestamp: r.created_at,
        link: "/employee/attendance/regularizations",
        sortTs: new Date(r.created_at || r.attendance_date || Date.now()).getTime(),
      });
    }

    /* Birthday & anniversary events */
    const eventItems = buildEventItems(employees);
    for (const ev of eventItems) {
      ev.sortTs = new Date(ev.timestamp || Date.now()).getTime() + (ev.sortKey || 0) * 1000;
      ev.message = ev.type === "birthday"
        ? `Happy Birthday, ${ev.name}! 🎉`
        : `Congratulations on ${ev.years} year${ev.years > 1 ? "s" : ""}, ${ev.name}! 🎊`;
      items.push(ev);
    }

    return items;
  }, [employees, leaveRequests, payslips, holidays, regularizations]);

  /* ── Filter + sort ── */
  const visibleItems = useMemo(() => {
    let filtered = activeFilter === "all"
      ? allItems
      : allItems.filter((i) => i.section === activeFilter);

    const staticSections = ["worklife", "hiring", "helpdesk"];
    if (staticSections.includes(activeFilter)) filtered = [];

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((i) =>
        i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q) || (i.name || "").toLowerCase().includes(q)
      );
    }

    filtered = [...filtered].sort((a, b) =>
      sortBy === "oldest" ? a.sortTs - b.sortTs : b.sortTs - a.sortTs
    );

    return filtered;
  }, [allItems, activeFilter, search, sortBy]);

  const todayEvents = allItems.filter((i) => i.section === "events" && i.offset === 0).length;

  /* ── Section counts ── */
  const countFor = (key) => key === "all" ? allItems.length : allItems.filter((i) => i.section === key).length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E6F1FB",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 18, color: "#185FA5" }}>
              {initials(myName)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hey {greetingName},</h1>
              <p className="text-gray-500 text-sm">
                {todayEvents > 0
                  ? `${todayEvents} celebration${todayEvents > 1 ? "s" : ""} happening today! 🎉`
                  : "Here's what's happening across your workspace."}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/employee/worklife/kudos")}
              className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-pink-300 rounded-lg hover:bg-pink-50">
              <span className="text-2xl">💝</span>
              <span className="text-xs font-medium text-gray-700">Give Kudos</span>
            </button>
            <button className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-brand-200 rounded-lg hover:bg-brand-50">
              <span className="text-2xl">📊</span>
              <span className="text-xs font-medium text-gray-700">Create Polls</span>
            </button>
            <button onClick={() => navigate("/employee/leave/apply")}
              className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-purple-300 rounded-lg hover:bg-purple-50">
              <span className="text-2xl">📝</span>
              <span className="text-xs font-medium text-gray-700">Apply Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto p-6 flex gap-6">

        {/* ── Left Sidebar ── */}
        <div className="w-64 flex-shrink-0 space-y-4">

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Filters</h3>

            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Activities</h4>
            <div className="space-y-1 mb-5">
              {SECTIONS.map(({ key, label, icon, color }) => {
                const cnt = countFor(key);
                const active = activeFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "7px 10px",
                      borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
                      background: active ? "#f0f7ff" : "transparent",
                      color: active ? color || "#185FA5" : "#4b5563",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span style={{ color: active ? color || "#185FA5" : "#9ca8b5", display: "flex" }}>{icon}</span>
                    <span style={{ fontSize: 13, flex: 1 }}>{label}</span>
                    {cnt > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: active ? color + "22" : "#f0f3f8",
                        color: active ? color || "#185FA5" : "#9ca8b5", padding: "1px 6px", borderRadius: 10, minWidth: 20, textAlign: "center" }}>
                        {cnt}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Search</h4>
            <div className="relative mb-5">
              <input type="text" placeholder="Search activities…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gray-400" />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>

            {/* Groups / Dept / Location placeholders */}
            {[["Groups", "/employee/people"], ["Department", "/employee/people"], ["Location", null]].map(([label, link]) => (
              <button key={label}
                onClick={() => link && navigate(link)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                <span className="font-medium">{label}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>

          {/* Upcoming panel */}
          <UpcomingPanel employees={employees} holidays={holidays} />

          {/* Quick links */}
          <div className="bg-white rounded-lg shadow p-4">
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1a2233", margin: "0 0 10px" }}>Quick Links</p>
            {[
              { label: "Apply Leave", path: "/employee/leave/apply", emoji: "🌴" },
              { label: "Leave Balance", path: "/employee/leave/balance", emoji: "📋" },
              { label: "Payslips", path: "/employee/payroll/payslips", emoji: "💰" },
              { label: "Holiday Calendar", path: "/employee/leave/holiday-calendar", emoji: "📅" },
              { label: "Give Kudos", path: "/employee/worklife/kudos", emoji: "💝" },
            ].map(({ label, path, emoji }) => (
              <button key={label} onClick={() => navigate(path)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 8px", borderRadius: 7, border: "none", background: "transparent",
                  cursor: "pointer", fontSize: 12, color: "#4b5563", textAlign: "left" }}
                className="hover:bg-gray-50">
                <span>{emoji}</span><span>{label}</span>
                <ChevronRight size={12} style={{ marginLeft: "auto", color: "#d1d8e0" }} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Feed ── */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-800">
              {SECTIONS.find((s) => s.key === activeFilter)?.label || "All Activities"}
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({visibleItems.length} item{visibleItems.length !== 1 ? "s" : ""})
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="text-sm bg-white border border-gray-300 rounded px-3 py-1 focus:outline-none">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => <div key={n} className="bg-white rounded-xl h-36 animate-pulse border border-gray-100" />)}
            </div>
          ) : ["worklife", "hiring", "helpdesk"].includes(activeFilter) ? (
            <div className="bg-white rounded-xl border border-gray-100 p-14 text-center">
              <p className="text-4xl mb-3">
                {activeFilter === "worklife" ? "💝" : activeFilter === "hiring" ? "🚀" : "🎧"}
              </p>
              <p className="font-semibold text-gray-600 text-sm mb-1">
                No {SECTIONS.find((s) => s.key === activeFilter)?.label} activities yet
              </p>
              <p className="text-gray-400 text-xs">Be the first to create one!</p>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-14 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-semibold text-gray-600 text-sm mb-1">No activities found</p>
              <p className="text-gray-400 text-xs">
                {search ? "Try a different search term." : "Check back later for updates."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleItems.map((item) => (
                <ActivityCard key={item.id} item={item} navigate={navigate} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Engage;
