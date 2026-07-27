import React, { useMemo } from "react";

const StatusFilterBar = React.memo(function StatusFilterBar({ offers, filterStatus, onSelect }) {
  const statBtns = useMemo(() => [
    { label: "Total", val: "", count: offers.length, colorCls: "text-gray-500", bgCls: "bg-gray-100", activeBorder: "border-gray-500" },
    { label: "Draft", val: "Draft", count: offers.filter((o) => o.status === "Draft").length, colorCls: "text-gray-500", bgCls: "bg-gray-100", activeBorder: "border-gray-500" },
    { label: "Released", val: "Released", count: offers.filter((o) => o.status === "Released").length, colorCls: "text-amber-600", bgCls: "bg-amber-100", activeBorder: "border-amber-600" },
    { label: "Accepted", val: "Accepted", count: offers.filter((o) => o.status === "Accepted").length, colorCls: "text-emerald-600", bgCls: "bg-emerald-100", activeBorder: "border-emerald-600" },
    { label: "Rejected", val: "Rejected", count: offers.filter((o) => o.status === "Rejected").length, colorCls: "text-red-600", bgCls: "bg-red-100", activeBorder: "border-red-600" }
  ], [offers]);

  return (
    <div className="flex gap-2.5 mb-5 flex-wrap">
      {statBtns.map((s) => (
        <div key={s.label} onClick={() => onSelect(s.val)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full cursor-pointer border-2 transition-all ${s.bgCls} ${filterStatus === s.val ? s.activeBorder + " shadow-sm" : "border-transparent"}`}>
          <span className={`text-base font-bold ${s.colorCls}`}>{s.count}</span>
          <span className={`text-[12px] font-medium ${s.colorCls}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );
});

export default StatusFilterBar;
