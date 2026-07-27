import { AVATAR_COLORS, SECTIONS } from "../constants";

export function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function timeAgo(iso) {
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

export function fullName(emp) {
  return [emp.first_name, emp.last_name].filter(Boolean).join(" ").trim() || emp.email;
}

export function avatarColor(name = "") {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initials(name = "") {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0][0] + p[1][0] : name.slice(0, 2)).toUpperCase();
}

export function anniversaryThisYear(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const now = new Date();
  return new Date(now.getFullYear(), d.getMonth(), d.getDate());
}

export function daysFromToday(target) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const t = new Date(target); t.setHours(0, 0, 0, 0);
  return Math.round((t - now) / 86_400_000);
}

export function labelForDays(offset) {
  if (offset === 0) return "Today 🎉";
  if (offset === 1) return "Tomorrow";
  if (offset > 0) return `In ${offset} days`;
  return `${Math.abs(offset)}d ago`;
}

export function yearsCompleted(dateStr) {
  if (!dateStr) return 0;
  const then = new Date(dateStr); const now = new Date();
  let y = now.getFullYear() - then.getFullYear();
  const m = now.getMonth() - then.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < then.getDate())) y--;
  return Math.max(0, y);
}

export function sectionCfg(key) {
  return SECTIONS.find((s) => s.key === key) || SECTIONS[0];
}

export function buildMockFeed(holidays) {
  const now = Date.now();
  const t = (daysAgo) => new Date(now - daysAgo * 86_400_000).toISOString();

  const items = [];

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
