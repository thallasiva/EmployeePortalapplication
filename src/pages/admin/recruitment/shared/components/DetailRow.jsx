import React from "react";

export const DetailRow = React.memo(function DetailRow({ label, value }) {
  return (
    <div className="flex gap-2 mb-2.5 text-[13px]">
      <span className="text-gray-500 min-w-[160px] font-medium">{label}</span>
      <span className="text-gray-900 flex-1">{value || "—"}</span>
    </div>
  );
});

export const TwoColGrid = React.memo(function TwoColGrid({ children }) {
  return (
    <div className="grid grid-cols-2 gap-x-5">
      {children}
    </div>
  );
});
