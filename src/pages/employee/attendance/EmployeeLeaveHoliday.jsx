import React, { useEffect, useState } from 'react';
import { CalendarDays, Heart, Palmtree, Plus, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyLeaveBalances, getMyLeaveRequests } from '../../../api/leaveRequest.api';
import { listHolidays } from '../../../api/holiday.api';

export default function EmployeeLeaveHoliday() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('requests');
  const [balances, setBalances] = useState([]); const [requests, setRequests] = useState([]); const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    setLoading(true); setError('');
    Promise.all([getMyLeaveBalances(), getMyLeaveRequests({ limit: 100 }), listHolidays({ limit: 100 })])
      .then(([balanceData, requestData, holidayData]) => {
        setBalances(Array.isArray(balanceData) ? balanceData : balanceData?.data || []);
        setRequests(requestData?.data || []);
        setHolidays(Array.isArray(holidayData) ? holidayData : holidayData?.data || []);
      })
      .catch((err) => setError(err?.response?.data?.message || 'Could not load your leave and holiday details.'))
      .finally(() => setLoading(false));
  }, []);
  return <div className="space-y-4 rounded-2xl bg-slate-50 p-3 sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><CalendarDays size={20}/></span><div><h1 className="text-xl font-bold text-slate-950">Leave &amp; Holiday</h1><p className="text-sm text-slate-500">View your leave balance, requests, and company holidays.</p></div></div><button type="button" onClick={()=>navigate('/employee/leave/apply')} className="inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#cf6900]"><Plus size={16}/> Apply Leave</button></header>
    {error&&<div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    <section><h2 className="mb-3 font-semibold text-slate-900">Leave Balance</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{balances.length?balances.map((balance,index)=>{const values=[['bg-blue-50','text-blue-700',Sun],['bg-rose-50','text-rose-700',Heart],['bg-amber-50','text-amber-700',CalendarDays],['bg-violet-50','text-violet-700',Palmtree]];const [bg,color,Icon]=values[index%values.length];return <div key={balance.leave_type_id||balance.leave_type_name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{balance.leave_type_name||'Leave'}</span><span className={`rounded-lg p-2 ${bg} ${color}`}><Icon size={18}/></span></div><p className={`mt-2 text-2xl font-bold ${color}`}>{balance.available??balance.balance??0}<span className="ml-1 text-sm font-medium text-slate-400">/ {balance.total_days??balance.total??balance.annual_quota??0}</span></p><p className="mt-1 text-xs text-slate-400">days available</p></div>}):<div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">{loading?'Loading leave balances…':'No leave balances found.'}</div>}</div></section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 pt-2"><div className="flex gap-1">{[['requests','My Leave Requests'],['holidays','Holidays']].map(([key,label])=><button type="button" key={key} onClick={()=>setTab(key)} className={tab===key?'border-b-2 border-[#e87500] px-3 py-3 text-sm font-bold text-[#e87500]':'border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-slate-500'}>{label}</button>)}</div>{tab==='requests'&&<button type="button" onClick={()=>navigate('/employee/leave/apply')} className="mb-1 inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-3 py-2 text-xs font-semibold text-white hover:bg-[#cf6900]"><Plus size={14}/> Apply Leave</button>}</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{tab==='requests'?['Request ID','Leave Type','From','To','Days','Status'].map((heading)=><th key={heading} className="px-4 py-3 font-semibold">{heading}</th>):['Date','Holiday','Type'].map((heading)=><th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{tab==='requests'?(requests.length?requests.map((row)=><tr key={row.leave_request_id}><td className="px-4 py-3 font-medium">LVR-{row.leave_request_id}</td><td className="px-4 py-3">{row.leave_type_name||'—'}</td><td className="px-4 py-3">{String(row.from_date||'').slice(0,10)}</td><td className="px-4 py-3">{String(row.to_date||'').slice(0,10)}</td><td className="px-4 py-3">{row.days??row.total_days??'—'}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize">{row.status||'Pending'}</span></td></tr>):<tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">{loading?'Loading requests…':'No leave requests found.'}</td></tr>):(holidays.length?holidays.map((row,index)=><tr key={row.holiday_id||index}><td className="px-4 py-3">{String(row.holiday_date||row.date||'').slice(0,10)}</td><td className="px-4 py-3 font-medium">{row.holiday_name||row.name||'—'}</td><td className="px-4 py-3">{row.is_restricted?'Restricted holiday':'Company holiday'}</td></tr>):<tr><td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-500">{loading?'Loading holidays…':'No holidays found.'}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
}
