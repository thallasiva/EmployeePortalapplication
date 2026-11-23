import React from "react";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { NAVY, AMBER, TEMPLATES } from "./shared";
// ─── TemplateToggle component ─────────────────────────────────────────────────
const TemplateToggle = React.memo(function TemplateToggle({
  value,
  onChange
}) {
  return <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
      {TEMPLATES.map(({
      id,
      label,
      Icon
    }) => {
      const active = value === id;
      return <button key={id} onClick={() => onChange(id)} title={`Template ${id}: ${label}`} className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md transition-all" style={active ? {
        backgroundColor: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: `1.5px solid ${AMBER}`
      } : {
        border: "1.5px solid transparent"
      }}>
            <Icon active={active} />
            <span className="text-[9px] font-semibold leading-none" style={{
          color: active ? NAVY : "#9ca3af"
        }}>
              {label}
            </span>
          </button>;
    })}
    </div>;
});
// ─── Hook for reading/writing template preference ─────────────────────────────
export { TemplateToggle };
