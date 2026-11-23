import React from "react";
const DetailRow = React.memo(function DetailRow({
  label,
  value
}) {
  return <div className="flex gap-2 mb-2.5 text-[13px]">
      <span className="text-gray-500 min-w-[160px] font-medium">{label}</span>
      <span className="text-gray-900 flex-1">{value || "—"}</span>
    </div>;
});
export { DetailRow };
