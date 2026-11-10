import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Download, FileText, Timer, UserRound } from 'lucide-react';
import apiClient, { unwrap } from '../../../api/client';
import { getMyMonthlyAttendance } from '../../../api/attendance.api';

const REPORTS = [
  ['Monthly Attendance', 'Complete month summary', CalendarDays],
  ['Attendance Summary', 'Present, absent, late and leave', UserRound],
  ['Work Hours Report', 'Daily work hours detail', Clock3],
  ['Overtime Report', 'Your overtime request history', Timer],
];
const thisMonth = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; };
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
function exportCsv(rows, month, isOvertime) {
  if (isOvertime) {
    const columns = [['Date','work_date'],['Overtime minutes','overtime_minutes'],['Reason','reason'],['Status','status']];
    const csv = [columns.map(([label])=>csvCell(label)).join(','), ...rows.map((row)=>columns.map(([,key])=>csvCell(row[key])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link=document.createElement('a'); link.href=url; link.download=`overtime-${month}.csv`; link.click(); URL.revokeObjectURL(url); return;
  }
  const columns = [['Date','attendance_date'],['Check-in','check_in'],['Check-out','check_out'],['Work hours','work_hours'],['Status','status']];
  const csv = [columns.map(([label])=>csvCell(label)).join(','), ...rows.map((row)=>columns.map(([,key])=>csvCell(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link=document.createElement('a'); link.href=url; link.download=`attendance-${month}.csv`; link.click(); URL.revokeObjectURL(url);
}
export default function AttendanceReports() {
  const [month, setMonth] = useState(thisMonth);
  const [type, setType] = useState('Monthly Attendance');
  const [rows, setRows] = useState([]);
  const [overtime, setOvertime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const [year, monthNumber] = month.split('-').map(Number);
    setLoading(true); setError('');
    try {
      if (type === 'Overtime Report') {
        const data = await apiClient.get('/attendance/overtime').then(unwrap);
        setOvertime((Array.isArray(data) ? data : []).filter((row)=>String(row.work_date).slice(0,7)===month));
      } else {
        const data = await getMyMonthlyAttendance({ year, month: monthNumber });
        setRows(Array.isArray(data) ? data : data?.data || []);
      }
    } catch (err) { setError(err?.response?.data?.message || 'Could not generate your attendance report.'); }
    finally { setLoading(false); }
  }, [month, type]);
  useEffect(() => { load(); }, [load]);
  const label = new Date(`${month}-15T12:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const selectedRows = useMemo(() => type === 'Overtime Report' ? overtime : rows, [type, overtime, rows]);
  const present = rows.filter((row)=>['present','late','half_day'].includes(String(row.status||'').toLowerCase())).length;
  const absent = rows.filter((row)=>String(row.status||'').toLowerCase()==='absent').length;
  const hours = rows.reduce((sum,row)=>{const value=String(row.work_hours||0);const match=value.match(/^(\d+):(\d{1,2})$/);return sum+(match?Number(match[1])+Number(match[2])/60:Number(value)||0);},0);
  return <div className="space-y-4 rounded-2xl bg-slate-50 p-3 sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><FileText size={20}/></span><div><h1 className="text-xl font-bold text-slate-950">Attendance Reports</h1><p className="text-sm text-slate-500">Generate and download your attendance reports.</p></div></div><button type="button" onClick={()=>exportCsv(selectedRows,month,type==='Overtime Report')} disabled={!selectedRows.length} className="inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-3 py-2 text-sm font-semibold text-white hover:bg-[#cf6900] disabled:opacity-50"><Download size={15}/> Export</button></header>
    {error&&<div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{REPORTS.map(([name,description,Icon])=><button type="button" key={name} onClick={()=>setType(name)} className={`rounded-xl border p-4 text-left shadow-sm transition ${type===name?'border-orange-300 bg-orange-50 ring-1 ring-orange-100':'border-slate-200 bg-white hover:border-orange-200'}`}><div className="flex items-center gap-3"><span className="rounded-lg bg-orange-100 p-2 text-[#e87500]"><Icon size={18}/></span><span><b className="block text-sm text-slate-900">{name}</b><small className="text-xs text-slate-500">{description}</small></span></div></button>)}</div>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4"><div><h2 className="font-semibold text-slate-900">{type}</h2><p className="text-xs text-slate-500">{label}</p></div><label className="ml-auto text-xs font-semibold text-slate-600">Month<input type="month" value={month} onChange={(event)=>setMonth(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"/></label><button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-3 py-2 text-sm font-semibold text-white hover:bg-[#cf6900]">{loading?'Generating…':'Generate Report'}</button></div>
      {type!=='Overtime Report'&&<div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 sm:grid-cols-4">{[['Present',present],['Absent',absent],['Attendance records',rows.length],['Work hours',hours.toFixed(1)+' h']].map(([label,value])=><div key={label} className="rounded-lg bg-slate-50 p-3"><span className="block text-xs text-slate-500">{label}</span><b className="mt-1 block text-lg text-slate-900">{loading?'—':value}</b></div>)}</div>}
      <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{type==='Overtime Report'?['Date','Overtime','Reason','Status'].map((heading)=><th key={heading} className="px-4 py-3 font-semibold">{heading}</th>):['Date','Check-in','Check-out','Work hours','Status'].map((heading)=><th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{selectedRows.length?selectedRows.map((row,index)=><tr key={row.attendance_id||row.overtime_request_id||index}>{type==='Overtime Report'?<><td className="px-4 py-3">{String(row.work_date||'').slice(0,10)}</td><td className="px-4 py-3">{Math.floor(Number(row.overtime_minutes||0)/60)}h {Number(row.overtime_minutes||0)%60}m</td><td className="px-4 py-3">{row.reason}</td><td className="px-4 py-3 capitalize">{row.status}</td></>:<><td className="px-4 py-3 font-medium">{String(row.attendance_date||row.date||'').slice(0,10)}</td><td className="px-4 py-3">{String(row.check_in||'—').slice(0,5)}</td><td className="px-4 py-3">{String(row.check_out||'—').slice(0,5)}</td><td className="px-4 py-3">{row.work_hours??'—'}</td><td className="px-4 py-3 capitalize">{row.status||'—'}</td></>}</tr>):<tr><td colSpan={type==='Overtime Report'?4:5} className="px-4 py-12 text-center text-sm text-slate-500">{loading?'Generating report…':'No report rows for this month.'}</td></tr>}</tbody></table></div>
    </section>
  </div>;
}
