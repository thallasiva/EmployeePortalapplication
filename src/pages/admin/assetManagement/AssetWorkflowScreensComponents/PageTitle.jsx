import React from "react";
function PageTitle({
  title,
  description,
  action
}) {
  return <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold  text-[#e87500]">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{action}</div>;
}
export { PageTitle };
