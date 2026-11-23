import React from 'react';
function Panel({
  title,
  children,
  action
}) {
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5"><h2 className="font-semibold text-slate-900">{title}</h2>{action}</div>{children}</section>;
}
export { Panel };
