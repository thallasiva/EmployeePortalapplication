import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Eye, Plus, RefreshCw } from 'lucide-react';
import { listRegularizations } from '../../../api/attendance.api';
import { getLoggedInUser } from '../../../lib/dateUtils';

const TABS = ['My Requests', 'Pending', 'Approved', 'Rejected'];
function statusClass(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'approved') return 'bg-emerald-100 text-emerald-800';
  if (value === 'rejected') return 'bg-rose-100 text-rose-800';
  return 'bg-amber-100 text-amber-800';
}

export default function MyRegularizations() {
  const navigate = useNavigate();
  const user = getLoggedInUser();
  const [tab, setTab] = useState('My Requests');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await listRegularizations({ employee_id: user.employeeId, limit: 500 });
      setRows(result?.data || []);
    } catch (err) { setError(err?.response?.data?.message || 'Could not load your requests.'); }
    finally { setLoading(false); }
  }, [user.employeeId]);
  useEffect(() => { load(); }, [load]);
  const visible = useMemo(() => tab === 'My Requests' ? rows : rows.filter((row) => String(row.status || '').toLowerCase() === tab.toLowerCase()), [rows, tab]);

  return <div className="space-y-4 rounded-2xl bg-slate-50 p-3 sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><CalendarDays size={20}/></span><div><h1 className="text-xl font-bold text-slate-950">Attendance Regularization</h1><p className="mt-0.5 text-sm text-slate-500">Request correction for missed or incorrect attendance punches.</p></div></div><div className="flex gap-2"><button type="button" onClick={load} disabled={loading} aria-label="Refresh requests" className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={loading?'animate-spin':''}/></button><button type="button" onClick={()=>navigate('/employee/attendance/new-request')} className="inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#cf6900]"><Plus size={16}/> New Request</button></div></header>
    {error&&<div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 pt-3">{TABS.map((name)=><button type="button" key={name} onClick={()=>setTab(name)} className={tab===name?'border-b-2 border-[#e87500] px-3 py-3 text-sm font-bold text-[#e87500]':'border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-slate-500 hover:text-slate-800'}>{name}{name==='My Requests'?` (${rows.length})`:` (${rows.filter((row)=>String(row.status||'').toLowerCase()===name.toLowerCase()).length})`}</button>)}</div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{['Request ID','Date','Request Type','Requested Time','Reason','Status','Action'].map((heading)=><th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visible.length?visible.map((row)=><tr key={row.regularization_id}><td className="px-4 py-3 font-semibold">REG-{String(row.regularization_id).padStart(4,'0')}</td><td className="px-4 py-3">{String(row.attendance_date||'').slice(0,10)}</td><td className="px-4 py-3">{row.requested_check_in&&row.requested_check_out?'Check-in & out':row.requested_check_in?'Check-in':'Check-out'}</td><td className="px-4 py-3">{row.requested_check_in?String(row.requested_check_in).slice(0,5):'—'}{row.requested_check_out?` – ${String(row.requested_check_out).slice(0,5)}`:''}</td><td className="max-w-56 truncate px-4 py-3 text-slate-600" title={row.reason}>{row.reason||'—'}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(row.status)}`}>{row.status||'Pending'}</span></td><td className="px-4 py-3"><button type="button" onClick={()=>navigate('/employee/attendance/history')} title="View attendance history" className="rounded-lg p-2 text-[#e87500] hover:bg-orange-50"><Eye size={16}/></button></td></tr>):<tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">{loading?'Loading requests…':'No requests in this view yet.'}</td></tr>}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span>Showing {visible.length} request{visible.length===1?'':'s'}</span><button type="button" onClick={()=>navigate('/employee/attendance/new-request')} className="font-semibold text-[#e87500] hover:underline">Submit an attendance correction</button></div></section>
  </div>;
}
