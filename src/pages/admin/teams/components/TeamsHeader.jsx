import React from "react";
import { Plus, RefreshCw } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";

const TeamsHeader = React.memo(function TeamsHeader({
  search,
  onSearchChange,
  onRefresh,
  onCreateClick,
}) {
  return (
    <div className="teams-page__header">
      <div>
        <h1 className="teams-page__title">Teams</h1>
        <p className="teams-page__subtitle">View and manage teams across the organization.</p>
      </div>
      <div className={cssClass({ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" })}>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search teams or members…"
          className={cssClass({
            height: 36,
            width: 220,
            padding: "0 12px",
            fontSize: 13,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            outline: "none",
            color: "#374151",
          })}
        />
        <button
          type="button"
          onClick={onRefresh}
          className={cssClass({
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 13,
            color: "#374151",
            cursor: "pointer",
            height: 36,
          })}
        >
          <RefreshCw size={14} />Refresh
        </button>
        <button
          type="button"
          className="teams-page__create-btn"
          onClick={onCreateClick}
        >
          <Plus size={16} />Create Team
        </button>
      </div>
    </div>
  );
});

export default TeamsHeader;
