import React from "react";

export const Tabs = React.memo(function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-0.5 border-b-2 border-gray-100 mb-5">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`py-2 px-4 text-[13px] font-semibold border-0 border-b-2 -mb-0.5 bg-transparent cursor-pointer transition-colors ${
            active === tab.key
              ? "border-[#f18200] text-[#f18200]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
          {tab.count != null && (
            <span className={`ml-1.5 text-[10px] font-bold rounded-full px-1.5 py-px ${
              active === tab.key ? "bg-[#fff7ed] text-[#f18200]" : "bg-gray-100 text-gray-500"
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
});
