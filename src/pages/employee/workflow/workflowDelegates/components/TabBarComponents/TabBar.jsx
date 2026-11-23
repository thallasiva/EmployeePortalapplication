import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
import { TABS } from "./TABS";
const TabBar = React.memo(function TabBar({
  tab,
  onTabChange
}) {
  return <div className={cssClass({
    display: "flex",
    gap: 4,
    marginBottom: 20
  })}>
      {TABS.map(t => <button key={t.key} type="button" onClick={() => onTabChange(t.key)} className={cssClass({
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 16px",
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      border: "none",
      cursor: "pointer",
      transition: "all 0.15s",
      background: tab === t.key ? "#e87500" : "#fff",
      color: tab === t.key ? "#fff" : "#64748b",
      boxShadow: tab === t.key ? "0 2px 6px rgba(232,117,0,0.3)" : "0 1px 2px rgba(0,0,0,0.06)"
    })}>
          {t.icon} {t.label}
        </button>)}
    </div>;
});
export { TabBar };
