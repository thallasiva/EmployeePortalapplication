import React, { useCallback, useEffect, useState } from "react";
import { Lock, ChevronLeft, ChevronRight, Play, Loader2,
Users, TrendingUp, TrendingDown, DollarSign, CheckCircle2,
Briefcase, Shield, Landmark } from "lucide-react";
import { listPayslips, generateAllPayslips, listPayrollRuns } from "../../api/payroll.api";
import { listEmployees } from "../../api/employee.api";
import { successToast, errorToast } from "../../utils/ToastControllers";import { cssClass, joinClasses } from "../../utils/classStyles";

const BRAND = "#f18200";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ── Number formatting ──────────────────────────────────────────────────────── */
function fmtINR(n, short = false) {
  if (!n && n !== 0) return "—";
  const abs = Math.abs(Number(n));
  if (short) {
    if (abs >= 10000000) return "₹" + (abs / 10000000).toFixed(1) + "Cr";
    if (abs >= 100000) return "₹" + (abs / 100000).toFixed(1) + "L";
    if (abs >= 1000) return "₹" + (abs / 1000).toFixed(1) + "K";
    return "₹" + abs;
  }
  if (abs >= 10000000) return "₹ " + (abs / 10000000).toFixed(2) + " Cr";
  if (abs >= 100000) return "₹ " + (abs / 100000).toFixed(2) + " L";
  return "₹ " + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function pct(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.round(part / total * 100));
}

function buildMonthList() {
  const now = new Date();
  const list = [];
  for (let i = -3; i <= 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    list.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return list;
}

/* ── Multi-segment donut (pure SVG) ─────────────────────────────────────────── */
function MultiDonut({ segments, size = 180, thickness = 26 }) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pctVal = seg.value / total * 100;
    const dash = pctVal / 100 * circ;
    const o = -(offset / 100) * circ;
    offset += pctVal;
    return { ...seg, dash, dashGap: circ - dash, o };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
      {/* Segments */}
      {arcs.map((seg, i) => seg.value > 0 &&
      <circle key={i} cx={cx} cy={cy} r={r} fill="none"
      stroke={seg.color} strokeWidth={thickness}
      strokeLinecap="butt"
      transform={`rotate(-90 ${cx} ${cy})`} className={cssClass(
        {
          strokeDasharray: `${seg.dash} ${seg.dashGap}`,
          strokeDashoffset: seg.o
        })} />
      )}
      {/* Center hole */}
      <circle cx={cx} cy={cy} r={r - thickness / 2 - 2} fill="#fff" />
    </svg>);

}

/* ── Horizontal progress bar ─────────────────────────────────────────────────── */
function ProgressRow({ label, value, total, color, sub }) {
  const p = pct(value, total);
  return (
    <div className={cssClass({ marginBottom: 12 })}>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", marginBottom: 5 })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 7 })}>
          <div className={cssClass({ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 })} />
          <span className={cssClass({ fontSize: 12, color: "#4b5563", fontWeight: 500 })}>{label}</span>
          {sub && <span className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{sub}</span>}
        </div>
        <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#1a1a1a" })}>{fmtINR(value)}</span>
      </div>
      <div className={cssClass({ height: 7, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" })}>
        <div className={cssClass({
          height: "100%", borderRadius: 4,
          background: color,
          width: `${p}%`,
          transition: "width .6s cubic-bezier(.4,0,.2,1)"
        })} />
      </div>
    </div>);

}

/* ── Toggle switch ───────────────────────────────────────────────────────────── */
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} className={cssClass({
      width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative",
      background: on ? BRAND : "#d1d5db", transition: "background .2s", flexShrink: 0
    })}>
      <div className={cssClass({
        position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%",
        background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px #0003",
        left: on ? 22 : 2
      })} />
    </div>);

}

/* ── Mini KPI chip ───────────────────────────────────────────────────────────── */
function KpiChip({ icon, label, value, accent }) {
  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #f0f0f0", borderRadius: 10,
      padding: "14px 16px", boxShadow: "0 1px 3px #0000000a",
      display: "flex", alignItems: "center", gap: 12
    })}>
      <div className={cssClass({
        width: 40, height: 40, borderRadius: 9, flexShrink: 0,
        background: (accent || BRAND) + "15",
        display: "flex", alignItems: "center", justifyContent: "center"
      })}>
        {icon}
      </div>
      <div>
        <div className={cssClass({ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 })}>{label}</div>
        <div className={cssClass({ fontSize: 18, fontWeight: 800, color: accent || "#111827", lineHeight: 1.2, marginTop: 2 })}>{value}</div>
      </div>
    </div>);

}

/* ══════════════════════════════════════════════════════════════════════════════
   PAYOUT DETAILS PANEL
══════════════════════════════════════════════════════════════════════════════ */
function PayoutDetailsPanel({ payslips }) {
  // ── Aggregate totals ────────────────────────────────────────────────────────
  let totalBasic = 0,totalHRA = 0,totalAllowances = 0;
  let totalPF = 0,totalESI = 0,totalPT = 0,totalTDS = 0;
  let totalGross = 0,totalNet = 0,totalDeductions = 0;

  payslips.forEach((p) => {
    const basic = Number(p.basic || 0);
    const hra = Number(p.hra || 0);
    const allowances = Number(p.allowances || 0);
    const gross = Number(p.gross_earnings || p.gross || 0);
    const ded = Number(p.deductions || 0);
    const net = Number(p.net_pay || p.net || 0);

    totalBasic += basic;
    totalHRA += hra;
    totalAllowances += allowances;
    totalGross += gross;
    totalDeductions += ded;
    totalNet += net;

    // Compute deduction breakdown
    const pfBase = Math.min(basic, 15000);
    const pf = +(pfBase * 0.12).toFixed(2);
    const esi = gross <= 21000 ? +(gross * 0.0075).toFixed(2) : 0;
    const pt = gross < 7500 ? 0 : gross < 10000 ? 175 : gross < 15000 ? 150 : 200;
    const tds = Math.max(0, ded - pf - esi - pt);
    totalPF += pf;
    totalESI += esi;
    totalPT += pt;
    totalTDS += tds;
  });

  const earnSegs = [
  { label: "Basic", value: totalBasic, color: "#f18200" },
  { label: "HRA", value: totalHRA, color: "#fb923c" },
  { label: "Allowances", value: totalAllowances, color: "#fbbf24" }];

  const dedSegs = [
  { label: "PF (12%)", value: totalPF, color: "#6366f1" },
  { label: "ESI (0.75%)", value: totalESI, color: "#8b5cf6" },
  { label: "Prof. Tax", value: totalPT, color: "#a78bfa" },
  { label: "TDS / Income Tax", value: totalTDS, color: "#c4b5fd" }];


  const netRatio = pct(totalNet, totalGross);
  const dedRatio = pct(totalDeductions, totalGross);
  const count = payslips.length;

  // For the main ring: show earnings components then deductions
  const ringSegs = [
  ...earnSegs,
  { label: "Deductions", value: totalDeductions, color: "#e0e7ff" }];


  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e9eaec", borderRadius: 14,
      padding: "24px 26px", boxShadow: "0 2px 8px #0000000d"
    })}>
      {/* Panel header */}
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 })}>
        <div>
          <div className={cssClass({ fontWeight: 800, fontSize: 16, color: "#111827" })}>Payout Details</div>
          <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginTop: 2 })}>{count} employees processed</div>
        </div>
        <div className={cssClass({
          background: "#fff8f0", border: `1px solid ${BRAND}30`,
          borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: BRAND
        })}>
          {netRatio}% Net Ratio
        </div>
      </div>

      {/* ── Two-column: donut + breakdown ───────────────────────────────────── */}
      <div className={cssClass({ display: "flex", gap: 28, alignItems: "flex-start", marginBottom: 22 })}>

        {/* Donut */}
        <div className={cssClass({ flexShrink: 0, position: "relative" })}>
          <MultiDonut segments={ringSegs} size={180} thickness={28} />
          <div className={cssClass({
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none"
          })}>
            <div className={cssClass({ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 })}>Net Pay</div>
            <div className={cssClass({ fontSize: 17, fontWeight: 900, color: "#111827", lineHeight: 1.1, marginTop: 1 })}>
              {fmtINR(totalNet, true)}
            </div>
            <div className={cssClass({ fontSize: 10, color: "#9ca3af", marginTop: 2 })}>of {fmtINR(totalGross, true)}</div>
          </div>
        </div>

        {/* Donut legend + totals */}
        <div className={cssClass({ flex: 1 })}>
          {/* Gross / Net / Ded tiles */}
          {[
          { label: "Gross Earnings", value: totalGross, color: BRAND, bg: "#fff8f0" },
          { label: "Total Net Pay", value: totalNet, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Total Deductions", value: totalDeductions, color: "#dc2626", bg: "#fff1f2" }].
          map((t) =>
          <div key={t.label} className={cssClass({
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: t.bg, borderRadius: 8, padding: "9px 12px", marginBottom: 7
          })}>
              <span className={cssClass({ fontSize: 12, color: "#6b7280", fontWeight: 500 })}>{t.label}</span>
              <span className={cssClass({ fontSize: 14, fontWeight: 800, color: t.color })}>{fmtINR(t.value)}</span>
            </div>
          )}

          {/* Ratio bar */}
          <div className={cssClass({ marginTop: 12 })}>
            <div className={cssClass({ fontSize: 11, color: "#9ca3af", marginBottom: 5, fontWeight: 600 })}>
              Gross split — Net vs Deductions
            </div>
            <div className={cssClass({ height: 10, background: "#f1f5f9", borderRadius: 6, overflow: "hidden", display: "flex" })}>
              <div className={cssClass({ width: `${netRatio}%`, background: "linear-gradient(90deg,#f18200,#fb923c)", transition: "width .5s", borderRadius: "6px 0 0 6px" })} />
              <div className={cssClass({ width: `${dedRatio}%`, background: "linear-gradient(90deg,#6366f1,#a78bfa)", transition: "width .5s" })} />
            </div>
            <div className={cssClass({ display: "flex", justifyContent: "space-between", marginTop: 4 })}>
              <span className={cssClass({ fontSize: 10, color: BRAND, fontWeight: 700 })}>Net {netRatio}%</span>
              <span className={cssClass({ fontSize: 10, color: "#6366f1", fontWeight: 700 })}>Ded {dedRatio}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className={cssClass({ borderTop: "1px dashed #f0f0f0", margin: "4px 0 20px" })} />

      {/* ── Earnings breakdown ───────────────────────────────────────────────── */}
      <div className={cssClass({ marginBottom: 18 })}>
        <div className={cssClass({
          display: "flex", alignItems: "center", gap: 6, marginBottom: 12
        })}>
          <div className={cssClass({ width: 3, height: 14, background: BRAND, borderRadius: 2 })} />
          <span className={cssClass({ fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: .5 })}>
            Earnings Breakdown
          </span>
        </div>
        {earnSegs.map((s) =>
        <ProgressRow key={s.label} label={s.label} value={s.value} total={totalGross} color={s.color}
        sub={`${pct(s.value, totalGross)}%`} />
        )}
      </div>

      {/* ── Deductions breakdown ─────────────────────────────────────────────── */}
      <div>
        <div className={cssClass({
          display: "flex", alignItems: "center", gap: 6, marginBottom: 12
        })}>
          <div className={cssClass({ width: 3, height: 14, background: "#6366f1", borderRadius: 2 })} />
          <span className={cssClass({ fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: .5 })}>
            Deductions Breakdown
          </span>
        </div>
        {dedSegs.map((s) => s.value > 0 &&
        <ProgressRow key={s.label} label={s.label} value={s.value} total={totalDeductions} color={s.color}
        sub={`${pct(s.value, totalDeductions)}%`} />
        )}
        {totalDeductions === 0 &&
        <div className={cssClass({ fontSize: 13, color: "#aaa", textAlign: "center", padding: "12px 0" })}>No deduction data</div>
        }
      </div>

      {/* ── Per-employee averages ────────────────────────────────────────────── */}
      {count > 0 &&
      <>
          <div className={cssClass({ borderTop: "1px dashed #f0f0f0", margin: "18px 0 14px" })} />
          <div className={cssClass({ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 })}>
            Per Employee Avg
          </div>
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 })}>
            {[
          { label: "Avg Gross", value: fmtINR(Math.round(totalGross / count), true), color: BRAND },
          { label: "Avg Net", value: fmtINR(Math.round(totalNet / count), true), color: "#16a34a" },
          { label: "Avg Ded", value: fmtINR(Math.round(totalDeductions / count), true), color: "#6366f1" }].
          map((a) =>
          <div key={a.label} className={cssClass({
            background: "#fafafa", borderRadius: 8, padding: "10px 12px",
            border: "1px solid #f0f0f0", textAlign: "center"
          })}>
                <div className={cssClass({ fontSize: 15, fontWeight: 800, color: a.color })}>{a.value}</div>
                <div className={cssClass({ fontSize: 10, color: "#9ca3af", marginTop: 2, fontWeight: 500 })}>{a.label}</div>
              </div>
          )}
          </div>
        </>
      }
    </div>);

}

/* ══════════════════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════════════════ */
export default function AdminPayrollOverview() {
  const now = new Date();
  const months = buildMonthList();
  const [selIdx, setSelIdx] = useState(3);
  const [scroll, setScroll] = useState(0);
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [controls, setControls] = useState({
    payrollInputs: false,
    employeeView: false,
    itStatementView: false,
    payroll: false
  });

  const selected = months[selIdx];
  const VISIBLE = 9;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ps, emps, rs] = await Promise.all([
      listPayslips({ month: selected.month, year: selected.year, limit: 500 }),
      listEmployees({ status: "Active", limit: 500 }),
      listPayrollRuns({ year: selected.year, limit: 100 }).catch(() => ({ data: [] }))]
      );
      setPayslips(ps.data || []);
      setEmployees(emps.data || []);
      setRuns(rs.data || []);
    } catch {} finally
    {setLoading(false);}
  }, [selected.month, selected.year]);

  useEffect(() => {load();}, [load]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const gross = payslips.reduce((s, p) => s + Number(p.gross_earnings || p.gross || 0), 0);
  const deductions = payslips.reduce((s, p) => s + Number(p.deductions || 0), 0);
  const net = payslips.reduce((s, p) => s + Number(p.net_pay || p.net || 0), 0);
  const totalEmp = employees.length;

  const additions = employees.filter((e) => {
    if (!e.date_of_joining) return false;
    const j = new Date(e.date_of_joining);
    return j.getMonth() + 1 === selected.month && j.getFullYear() === selected.year;
  }).length;
  const separations = employees.filter((e) => {
    const d = e.date_of_leaving || e.last_working_day;
    if (!d) return false;
    const dt = new Date(d);
    return dt.getMonth() + 1 === selected.month && dt.getFullYear() === selected.year;
  }).length;

  const processedSet = new Set(runs.map((r) => `${r.month}-${r.year}`));
  const isProcessed = (m, y) => processedSet.has(`${m}-${y}`);
  const isFuture = (m, y) => new Date(y, m - 1, 1) > new Date(now.getFullYear(), now.getMonth(), 1);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await generateAllPayslips({ month: selected.month, year: selected.year });
      successToast(`Payroll processed for ${MONTHS[selected.month - 1]} ${selected.year}`);
      load();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Payroll processing failed");
    } finally {setProcessing(false);}
  };

  const visibleMonths = months.slice(scroll, scroll + VISIBLE);
  const selLabel = `${MONTHS[selected.month - 1]} ${selected.year}`;

  return (
    <div className={cssClass({ padding: "28px 32px", fontFamily: "Inter, system-ui, sans-serif", background: "#f8f9fb", minHeight: "100vh" })}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 })}>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" })}>Payroll Overview</h1>
          <p className={cssClass({ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" })}>
            Process and manage monthly payroll — {selLabel}
          </p>
        </div>
        <button onClick={handleProcess}
        disabled={processing || isFuture(selected.month, selected.year)} className={cssClass(
          {
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 24px", background: BRAND, color: "#fff",
            border: "none", borderRadius: 9, cursor: "pointer",
            fontWeight: 700, fontSize: 14, boxShadow: `0 2px 10px ${BRAND}55`,
            opacity: processing || isFuture(selected.month, selected.year) ? .6 : 1
          })}>
          {processing ?
          <><Loader2 size={15} className={cssClass({ animation: "spin 1s linear infinite" })} /> Processing…</> :
          <><Play size={14} fill="#fff" /> Process Payroll</>}
        </button>
      </div>

      {/* ── Month timeline ───────────────────────────────────────────────────── */}
      <div className={cssClass({
        background: "#fff", border: "1px solid #e9eaec", borderRadius: 12,
        padding: "14px 16px", marginBottom: 22, boxShadow: "0 1px 4px #0000000a"
      })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
          <button onClick={() => setScroll((s) => Math.max(0, s - 1))} disabled={scroll === 0} className={cssClass(
            { background: "none", border: "1px solid #e5e7eb", borderRadius: 6,
              cursor: scroll === 0 ? "not-allowed" : "pointer", color: scroll === 0 ? "#d1d5db" : "#374151",
              padding: "6px 8px", display: "flex" })}>
            <ChevronLeft size={16} />
          </button>

          <div className={cssClass({ display: "flex", gap: 5, flex: 1 })}>
            {visibleMonths.map((m) => {
              const gIdx = months.findIndex((x) => x.month === m.month && x.year === m.year);
              const active = gIdx === selIdx;
              const locked = isProcessed(m.month, m.year);
              const future = isFuture(m.month, m.year);
              const curr = m.month === now.getMonth() + 1 && m.year === now.getFullYear();
              return (
                <button key={`${m.month}-${m.year}`} onClick={() => setSelIdx(gIdx)} className={cssClass(
                  {
                    flex: "1 1 0", padding: "10px 4px", borderRadius: 8, cursor: "pointer",
                    border: active ? `2px solid ${BRAND}` : "1px solid #e9eaec",
                    background: active ? "#fff8f0" : future ? "#fafafa" : "#fff",
                    color: active ? BRAND : future ? "#c4c4c4" : "#374151",
                    fontWeight: active ? 800 : 500,
                    fontSize: 13, position: "relative", transition: "all .15s"
                  })}>
                  {curr && !active &&
                  <div className={cssClass({ position: "absolute", top: -1, right: -1, width: 7, height: 7,
                    borderRadius: "50%", background: BRAND, border: "1.5px solid #fff" })} />
                  }
                  {locked && !active &&
                  <Lock size={9} className={cssClass({ position: "absolute", top: 5, left: "50%",
                    transform: "translateX(-50%)", color: "#9ca3af" })} />
                  }
                  <div className={cssClass({ marginTop: locked && !active ? 10 : 0 })}>{MONTHS[m.month - 1]}</div>
                  <div className={cssClass({ fontSize: 10, opacity: .65 })}>{m.year}</div>
                </button>);

            })}
          </div>

          <button onClick={() => setScroll((s) => Math.min(months.length - VISIBLE, s + 1))}
          disabled={scroll + VISIBLE >= months.length} className={cssClass(
            { background: "none", border: "1px solid #e5e7eb", borderRadius: 6,
              cursor: scroll + VISIBLE >= months.length ? "not-allowed" : "pointer",
              color: scroll + VISIBLE >= months.length ? "#d1d5db" : "#374151",
              padding: "6px 8px", display: "flex" })}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── KPI chips ────────────────────────────────────────────────────────── */}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 })}>
        <KpiChip icon={<DollarSign size={18} color={BRAND} />} label="Gross Pay" value={fmtINR(gross, true)} accent={BRAND} />
        <KpiChip icon={<CheckCircle2 size={18} color="#16a34a" />} label="Net Pay" value={fmtINR(net, true)} accent="#16a34a" />
        <KpiChip icon={<Landmark size={18} color="#6366f1" />} label="Deductions" value={fmtINR(deductions, true)} accent="#6366f1" />
        <KpiChip icon={<Users size={18} color="#0ea5e9" />} label="Employees" value={totalEmp} accent="#0ea5e9" />
      </div>

      {loading ?
      <div className={cssClass({ textAlign: "center", padding: 80, color: "#9ca3af", fontSize: 14 })}>
          <Loader2 size={30} className={cssClass({ animation: "spin 1s linear infinite", marginBottom: 10 })} />
          <div>Loading payroll data…</div>
        </div> :

      <div className={cssClass({ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 })}>

          {/* ── LEFT: Payout Details ─────────────────────────────────────────── */}
          <PayoutDetailsPanel payslips={payslips} />

          {/* ── RIGHT: Employee Details + Controls ───────────────────────────── */}
          <div className={cssClass({ display: "flex", flexDirection: "column", gap: 16 })}>

            {/* Employee Details */}
            <div className={cssClass({ background: "#fff", border: "1px solid #e9eaec", borderRadius: 14,
            padding: "22px 24px", boxShadow: "0 2px 8px #0000000d" })}>
              <div className={cssClass({ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 4 })}>Employee Details</div>
              <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginBottom: 16 })}>Movement — {selLabel}</div>

              {/* Hero */}
              <div className={cssClass({
              background: "linear-gradient(135deg,#fff8f0,#fff3e6)",
              border: `1px solid ${BRAND}25`, borderRadius: 10, padding: "16px 18px",
              display: "flex", alignItems: "center", gap: 14, marginBottom: 14
            })}>
                <div className={cssClass({ width: 48, height: 48, borderRadius: 10, background: BRAND,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 })}>
                  <Users size={22} color="#fff" />
                </div>
                <div>
                  <div className={cssClass({ fontSize: 30, fontWeight: 900, color: "#111827", lineHeight: 1 })}>{totalEmp}</div>
                  <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginTop: 2 })}>Total Active Employees</div>
                </div>
              </div>

              {/* Movement grid */}
              <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 })}>
                {[
              { label: "New Joinees", value: additions, icon: <TrendingUp size={14} color="#16a34a" />, bg: "#f0fdf4", border: "#bbf7d0", valColor: "#16a34a" },
              { label: "Separations", value: separations, icon: <TrendingDown size={14} color="#dc2626" />, bg: "#fff1f2", border: "#fecdd3", valColor: "#dc2626" },
              { label: "Payslips", value: payslips.length, icon: <Briefcase size={14} color={BRAND} />, bg: "#fff8f0", border: "#fed7aa", valColor: BRAND },
              { label: "Processed", value: isProcessed(selected.month, selected.year) ? "Yes" : "No",
                icon: <Shield size={14} color="#7c3aed" />, bg: "#f5f3ff", border: "#ddd6fe", valColor: "#7c3aed" }].
              map((s) =>
              <div key={s.label} className={cssClass({
                background: s.bg, border: `1px solid ${s.border}`,
                borderRadius: 9, padding: "12px 14px"
              })}>
                    <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 })}>
                      {s.icon}
                      <span className={cssClass({ fontSize: 20, fontWeight: 900, color: s.valColor })}>{s.value}</span>
                    </div>
                    <div className={cssClass({ fontSize: 11, color: "#6b7280", fontWeight: 600 })}>{s.label}</div>
                  </div>
              )}
              </div>
            </div>

            {/* Controls */}
            <div className={cssClass({ background: "#fff", border: "1px solid #e9eaec", borderRadius: 14,
            padding: "22px 24px", boxShadow: "0 2px 8px #0000000d" })}>
              <div className={cssClass({ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 4 })}>Payroll Controls</div>
              <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginBottom: 16 })}>Access & lock settings</div>

              {[
            { key: "payrollInputs", label: "Payroll Inputs", sub: "Allow data entry" },
            { key: "employeeView", label: "Employee Payslip View", sub: "Release to staff" },
            { key: "itStatementView", label: "IT Statement View", sub: "Release IT forms" },
            { key: "payroll", label: "Payroll Processing", sub: "Allow payroll run" }].
            map((item) =>
            <div key={item.key} className={cssClass({
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "11px 13px", borderRadius: 8, marginBottom: 7,
              background: controls[item.key] ? "#fff8f0" : "#fafafa",
              border: `1px solid ${controls[item.key] ? BRAND + "30" : "#f0f0f0"}`,
              transition: "all .2s"
            })}>
                  <div>
                    <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1a1a1a" })}>{item.label}</div>
                    <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{item.sub}</div>
                  </div>
                  <Toggle on={controls[item.key]} onChange={(v) => setControls((c) => ({ ...c, [item.key]: v }))} />
                </div>
            )}

              {/* Quick links */}
              <div className={cssClass({ borderTop: "1px solid #f3f4f6", marginTop: 14, paddingTop: 12 })}>
                <div className={cssClass({ fontSize: 10, fontWeight: 700, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 })}>Quick Access</div>
                {[
              { label: "Payroll Statement", path: "/dashboard/payroll/statement" },
              { label: "PF / ESI Compliance", path: "/dashboard/payroll/compliance?tab=pan" },
              { label: "Payslip Release", path: "/dashboard/payroll/compliance?tab=release" },
              { label: "IT Declaration", path: "/dashboard/it-declaration" }].
              map((l) =>
              <a key={l.label} href={l.path}



              onMouseEnter={(e) => e.currentTarget.style.color = BRAND}
              onMouseLeave={(e) => e.currentTarget.style.color = "#374151"} className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 12, color: "#374151", textDecoration: "none", borderBottom: "1px solid #f3f4f6", transition: "color .15s" })}>
                    <span>{l.label}</span>
                    <span className={cssClass({ color: "#d1d5db" })}>›</span>
                  </a>
              )}
              </div>
            </div>

          </div>
        </div>
      }

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>);

}
