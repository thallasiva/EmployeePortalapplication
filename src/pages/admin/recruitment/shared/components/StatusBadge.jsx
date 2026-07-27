import React from "react";
import { STATUS_CLS } from "../constants";

export const StatusBadge = React.memo(function StatusBadge({ status }) {
  const cls = STATUS_CLS[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center px-[9px] py-[2px] rounded-full text-[11px] font-semibold tracking-[0.02em] whitespace-nowrap ${cls}`}
    >
      {status}
    </span>
  );
});
