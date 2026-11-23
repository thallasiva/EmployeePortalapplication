import React from "react";
const Row = React.memo(function Row({
  label,
  value
}) {
  return <div className="flex justify-between py-2 border-b border-amber-50 last:border-0 text-[13px]">
      <span className="text-gray-400 w-44 flex-shrink-0 text-[12px]">{label}</span>
      <span className="font-medium text-gray-800 text-right break-all">{value || "—"}</span>
    </div>;
});
export { Row };
