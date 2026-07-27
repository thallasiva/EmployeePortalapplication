import React from "react";
import { sectionCfg, timeAgo } from "../utils";
import Avatar from "./Avatar";
import StatusBadge from "./StatusBadge";

const ActivityCard = React.memo(function ActivityCard({ item, navigate }) {
  const sec = sectionCfg(item.section);

  return (
    <div style={{
      background: "#fff", border: "1px solid #e8edf2",
      borderLeft: `3px solid ${sec.color}`,
      borderRadius: 10, padding: "14px 16px",
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: sec.bg || "#f0f3f8",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>
        {item.emoji || <span style={{ color: sec.color, display: "flex" }}>{sec.icon}</span>}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2233" }}>{item.title}</span>
          {item.status && <StatusBadge status={item.status} />}
        </div>

        {item.description && (
          <p style={{ fontSize: 12.5, color: "#4b5563", margin: "0 0 6px", lineHeight: 1.5 }}>
            {item.description}
          </p>
        )}

        {item.chips && item.chips.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            {item.chips.map((chip, i) => (
              <span key={i} style={{
                fontSize: 11, background: "#f5f7fb", color: "#4b5563",
                padding: "2px 8px", borderRadius: 20, border: "1px solid #e8edf2", fontWeight: 500,
              }}>
                {chip}
              </span>
            ))}
          </div>
        )}

        {item.fromName && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: sec.bg || "#f0f3f8", borderRadius: 7,
            padding: "4px 10px", marginBottom: 6,
          }}>
            <Avatar name={item.fromName} size={20} />
            <span style={{ fontSize: 11, fontWeight: 600, color: sec.color }}>
              {item.fromName} sent you kudos 💝
            </span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: "#9ca8b5" }}>
            {sec.label} · {item.timeLabel || timeAgo(item.timestamp)}
          </span>
          {item.link && (
            <button
              onClick={() => navigate(item.link)}
              style={{
                marginLeft: "auto", fontSize: 11, fontWeight: 600, color: sec.color,
                background: "none", border: "none", cursor: "pointer", padding: 0, whiteSpace: "nowrap",
              }}
            >
              View →
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default ActivityCard;
