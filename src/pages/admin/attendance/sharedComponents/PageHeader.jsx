import React from 'react';
import { RefreshCw } from 'lucide-react';
function PageHeader({
  eyebrow = 'TIME & ATTENDANCE',
  title,
  description,
  action,
  onRefresh,
  loading
}) {
  return <header className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-cyan-700">{eyebrow}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div><div className="flex items-center gap-2">{onRefresh && <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>}{action}</div></header>;
}
export { PageHeader };
