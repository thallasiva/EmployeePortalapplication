import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { SIDEBAR } from "../constants";

const MyInfoSidebar = React.memo(function MyInfoSidebar({ activeSection, onSelect }) {
  return (
    <div className={cssClass({ width: 200, flexShrink: 0, background: "#fff", borderRight: "1px solid #e2e8f0", padding: "20px 0", position: "sticky", top: 0, height: "100vh", overflowY: "auto" })}>
      {SIDEBAR.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={cssClass({
            display: "block", width: "100%", textAlign: "left",
            padding: "9px 20px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13,
            fontWeight: activeSection === s.id ? 700 : 400,
            color: activeSection === s.id ? "#f18200" : "#475569",
            borderLeft: activeSection === s.id ? "3px solid #f18200" : "3px solid transparent",
          })}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
});

export default MyInfoSidebar;
