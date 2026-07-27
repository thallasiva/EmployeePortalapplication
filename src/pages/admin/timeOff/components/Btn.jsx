import React from "react";
import { cssClass, joinClasses } from "../../../../utils/classStyles";
import { B, BD } from "../constants";

const Btn = React.memo(({ onClick, disabled, children, variant = "primary", size = "md", style: extra = {} }) => {
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const base = {
    primary: { background: B, borderColor: B, color: "#fff" },
    cancel:  { background: "#fff", borderColor: "#d1d5db", color: "#374151" },
    danger:  { background: "#fff", borderColor: "#fca5a5", color: "#dc2626" },
    ghost:   { background: "transparent", borderColor: "transparent", color: "#6b7280" },
    green:   { background: "#16a34a", borderColor: "#16a34a", color: "#fff" },
  };
  const hover = {
    primary: { background: BD, borderColor: BD },
    cancel:  { background: "#f9fafb" },
    danger:  { background: "#fff1f2" },
    ghost:   { background: "#f3f4f6" },
    green:   { background: "#15803d", borderColor: "#15803d" },
  };
  const s = { ...base[variant], ...extra };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={joinClasses(
        `inline-flex items-center gap-1.5 font-semibold rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]}`,
        cssClass(s)
      )}
      onMouseEnter={(e) => { if (!disabled) Object.assign(e.currentTarget.style, { ...s, ...hover[variant] }); }}
      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, s); }}
    >
      {children}
    </button>
  );
});

Btn.displayName = "Btn";
export default Btn;
