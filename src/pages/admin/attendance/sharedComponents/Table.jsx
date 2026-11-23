import React from 'react';
function Table({
  headers,
  children,
  minWidth = '760px'
}) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm" style={{
      minWidth
    }}><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{headers.map(header => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{children}</tbody></table></div>;
}
export { Table };
