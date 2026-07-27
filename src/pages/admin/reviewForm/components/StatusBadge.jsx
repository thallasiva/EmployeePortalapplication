import React from "react";

const STATUS_STYLES = {
  Completed: "bg-green-50 text-green-700 border border-green-200",
  "In Progress": "bg-orange-50 text-orange-600 border border-orange-200",
  Pending: "bg-gray-50 text-gray-500 border border-gray-200",
  "Not Started": "bg-gray-50 text-gray-400 border border-gray-200",
};

const StatusBadge = React.memo(function StatusBadge({ status }) {
  return (
    <span
      className={`text-[12px] font-medium px-2.5 py-0.5 rounded ${
        STATUS_STYLES[status] ?? STATUS_STYLES["Pending"]
      }`}
    >
      {status}
    </span>
  );
});

export default StatusBadge;
