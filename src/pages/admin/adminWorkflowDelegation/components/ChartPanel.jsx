import React from "react";
import { GitBranch, Search, RefreshCw, X } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants/tabs";
import OrgChart from "./OrgChart";

/**
 * Standalone chart panel used by HierarchyTab.
 * Renders the org-chart legend + search bar header, then the chart body.
 */
const ChartPanel = React.memo(function ChartPanel({
  loading,
  visibleTree,
  highlightIds,
  setSelectedNode,
  searchVal,
  onSearchChange,
}) {
  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden",
    })}>
      <div className={cssClass({
        padding: "14px 16px", borderBottom: "1px solid #f3f4f6",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
      })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
          <GitBranch size={16} color={BRAND} />
          <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827" })}>Organisation Chart</span>
        </div>
        <div className={cssClass({ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" })}>
          <div className={cssClass({ display: "flex", gap: 10 })}>
            {[["#0369a1", "Top Level"], ["#0284c7", "Manager"], ["#38bdf8", "Employee"], ["#d97706", "Delegated"], ["#9ca3af", "Inactive"]].map(([c, l]) => (
              <div key={l} className={cssClass({ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" })}>
                <div className={cssClass({ width: 10, height: 10, borderRadius: 2, background: c })} />{l}
              </div>
            ))}
          </div>
          <div className={cssClass({
            display: "flex", alignItems: "center", gap: 6, background: "#f9fafb",
            border: "1px solid #e5e7eb", borderRadius: 7, padding: "5px 10px",
          })}>
            <Search size={12} color="#9ca3af" />
            <input
              value={searchVal}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search…"
              className={cssClass({ border: "none", background: "none", outline: "none", fontSize: 12, width: 120 })}
            />
            {searchVal && (
              <button
                onClick={() => onSearchChange("")}
                className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 })}
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={cssClass({ padding: "16px", background: "#f8fafc", minHeight: 300 })}>
        {loading ? (
          <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af" })}>
            <RefreshCw size={20} className={cssClass({ animation: "spin 1s linear infinite" })} />
            <div className={cssClass({ marginTop: 8, fontSize: 13 })}>Loading chart…</div>
          </div>
        ) : visibleTree.length === 0 ? (
          <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af", fontSize: 13 })}>
            {searchVal ? "No matching employees" : "No data — restart the backend to auto-seed hierarchy"}
          </div>
        ) : (
          <OrgChart nodes={visibleTree} onSelect={setSelectedNode} highlightIds={highlightIds} />
        )}
      </div>
    </div>
  );
});

export default ChartPanel;
