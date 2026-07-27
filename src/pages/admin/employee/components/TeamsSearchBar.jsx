import React from "react";
import { Filter, Search, X } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import FilterPanel from "./FilterPanel";

const TeamsSearchBar = React.memo(function TeamsSearchBar({
  search,
  onSearchChange,
  filterPanelOpen,
  onOpenFilter,
  onCloseFilter,
  activeFilterCount,
  filteredCount,
  activePills,
  onClearAll,
  filterSections,
}) {
  return (
    <div
      className={cssClass({
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
      })}
    >
      <div
        className={cssClass({
          position: "relative",
          flex: "1 1 200px",
          minWidth: 160,
          maxWidth: 280,
        })}
      >
        <Search
          size={14}
          className={cssClass({
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
            pointerEvents: "none",
          })}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search employees…"
          className={cssClass({
            width: "100%",
            height: 34,
            paddingLeft: 32,
            paddingRight: search ? 28 : 12,
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          })}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className={cssClass({
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            })}
          >
            <X size={13} color="#94a3b8" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenFilter}
        className={cssClass({
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 34,
          padding: "0 14px",
          border: activeFilterCount > 0 ? "1.5px solid #f18200" : "1px solid #e2e8f0",
          borderRadius: 8,
          background: activeFilterCount > 0 ? "#fff7ed" : "#fff",
          fontSize: 13,
          fontWeight: 600,
          color: activeFilterCount > 0 ? "#c2410c" : "#64748b",
          cursor: "pointer",
        })}
      >
        <Filter size={14} />
        Filters
        {activeFilterCount > 0 && (
          <span
            className={cssClass({
              background: "#f18200",
              color: "#fff",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 6px",
              minWidth: 18,
              textAlign: "center",
            })}
          >
            {activeFilterCount}
          </span>
        )}
      </button>

      <FilterPanel
        open={filterPanelOpen}
        onClose={onCloseFilter}
        resultCount={filteredCount}
        activePills={activePills}
        activeFilterCount={activeFilterCount}
        onClearAll={onClearAll}
        sections={filterSections}
      />
    </div>
  );
});

export default TeamsSearchBar;
