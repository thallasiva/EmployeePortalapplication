import React from "react";

const CtcTableRow = React.memo(function CtcTableRow({ label, monthly, annual, highlight }) {
  return (
    <div className={`grid grid-cols-3 px-4 py-2.5 border-b border-gray-100 ${highlight ? "bg-orange-50" : ""}`}>
      <span className={`text-[13px] ${highlight ? "text-gray-900 font-bold" : "text-gray-600"}`}>{label}</span>
      <span className={`text-[13px] text-right pr-4 ${highlight ? "text-[#f18200] font-bold" : "text-gray-800"}`}>{monthly}</span>
      <span className={`text-[13px] text-right ${highlight ? "text-[#f18200] font-bold" : "text-gray-800"}`}>{annual}</span>
    </div>
  );
});

export default CtcTableRow;
