import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { RESIGN_STATUS_CONFIG } from "../constants";

const LABELS = {
  pending: "Pending", rm_approved: "RM Approved", rm_rejected: "RM Rejected",
  accepted: "Accepted", rejected: "Rejected", withdrawn: "Withdrawn",
};

const ResignBadge = React.memo(function ResignBadge({ status }) {
  const cfg = RESIGN_STATUS_CONFIG[status] || RESIGN_STATUS_CONFIG.pending;
  return (
    <span className={cssClass({
      display: "inline-block", fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 999,
      background: cfg.bg, color: cfg.color,
      whiteSpace: "nowrap", flexShrink: 0,
    })}>
      {LABELS[status] || status}
    </span>
  );
});

export default ResignBadge;
