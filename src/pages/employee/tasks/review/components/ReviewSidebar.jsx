import React from "react";
import { ChevronRight } from "lucide-react";
import { REVIEW_NAV_SECTIONS } from "../../../../../data/reviewHub";
import { cssClass, joinClasses } from "../../../../../utils/classStyles";
import { SECTION_ICONS } from "../constants";

const ReviewSidebar = React.memo(function ReviewSidebar({ activeItemId, onNavClick }) {
  return (
    <aside className={cssClass({
      width: 235, flexShrink: 0,
      background: "#fff",
      borderRight: "1px solid #e8edf2",
      display: "flex", flexDirection: "column",
      minHeight: "calc(100vh - 4.5rem)",
    })}>
      <div className={cssClass({
        padding: "16px 18px 12px",
        fontSize: 14, fontWeight: 700, color: "#1e293b",
        borderBottom: "1px solid #f0f4f8",
      })}>
        Overview
      </div>

      <div className={cssClass({ flex: 1, overflowY: "auto", padding: "8px 0" })}>
        {REVIEW_NAV_SECTIONS.map((section) => (
          <div key={section.id} className={cssClass({ marginBottom: 2 })}>
            <div className={cssClass({
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 18px 4px",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              color: "#94a3b8", textTransform: "uppercase",
            })}>
              <span className={cssClass({ opacity: 0.7 })}>{SECTION_ICONS[section.id]}</span>
              {section.label}
            </div>

            {section.items.map((item) => {
              const active = activeItemId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={joinClasses("rv-nav-btn", cssClass({
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%", textAlign: "left",
                    padding: "9px 14px 9px 24px",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#1890ff" : "#475569",
                    background: active ? "#eef6ff" : "transparent",
                    border: "none",
                    borderLeft: active ? "3px solid #1890ff" : "3px solid transparent",
                    cursor: "pointer", transition: "all 0.12s",
                  }))}
                  onClick={() => onNavClick(item.id)}
                >
                  {item.label}
                  {active && <ChevronRight size={13} className={cssClass({ color: "#1890ff" })} />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
});

export default ReviewSidebar;
