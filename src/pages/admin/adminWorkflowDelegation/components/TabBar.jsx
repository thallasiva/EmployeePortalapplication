import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants/tabs";

const TabBar = React.memo(function TabBar({ tabs, activeTab, setActiveTab, stats }) {
  return (
    <div className={cssClass({
      display: "flex", gap: 2, background: "#f3f4f6", borderRadius: 10,
      padding: 4, marginBottom: 24, flexWrap: "wrap",
    })}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.key;
        const badge = tab.key === "unassigned" && stats?.without_manager > 0 ? stats.without_manager : null;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cssClass({
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: active ? 700 : 500,
              background: active ? "#fff" : "transparent",
              color: active ? BRAND : "#6b7280",
              boxShadow: active ? "0 1px 4px #0001" : "none",
              transition: "all .15s", position: "relative",
            })}
          >
            <Icon size={15} />
            {tab.label}
            {badge != null && (
              <span className={cssClass({
                background: "#ef4444", color: "#fff", borderRadius: 10,
                fontSize: 10, fontWeight: 700, padding: "1px 5px",
                minWidth: 18, textAlign: "center",
              })}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default TabBar;
