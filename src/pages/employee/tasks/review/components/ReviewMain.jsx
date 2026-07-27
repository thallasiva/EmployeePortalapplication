import React from "react";
import { Search } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { getStoredUser, isAdmin, isReportingManager } from "../../../../../data/auth";
import { TABS, showTabs } from "../constants";
import PanelRouter from "./PanelRouter";

const ReviewMain = React.memo(function ReviewMain({
  activeItem, statusFilter, onStatusFilter, search, onSearch,
}) {
  const user = getStoredUser();
  const isPrivileged = isAdmin(user) || isReportingManager(user);

  return (
    <main className={cssClass({ flex: 1, padding: "24px 28px", minWidth: 0, background: "#f8fafc" })}>
      {/* Header */}
      <div className={cssClass({ marginBottom: 20 })}>
        <h2 className={cssClass({ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 })}>
          {activeItem?.label || "Overview"}
        </h2>
        <p className={cssClass({ fontSize: 12, color: "#94a3b8", margin: "3px 0 0" })}>
          {activeItem?.sectionLabel}
          {isPrivileged && ["leave-decisions", "leave-cancel", "regularization"].includes(activeItem?.dataType)
            ? " · All employees"
            : " · Your requests"}
        </p>
      </div>

      {/* Toolbar */}
      {activeItem?.dataType !== "coming-soon" && (
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" })}>
          {showTabs(activeItem?.dataType) && (
            <div className={cssClass({ display: "inline-flex", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 4, gap: 2 })}>
              {TABS.map(({ key, label, icon }) => {
                const active = statusFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onStatusFilter(key)}
                    className={cssClass({
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "6px 14px",
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      color: active ? "#fff" : "#64748b",
                      background: active ? "#1890ff" : "transparent",
                      border: "none", borderRadius: 7,
                      cursor: "pointer", transition: "all 0.15s",
                    })}
                  >
                    {icon}{label}
                  </button>
                );
              })}
            </div>
          )}

          <div className={cssClass({ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 12px", gap: 8, height: 38, minWidth: 220 })}>
            <Search size={14} className={cssClass({ color: "#94a3b8", flexShrink: 0 })} />
            <input
              type="search"
              placeholder={isPrivileged ? "Search employee, type…" : "Search type, reason…"}
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className={cssClass({ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#334155", width: "100%" })}
            />
          </div>
        </div>
      )}

      {/* Panel */}
      <div className={cssClass({
        background: "#fff",
        border: "1px solid #e8edf2",
        borderRadius: 12,
        minHeight: 400,
        padding: activeItem?.dataType === "coming-soon" ? 0 : 20,
        display: activeItem?.dataType === "coming-soon" ? "flex" : "block",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
      })}>
        <PanelRouter item={activeItem} search={search} statusFilter={statusFilter} />
      </div>
    </main>
  );
});

export default ReviewMain;
