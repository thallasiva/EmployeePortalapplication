import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import Stat from "./Stat";

const StatsBar = React.memo(function StatsBar({ counts }) {
  return (
    <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 })}>
      <Stat label="Awaiting Manager" value={counts.pending}     color="#d97706" />
      <Stat label="Manager Approved" value={counts.rm_approved} color="#3b82f6" />
      <Stat label="Accepted"         value={counts.accepted}    color="#16a34a" />
      <Stat label="Rejected"         value={counts.rejected}    color="#dc2626" />
    </div>
  );
});

export default StatsBar;
