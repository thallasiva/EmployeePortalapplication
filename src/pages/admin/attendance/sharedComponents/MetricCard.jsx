import React from 'react';
function MetricCard({
  label,
  value,
  note,
  tone = 'cyan',
  icon: Icon
}) {
  const tones = {
    cyan: 'bg-cyan-50 text-cyan-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700'
  };
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>{Icon && <span className={`rounded-lg p-2 ${tones[tone]}`}><Icon size={19} /></span>}</div>{note && <p className="mt-2 text-xs text-slate-500">{note}</p>}</div>;
}
export { MetricCard };
