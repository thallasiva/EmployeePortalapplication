import React from "react";
import LeaveDecisionsPanel  from "./LeaveDecisionsPanel";
import LeaveCancelPanel     from "./LeaveCancelPanel";
import RegularizationPanel  from "./RegularizationPanel";
import ResignationsPanel    from "./ResignationsPanel";
import HelpdeskPanel        from "./HelpdeskPanel";
import ComingSoonPanel      from "./ComingSoonPanel";

const PanelRouter = React.memo(function PanelRouter({ item, search, statusFilter }) {
  if (!item) return null;
  switch (item.dataType) {
    case "leave-decisions": return <LeaveDecisionsPanel search={search} statusFilter={statusFilter} />;
    case "leave-cancel":    return <LeaveCancelPanel search={search} />;
    case "regularization":  return <RegularizationPanel search={search} statusFilter={statusFilter} />;
    case "resignations":    return <ResignationsPanel search={search} statusFilter={statusFilter} />;
    case "helpdesk":        return <HelpdeskPanel search={search} statusFilter={statusFilter} />;
    default:                return <ComingSoonPanel label={item.label} />;
  }
});

export default PanelRouter;
