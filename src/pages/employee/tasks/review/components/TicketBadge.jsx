import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { TICKET_STATUS_CONFIG } from "../constants";

const TicketBadge = React.memo(function TicketBadge({ status }) {
  const cfg = TICKET_STATUS_CONFIG[status] || { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
  return (
    <span className={cssClass({
      display: "inline-block", fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 999,
      background: cfg.bg, color: cfg.color, whiteSpace: "nowrap", flexShrink: 0,
    })}>
      {status}
    </span>
  );
});

export default TicketBadge;
