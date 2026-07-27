import React from "react";
import { getConfig } from "../utils/leaveConfig";
import { cssClass } from "../../../../../utils/classStyles";

const LeaveCard = React.memo(function LeaveCard({ item, onViewDetails }) {
  const cfg = getConfig(item.title);
  const Icon = cfg.icon;
  const progress = item.total > 0 ? Math.min((item.consumed / item.total) * 100, 100) : 0;

  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e5eaf0", borderRadius: 14,
      padding: "18px 18px 14px", display: "flex", flexDirection: "column",
      gap: 14, boxShadow: "0 1px 4px 0 rgba(0,0,0,0.05)",
    })}>

      <div className={cssClass({ display: "flex", alignItems: "flex-start", justifyContent: "space-between" })}>
        <div className={cssClass({
          width: 40, height: 40, borderRadius: 10, background: cfg.bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        })}>
          <Icon size={20} color={cfg.iconColor} strokeWidth={2} />
        </div>
        <span className={cssClass({
          fontSize: 11, fontWeight: 600, background: cfg.badgeBg,
          color: cfg.badgeColor, padding: "3px 9px", borderRadius: 20,
        })}>
          Granted : {item.granted}
        </span>
      </div>

      <div>
        <p className={cssClass({ fontSize: 12, color: "#6b7a8d", margin: "0 0 3px", fontWeight: 500 })}>
          {item.title}
        </p>
        <p className={cssClass({ fontSize: 34, fontWeight: 600, color: "#1a2233", margin: 0, lineHeight: 1 })}>
          {String(item.balance).padStart(2, "0")}
        </p>
        <p className={cssClass({ fontSize: 11, color: "#9ca8b5", margin: "4px 0 0" })}>days balance</p>
      </div>

      <div>
        <div className={cssClass({ height: 5, borderRadius: 5, background: "#f0f3f8", overflow: "hidden" })}>
          <div className={cssClass({
            height: "100%", width: `${progress}%`, background: cfg.barColor,
            borderRadius: 5, transition: "width 0.4s ease",
          })} />
        </div>
        <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 })}>
          <span className={cssClass({ fontSize: 11, color: "#9ca8b5" })}>
            {item.consumed} of {item.total || item.granted} consumed
          </span>
          {item.granted > 0 && (
            <button
              type="button"
              onClick={() => onViewDetails(item.title)}
              className={cssClass({
                fontSize: 11, fontWeight: 600, color: cfg.detailColor,
                background: "none", border: "none", cursor: "pointer", padding: 0,
              })}
            >
              View details
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default LeaveCard;
