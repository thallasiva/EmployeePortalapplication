import React from "react";
import { Search, ChevronDown, Filter } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND, TEAMS, ALL_STATUSES } from "../constants";

const FilterBar = React.memo(({ search, statusF, teamF, isAdminUser, onSearch, onStatusChange, onTeamChange, onClear }) => {
  const filters = [
    { value: statusF, setter: onStatusChange, placeholder: "All Status", options: ALL_STATUSES },
    ...(!isAdminUser ? [{ value: teamF, setter: onTeamChange, placeholder: "All Teams", options: TEAMS }] : []),
  ];
  const hasFilter = !!(search || statusF || (!isAdminUser && teamF));

  return (
    <div className={cssClass({ display: "flex", gap: 8, marginBottom: 14, flexShrink: 0, flexWrap: "wrap", alignItems: "center" })}>
      {/* search */}
      <div className={cssClass({ position: "relative" })}>
        <Search size={13} className={cssClass({ position: "absolute", left: 9, top: "50%",
          transform: "translateY(-50%)", color: "#94a3b8" })} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search tickets…"
          onFocus={(e) => e.target.style.borderColor = BRAND}
          onBlur={(e) => e.target.style.borderColor = "#dbe2ea"}
          className={cssClass({ height: 34, width: 200, paddingLeft: 28, paddingRight: 10,
            border: "1px solid #dbe2ea", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff" })}
        />
      </div>

      {/* dropdowns */}
      {filters.map((f, i) => (
        <div key={i} className={cssClass({ position: "relative" })}>
          <select value={f.value} onChange={(e) => f.setter(e.target.value)}
            className={cssClass({ height: 34, paddingLeft: 10, paddingRight: 28,
              border: "1px solid #dbe2ea", borderRadius: 8, fontSize: 12, background: "#fff",
              outline: "none", cursor: "pointer", appearance: "none", color: "#374151" })}>
            <option value="">{f.placeholder}</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={12} className={cssClass({ position: "absolute", right: 8, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" })} />
        </div>
      ))}

      {hasFilter && (
        <button onClick={onClear} className={cssClass({ background: "none", border: "none",
          color: "#94a3b8", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 })}>
          <Filter size={12} /> Clear
        </button>
      )}
    </div>
  );
});

FilterBar.displayName = "FilterBar";
export default FilterBar;
