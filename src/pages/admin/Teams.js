import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Plus, Users, RefreshCw, Crown } from "lucide-react";
import CreateTeamModal from "./CreateTeamModal";
import { DEPARTMENT_BADGE } from "../../data/teamsData";
import "./teams.css";
import apiClient, { unwrap } from "../../api/client";

/* ── helpers ──────────────────────────────────────────────────────────── */import { cssClass, joinClasses } from "../../utils/classStyles";
const AVATAR_COLORS = [
"#6366f1", "#8b5cf6", "#ec4899", "#f97316",
"#14b8a6", "#3b82f6", "#eab308", "#ef4444",
"#10b981", "#f18200", "#06b6d4", "#a855f7"];


function getInitials(name) {
  return (name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}
function getAvatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function fullName(e) {
  return [e.first_name, e.last_name].filter(Boolean).join(" ") || e.emp_code || "Employee";
}
function calcAvgTenure(members) {
  const dates = members.
  map((m) => m.emp_joining_date || m.joining_date).
  filter(Boolean).
  map((d) => new Date(d)).
  filter((d) => !isNaN(d));
  if (!dates.length) return "—";
  const now = Date.now();
  const avgMs = dates.reduce((s, d) => s + (now - d.getTime()), 0) / dates.length;
  const yrs = avgMs / (1000 * 60 * 60 * 24 * 365.25);
  return yrs < 1 ? `${Math.round(yrs * 12)} mo` : `${yrs.toFixed(1)} yrs`;
}

const FALLBACK_BADGE_COLORS = [
{ color: "#7c3aed", border: "#c4b5fd", bg: "#f5f3ff" },
{ color: "#2563eb", border: "#93c5fd", bg: "#eff6ff" },
{ color: "#ea580c", border: "#fdba74", bg: "#fff7ed" },
{ color: "#db2777", border: "#f9a8d4", bg: "#fdf2f8" },
{ color: "#0891b2", border: "#67e8f9", bg: "#ecfeff" },
{ color: "#059669", border: "#6ee7b7", bg: "#ecfdf5" },
{ color: "#f18200", border: "#fed7aa", bg: "#fff7ed" },
{ color: "#dc2626", border: "#fca5a5", bg: "#fef2f2" }];

function badgeInlineStyle(idx) {
  const s = FALLBACK_BADGE_COLORS[idx % FALLBACK_BADGE_COLORS.length];
  return { color: s.color, borderColor: s.border, background: s.bg };
}

/* ── Build teams: one team per manager who has ≥1 direct report ─────── */
function buildTeams(rows) {
  const nameMap = {};
  rows.forEach((e) => {nameMap[e.employee_id] = { ...e, name: fullName(e) };});

  // Count direct reports per manager
  const directReports = {}; // managerId → [employee rows]
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

    // Sort members alphabetically
    members.sort((a, b) => a.name.localeCompare(b.name));

    const dept = manager.department_name || "General";
    const badgeClass = DEPARTMENT_BADGE[dept];

    teams.push({
      id: `team-${managerId}`,
      managerId: Number(managerId),
      name: `${manager.name}'s Team`,
      department: dept,
      description: [
      manager.emp_job_title || manager.designation_name,
      dept].
      filter(Boolean).join(" · "),
      lead: {
        name: manager.name,
        title: manager.emp_job_title || manager.designation_name || "Manager",
        employee_id: manager.employee_id
      },
      members,
      avgTenure: calcAvgTenure(members),
      badgeClass,
      badgeIdx: idx++
    });
  });

  // Sort: largest team first, then alphabetically
  teams.sort((a, b) => b.members.length - a.members.length || a.name.localeCompare(b.name));
  return teams;
}

/* ── Avatar ───────────────────────────────────────────────────────────── */
function MemberAvatar({ name, size = "sm" }) {
  return (
    <span className={joinClasses(`teams-avatar teams-avatar--${size}`, cssClass(
      { backgroundColor: getAvatarColor(name) }))} title={name}>
      {getInitials(name)}
    </span>);

}

/* ── TeamCard ─────────────────────────────────────────────────────────── */
function TeamCard({ team, expanded, onToggle }) {
  const { lead, members, name, department, description, badgeClass, badgeIdx } = team;
  const inlineStyle = badgeClass ? undefined : badgeInlineStyle(badgeIdx);
  const badgeCls = badgeClass ? `teams-badge ${badgeClass}` : "teams-badge";

  return (
    <article className="teams-card">
      <div className="teams-card__top">
        <h3 className="teams-card__name">{name}</h3>
        <span className="teams-card__count">
          <Users size={14} />{members.length}
        </span>
      </div>

      <span className={joinClasses(badgeCls, cssClass(inlineStyle))}>{department}</span>

      {description &&
      <p className="teams-card__description">{description}</p>
      }

      {lead &&
      <div className="teams-card__lead">
          <MemberAvatar name={lead.name} size="md" />
          <span className={cssClass({ display: "flex", alignItems: "center", gap: 5 })}>
            {lead.name}
            <span className="teams-card__lead-label"> · Lead</span>
            <Crown size={11} className={cssClass({ color: "#d97706", marginLeft: 2 })} />
          </span>
        </div>
      }

      <div className="teams-avatar-stack">
        {members.slice(0, 6).map((m) =>
        <MemberAvatar key={m.employee_id} name={m.name} />
        )}
        {members.length > 6 &&
        <span className={joinClasses("teams-avatar teams-avatar--sm", cssClass(
          { background: "#e2e8f0", color: "#64748b", fontSize: 9 }))}>
            +{members.length - 6}
          </span>
        }
      </div>

      <button type="button" className="teams-card__toggle"
      onClick={onToggle} aria-expanded={expanded}>
        {expanded ?
        <><ChevronUp size={16} />Hide Members</> :
        <><ChevronDown size={16} />View All Members ({members.length})</>}
      </button>

      {expanded &&
      <div className="teams-card__members">
          {members.map((m) =>
        <div key={m.employee_id} className="teams-card__member">
              <MemberAvatar name={m.name} size="md" />
              <div className="teams-card__member-info">
                <span className="teams-card__member-name">{m.name}</span>
                <span className="teams-card__member-title">
                  {m.emp_job_title || m.designation_name || "—"}
                </span>
              </div>
            </div>
        )}
        </div>
      }
    </article>);

}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function Teams() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [extraTeams, setExtraTeams] = useState([]);
  const [search, setSearch] = useState("");

  const fetchData = () => {
    setLoading(true);
    setError(null);
    apiClient.get("/employees/org-chart").then(unwrap).
    then((data) => {
      setRows(data);
      const built = buildTeams(data);
      if (built.length) setExpandedId((prev) => prev || built[0].id);
    }).
    catch((e) => setError(e?.response?.data?.message || "Failed to load teams")).
    finally(() => setLoading(false));
  };

  useEffect(() => {fetchData();}, []);

  const apiTeams = useMemo(() => buildTeams(rows), [rows]);

  // Total unique managers (employees who are someone's reporting_to)
  const managerCount = apiTeams.length;

  const allTeams = useMemo(() => {
    const combined = [...apiTeams, ...extraTeams];
    if (!search.trim()) return combined;
    const q = search.toLowerCase();
    return combined.filter((t) =>
    t.name.toLowerCase().includes(q) ||
    t.department.toLowerCase().includes(q) ||
    t.lead?.name.toLowerCase().includes(q) ||
    t.members.some((m) => m.name.toLowerCase().includes(q))
    );
  }, [apiTeams, extraTeams, search]);

  const handleCreateTeam = ({ name, department, description }) => {
    setExtraTeams((prev) => [...prev, {
      id: `custom-${Date.now()}`, name, department,
      description: description || "",
      lead: null, members: [], avgTenure: "—",
      badgeIdx: prev.length
    }]);
  };

  return (
    <div className="teams-page">
      {/* Header */}
      <div className="teams-page__header">
        <div>
          <h1 className="teams-page__title">Teams</h1>
          <p className="teams-page__subtitle">
            View and manage teams across the organization.
          </p>
        </div>
        <div className={cssClass({ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" })}>
          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams or members…" className={cssClass(
              { height: 36, width: 220, padding: "0 12px", fontSize: 13,
                border: "1px solid #e5e7eb", borderRadius: 8, outline: "none",
                color: "#374151" })} />
          
          <button type="button" onClick={fetchData} className={cssClass(
            { display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 8, fontSize: 13, color: "#374151", cursor: "pointer", height: 36 })}>
            <RefreshCw size={14} />Refresh
          </button>
          <button type="button" className="teams-page__create-btn"
          onClick={() => setModalOpen(true)}>
            <Plus size={16} />Create Team
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && !error &&
      <div className={cssClass({ display: "flex", gap: 12, flexWrap: "wrap" })}>
          {[
        { label: "Total Employees", value: rows.length, color: "#f18200" },
        { label: "Reporting Managers", value: managerCount, color: "#6366f1" },
        { label: "Teams Visible", value: allTeams.length, color: "#10b981" }].
        map((s) =>
        <div key={s.label} className={cssClass({ background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: 10, padding: "10px 20px", textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: 140 })}>
              <div className={cssClass({ fontSize: 22, fontWeight: 800, color: s.color })}>{s.value}</div>
              <div className={cssClass({ fontSize: 11, color: "#9ca3af", marginTop: 2 })}>{s.label}</div>
            </div>
        )}
        </div>
      }

      {/* Loading skeleton */}
      {loading ?
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 })}>
          {[1, 2, 3].map((i) =>
        <div key={i} className={cssClass({ background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: 12, padding: 20, minHeight: 200 })}>
              <div className={cssClass({ height: 16, width: "60%", background: "#f1f5f9", borderRadius: 6, marginBottom: 12 })} />
              <div className={cssClass({ height: 10, width: "30%", background: "#f1f5f9", borderRadius: 6, marginBottom: 16 })} />
              <div className={cssClass({ height: 10, width: "85%", background: "#f1f5f9", borderRadius: 6 })} />
            </div>
        )}
        </div> :
      error ?
      <div className={cssClass({ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
        padding: 24, color: "#dc2626", fontSize: 14 })}>
          {error}
          <button onClick={fetchData} className={cssClass({ marginLeft: 12, color: "#dc2626",
          background: "none", border: "none", cursor: "pointer", textDecoration: "underline" })}>
            Retry
          </button>
        </div> :
      allTeams.length === 0 ?
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af" })}>
          <Users size={48} strokeWidth={1.2} className={cssClass({ marginBottom: 12, color: "#d1d5db" })} />
          <p className={cssClass({ fontSize: 14 })}>
            {search ? `No teams match "${search}".` : "No reporting relationships found. Make sure employees have managers assigned."}
          </p>
        </div> :

      <div className="teams-grid">
          {allTeams.map((team) =>
        <TeamCard
          key={team.id}
          team={team}
          expanded={expandedId === team.id}
          onToggle={() => setExpandedId((prev) => prev === team.id ? null : team.id)} />

        )}
        </div>
      }

      {/* Comparison table */}
      {!loading && allTeams.length > 0 &&
      <section className="teams-comparison">
          <h2 className="teams-comparison__title">Team Comparison</h2>
          <table className="teams-comparison__table">
            <thead>
              <tr>
                <th>Team (Manager)</th>
                <th>Department</th>
                <th>Direct Reports</th>
                <th>Avg Tenure</th>
                <th>Lead</th>
              </tr>
            </thead>
            <tbody>
              {allTeams.map((team) =>
            <tr key={team.id}>
                  <td className={cssClass({ fontWeight: 500 })}>{team.name}</td>
                  <td>{team.department}</td>
                  <td>{team.members.length}</td>
                  <td>{team.avgTenure}</td>
                  <td>{team.lead?.name || "—"}</td>
                </tr>
            )}
            </tbody>
          </table>
        </section>
      }

      <CreateTeamModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateTeam} />
      
    </div>);

}
