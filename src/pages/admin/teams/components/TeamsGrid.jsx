import React from "react";
import { Users } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import TeamCard from "./TeamCard";

const TeamsGrid = React.memo(function TeamsGrid({
  loading,
  error,
  allTeams,
  search,
  expandedId,
  onToggle,
  onRetry,
}) {
  if (loading) {
    return (
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 })}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cssClass({
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 20,
              minHeight: 200,
            })}
          >
            <div className={cssClass({ height: 16, width: "60%", background: "#f1f5f9", borderRadius: 6, marginBottom: 12 })} />
            <div className={cssClass({ height: 10, width: "30%", background: "#f1f5f9", borderRadius: 6, marginBottom: 16 })} />
            <div className={cssClass({ height: 10, width: "85%", background: "#f1f5f9", borderRadius: 6 })} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cssClass({
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 10,
          padding: 24,
          color: "#dc2626",
          fontSize: 14,
        })}
      >
        {error}
        <button
          onClick={onRetry}
          className={cssClass({
            marginLeft: 12,
            color: "#dc2626",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          })}
        >
          Retry
        </button>
      </div>
    );
  }

  if (allTeams.length === 0) {
    return (
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af" })}>
        <Users size={48} strokeWidth={1.2} className={cssClass({ marginBottom: 12, color: "#d1d5db" })} />
        <p className={cssClass({ fontSize: 14 })}>
          {search
            ? `No teams match "${search}".`
            : "No reporting relationships found. Make sure employees have managers assigned."}
        </p>
      </div>
    );
  }

  return (
    <div className="teams-grid">
      {allTeams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          expanded={expandedId === team.id}
          onToggle={() => onToggle(team.id)}
        />
      ))}
    </div>
  );
});

export default TeamsGrid;
