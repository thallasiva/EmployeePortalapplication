import React from "react";

export default function PageTabs({ tabs, value, onChange, label = "Page sections" }) {
  return (
    <div role="tablist" aria-label={label} className="flex max-w-full flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const selected = value === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50"
            }`}
          >
            {Icon && <Icon size={14} aria-hidden="true" />}
            {tab.label}
            {tab.count != null && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                selected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
