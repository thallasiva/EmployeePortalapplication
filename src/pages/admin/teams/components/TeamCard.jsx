import React from "react";
import { ChevronDown, ChevronUp, Users, Crown } from "lucide-react";
import { cssClass, joinClasses } from "../../../../utils/classStyles";
import { badgeInlineStyle } from "../utils";
import MemberAvatar from "./MemberAvatar";

const TeamCard = React.memo(function TeamCard({ team, expanded, onToggle }) {
  const { lead, members, name, department, description, badgeClass, badgeIdx } = team;
  const inlineStyle = badgeClass ? undefined : badgeInlineStyle(badgeIdx);
  const badgeCls = badgeClass ? `teams-badge ${badgeClass}` : "teams-badge";

  return (
    <article className="teams-card">
      <div className="teams-card__top">
        <h3 className="teams-card__name">{name}</h3>
        <span className="teams-card__count">
          <Users size={14} />
          {members.length}
        </span>
      </div>

      <span className={joinClasses(badgeCls, cssClass(inlineStyle))}>{department}</span>

      {description && <p className="teams-card__description">{description}</p>}

      {lead && (
        <div className="teams-card__lead">
          <MemberAvatar name={lead.name} size="md" />
          <span className={cssClass({ display: "flex", alignItems: "center", gap: 5 })}>
            {lead.name}
            <span className="teams-card__lead-label"> · Lead</span>
            <Crown size={11} className={cssClass({ color: "#d97706", marginLeft: 2 })} />
          </span>
        </div>
      )}

      <div className="teams-avatar-stack">
        {members.slice(0, 6).map((m) => (
          <MemberAvatar key={m.employee_id} name={m.name} />
        ))}
        {members.length > 6 && (
          <span
            className={joinClasses(
              "teams-avatar teams-avatar--sm",
              cssClass({ background: "#e2e8f0", color: "#64748b", fontSize: 9 })
            )}
          >
            +{members.length - 6}
          </span>
        )}
      </div>

      <button
        type="button"
        className="teams-card__toggle"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        {expanded ? (
          <>
            <ChevronUp size={16} />Hide Members
          </>
        ) : (
          <>
            <ChevronDown size={16} />View All Members ({members.length})
          </>
        )}
      </button>

      {expanded && (
        <div className="teams-card__members">
          {members.map((m) => (
            <div key={m.employee_id} className="teams-card__member">
              <MemberAvatar name={m.name} size="md" />
              <div className="teams-card__member-info">
                <span className="teams-card__member-name">{m.name}</span>
                <span className="teams-card__member-title">
                  {m.emp_job_title || m.designation_name || "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
});

export default TeamCard;
