import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ChevronRight,
  Radio, Info, BookOpen, Star, Megaphone, PartyPopper, Cake,
  CheckCircle2, AlertCircle, Calendar,
} from "lucide-react";
import { getUserGreetingName, getLoggedInUser } from "../../../lib/dateUtils";
import { listEmployees } from "../../../api/employee.api";
import { listHolidays } from "../../../api/holiday.api";
import { cssClass, joinClasses } from "../../../utils/classStyles";

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
    <div className={cssClass({
      width: size, height: size, borderRadius: "50%", background: bg, color: fg,
      fontWeight: 700, fontSize: size * 0.36, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0, userSelect: "none",
    })}>
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
  if (offset > 0) return `In ${offset} days`;
  return `${Math.abs(offset)}d ago`;
}
function yearsCompleted(dateStr) {
  if (!dateStr) return 0;
  const then = new Date(dateStr); const now = new Date();
  let y = now.getFullYear() - then.getFullYear();
  const m = now.getMonth() - then.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < then.getDate())) y--;
  return Math.max(0, y);
}

/* ─── Section config ─────────────────────────────────────────────────────── */
const SECTIONS = [
  { key: "all",          label: "All Activities",  icon: <Radio size={16} />,       color: "#6b7a8d" },
  { key: "announcement", label: "Announcements",   icon: <Megaphone size={16} />,   color: "#185FA5", bg: "#E6F1FB" },
  { key: "holiday",      label: "Holidays",        icon: <BookOpen size={16} />,    color: "#534AB7", bg: "#EEEDFE" },
  { key: "recognition",  label: "Recognition",     icon: <Star size={16} />,        color: "#854F0B", bg: "#FAEEDA" },
  { key: "event",        label: "Events",          icon: <PartyPopper size={16} />, color: "#0F6E56", bg: "#E1F5EE" },
  { key: "helpdesk",     label: "Helpdesk",        icon: <Info size={16} />,        color: "#7a1e1e", bg: "#FDEDED" },
];

function sectionCfg(key) {
  return SECTIONS.find((s) => s.key === key) || SECTIONS[0];
}

/* ─── Status badge ───────────────────────────────────────────────────────── */
const STATUS_CFG = {
  new:      { label: "New",      bg: "#E6F1FB", color: "#185FA5", Icon: AlertCircle },
  open:     { label: "Open",     bg: "#FAEEDA", color: "#854F0B", Icon: AlertCircle },
  resolved: { label: "Resolved", bg: "#E1F5EE", color: "#0F6E56", Icon: CheckCircle2 },
  upcoming: { label: "Upcoming", bg: "#EEEDFE", color: "#534AB7", Icon: Calendar },
  general:  { label: "General",  bg: "#EEEDFE", color: "#534AB7", Icon: Calendar },
  restricted:{ label: "Restricted", bg: "#FBEAF0", color: "#993556", Icon: Calendar },
  kudos:    { label: "Kudos",    bg: "#FAEEDA", color: "#854F0B", Icon: Star },
};
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG["new"];
  const { label, bg, color, Icon } = cfg;
  return (
    <span className={cssClass({
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11,
      fontWeight: 600, background: bg, color, padding: "3px 9px", borderRadius: 20,
    })}>
      <Icon size={11} />{label}
    </span>
  );
}

/* ─── Activity card ──────────────────────────────────────────────────────── */
function ActivityCard({ item, navigate }) {
  const sec = sectionCfg(item.section);

  return (
    <div style={{
      background: "#fff", border: "1px solid #e8edf2",
      borderLeft: `3px solid ${sec.color}`,
      borderRadius: 10, padding: "14px 16px",
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: sec.bg || "#f0f3f8",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>
        {item.emoji || <span style={{ color: sec.color, display: "flex" }}>{sec.icon}</span>}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title + badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2233" }}>{item.title}</span>
          {item.status && <StatusBadge status={item.status} />}
        </div>

        {/* Description */}
        {item.description && (
          <p style={{ fontSize: 12.5, color: "#4b5563", margin: "0 0 6px", lineHeight: 1.5 }}>
            {item.description}
          </p>
        )}

        {/* Chips */}
        {item.chips && item.chips.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            {item.chips.map((chip, i) => (
              <span key={i} style={{
                fontSize: 11, background: "#f5f7fb", color: "#4b5563",
                padding: "2px 8px", borderRadius: 20, border: "1px solid #e8edf2", fontWeight: 500,
              }}>{chip}</span>
            ))}
          </div>
        )}

        {/* Kudos person highlight */}
        {item.fromName && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: sec.bg || "#f0f3f8", borderRadius: 7,
            padding: "4px 10px", marginBottom: 6,
          }}>
            <Avatar name={item.fromName} size={20} />
            <span style={{ fontSize: 11, fontWeight: 600, color: sec.color }}>
              {item.fromName} sent you kudos 💝
            </span>
          </div>
        )}

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: "#9ca8b5" }}>
            {sec.label} · {item.timeLabel || timeAgo(item.timestamp)}
          </span>
          {item.link && (
            <button onClick={() => navigate(item.link)} style={{
              marginLeft: "auto", fontSize: 11, fontWeight: 600, color: sec.color,
              background: "none", border: "none", cursor: "pointer", padding: 0, whiteSpace: "nowrap",
            }}>
              View →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Upcoming panel ─────────────────────────────────────────────────────── */
function UpcomingPanel({ employees, holidays }) {
  const upcoming = useMemo(() => {
    const list = [];
    /* Holidays */
    for (const h of holidays) {
      const off = daysFromToday(h.holiday_date);
      if (off >= 0 && off <= 30)
        list.push({ name: h.holiday_name, off, emoji: h.is_restricted ? "🔒" : "📅", isHoliday: true });
    }
    /* Birthdays */
    for (const emp of employees) {
      const name = fullName(emp);
      const bd = anniversaryThisYear(emp.dob);
      if (bd) {
        const off = daysFromToday(bd);
        if (off >= 0 && off <= 14) list.push({ name, off, emoji: "🎂" });
      }
      const an = anniversaryThisYear(emp.emp_joining_date);
      if (an && yearsCompleted(emp.emp_joining_date) >= 1) {
        const off = daysFromToday(an);
        if (off >= 0 && off <= 14) list.push({ name, off, emoji: "🏆" });
      }
    }
    return list.sort((a, b) => a.off - b.off).slice(0, 8);
  }, [employees, holidays]);

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e8edf2", borderRadius: 12, padding: 16 })}>
      <p className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1a2233", margin: "0 0 12px" })}>
        📅 Coming Up (30 days)
      </p>
      {upcoming.length === 0 ? (
        <p className={cssClass({ fontSize: 12, color: "#9ca8b5", margin: 0 })}>Nothing upcoming.</p>
      ) : (
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
          {upcoming.map((it, i) => (
            <div key={i} className={cssClass({ display: "flex", alignItems: "center", gap: 9 })}>
              <span className={cssClass({ fontSize: 18, flexShrink: 0 })}>{it.emoji}</span>
              <div className={cssClass({ minWidth: 0 })}>
                <p className={cssClass({
                  fontSize: 12, fontWeight: 600, color: "#1a2233", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                })}>
                  {it.isHoliday ? it.name : it.name.split(" ")[0]}
                </p>
                <p className={cssClass({ fontSize: 11, color: "#9ca8b5", margin: 0 })}>
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

/* ─── Mock engagement feed data ───────────────────────────────────────────── */
function buildMockFeed(holidays) {
  const now = Date.now();
  const t = (daysAgo) => new Date(now - daysAgo * 86_400_000).toISOString();

  const items = [];

  /* ── Announcements ── */
  items.push({
    id: "ann-1", section: "announcement", emoji: "📢",
    title: "Q3 Company All-Hands Meeting",
    description: "Join us for our quarterly all-hands on 15 Jul at 3:00 PM IST. Leadership will share company updates, roadmap highlights, and Q&A.",
    chips: ["15 Jul 2026", "3:00 PM IST", "Virtual"],
    timestamp: t(1), sortTs: now - 1 * 86_400_000,
  });
  items.push({
    id: "ann-2", section: "announcement", emoji: "📋",
    title: "Updated Work From Home Policy",
    description: "HR has updated the WFH policy effective 1 Aug 2026. Employees may work remotely up to 3 days per week with manager approval.",
    chips: ["Effective 1 Aug 2026", "HR Policy"],
    timestamp: t(3), sortTs: now - 3 * 86_400_000,
    link: "/employee/worklife",
  });
  items.push({
    id: "ann-3", section: "announcement", emoji: "🏥",
    title: "Health Insurance Renewal — Action Required",
    description: "Annual health insurance enrollment is open. Please review your coverage options and update nominees by 31 Jul 2026.",
    chips: ["Deadline: 31 Jul 2026", "Benefits"],
    timestamp: t(5), sortTs: now - 5 * 86_400_000,
  });

  /* ── Holidays (from API) ── */
  for (const h of holidays) {
    const off = daysFromToday(h.holiday_date);
    if (off < -7 || off > 60) continue;
    items.push({
      id: `holiday-${h.holiday_id}`, section: "holiday",
      emoji: h.is_restricted ? "🔒" : "📅",
      title: h.holiday_name,
      description: `${h.is_restricted ? "Restricted holiday" : "Public holiday"} on ${fmtDate(h.holiday_date)}.`,
      chips: [h.is_restricted ? "Restricted" : "Public Holiday", fmtDate(h.holiday_date)],
      status: h.is_restricted ? "restricted" : "general",
      timestamp: h.holiday_date,
      sortTs: new Date(h.holiday_date).getTime(),
    });
  }

  /* ── Recognition / Kudos ── */
  items.push({
    id: "kudo-1", section: "recognition", emoji: "💝",
    title: "Kudos Received!",
    description: "\"Outstanding work on the client onboarding project — delivered ahead of schedule and exceeded expectations!\"",
    fromName: "Priya Sharma",
    status: "kudos",
    chips: ["Teamwork", "Delivery Excellence"],
    timestamp: t(2), sortTs: now - 2 * 86_400_000,
  });
  items.push({
    id: "kudo-2", section: "recognition", emoji: "🏆",
    title: "Employee Spotlight — June 2026",
    description: "Congratulations to Arjun Kumar for being recognised as Employee of the Month for June 2026!",
    chips: ["Employee of the Month", "Jun 2026"],
    timestamp: t(4), sortTs: now - 4 * 86_400_000,
  });
  items.push({
    id: "kudo-3", section: "recognition", emoji: "⭐",
    title: "Team Achievement — Product Launch",
    description: "The Engineering team successfully launched v2.0 on schedule. Great collaborative effort across all squads!",
    chips: ["Team Win", "Engineering"],
    timestamp: t(7), sortTs: now - 7 * 86_400_000,
  });

  /* ── Events ── */
  items.push({
    id: "event-1", section: "event", emoji: "🎉",
    title: "Team Outing — Adventure Park",
    description: "Join the team for a fun outing at Wonderla on 20 Jul 2026. RSVPs due by 12 Jul. Transport arranged from office.",
    chips: ["20 Jul 2026", "Wonderla", "RSVP by 12 Jul"],
    timestamp: t(2), sortTs: now - 2 * 86_400_000,
  });
  items.push({
    id: "event-2", section: "event", emoji: "🎓",
    title: "Leadership Workshop — Growth Mindset",
    description: "An interactive half-day session on building a growth mindset at work. Open to all employees.",
    chips: ["18 Jul 2026", "10:00 AM", "Conference Hall A"],
    timestamp: t(6), sortTs: now - 6 * 86_400_000,
  });
  items.push({
    id: "event-3", section: "event", emoji: "🏸",
    title: "Inter-Department Sports Day",
    description: "Annual sports event featuring badminton, cricket, and carrom. Register your team before 10 Jul.",
    chips: ["25 Jul 2026", "Sports Complex", "Register by 10 Jul"],
    timestamp: t(8), sortTs: now - 8 * 86_400_000,
  });

  /* ── Helpdesk ── */
  items.push({
    id: "hd-1", section: "helpdesk", emoji: "🎧",
    title: "IT Support — Laptop Replacement",
    description: "Your request for a laptop replacement (Ticket #HD-2041) has been approved. Collection from IT desk by 14 Jul.",
    chips: ["#HD-2041", "Approved"],
    status: "resolved",
    timestamp: t(1), sortTs: now - 1 * 86_400_000,
  });
  items.push({
    id: "hd-2", section: "helpdesk", emoji: "🔧",
    title: "Facility Request — Ergonomic Chair",
    description: "Your request for an ergonomic chair (Ticket #HD-2038) is under review by the Facilities team.",
    chips: ["#HD-2038", "In Progress"],
    status: "open",
    timestamp: t(3), sortTs: now - 3 * 86_400_000,
  });

  return items.sort((a, b) => b.sortTs - a.sortTs);
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
const Engage = () => {
  const navigate = useNavigate();
  const greetingName = getUserGreetingName();
  const loggedUser = getLoggedInUser();
  const myName = loggedUser?.name || greetingName;

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [employees, setEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);

  /* ── Fetch ── */
  useEffect(() => {
    const yr = new Date().getFullYear();
    setLoading(true);
    Promise.allSettled([
      listEmployees({ limit: 500, status: "active" }),
      listHolidays({ year: yr, limit: 50 }),
    ]).then(([emp, hol]) => {
      const arr = (v) =>
        v.status === "fulfilled"
          ? Array.isArray(v.value) ? v.value : v.value?.data ?? []
          : [];
      setEmployees(arr(emp));
      setHolidays(arr(hol));
    }).finally(() => setLoading(false));
  }, []);

  /* ── Feed ── */
  const allItems = useMemo(() => buildMockFeed(holidays), [holidays]);

  /* ── Filter ── */
  const visibleItems = useMemo(() => {
    let list = activeFilter === "all"
      ? allItems
      : allItems.filter((i) => i.section === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allItems, activeFilter, search]);

  const countFor = (key) =>
    key === "all" ? allItems.length : allItems.filter((i) => i.section === key).length;

  /* ── Celebrate today events ── */
  const todayBirthdays = useMemo(() =>
    employees.filter((e) => {
      const bd = anniversaryThisYear(e.dob);
      return bd && daysFromToday(bd) === 0;
    }), [employees]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={cssClass({
              width: 48, height: 48, borderRadius: "50%", background: "#E6F1FB",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 18, color: "#185FA5",
            })}>
              {initials(myName)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hey {greetingName},</h1>
              <p className="text-gray-500 text-sm">
                {todayBirthdays.length > 0
                  ? `🎂 ${todayBirthdays.map((e) => fullName(e).split(" ")[0]).join(", ")} ${todayBirthdays.length === 1 ? "is" : "are"} celebrating a birthday today!`
                  : "Here's what's happening across your workspace."}
              </p>
            </div>
          </div>

          {/* Quick Actions — Kudos + Apply Leave only */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/employee/worklife/kudos")}
              className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-pink-300 rounded-lg hover:bg-pink-50 transition-colors"
            >
              <span className="text-2xl">💝</span>
              <span className="text-xs font-medium text-gray-700">Give Kudos</span>
            </button>
            <button
              onClick={() => navigate("/employee/leave/apply")}
              className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
            >
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

          {/* Activity Filters */}
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
                    className={cssClass({
                      width: "100%", display: "flex", alignItems: "center", gap: 9,
                      padding: "7px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                      textAlign: "left",
                      background: active ? "#f0f7ff" : "transparent",
                      color: active ? color || "#185FA5" : "#4b5563",
                      fontWeight: active ? 600 : 400,
                    })}
                  >
                    <span className={cssClass({ color: active ? color || "#185FA5" : "#9ca8b5", display: "flex" })}>
                      {icon}
                    </span>
                    <span className={cssClass({ fontSize: 13, flex: 1 })}>{label}</span>
                    {cnt > 0 && (
                      <span className={cssClass({
                        fontSize: 10, fontWeight: 700,
                        background: active ? color + "22" : "#f0f3f8",
                        color: active ? color || "#185FA5" : "#9ca8b5",
                        padding: "1px 6px", borderRadius: 10, minWidth: 20, textAlign: "center",
                      })}>
                        {cnt}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Search</h4>
            <div className="relative">
              <input
                type="text"
                placeholder="Search activities…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gray-400"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Coming Up */}
          <UpcomingPanel employees={employees} holidays={holidays} />

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow p-4">
            <p className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1a2233", margin: "0 0 10px" })}>
              Quick Links
            </p>
            {[
              { label: "Apply Leave",      path: "/employee/leave/apply",            emoji: "🌴" },
              { label: "Leave Balance",    path: "/employee/leave/balance",           emoji: "📋" },
              { label: "Holiday Calendar", path: "/employee/leave/calendar",          emoji: "📅" },
              { label: "Helpdesk",         path: "/employee/worklife/helpdesk",       emoji: "🎧" },
            ].map(({ label, path, emoji }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={joinClasses(
                  "hover:bg-gray-50",
                  cssClass({
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 8px", borderRadius: 7, border: "none",
                    background: "transparent", cursor: "pointer",
                    fontSize: 12, color: "#4b5563", textAlign: "left",
                  })
                )}
              >
                <span>{emoji}</span>
                <span>{label}</span>
                <ChevronRight size={12} className={cssClass({ marginLeft: "auto", color: "#d1d8e0" })} />
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
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-xl h-28 animate-pulse border border-gray-100" />
              ))}
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
            <div className="space-y-3">
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
