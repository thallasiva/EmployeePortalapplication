import React from "react";
import { STATUS_STYLE } from "./shared";
function StatusBadge({
  status
}) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[status] || ""}`}>
      {status}
    </span>;
}
export { StatusBadge };
