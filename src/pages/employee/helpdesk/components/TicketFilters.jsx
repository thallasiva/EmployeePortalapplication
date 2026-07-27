import { memo } from "react";
import { TICKET_STATUSES } from "../constants/categories";
import { BRAND, BRAND_LIGHT } from "../utils/helpdeskUtils";
import { cssClass } from "../../../../utils/classStyles";

/**
 * Pill-filter row for the My Tickets view.
 * Single responsibility: render status filter buttons + fire onFilterChange.
 */
const TicketFilters = memo(function TicketFilters({ activeFilter, onFilterChange }) {
  return (
    <div className={cssClass({ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" })}>
      {TICKET_STATUSES.map((f) => (
        <button
          key={f}
          onClick={() => onFilterChange(f)}
          className={cssClass({
            padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
            border: activeFilter === f ? "1.5px solid " + BRAND : "1px solid #e5e7eb",
            background: activeFilter === f ? BRAND_LIGHT : "#fff",
            color: activeFilter === f ? BRAND : "#6b7280",
            cursor: "pointer",
          })}
        >
          {f === "all" ? "All" : f}
        </button>
      ))}
    </div>
  );
});

export default TicketFilters;
