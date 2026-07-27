import { memo } from "react";
import { cssClass, joinClasses } from "../../../../utils/classStyles";
import { B, BD } from "../constants/leaveConstants";

const styleMap = {
  primary: { background: B,             borderColor: B,         color: "#fff"     },
  cancel:  { background: "#fff",        borderColor: "#d1d5db", color: "#374151"  },
  danger:  { background: "#fff",        borderColor: "#fca5a5", color: "#dc2626"  },
  ghost:   { background: "transparent", borderColor: "transparent", color: "#6b7280" },
};

const Btn = memo(({ onClick, disabled, children, variant = "primary", size = "md", className = "", type }) => {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={joinClasses(`${base} ${sizes[size]} ${className}`, cssClass(styleMap[variant]))}
      onMouseEnter={(e) => {
        if (variant === "primary" && !disabled) { e.currentTarget.style.background = BD; e.currentTarget.style.borderColor = BD; }
        if (variant === "cancel") e.currentTarget.style.background = "#f9fafb";
        if (variant === "danger") e.currentTarget.style.background = "#fff1f2";
      }}
      onMouseLeave={(e) => {
        if (variant === "primary" && !disabled) { e.currentTarget.style.background = B; e.currentTarget.style.borderColor = B; }
        if (variant === "cancel") e.currentTarget.style.background = "#fff";
        if (variant === "danger") e.currentTarget.style.background = "#fff";
      }}
    >
      {children}
    </button>
  );
});

Btn.displayName = "Btn";
export default Btn;
