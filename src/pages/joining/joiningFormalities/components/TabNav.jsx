import React from "react";
import { CheckCircle } from "lucide-react";
import { TABS } from "../constants";

const TabNav = React.memo(function TabNav({ tab, visited, goTo }) {
  return (
    <div className="bg-[#f18200] px-4 py-4 shadow-sm">
      <div className="max-w-5xl mx-auto flex flex-wrap gap-2">
        {TABS.map((t, i) => {
          const isActive = i === tab;
          const isDone = visited.has(i) && i < tab;
          return (
            <button
              key={t.id}
              onClick={() => goTo(i)}
              style={
                isActive
                  ? { backgroundColor: "#ffffff", color: "#d97706" }
                  : { backgroundColor: "#fbcd97", color: "#92400e" }
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap shadow-sm hover:opacity-90"
            >
              {isDone ? (
                <CheckCircle size={12} className={isActive ? "text-amber-600" : "text-green-300"} />
              ) : (
                <t.icon size={12} />
              )}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default TabNav;
