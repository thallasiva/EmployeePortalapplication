import React from "react";
import SummaryCard from "./SummaryCard";

const SummaryCards = React.memo(function SummaryCards({ loading, summary, recordsByDate }) {
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <div className="flex flex-wrap gap-4 flex-1">
        <SummaryCard
          title="AVG. WORK HRS"
          value={loading ? "—" : summary.avgWork}
          trend={loading ? "" : `${recordsByDate.size} day(s) recorded`}
        />
        <SummaryCard
          title="AVG. ACTUAL WORK HRS"
          value={loading ? "—" : summary.avgActual}
        />
        <SummaryCard
          title="PENALTY DAYS"
          value={loading ? "—" : String(summary.penaltyDays)}
        />
      </div>
    </div>
  );
});

export default SummaryCards;
