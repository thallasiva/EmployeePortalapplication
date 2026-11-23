import React from "react";
import { getUserInitials } from "../../../../lib/dateUtils";
const Avatar = ({
  name,
  size = 40,
  tone = "orange"
}) => {
  const tones = {
    orange: "bg-[#fff4e6] text-[#b45309]",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-[#e87500]"
  };
  return <div className={`rounded-full flex items-center justify-center font-bold shrink-0 ${tones[tone]}`} style={{
    width: size,
    height: size,
    fontSize: size * 0.32
  }} aria-hidden="true">
      {name === "Anonymous" ? "?" : getUserInitials(name)}
    </div>;
};
export { Avatar };
