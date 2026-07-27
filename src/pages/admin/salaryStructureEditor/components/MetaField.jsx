import React from "react";

const MetaField = React.memo(function MetaField({ icon, label, value, badge }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">{label}</p>
        {badge ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
            {value}
          </span>
        ) : (
          <p className="text-[12px] font-medium text-gray-700 truncate">{value || "—"}</p>
        )}
      </div>
    </div>
  );
});

export default MetaField;
