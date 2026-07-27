import React from "react";
import { Search } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { FILTERS } from "../constants";

const FilterBar = React.memo(function FilterBar({ search, filter, onSearchChange, onFilterChange }) {
  return (
    <div className={cssClass({ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" })}>
      <div className={cssClass({ position: "relative", flex: 1, minWidth: 220 })}>
        <Search size={14} className={cssClass({ position: "absolute", left: 12, top: "50%",
          transform: "translateY(-50%)", color: "#94a3b8" })} />
        <input value={search} onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search employee, code, department…"
          className={cssClass({ width: "100%", boxSizing: "border-box", height: 38,
            paddingLeft: 34, paddingRight: 12, border: "1px solid #e2e8f0", borderRadius: 8,
            fontSize: 13, outline: "none", background: "#fff", fontFamily: "inherit" })} />
      </div>
      <div className={cssClass({ display: "flex", gap: 4, padding: 3, background: "#f1f5f9",
        borderRadius: 10, flexWrap: "wrap" })}>
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => onFilterChange(f.key)}
            className={cssClass({ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer",
              background: filter === f.key ? "#fff" : "transparent",
              color: filter === f.key ? "#1e293b" : "#64748b",
              boxShadow: filter === f.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" })}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
});

export default FilterBar;
