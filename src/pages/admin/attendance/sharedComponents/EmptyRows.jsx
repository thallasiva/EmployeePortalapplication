import React from 'react';
function EmptyRows({
  colSpan,
  children = 'No records match these filters.'
}) {
  return <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-slate-500">{children}</td></tr>;
}
export { EmptyRows };
