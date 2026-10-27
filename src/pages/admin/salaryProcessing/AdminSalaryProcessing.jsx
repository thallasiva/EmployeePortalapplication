import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Download, Loader2, Lock, PauseCircle, Play, Search, SlidersHorizontal, Users, Wallet, X, ArrowRight } from "lucide-react";
import { getErrorMessage } from "../../../api/client";
import {
  getPayrollAttendanceSummary,
  runPayroll,
  savePayrollAttendanceAdjustment } from
"../../../api/payroll.api";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const num = (n) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 });

// Day-type colours for the attendance strip and legend.
const DAY_STYLE = {
  present: { bg: "#16a34a", label: "Present" },
  late: { bg: "#65a30d", label: "Late" },
  half_day: { bg: "#eab308", label: "Half day" },
  paid_leave: { bg: "#2563eb", label: "Paid leave" },
  unpaid_leave: { bg: "#dc2626", label: "Unpaid leave (LOP)" },
  absent: { bg: "#b91c1c", label: "Absent (LOP)" },
  pending_leave: { bg: "#f97316", label: "Leave pending" },
  pending_regularization: { bg: "#fb923c", label: "Regularization pending" },
  holiday: { bg: "#a855f7", label: "Holiday" },
  weekly_off: { bg: "#e2e8f0", label: "Weekly off" },
  upcoming: { bg: "#f1f5f9", label: "Upcoming" },
  not_employed: { bg: "#ffffff", label: "Not employed" }
};

const FLAG_TONE = {
  NO_SALARY: "bg-rose-50 text-rose-700 border-rose-200",
  NO_BANK: "bg-amber-50 text-amber-800 border-amber-200",
  PENDING_LEAVE: "bg-orange-50 text-orange-700 border-orange-200",
  PENDING_REGULARIZATION: "bg-orange-50 text-orange-700 border-orange-200",
  HIGH_ABSENCE: "bg-rose-50 text-rose-700 border-rose-200",
  ON_HOLD: "bg-slate-100 text-slate-700 border-slate-300",
  MONTH_NOT_OVER: "bg-sky-50 text-sky-700 border-sky-200",
  NEW_JOINER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  EXITING: "bg-violet-50 text-violet-700 border-violet-200"
};
const INFO_FLAGS = ["MONTH_NOT_OVER", "NEW_JOINER", "EXITING"];

function previousMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ---------- small pieces ---------- */

const Kpi = ({ icon, label, value, sub, tone = "text-slate-900" }) =>
<div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-xl font-black tabular-nums mt-0.5 ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>;


const Stat = ({ label, value, tone = "text-slate-800" }) =>
<div className="flex justify-between gap-3 py-1 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-semibold tabular-nums ${tone}`}>{value}</span>
  </div>;


function DayStrip({ days }) {
  return (
    <div className="flex flex-wrap gap-1" role="list" aria-label="Day-by-day attendance">
      {days.map((d) => {
        const st = DAY_STYLE[d.type] || DAY_STYLE.upcoming;
        const day = Number(d.date.slice(8));
        const dark = !["weekly_off", "upcoming", "not_employed"].includes(d.type);
        return (
          <div
            key={d.date}
            role="listitem"
            title={`${d.date} — ${st.label}${d.label ? `: ${d.label}` : ""}${d.lop ? ` · LOP ${d.lop}` : ""}${d.worked ? " · worked" : ""}`}
            className={`w-7 h-8 rounded-md flex flex-col items-center justify-center text-[10px] font-bold border ${dark ? "text-white border-transparent" : "text-slate-500 border-slate-200"}`}
            style={{ background: st.bg }}>
            {day}
            {d.lop ? <span className="text-[8px] leading-none opacity-90">−{d.lop}</span> : null}
          </div>);

      })}
    </div>);

}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {["present", "late", "half_day", "paid_leave", "unpaid_leave", "absent", "pending_leave", "holiday", "weekly_off"].map((k) =>
      <span key={k} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-3 h-3 rounded-sm border border-slate-200" style={{ background: DAY_STYLE[k].bg }} />{DAY_STYLE[k].label}
        </span>
      )}
    </div>);

}

/* ---------- adjustment dialog ---------- */

function AdjustDialog({ row, month, year, onClose, onSaved }) {
  const [lop, setLop] = useState(row.adjustment?.lop_adjustment ?? 0);
  const [hold, setHold] = useState(row.adjustment?.hold_salary ?? false);
  const [reason, setReason] = useState(row.adjustment?.reason ?? "");
  const [saving, setSaving] = useState(false);
  const a = row.attendance;
  const newLop = Math.min(a.employedWorkingDays, Math.max(0, a.computedLop + Number(lop || 0)));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async (e) => {
    e.preventDefault();
    if ((Number(lop) || hold) && reason.trim().length < 3) return toast.error("Please give a reason for the adjustment");
    setSaving(true);
    try {
      const res = await savePayrollAttendanceAdjustment(row.employee_id, {
        month, year, lop_adjustment: Number(lop) || 0, hold_salary: hold, reason: reason.trim() || "Cleared"
      });
      toast.success("Adjustment saved");
      onSaved(res.employee);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save adjustment"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center px-4" onMouseDown={onClose}>
      <form role="dialog" aria-modal="true" aria-label="Adjust attendance" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Adjust attendance</h2>
            <p className="text-sm text-slate-500">{row.name} · {MONTHS[month - 1]} {year}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><X size={18} /></button>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <Stat label="LOP from attendance" value={`${num(a.computedLop)} day(s)`} />
          <Stat label="After adjustment" value={`${num(newLop)} day(s)`} tone="text-[#b45309]" />
        </div>
        <div>
          <label htmlFor="adj-lop" className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">LOP adjustment (days)</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLop((v) => Math.round((Number(v) - 0.5) * 10) / 10)} className="w-10 h-10 rounded-xl border border-slate-200 font-bold">−</button>
            <input id="adj-lop" type="number" step="0.5" min="-31" max="31" value={lop} onChange={(e) => setLop(e.target.value)}
            className="flex-1 h-10 border border-slate-200 rounded-xl px-3 text-center font-bold tabular-nums outline-none focus:border-[#f18200]" />
            <button type="button" onClick={() => setLop((v) => Math.round((Number(v) + 0.5) * 10) / 10)} className="w-10 h-10 rounded-xl border border-slate-200 font-bold">+</button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Use a minus value to waive LOP (e.g. −1 for an approved client visit), plus to add LOP.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={hold} onChange={(e) => setHold(e.target.checked)} className="w-4 h-4 accent-[#f18200]" />
          Hold this employee's salary for the month
        </label>
        <div>
          <label htmlFor="adj-reason" className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Reason (kept in the audit trail)</label>
          <textarea id="adj-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#f18200] resize-none" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl bg-[#f18200] hover:bg-[#e07000] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 size={15} className="animate-spin" />} Save
          </button>
        </div>
      </form>
    </div>);

}

/* ---------- employee row ---------- */

function EmployeeRow({ row, open, onToggle, onAdjust, locked }) {
  const a = row.attendance;
  const p = row.pay;
  const issues = row.flags.filter((f) => !INFO_FLAGS.includes(f.code));
  return (
    <>
      <tr className={`border-t border-slate-100 ${open ? "bg-orange-50/30" : "hover:bg-slate-50/60"}`}>
        <td className="px-4 py-3">
          <button onClick={onToggle} aria-expanded={open} className="flex items-center gap-2 text-left">
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            <span>
              <span className="block text-sm font-bold text-slate-900">{row.name}</span>
              <span className="block text-xs text-slate-500">{[row.emp_code, row.department].filter(Boolean).join(" · ")}</span>
            </span>
          </button>
        </td>
        <td className="px-3 py-3 text-sm tabular-nums text-slate-700">{num(a.employedWorkingDays)}<span className="text-slate-400">/{a.monthWorkingDays}</span></td>
        <td className="px-3 py-3 text-sm tabular-nums">{num(a.present)}{a.late ? <span className="ml-1 text-xs text-lime-700">({a.late} late)</span> : null}</td>
        <td className="px-3 py-3 text-sm tabular-nums">{num(a.paidLeave)}</td>
        <td className="px-3 py-3 text-sm tabular-nums font-bold">
          <span className={a.lopDays > 0 ? "text-rose-700" : "text-slate-400"}>{num(a.lopDays)}</span>
          {a.lopAdjustment ? <span className="ml-1 text-[11px] font-semibold text-[#b45309]">({a.lopAdjustment > 0 ? "+" : ""}{a.lopAdjustment} adj)</span> : null}
        </td>
        <td className="px-3 py-3 text-sm tabular-nums font-semibold">{num(a.paidDays)}</td>
        <td className="px-3 py-3 text-sm tabular-nums text-slate-500">{p ? inr(p.monthlyGross) : "—"}</td>
        <td className="px-3 py-3 text-sm tabular-nums font-bold text-slate-900">{p ? inr(p.net) : <span className="text-rose-700 font-semibold">No salary</span>}</td>
        <td className="px-3 py-3">
          <div className="flex flex-wrap gap-1">
            {row.on_hold && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-300">On hold</span>}
            {issues.filter((f) => f.code !== "ON_HOLD").slice(0, 2).map((f) =>
            <span key={f.code} title={f.label} className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${FLAG_TONE[f.code] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                {f.code.replace(/_/g, " ").toLowerCase()}
              </span>
            )}
            {issues.length > 2 && <span className="text-[11px] text-slate-500">+{issues.length - 2}</span>}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => onAdjust(row)} disabled={locked} className="text-xs font-bold text-[#b45309] hover:underline disabled:text-slate-300 disabled:no-underline">Adjust</button>
        </td>
      </tr>
      {open &&
      <tr className="bg-orange-50/30">
          <td colSpan={10} className="px-4 pb-5 pt-1">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <section className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Day-by-day attendance</h3>
                  <span className="text-xs text-slate-500">Works {row.work_days.map((d) => d.slice(0, 1).toUpperCase() + d.slice(1)).join(", ")}</span>
                </div>
                {row.days ? <DayStrip days={row.days} /> : null}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6">
                  <Stat label="Present" value={num(a.present)} />
                  <Stat label="Late marks" value={a.late} />
                  <Stat label="Half days" value={a.halfDays} />
                  <Stat label="Paid leave" value={num(a.paidLeave)} />
                  <Stat label="Unpaid leave" value={num(a.unpaidLeave)} tone={a.unpaidLeave ? "text-rose-700" : undefined} />
                  <Stat label="No attendance" value={num(a.absent)} tone={a.absent ? "text-rose-700" : undefined} />
                  <Stat label="Pending approvals" value={num(a.pendingLeave + a.pendingRegularization)} tone={a.pendingLeave + a.pendingRegularization ? "text-orange-700" : undefined} />
                  <Stat label="Holidays / offs" value={`${a.holidays} / ${a.weeklyOffs}`} />
                </div>
                {row.flags.length > 0 &&
              <ul className="space-y-1">
                    {row.flags.map((f) =>
                <li key={f.code} className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${FLAG_TONE[f.code] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{f.label}</li>
                )}
                  </ul>
              }
                {row.adjustment &&
              <p className="text-xs text-[#9a4a00] bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5">
                    Admin adjustment: {row.adjustment.lop_adjustment ? `${row.adjustment.lop_adjustment > 0 ? "+" : ""}${row.adjustment.lop_adjustment} LOP day(s)` : ""}
                    {row.adjustment.hold_salary ? " · salary on hold" : ""} — “{row.adjustment.reason}”
                  </p>
              }
              </section>
              <section className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Salary for {num(a.paidDays)} of {a.monthWorkingDays} days</h3>
                {!p ? <p className="text-sm text-rose-700">Assign a salary structure before processing this employee.</p> :
              <>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-2">Earnings</p>
                    {p.earnings.map((e) =>
                <Stat key={e.code + e.label} label={e.label} value={
                <span>{e.monthly && e.amount !== e.monthly ? <s className="text-slate-300 font-normal mr-1.5">{inr(e.monthly)}</s> : null}{inr(e.amount)}</span>
                } />
                )}
                    <div className="border-t border-slate-100 mt-1"><Stat label="Gross" value={inr(p.gross)} tone="text-slate-900" /></div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-2">Deductions</p>
                    {p.deductions.map((d) => <Stat key={d.code + d.label} label={d.label} value={`− ${inr(d.amount)}`} tone="text-rose-700" />)}
                    {p.lopDeduction > 0 && <Stat label="Loss of pay (already in gross)" value={inr(p.lopDeduction)} tone="text-slate-400" />}
                    <div className="border-t border-slate-200 mt-2 pt-1"><Stat label="Net pay" value={inr(p.net)} tone="text-[#b45309] text-base" /></div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      {p.source === "structure" ? `Structure: ${p.structureName || "assigned"}` : "From base salary (50% basic, 20% HRA, 30% special)"} · per day {inr(p.perDayRate)}
                    </p>
                  </>
              }
              </section>
            </div>
          </td>
        </tr>
      }
    </>);

}

/* ---------- page ---------- */

export default function AdminSalaryProcessing() {
  const [{ month, year }, setPeriod] = useState(previousMonth);
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
      setData(await getPayrollAttendanceSummary({ month, year }));
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load attendance"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {load();}, [load]);

  const shiftMonth = (delta) => setPeriod(({ month: m, year: y }) => {
    const d = new Date(y, m - 1 + delta, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  const rows = data?.employees || [];
  const departments = useMemo(() => [...new Set(rows.map((r) => r.department).filter(Boolean))].sort(), [rows]);
  const visible = rows.filter((r) =>
  (!search || `${r.name} ${r.emp_code}`.toLowerCase().includes(search.toLowerCase())) && (
  !dept || r.department === dept) && (
  !onlyIssues || r.flags.some((f) => !INFO_FLAGS.includes(f.code))));

  const run = data?.run;
  const locked = Boolean(run?.is_locked) || run?.review_status === "APPROVED";
  const t = data?.totals;
  const blocking = rows.filter((r) => r.flags.some((f) => ["PENDING_LEAVE", "PENDING_REGULARIZATION"].includes(f.code))).length;

  const replaceRow = (updated) => {
    if (!updated) return load();
    setData((prev) => {
      const employees = prev.employees.map((r) => r.employee_id === updated.employee_id ? updated : r);
      const payable = employees.filter((r) => r.pay && !r.on_hold);
      return {
        ...prev, employees,
        totals: {
          ...prev.totals,
          onHold: employees.filter((r) => r.on_hold).length,
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
      const res = await runPayroll({ month, year });
      toast.success(res.message || "Payroll processed");
      setConfirming(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Payroll could not be processed"));
    } finally {
      setProcessing(false);
    }
  };

  const exportCsv = () => downloadCsv(`attendance-salary-${year}-${String(month).padStart(2, "0")}.csv`, [
  ["Employee code", "Name", "Department", "Working days", "Employed days", "Present", "Late", "Half days", "Paid leave", "Unpaid leave", "No attendance", "Pending", "LOP adjustment", "LOP days", "Paid days", "Monthly gross", "Gross earned", "Deductions", "Net pay", "On hold", "Notes"],
  ...rows.map((r) => {
    const a = r.attendance;
    return [r.emp_code, r.name, r.department, a.monthWorkingDays, a.employedWorkingDays, a.present, a.late, a.halfDays, a.paidLeave, a.unpaidLeave, a.absent,
    a.pendingLeave + a.pendingRegularization, a.lopAdjustment, a.lopDays, a.paidDays, r.pay?.monthlyGross ?? "", r.pay?.gross ?? "", r.pay?.totalDeductions ?? "", r.pay?.net ?? "",
    r.on_hold ? "Yes" : "", r.flags.map((f) => f.label).join("; ")];
  })]
  );

  return (
    <div className="space-y-5">
      {adjusting && <AdjustDialog row={adjusting} month={month} year={year} onClose={() => setAdjusting(null)} onSaved={replaceRow} />}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b45309]">Payroll · Step 1 of 3</p>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Attendance &amp; Salary</h1>
          <p className="text-sm text-slate-500 mt-1">Check each employee's attendance and the salary it produces, fix anything flagged, then process payroll.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
          <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"><ChevronLeft size={18} /></button>
          <span className="min-w-[150px] text-center font-bold text-slate-900 flex items-center justify-center gap-2"><CalendarDays size={16} className="text-[#f18200]" />{MONTHS[month - 1]} {year}</span>
          <button onClick={() => shiftMonth(1)} aria-label="Next month" className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* Run status */}
      {run &&
      <div className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${locked ? "bg-slate-50 border-slate-200" : "bg-sky-50 border-sky-200"}`}>
          <p className="text-sm text-slate-700 flex items-center gap-2">
            {locked ? <Lock size={16} className="text-slate-500" /> : <CheckCircle2 size={16} className="text-sky-600" />}
            Payroll for {MONTHS[month - 1]} was processed on {String(run.processed_on || "").slice(0, 16)} — status <strong>{run.review_status}</strong>{locked ? " and locked. Unlock it from the Payroll page to make changes." : ". You can adjust and re-process until it is approved."}
          </p>
          <Link to="/dashboard/payroll" className="text-sm font-bold text-[#b45309] hover:underline inline-flex items-center gap-1">Review &amp; approve <ArrowRight size={14} /></Link>
        </div>
      }

      {/* KPIs */}
      {loading && !data ?
      <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div> :
      t &&
      <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Kpi icon={<Users size={18} />} label="Employees" value={t.employees} sub={`${t.payable} payable${t.onHold ? ` · ${t.onHold} on hold` : ""}`} />
            <Kpi icon={<AlertTriangle size={18} />} label="Need attention" value={t.withIssues} sub={t.withoutSalary ? `${t.withoutSalary} without salary` : "flags to review"} tone={t.withIssues ? "text-orange-700" : "text-slate-900"} />
            <Kpi icon={<CalendarDays size={18} />} label="LOP days" value={num(t.lopDays)} sub={`${inr(t.lopAmount)} not paid`} tone={t.lopDays ? "text-rose-700" : "text-slate-900"} />
            <Kpi icon={<Wallet size={18} />} label="Gross payable" value={inr(t.gross)} sub={`− ${inr(t.deductions)} deductions`} />
            <Kpi icon={<Wallet size={18} />} label="Net payout" value={inr(t.net)} tone="text-[#b45309]" />
          </div>

          {blocking > 0 &&
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span><strong>{blocking} employee(s)</strong> have leaves or regularizations still pending. Those days count as loss of pay until they are approved — approve them first, or adjust here.</span>
            </div>
        }

          {/* Filters + actions */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm h-10 bg-white border border-slate-200 rounded-xl px-3">
              <Search size={15} className="text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or code" aria-label="Search employees" className="flex-1 text-sm outline-none bg-transparent" />
            </label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department" className="h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm">
              <option value="">All departments</option>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
            <button onClick={() => setOnlyIssues((v) => !v)} aria-pressed={onlyIssues}
          className={`h-10 px-3 rounded-xl border text-sm font-semibold flex items-center gap-2 ${onlyIssues ? "bg-orange-50 border-[#f18200] text-[#9a4a00]" : "bg-white border-slate-200 text-slate-700"}`}>
              <SlidersHorizontal size={15} /> Needs attention
            </button>
            <div className="flex-1" />
            <button onClick={exportCsv} className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 flex items-center gap-2"><Download size={15} /> Export</button>
            <button onClick={() => setConfirming(true)} disabled={locked || !t.payable}
          className="h-10 px-5 rounded-xl bg-[#f18200] hover:bg-[#e07000] text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">
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
                {visible.map((r) =>
              <EmployeeRow key={r.employee_id} row={r} open={openId === r.employee_id} locked={locked}
              onToggle={() => setOpenId((id) => id === r.employee_id ? null : r.employee_id)} onAdjust={setAdjusting} />
              )}
                {!visible.length &&
              <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">No employees match these filters.</td></tr>
              }
              </tbody>
            </table>
          </div>
        </>
      }

      {/* Confirm processing */}
      {confirming && t &&
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center px-4" onMouseDown={() => !processing && setConfirming(false)}>
          <div role="dialog" aria-modal="true" aria-label="Process payroll" onMouseDown={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Process payroll for {MONTHS[month - 1]} {year}?</h2>
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
              <button onClick={() => setConfirming(false)} disabled={processing} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={process} disabled={processing} className="flex-1 h-10 rounded-xl bg-[#f18200] hover:bg-[#e07000] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {processing ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Process
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}
