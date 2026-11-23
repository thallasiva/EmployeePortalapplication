import React from "react";
import { ChevronDown } from "lucide-react";
import { inr, num, FLAG_TONE, INFO_FLAGS } from "./shared";
import { Stat } from "./Stat";
import { DayStrip } from "./DayStrip";
/* ---------- employee row ---------- */
function EmployeeRow({
  row,
  open,
  onToggle,
  onAdjust,
  locked
}) {
  const a = row.attendance;
  const p = row.pay;
  const issues = row.flags.filter(f => !INFO_FLAGS.includes(f.code));
  return <>
      <tr className={`border-t border-slate-100 ${open ? "bg-orange-50/30" : "hover:bg-slate-50/60"}`}>
        <td className="px-4 py-3">
          <button onClick={onToggle} aria-expanded={open} className="flex items-center gap-2 text-left">
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            <span>
              <span className="block text-sm font-bold  text-[#e87500]">{row.name}</span>
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
        <td className="px-3 py-3 text-sm tabular-nums font-bold  text-[#e87500]">{p ? inr(p.net) : <span className="text-rose-700 font-semibold">No salary</span>}</td>
        <td className="px-3 py-3">
          <div className="flex flex-wrap gap-1">
            {row.on_hold && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-300">On hold</span>}
            {issues.filter(f => f.code !== "ON_HOLD").slice(0, 2).map(f => <span key={f.code} title={f.label} className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${FLAG_TONE[f.code] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                {f.code.replace(/_/g, " ").toLowerCase()}
              </span>)}
            {issues.length > 2 && <span className="text-[11px] text-slate-500">+{issues.length - 2}</span>}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => onAdjust(row)} disabled={locked} className="text-xs font-bold text-[#b45309] hover:underline disabled:text-slate-300 disabled:no-underline">Adjust</button>
        </td>
      </tr>
      {open && <tr className="bg-orange-50/30">
          <td colSpan={10} className="px-4 pb-5 pt-1">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <section className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold  text-[#e87500]">Day-by-day attendance</h3>
                  <span className="text-xs text-slate-500">Works {row.work_days.map(d => d.slice(0, 1).toUpperCase() + d.slice(1)).join(", ")}</span>
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
                {row.flags.length > 0 && <ul className="space-y-1">
                    {row.flags.map(f => <li key={f.code} className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${FLAG_TONE[f.code] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{f.label}</li>)}
                  </ul>}
                {row.adjustment && <p className="text-xs text-[#9a4a00] bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5">
                    Admin adjustment: {row.adjustment.lop_adjustment ? `${row.adjustment.lop_adjustment > 0 ? "+" : ""}${row.adjustment.lop_adjustment} LOP day(s)` : ""}
                    {row.adjustment.hold_salary ? " · salary on hold" : ""} — “{row.adjustment.reason}”
                  </p>}
              </section>
              <section className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold  text-[#e87500] mb-2">Salary for {num(a.paidDays)} of {a.monthWorkingDays} days</h3>
                {!p ? <p className="text-sm text-rose-700">Assign a salary structure before processing this employee.</p> : <>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-2">Earnings</p>
                    {p.earnings.map(e => <Stat key={e.code + e.label} label={e.label} value={<span>{e.monthly && e.amount !== e.monthly ? <s className="text-slate-300 font-normal mr-1.5">{inr(e.monthly)}</s> : null}{inr(e.amount)}</span>} />)}
                    <div className="border-t border-slate-100 mt-1"><Stat label="Gross" value={inr(p.gross)} tone=" text-[#e87500]" /></div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-2">Deductions</p>
                    {p.deductions.map(d => <Stat key={d.code + d.label} label={d.label} value={`− ${inr(d.amount)}`} tone="text-rose-700" />)}
                    {p.lopDeduction > 0 && <Stat label="Loss of pay (already in gross)" value={inr(p.lopDeduction)} tone="text-slate-400" />}
                    <div className="border-t border-slate-200 mt-2 pt-1"><Stat label="Net pay" value={inr(p.net)} tone="text-[#b45309] text-base" /></div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      {p.source === "structure" ? `Structure: ${p.structureName || "assigned"}` : "From base salary (50% basic, 20% HRA, 30% special)"} · per day {inr(p.perDayRate)}
                    </p>
                  </>}
              </section>
            </div>
          </td>
        </tr>}
    </>;
}
/* ---------- page ---------- */
export { EmployeeRow };
