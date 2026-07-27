import React from "react";

const TABS = [
  { key: "apply", label: "Apply" },
  { key: "pending", label: "Pending" },
  { key: "history", label: "History" },
];

const TabSwitcher = React.memo(function TabSwitcher({ tab, onTabChange }) {
  return (
    <div className="relative flex items-center justify-center mb-4 min-h-[40px]">
      <div className="inline-flex rounded-md border border-slate-200 overflow-hidden bg-white">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={`px-8 py-2 text-sm font-medium border-l border-slate-200 first:border-l-0 transition-colors ${
              tab === key
                ? "bg-sky-500 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
});

export default TabSwitcher;
