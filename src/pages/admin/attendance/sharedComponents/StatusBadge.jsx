import React from 'react';
function StatusBadge({
  status
}) {
  const normalized = String(status || 'Unknown').toLowerCase();
  const tone = ['present', 'approved', 'active'].includes(normalized) ? 'bg-emerald-100 text-emerald-800' : ['late', 'pending'].includes(normalized) ? 'bg-amber-100 text-amber-800' : ['rejected', 'absent', 'inactive'].includes(normalized) ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>{status || 'Unknown'}</span>;
}
export { StatusBadge };
