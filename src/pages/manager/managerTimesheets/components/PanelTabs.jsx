import React from "react";
import { PANEL_OPTIONS } from "../constants";

const PanelTabs = React.memo(function PanelTabs({ activePanel, setActivePanel }) {
  return (
    <div className="flex gap-2">
      {PANEL_OPTIONS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => setActivePanel(p.key)}
          className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
            activePanel === p.key
              ? "bg-brand text-white border-brand"
              : "bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
});

export default PanelTabs;
