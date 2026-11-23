import React from "react";
function Dot({
  color = "green"
}) {
  const map = {
    green: "bg-emerald-500",
    red: "bg-red-500",
    amber: "bg-amber-400",
    blue: "bg-blue-500",
    gray: "bg-slate-400",
    orange: "bg-[#e87500]"
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${map[color] || "bg-slate-400"}`} />;
}
export { Dot };
