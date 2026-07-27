import { DEPARTMENT_BADGE } from "../../../../data/teamsData";
import { AVATAR_COLORS, FALLBACK_BADGE_COLORS } from "../constants";

export function getInitials(name) {
  return (name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function getAvatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function fullName(e) {
  return [e.first_name, e.last_name].filter(Boolean).join(" ") || e.emp_code || "Employee";
}

export function calcAvgTenure(members) {
  const dates = members
    .map((m) => m.emp_joining_date || m.joining_date)
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d));
  if (!dates.length) return "—";
  const now = Date.now();
  const avgMs = dates.reduce((s, d) => s + (now - d.getTime()), 0) / dates.length;
  const yrs = avgMs / (1000 * 60 * 60 * 24 * 365.25);
  return yrs < 1 ? `${Math.round(yrs * 12)} mo` : `${yrs.toFixed(1)} yrs`;
}

export function badgeInlineStyle(idx) {
  const s = FALLBACK_BADGE_COLORS[idx % FALLBACK_BADGE_COLORS.length];
  return { color: s.color, borderColor: s.border, background: s.bg };
}

export function buildTeams(rows) {
  const nameMap = {};
  rows.forEach((e) => { nameMap[e.employee_id] = { ...e, name: fullName(e) }; });

  const directReports = {};
  rows.forEach((e) => {
    if (e.reporting_to && nameMap[e.reporting_to]) {
      if (!directReports[e.reporting_to]) directReports[e.reporting_to] = [];
      directReports[e.reporting_to].push({ ...e, name: fullName(e) });
    }
  });

  const teams = [];
  let idx = 0;

  Object.entries(directReports).forEach(([managerId, members]) => {
    const manager = nameMap[managerId];
    if (!manager) return;

    members.sort((a, b) => a.name.localeCompare(b.name));

    const dept = manager.department_name || "General";
    const badgeClass = DEPARTMENT_BADGE[dept];

    teams.push({
      id: `team-${managerId}`,
      managerId: Number(managerId),
      name: `${manager.name}'s Team`,
      department: dept,
      description: [manager.emp_job_title || manager.designation_name, dept]
        .filter(Boolean)
        .join(" · "),
      lead: {
        name: manager.name,
        title: manager.emp_job_title || manager.designation_name || "Manager",
        employee_id: manager.employee_id,
      },
      members,
      avgTenure: calcAvgTenure(members),
      badgeClass,
      badgeIdx: idx++,
    });
  });

  teams.sort((a, b) => b.members.length - a.members.length || a.name.localeCompare(b.name));
  return teams;
}
