import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Users } from "lucide-react";
import CreateTeamModal from "./CreateTeamModal";
import {
  DEPARTMENT_BADGE,
  INITIAL_TEAMS,
} from "../../data/teamsData";
import "./teams.css";

const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#3b82f6",
  "#eab308",
];

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function MemberAvatar({ name, size = "sm" }) {
  return (
    <span
      className={`teams-avatar teams-avatar--${size}`}
      style={{ backgroundColor: getAvatarColor(name) }}
      title={name}
    >
      {getInitials(name)}
    </span>
  );
}

function TeamCard({ team, expanded, onToggle }) {
  const badgeClass =
    DEPARTMENT_BADGE[team.department] || "teams-badge--engineering";
  const lead = team.lead || team.members.find((m) => m.isLead);

  return (
    <article className="teams-card">
      <div className="teams-card__top">
        <h3 className="teams-card__name">{team.name}</h3>
        <span className="teams-card__count">
          <Users size={14} />
          {team.members.length}
        </span>
      </div>

      <span className={`teams-badge ${badgeClass}`}>{team.department}</span>

      {team.description && (
        <p className="teams-card__description">{team.description}</p>
      )}

      {lead && (
        <div className="teams-card__lead">
          <MemberAvatar name={lead.name} size="md" />
          <span>
            {lead.name}
            <span className="teams-card__lead-label"> · Lead</span>
          </span>
        </div>
      )}

      <div className="teams-avatar-stack">
        {team.members.slice(0, 5).map((member) => (
          <MemberAvatar key={member.name} name={member.name} />
        ))}
      </div>

      <button
        type="button"
        className="teams-card__toggle"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        {expanded ? (
          <>
            Hide Members
            <ChevronUp size={16} />
          </>
        ) : (
          <>
            View All Members
            <ChevronDown size={16} />
          </>
        )}
      </button>

      {expanded && (
        <div className="teams-card__members">
          {team.members.map((member) => (
            <div key={member.name} className="teams-card__member">
              <MemberAvatar name={member.name} size="md" />
              <div className="teams-card__member-info">
                <span className="teams-card__member-name">{member.name}</span>
                <span className="teams-card__member-title">{member.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function Teams() {
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [expandedId, setExpandedId] = useState("platform");
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreateTeam = ({ name, department, description }) => {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    const newTeam = {
      id,
      name,
      department,
      description: description || "New team",
      avgTenure: "0 yrs",
      lead: null,
      members: [],
    };
    setTeams((prev) => [...prev, newTeam]);
  };

  return (
    <div className="teams-page">
      <div className="teams-page__header">
        <div>
          <h1 className="teams-page__title">Teams</h1>
          <p className="teams-page__subtitle">
            View and manage teams across the organization.
          </p>
        </div>
        <button
          type="button"
          className="teams-page__create-btn"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} />
          Create Team
        </button>
      </div>

      <div className="teams-grid">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            expanded={expandedId === team.id}
            onToggle={() =>
              setExpandedId((prev) => (prev === team.id ? null : team.id))
            }
          />
        ))}
      </div>

      <section className="teams-comparison">
        <h2 className="teams-comparison__title">Team Comparison</h2>
        <table className="teams-comparison__table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Department</th>
              <th>Headcount</th>
              <th>Avg Tenure</th>
              <th>Lead</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id}>
                <td>{team.name}</td>
                <td>{team.department}</td>
                <td>{team.members.length}</td>
                <td>{team.avgTenure}</td>
                <td>{team.lead?.name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <CreateTeamModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateTeam}
      />
    </div>
  );
}
