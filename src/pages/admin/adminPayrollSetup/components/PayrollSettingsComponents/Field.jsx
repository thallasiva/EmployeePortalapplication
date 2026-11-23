import React from "react";
function Field({
  label,
  children,
  hint
}) {
  return <label className="grid gap-1.5 text-xs font-semibold text-gray-700"><span>{label}</span>{children}{hint && <span className="text-[11px] font-normal text-gray-500">{hint}</span>}</label>;
}
export { Field };
