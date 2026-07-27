import React from "react";
import { REGULARIZATION_HISTORY } from "../../../../../data/regularizations";
import HistoryCard from "./HistoryCard";

const HistoryTab = React.memo(function HistoryTab({ expandedId, onToggle, onViewDetails }) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto pb-4">
      {REGULARIZATION_HISTORY.map((record) => (
        <HistoryCard
          key={record.id}
          record={record}
          expanded={expandedId === record.id}
          onToggle={() => onToggle(record.id)}
          onViewDetails={() => onViewDetails(record)}
        />
      ))}
    </div>
  );
});

export default HistoryTab;
