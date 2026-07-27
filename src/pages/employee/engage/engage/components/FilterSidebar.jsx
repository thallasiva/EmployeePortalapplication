import React from "react";
import { Search, ChevronRight } from "lucide-react";
import { cssClass, joinClasses } from "../../../../../utils/classStyles";
import { SECTIONS } from "../constants";
import UpcomingPanel from "./UpcomingPanel";

const FilterSidebar = React.memo(function FilterSidebar({
  activeFilter, setActiveFilter,
  search, setSearch,
  countFor,
  employees, holidays,
  navigate, quickLinks,
}) {
  return (
    <div className="w-64 flex-shrink-0 space-y-4">
      {/* Filter Panel */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Filters</h3>

        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Activities</h4>
        <div className="space-y-1 mb-5">
          {SECTIONS.map(({ key, label, icon, color }) => {
            const cnt = countFor(key);
            const active = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cssClass({
                  width: "100%", display: "flex", alignItems: "center", gap: 9,
                  padding: "7px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                  textAlign: "left",
                  background: active ? "#f0f7ff" : "transparent",
                  color: active ? (color || "#185FA5") : "#4b5563",
                  fontWeight: active ? 600 : 400,
                })}
              >
                <span className={cssClass({ color: active ? (color || "#185FA5") : "#9ca8b5", display: "flex" })}>
                  {icon}
                </span>
                <span className={cssClass({ fontSize: 13, flex: 1 })}>{label}</span>
                {cnt > 0 && (
                  <span className={cssClass({
                    fontSize: 10, fontWeight: 700,
                    background: active ? color + "22" : "#f0f3f8",
                    color: active ? (color || "#185FA5") : "#9ca8b5",
                    padding: "1px 6px", borderRadius: 10, minWidth: 20, textAlign: "center",
                  })}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Search</h4>
        <div className="relative">
          <input
            type="text"
            placeholder="Search activities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gray-400"
          />
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <UpcomingPanel employees={employees} holidays={holidays} />

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1a2233", margin: "0 0 10px" })}>
          Quick Links
        </p>
        {quickLinks.map(({ label, path, emoji }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={joinClasses(
              "hover:bg-gray-50",
              cssClass({
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "6px 8px", borderRadius: 7, border: "none",
                background: "transparent", cursor: "pointer",
                fontSize: 12, color: "#4b5563", textAlign: "left",
              })
            )}
          >
            <span>{emoji}</span>
            <span>{label}</span>
            <ChevronRight size={12} className={cssClass({ marginLeft: "auto", color: "#d1d8e0" })} />
          </button>
        ))}
      </div>
    </div>
  );
});

export default FilterSidebar;
