import React from "react";
function InfoRow({
  icon,
  label,
  value
}) {
  if (!value) return null;
  return <div className="flex items-start gap-2.5 py-1.5">
      <span className="text-[#e87500] mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide block">{label}</span>
        <span className="text-[12px] font-semibold text-[#1e293b]">{value}</span>
      </div>
    </div>;
}
export { InfoRow };
