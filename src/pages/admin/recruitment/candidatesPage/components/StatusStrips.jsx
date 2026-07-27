import React, { useCallback } from "react";
import { STATUS_STRIPS_CONFIG } from "../constants";

const StatusStrips = React.memo(function StatusStrips({ candidates, filterStatus, setFilterStatus, tableRef }) {
  const strips = STATUS_STRIPS_CONFIG.map((s) => ({
    ...s,
    count: s.val === "" ? candidates.length : candidates.filter((c) => c.status === s.val).length
  }));

  const handleClick = useCallback((val) => {
    setFilterStatus(val);
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [setFilterStatus, tableRef]);

  return (
    <div className="flex gap-2.5 mb-5 flex-wrap">
      {strips.map((s) => (
        <div
          key={s.label}
          onClick={() => handleClick(s.val)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer border-[1.5px] transition-all ${s.cls} ${filterStatus === s.val ? s.activeBorder : s.defaultBorder}`}>
          <span className="text-lg font-extrabold leading-none">{s.count}</span>
          <span className="text-xs font-semibold">{s.label}</span>
        </div>
      ))}
    </div>
  );
});

export default StatusStrips;
