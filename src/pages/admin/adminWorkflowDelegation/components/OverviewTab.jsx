import React from "react";
import { Users, UserCheck, AlertTriangle, Shield, ArrowRight } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants/tabs";
import { fmtDate } from "../utils/formatters";
import StatCard from "./StatCard";
import OrgChartWithSidebar from "./OrgChartWithSidebar";

const OverviewTab = React.memo(function OverviewTab({
  stats,
  delegations,
  setActiveTab,
  loading,
  visibleTree,
  highlightIds,
  setHighlightIds,
  setSelectedNode,
  treeSearch,
  setTreeSearch,
  searchQ,
  setSearchQ,
  searching,
  searchResults,
  focusedPath,
  setFocusedPath,
}) {
  return (
    <div>
      {/* Stats row */}
      <div className={cssClass({ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 })}>
        <StatCard icon={Users} label="Total Employees" value={stats?.total_employees} color="#3b82f6" />
        <StatCard icon={UserCheck} label="Total Managers" value={stats?.total_managers} color="#f18200" />
        <StatCard
          icon={AlertTriangle} label="Without Manager" value={stats?.without_manager} color="#f59e0b"
          sub={stats?.without_manager > 0 ? "Needs attention" : undefined}
        />
        <StatCard icon={Shield} label="Active Delegations" value={stats?.delegated_workflows} color={BRAND} />
      </div>

      {/* Org chart with sidebar */}
      <OrgChartWithSidebar
        loading={loading}
        visibleTree={visibleTree}
        highlightIds={highlightIds}
        setHighlightIds={setHighlightIds}
        setSelectedNode={setSelectedNode}
        treeSearch={treeSearch}
        setTreeSearch={setTreeSearch}
        searchQ={searchQ}
        setSearchQ={setSearchQ}
        searching={searching}
        searchResults={searchResults}
        focusedPath={focusedPath}
        setFocusedPath={setFocusedPath}
      />

      {/* Alert cards */}
      <div className={cssClass({ display: "flex", gap: 14, flexWrap: "wrap" })}>
        {stats?.without_manager > 0 && (
          <div className={cssClass({
            flex: 1, minWidth: 240, background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: 12, padding: 14,
          })}>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 })}>
              <AlertTriangle size={15} color="#f59e0b" />
              <span className={cssClass({ fontSize: 13, fontWeight: 700, color: "#92400e" })}>
                {stats.without_manager} employees without a manager
              </span>
            </div>
            <button
              onClick={() => setActiveTab("unassigned")}
              className={cssClass({
                background: BRAND, color: "#fff", border: "none", borderRadius: 7,
                padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              })}
            >
              Assign Now →
            </button>
          </div>
        )}

        {delegations.filter((d) => d.status === "Active").length > 0 && (
          <div className={cssClass({
            flex: 1, minWidth: 240, background: "#fff8f0", border: "1px solid #fed7aa",
            borderRadius: 12, padding: 14,
          })}>
            <div className={cssClass({
              fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 10,
              display: "flex", alignItems: "center", gap: 6,
            })}>
              <Shield size={14} color="#d97706" /> Active Delegations
            </div>
            <div className={cssClass({ display: "flex", flexDirection: "column", gap: 8 })}>
              {delegations.filter((d) => d.status === "Active").slice(0, 4).map((d) => (
                <div key={d.id} className={cssClass({ fontSize: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" })}>
                  <span className={cssClass({ fontWeight: 600, color: "#111827" })}>{d.employee_name}</span>
                  <ArrowRight size={11} color="#d97706" />
                  <span className={cssClass({ color: "#92400e" })}>{d.delegate_name}</span>
                  <span className={cssClass({ marginLeft: "auto", color: "#9ca3af", fontSize: 11, whiteSpace: "nowrap" })}>
                    until {fmtDate(d.to_date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default OverviewTab;
