import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Download, Loader2, Lock, PauseCircle, Play, Search, SlidersHorizontal, Users, Wallet, ArrowRight } from "lucide-react";
import { getErrorMessage } from "../../../../api/client";
import { getPayrollAttendanceSummary, runPayroll } from "../../../../api/payroll.api";
import { MONTHS, inr, num, INFO_FLAGS, previousMonth, downloadCsv } from "./shared";
import { Kpi } from "./Kpi";
import { Stat } from "./Stat";
import { Legend } from "./Legend";
import { AdjustDialog } from "./AdjustDialog";
import { EmployeeRow } from "./EmployeeRow";
function AdminSalaryProcessing() {
  const [{
    month,
    year
  }, setPeriod] = useState(previousMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [processing, setProcessing] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getPayrollAttendanceSummary({
        month,
        year
      }));
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load attendance"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);
  useEffect(() => {
    load();
  }, [load]);
  const shiftMonth = delta => setPeriod(({
    month: m,
    year: y
  }) => {
    const d = new Date(y, m - 1 + delta, 1);
    return {
      month: d.getMonth() + 1,
      year: d.getFullYear()
    };
  });
  const rows = useMemo(() => data?.employees || [], [data?.employees]);
  const departments = useMemo(() => [...new Set(rows.map(r => r.department).filter(Boolean))].sort(), [rows]);
  const visible = rows.filter(r => (!search || `${r.name} ${r.emp_code}`.toLowerCase().includes(search.toLowerCase())) && (!dept || r.department === dept) && (!onlyIssues || r.flags.some(f => !INFO_FLAGS.includes(f.code))));
  const run = data?.run;
  const locked = Boolean(run?.is_locked) || run?.review_status === "APPROVED";
  const t = data?.totals;
  const blocking = rows.filter(r => r.flags.some(f => ["PENDING_LEAVE", "PENDING_REGULARIZATION"].includes(f.code))).length;
  const replaceRow = updated => {
    if (!updated) return load();
    setData(prev => {
      const employees = prev.employees.map(r => r.employee_id === updated.employee_id ? updated : r);
      const payable = employees.filter(r => r.pay && !r.on_hold);
      return {
        ...prev,
        employees,
        totals: {
          ...prev.totals,
          onHold: employees.filter(r => r.on_hold).length,
          payable: payable.length,
          lopDays: employees.reduce((s, r) => s + r.attendance.lopDays, 0),
          gross: payable.reduce((s, r) => s + r.pay.gross, 0),
          deductions: payable.reduce((s, r) => s + r.pay.totalDeductions, 0),
          net: payable.reduce((s, r) => s + r.pay.net, 0),
          lopAmount: payable.reduce((s, r) => s + r.pay.lopDeduction, 0)
        }
      };
    });
  };
  const process = async () => {
    setProcessing(true);
    try {
      const res = await runPayroll({
        month,
        year
      });
      toast.success(res.message || "Payroll processed");
      setConfirming(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Payroll could not be processed"));
    } finally {
      setProcessing(false);
    }
  };
  const exportCsv = () => downloadCsv(`attendance-salary-${year}-${String(month).padStart(2, "0")}.csv`, [["Employee code", "Name", "Department", "Working days", "Employed days", "Present", "Late", "Half days", "Paid leave", "Unpaid leave", "No attendance", "Pending", "LOP adjustment", "LOP days", "Paid days", "Monthly gross", "Gross earned", "Deductions", "Net pay", "On hold", "Notes"], ...rows.map(r => {
    const a = r.attendance;
    return [r.emp_code, r.name, r.department, a.monthWorkingDays, a.employedWorkingDays, a.present, a.late, a.halfDays, a.paidLeave, a.unpaidLeave, a.absent, a.pendingLeave + a.pendingRegularization, a.lopAdjustment, a.lopDays, a.paidDays, r.pay?.monthlyGross ?? "", r.pay?.gross ?? "", r.pay?.totalDeductions ?? "", r.pay?.net ?? "", r.on_hold ? "Yes" : "", r.flags.map(f => f.label).join("; ")];
  })]);
  return <div className="space-y-5">
      {adjusting && <AdjustDialog row={adjusting} month={month} year={year} onClose={() => setAdjusting(null)} onSaved={replaceRow} />}
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b45309]">Payroll · Step 1 of 3</p>
          <h1 className="text-2xl font-black  text-[#e87500] mt-1">Attendance &amp; Salary</h1>
          <p className="text-sm text-slate-500 mt-1">Check each employee's attendance and the salary it produces, fix anything flagged, then process payroll.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
          <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"><ChevronLeft size={18} /></button>
          <span className="min-w-[150px] text-center font-bold  text-[#e87500] flex items-center justify-center gap-2"><CalendarDays size={16} className="text-[#e87500]" />{MONTHS[month - 1]} {year}</span>
          <button onClick={() => shiftMonth(1)} aria-label="Next month" className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"><ChevronRight size={18} /></button>
        </div>
      </div>
      {/* Run status */}
      {run && <div className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${locked ? "bg-slate-50 border-slate-200" : "bg-sky-50 border-sky-200"}`}>
          <p className="text-sm text-slate-700 flex items-center gap-2">
            {locked ? <Lock size={16} className="text-slate-500" /> : <CheckCircle2 size={16} className="text-sky-600" />}
            Payroll for {MONTHS[month - 1]} was processed on {String(run.processed_on || "").slice(0, 16)} — status <strong>{run.review_status}</strong>{locked ? " and locked. Unlock it from the Payroll page to make changes." : ". You can adjust and re-process until it is approved."}
          </p>
          <Link to="/dashboard/payroll" className="text-sm font-bold text-[#b45309] hover:underline inline-flex items-center gap-1">Review &amp; approve <ArrowRight size={14} /></Link>
        </div>}
      {/* KPIs */}
      {loading && !data ? <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div> : t && <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Kpi icon={<Users size={18} />} label="Employees" value={t.employees} sub={`${t.payable} payable${t.onHold ? ` · ${t.onHold} on hold` : ""}`} />
            <Kpi icon={<AlertTriangle size={18} />} label="Need attention" value={t.withIssues} sub={t.withoutSalary ? `${t.withoutSalary} without salary` : "flags to review"} tone={t.withIssues ? "text-orange-700" : " text-[#e87500]"} />
            <Kpi icon={<CalendarDays size={18} />} label="LOP days" value={num(t.lopDays)} sub={`${inr(t.lopAmount)} not paid`} tone={t.lopDays ? "text-rose-700" : " text-[#e87500]"} />
            <Kpi icon={<Wallet size={18} />} label="Gross payable" value={inr(t.gross)} sub={`− ${inr(t.deductions)} deductions`} />
            <Kpi icon={<Wallet size={18} />} label="Net payout" value={inr(t.net)} tone="text-[#b45309]" />
          </div>
          {blocking > 0 && <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span><strong>{blocking} employee(s)</strong> have leaves or regularizations still pending. Those days count as loss of pay until they are approved — approve them first, or adjust here.</span>
            </div>}
          {/* Filters + actions */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm h-10 bg-white border border-slate-200 rounded-xl px-3">
              <Search size={15} className="text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or code" aria-label="Search employees" className="flex-1 text-sm outline-none bg-transparent" />
            </label>
            <select value={dept} onChange={e => setDept(e.target.value)} aria-label="Department" className="h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm">
              <option value="">All departments</option>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
            <button onClick={() => setOnlyIssues(v => !v)} aria-pressed={onlyIssues} className={`h-10 px-3 rounded-xl border text-sm font-semibold flex items-center gap-2 ${onlyIssues ? "bg-orange-50 border-[#e87500] text-[#9a4a00]" : "bg-white border-slate-200 text-slate-700"}`}>
              <SlidersHorizontal size={15} /> Needs attention
            </button>
            <div className="flex-1" />
            <button onClick={exportCsv} className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 flex items-center gap-2"><Download size={15} /> Export</button>
            <button onClick={() => setConfirming(true)} disabled={locked || !t.payable} className="h-10 px-5 rounded-xl bg-[#e87500] hover:bg-[#e07000] text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">
              <Play size={15} /> {run ? "Re-process payroll" : "Process payroll"}
            </button>
          </div>
          <Legend />
          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-4 py-3">Employee</th>
                  <th scope="col" className="px-3 py-3">Work days</th>
                  <th scope="col" className="px-3 py-3">Present</th>
                  <th scope="col" className="px-3 py-3">Paid leave</th>
                  <th scope="col" className="px-3 py-3">LOP</th>
                  <th scope="col" className="px-3 py-3">Paid days</th>
                  <th scope="col" className="px-3 py-3">Monthly</th>
                  <th scope="col" className="px-3 py-3">Net pay</th>
                  <th scope="col" className="px-3 py-3">Flags</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(r => <EmployeeRow key={r.employee_id} row={r} open={openId === r.employee_id} locked={locked} onToggle={() => setOpenId(id => id === r.employee_id ? null : r.employee_id)} onAdjust={setAdjusting} />)}
                {!visible.length && <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">No employees match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </>}
      {/* Confirm processing */}
      {confirming && t && <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center px-4" onMouseDown={() => !processing && setConfirming(false)}>
          <div role="dialog" aria-modal="true" aria-label="Process payroll" onMouseDown={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold  text-[#e87500]">Process payroll for {MONTHS[month - 1]} {year}?</h2>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <Stat label="Payslips to generate" value={t.payable} />
              {t.onHold > 0 && <Stat label="On hold (payslip marked On Hold)" value={t.onHold} />}
              {t.withoutSalary > 0 && <Stat label="Skipped — no salary" value={t.withoutSalary} tone="text-rose-700" />}
              <Stat label="Total LOP days" value={num(t.lopDays)} />
              <Stat label="Net payout" value={inr(t.net)} tone="text-[#b45309]" />
            </div>
            {blocking > 0 && <p className="text-sm text-orange-700 flex gap-2"><PauseCircle size={16} className="shrink-0 mt-0.5" />{blocking} employee(s) still have pending approvals counted as LOP.</p>}
            <p className="text-xs text-slate-500">Next you can review, approve and lock the run, then export the bank file from the Payroll page. Re-processing before approval replaces these payslips.</p>
            <div className="flex gap-2">
              <button data-cancel-button onClick={() => setConfirming(false)} disabled={processing} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={process} disabled={processing} className="flex-1 h-10 rounded-xl bg-[#e87500] hover:bg-[#e07000] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {processing ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Process
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
export { AdminSalaryProcessing };
