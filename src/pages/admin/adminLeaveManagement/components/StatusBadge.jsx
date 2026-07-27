import { memo } from "react";
import { cssClass } from "../../../../utils/classStyles";

const STATUS_STYLES = {
  Pending:   { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  Approved:  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  Rejected:  { bg: "#fff1f2", color: "#b91c1c", border: "#fecdd3" },
  Cancelled: { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
};

const StatusBadge = memo(({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Cancelled;
  return (
    <span className={cssClass({
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    })}>
      {status}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";
export default StatusBadge;
