import { memo } from "react";
import { BRAND } from "../utils/helpdeskUtils";
import { cssClass } from "../../../../utils/classStyles";

const TABS = [
  { id: "request", label: "Raise a Request" },
  { id: "tickets", label: "My Tickets" },
];

/**
 * Tab navigation bar at the top of the Helpdesk page.
 * Single responsibility: renders + fires onTabChange.
 */
const HelpdeskTabs = memo(function HelpdeskTabs({ activeTab, onTabChange }) {
  return (
    <div className={cssClass({
      display: "flex", background: "#fff",
      borderBottom: "1px solid #e5e7eb", flexShrink: 0, padding: "0 28px",
    })}>
      {TABS.map((tab) => {
        const isActive = tab.id === "request" ? activeTab === "request" || activeTab === "category" : activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cssClass({
              padding: "12px 20px", border: "none", background: "none",
              fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: "pointer",
              color: isActive ? BRAND : "#6b7280",
              borderBottom: isActive ? "2.5px solid " + BRAND : "2.5px solid transparent",
              marginBottom: -1,
            })}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
});

export default HelpdeskTabs;
