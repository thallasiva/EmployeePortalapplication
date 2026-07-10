import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle, FileText, AlertCircle, Users,
  Eye, EyeOff, Download, Loader2,
  Briefcase, Calendar, TrendingUp, Clock } from
"lucide-react";
import { getCurrentPayslipMonthLabel } from "../../../lib/dateUtils";
import { getMyPayslips, getMySalaryStructure, generateMyPayslip, getPayslipFull } from "../../../api/payroll.api";
import { getCurrentUser } from "../../../api/auth.api";
import { listHolidays } from "../../../api/holiday.api";
import { getMyLeaveBalances } from "../../../api/leaveRequest.api";
import { getMyTodayAttendance, getMyMonthlyAttendance, checkIn as apiCheckIn, checkOut as apiCheckOut } from "../../../api/attendance.api";
import { buildSalaryBreakdown } from "../../../utils/salaryBreakdown";
import InteractivePieChart, { formatINR as fmtINR } from "../../../component/charts/InteractivePieChart";
import { downloadPayslipPdf } from "../../../utils/payslipPdfGenerator";
import { errorToast, successToast } from "../../../utils/ToastControllers";

/* ─── helpers ─────────────────────────────────────────────────────────────── */import { cssClass, joinClasses } from "../../../utils/classStyles";
const fmt = (n) =>
Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const QUICK_LINKS = [
{ label: "CTC Payslip", to: "/employee/payroll/payslips" },
{ label: "Reimbursement Payslip", to: "/employee/payroll/reimbursements" },
{ label: "IT Statement", to: "/employee/payroll/it-statement" },
{ label: "YTD Reports", to: "/employee/payroll/ytd-reports" },
{ label: "Loan Statement", to: "/employee/payroll/loans" }];


function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
}


/* ─── Salary row ──────────────────────────────────────────────────────────── */
function SalRow({ label, value, show, color, bold }) {
  return (
    <div className={cssClass({ display: "flex", justifyContent: "space-between", padding: "6px 0",
      borderBottom: "1px solid #f8fafc" })}>
      <span className={cssClass({ fontSize: 13, color: "#64748b" })}>{label}</span>
      <span className={cssClass({ fontSize: 13, fontWeight: bold ? 700 : 500,
        color: color || "#1e293b", letterSpacing: show ? 0 : "0.12em" })}>
        {show ? `₹${fmt(value)}` : "•••••"}
      </span>
    </div>);

}

/* ─── Stat tile ───────────────────────────────────────────────────────────── */
function Tile({ icon, label, value, sub, bg, color }) {
  return (
    <div className={cssClass({ background: "#fff", borderRadius: 10, padding: "14px 16px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 14 })}>
      <div className={cssClass({ width: 42, height: 42, borderRadius: 10, background: bg || "#fff8f0",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 })}>
        {icon}
      </div>
      <div className={cssClass({ minWidth: 0 })}>
        <div className={cssClass({ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.05em" })}>{label}</div>
        <div className={cssClass({ fontSize: 18, fontWeight: 800, color: color || "#1e293b", marginTop: 2 })}>{value}</div>
        {sub && <div className={cssClass({ fontSize: 11, color: "#94a3b8", marginTop: 1 })}>{sub}</div>}
      </div>
    </div>);

}

/* ═════════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const payslipLabel = getCurrentPayslipMonthLabel();

  /* state */
  const [user, setUser] = useState(null);
  const [structure, setStructure] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);
  const [monthAtt, setMonthAtt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSal, setShowSal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const today = now.toISOString().split("T")[0];
    Promise.all([
    getCurrentUser().catch(() => null),
    getMySalaryStructure().catch(() => null),
    getMyPayslips({ limit: 3 }).then((r) => Array.isArray(r) ? r : r?.data ?? []).catch(() => []),
    listHolidays({ year, limit: 20 }).
    then((r) => Array.isArray(r) ? r : r?.data ?? []).
    catch(() => []),
    getMyLeaveBalances().then((r) => Array.isArray(r) ? r : r?.data ?? []).catch(() => []),
    getMyTodayAttendance().catch(() => null),
    getMyMonthlyAttendance({ month, year }).catch(() => null)]
    ).then(([u, s, p, h, lb, att, mAtt]) => {
      setUser(u);
      setStructure(s);
      setPayslips(Array.isArray(p) ? p : []);
      const todayMs = new Date(today).getTime();
      const upcoming = (Array.isArray(h) ? h : []).
      filter((hol) => {
        const d = new Date(hol.holiday_date || hol.date);
        return !isNaN(d) && d.getTime() >= todayMs;
      }).
      sort((a, b) =>
      new Date(a.holiday_date || a.date) - new Date(b.holiday_date || b.date)
      ).
      slice(0, 4);
      setHolidays(upcoming);
      setLeaveBalance(Array.isArray(lb) ? lb : []);
      setTodayAtt(att);
      setMonthAtt(mAtt);
    }).finally(() => setLoading(false));
  }, []);

  const currentSlip = useMemo(
    () => payslips.find((p) => Number(p.month) === month && Number(p.year) === year),
    [payslips, month, year]
  );
  const sal = useMemo(() => buildSalaryBreakdown(structure, currentSlip), [structure, currentSlip]);

  const empName = user ?
  `${user.first_name || user.name || ""}${user.last_name ? " " + user.last_name : ""}`.trim() :
  "";
  const empCode = user?.emp_code || user?.employee_code || "—";
  const designation = user?.emp_job_title || user?.designation || "—";
  const department = user?.department_name || "—";
  const joinDate = user?.emp_joining_date ?
  new Date(user.emp_joining_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) :
  "—";

  const paidDays = sal.fromPayslip ? sal.paidDays : sal.basic > 0 ? 26 : 0;
  const workDays = sal.fromPayslip ? sal.workingDays : sal.basic > 0 ? 26 : 0;
  const lopDays = sal.fromPayslip ? sal.lopDays : 0;

  const presentDays = monthAtt?.present_days ?? monthAtt?.presentDays ?? 0;
  const absentDays = monthAtt?.absent_days ?? monthAtt?.absentDays ?? 0;

  // DB returns check_in / check_out as "HH:MM:SS" time strings
  const checkIn  = todayAtt?.check_in  || todayAtt?.check_in_time  || todayAtt?.checkIn  || null;
  const checkOut = todayAtt?.check_out || todayAtt?.check_out_time || todayAtt?.checkOut || null;

  const workHours = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    try {
      const toSecs = (t) => {
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
          const [h, m, s = 0] = t.split(':').map(Number);
          return h * 3600 + m * 60 + s;
        }
        return new Date(t).getTime() / 1000;
      };
      const diff = toSecs(checkOut) - toSecs(checkIn);
      if (diff <= 0) return null;
      return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    } catch { return null; }
  }, [checkIn, checkOut]);

  const todayLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  // ── Live timer: ticks every second while checked in, not yet checked out ──
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    if (!checkIn || checkOut) { setElapsed(""); return; }
    function tick() {
      try {
        const toSecs = (t) => {
          if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
            const [h, m, s = 0] = t.split(":").map(Number);
            return h * 3600 + m * 60 + s;
          }
          return new Date(t).getTime() / 1000;
        };
        const n = new Date();
        const nowSecs = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
        const diff = Math.max(0, nowSecs - toSecs(checkIn));
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setElapsed(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
      } catch { setElapsed(""); }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkIn, checkOut]);

  const fmtTime = (t) => {
    if (!t) return "—";
    try {
      // Handle "HH:MM:SS" or "HH:MM" time strings returned by DB
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(String(t))) {
        const [h, m] = String(t).split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12  = h % 12 || 12;
        return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
      }
      const d = new Date(t);
      if (isNaN(d)) return String(t);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return String(t); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const rec = await generateMyPayslip({ month, year });
      const full = await getPayslipFull(rec.payslip_id);
      await downloadPayslipPdf(full);
    } catch (err) {
      errorToast(err?.response?.data?.message || "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const fmtHolDate = (dateStr) => {
    const d = new Date(dateStr);
    return {
      badge: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      weekday: d.toLocaleDateString("en-US", { weekday: "long" })
    };
  };

  const initials = empName ?
  empName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) :
  "?";

  const refreshAttendance = () =>
    getMyTodayAttendance().then(setTodayAtt).catch(() => {});

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await apiCheckIn({});
      await refreshAttendance();
      successToast("Checked in successfully!");
    } catch (err) {
      errorToast(err?.response?.data?.message || "Check-in failed.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await apiCheckOut({});
      await refreshAttendance();
      successToast("Checked out successfully!");
    } catch (err) {
      errorToast(err?.response?.data?.message || "Check-out failed.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f0f4f8", padding: 20 })}>

      {/* ── Profile banner ── */}
      <div className={cssClass({ background: "linear-gradient(135deg,#f18200 0%,#e07000 100%)", borderRadius: 12,
        padding: "20px 24px", marginBottom: 20, display: "flex", flexWrap: "wrap",
        alignItems: "center", gap: 20, color: "#fff" })}>
        {/* Avatar */}
        <div className={cssClass({ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0 })}>
          {loading ? "…" : initials}
        </div>

        {/* Name + meta */}
        <div className={cssClass({ flex: 1, minWidth: 200 })}>
          <div className={cssClass({ fontSize: 20, fontWeight: 800 })}>
            {loading ? "Loading…" : empName || "Employee"}
          </div>
          <div className={cssClass({ fontSize: 13, opacity: 0.85, marginTop: 3 })}>
            {empCode} &nbsp;·&nbsp; {designation} &nbsp;·&nbsp; {department}
          </div>
          <div className={cssClass({ fontSize: 12, opacity: 0.7, marginTop: 2 })}>
            Joined: {joinDate}
          </div>
        </div>

        {/* Today's attendance */}
        <div className={cssClass({ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "14px 20px",
          minWidth: 220, textAlign: "center" })}>
          <div className={cssClass({ fontSize: 11, opacity: 0.8, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
            Today's Attendance
          </div>

          {/* Check-in / Check-out time row */}
          <div className="flex justify-center gap-4 mb-2">
            <div className="text-center">
              <div className="text-[10px] opacity-70 mb-0.5 uppercase tracking-widest">Check In</div>
              <div className="text-sm font-bold">{loading ? "…" : fmtTime(checkIn)}</div>
            </div>
            <div className="w-px bg-white/30 self-stretch" />
            <div className="text-center">
              <div className="text-[10px] opacity-70 mb-0.5 uppercase tracking-widest">Check Out</div>
              <div className="text-sm font-bold">{loading ? "…" : fmtTime(checkOut)}</div>
            </div>
          </div>

          {/* Live elapsed timer */}
          {elapsed && (
            <div className="text-center mb-2">
              <div className="text-[10px] opacity-60 uppercase tracking-widest mb-0.5">Time Elapsed</div>
              <div className="text-[22px] font-black tracking-widest text-white tabular-nums">{elapsed}</div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleCheckIn}
              disabled={!!checkIn || checkingIn || loading}
              className={`flex-1 h-8 rounded-lg text-xs font-bold border-0 transition-all ${
                checkIn ? "bg-white/10 text-white/40 cursor-not-allowed" : "bg-white/95 text-[#f18200] cursor-pointer hover:bg-white"
              }`}
            >
              {checkingIn ? "…" : checkIn ? "✓ Checked In" : "Check In"}
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!checkIn || !!checkOut || checkingOut || loading}
              className={`flex-1 h-8 rounded-lg text-xs font-bold border-0 transition-all ${
                checkOut ? "bg-white/10 text-white/40 cursor-not-allowed"
                : !checkIn ? "bg-white/10 text-white/30 cursor-not-allowed"
                : "bg-white/95 text-[#f18200] cursor-pointer hover:bg-white"
              }`}
            >
              {checkingOut ? "…" : checkOut ? "✓ Checked Out" : "Check Out"}
            </button>
          </div>

          {todayAtt?.status &&
          <div className={cssClass({ fontSize: 11, marginTop: 6, opacity: 0.7 })}>{todayAtt.status}</div>
          }
        </div>

        {/* Greeting */}
        <div className={cssClass({ textAlign: "right" })}>
          <div className={cssClass({ fontSize: 14, opacity: 0.85 })}>{greeting()}</div>
          <div className={cssClass({ fontSize: 11, opacity: 0.65, marginTop: 2 })}>{payslipLabel}</div>
        </div>
      </div>

      {/* ── Stat tiles ── */}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14, marginBottom: 20 })}>
        <Tile icon={<TrendingUp size={20} color="#f18200" />} label="Gross Pay" bg="#fff8f0"
        value={loading ? "…" : showSal ? `₹${fmt(sal.gross)}` : "•••••"} color="#f18200" />
        <Tile icon={<TrendingUp size={20} color="#e11d48" />} label="Deductions" bg="#fff1f2"
        value={loading ? "…" : showSal ? `₹${fmt(sal.deductions)}` : "•••••"} color="#e11d48" />
        <Tile icon={<TrendingUp size={20} color="#16a34a" />} label="Net Pay" bg="#f0fdf4"
        value={loading ? "…" : showSal ? `₹${fmt(sal.net)}` : "•••••"} color="#16a34a" />
        <Tile icon={<Calendar size={20} color="#f18200" />} label="Paid Days" bg="#fff8f0"
        value={loading ? "…" : `${paidDays}/${workDays}`}
        sub={lopDays > 0 ? `LOP: ${lopDays} days` : undefined} />
        <Tile icon={<Clock size={20} color="#6366f1" />} label="Present This Month" bg="#f5f3ff"
        value={loading ? "…" : presentDays || paidDays} color="#6366f1" />
      </div>

      {/* ── Main grid ── */}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 })}>

        {/* ── Today's Attendance card ── */}
        <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20, borderTop: "3px solid #f18200" })}>
          <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 })}>
            <span className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b" })}>Today's Attendance</span>
            {todayAtt?.status &&
            <span className={cssClass({
              fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
              background: todayAtt.status === "Present" ? "#dcfce7" : "#fff3e0",
              color: todayAtt.status === "Present" ? "#15803d" : "#e07000"
            })}>{todayAtt.status}</span>
            }
          </div>
          <div className={cssClass({ fontSize: 11, color: "#94a3b8", marginBottom: 18 })}>{todayLabel}</div>

          {/* Time boxes */}
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 })}>
            {/* Check In */}
            <div className={cssClass({ background: checkIn ? "#f0fdf4" : "#f8fafc", borderRadius: 10, padding: "14px 12px", textAlign: "center", border: checkIn ? "1px solid #bbf7d0" : "1px solid #e2e8f0" })}>
              <div className={cssClass({ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: checkIn ? "#16a34a" : "#94a3b8", marginBottom: 6 })}>
                Check In
              </div>
              <div className={cssClass({ fontSize: 22, fontWeight: 800, color: checkIn ? "#15803d" : "#cbd5e1", letterSpacing: "-0.02em" })}>
                {loading ? "…" : checkIn ? fmtTime(checkIn) : "—"}
              </div>
              {checkIn && (
                <div className={cssClass({ marginTop: 4, fontSize: 10, color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 })}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                  Recorded
                </div>
              )}
            </div>

            {/* Check Out */}
            <div className={cssClass({ background: checkOut ? "#fff8f0" : "#f8fafc", borderRadius: 10, padding: "14px 12px", textAlign: "center", border: checkOut ? "1px solid #fde8c8" : "1px solid #e2e8f0" })}>
              <div className={cssClass({ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: checkOut ? "#f18200" : "#94a3b8", marginBottom: 6 })}>
                Check Out
              </div>
              <div className={cssClass({ fontSize: 22, fontWeight: 800, color: checkOut ? "#e07000" : "#cbd5e1", letterSpacing: "-0.02em" })}>
                {loading ? "…" : checkOut ? fmtTime(checkOut) : "—"}
              </div>
              {checkOut && (
                <div className={cssClass({ marginTop: 4, fontSize: 10, color: "#f18200", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 })}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f18200", display: "inline-block" }} />
                  Recorded
                </div>
              )}
            </div>
          </div>

          {/* Work duration / live timer */}
          {(elapsed || workHours) && (
            <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3.5 py-2 mb-3.5">
              <span className="text-xs text-purple-700 font-semibold">
                {elapsed && !checkOut ? "Time Elapsed" : "Work Duration"}
              </span>
              <span className="text-base font-extrabold text-purple-800 tabular-nums">
                {elapsed && !checkOut ? elapsed : workHours}
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCheckIn}
              disabled={!!checkIn || checkingIn || loading}
              className={`h-10 rounded-lg text-sm font-bold border-0 transition-all ${
                checkIn ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-green-600 text-white cursor-pointer hover:bg-green-700"
              }`}
            >
              {checkingIn ? "…" : checkIn ? "✓ Checked In" : "Check In"}
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!checkIn || !!checkOut || checkingOut || loading}
              className={`h-10 rounded-lg text-sm font-bold border-0 transition-all ${
                checkOut ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : !checkIn ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-[#f18200] text-white cursor-pointer hover:bg-orange-600"
              }`}
            >
              {checkingOut ? "…" : checkOut ? "✓ Checked Out" : "Check Out"}
            </button>
          </div>
        </div>

        {/* ── Payslip card ── */}
        <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
          <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 })}>
            <span className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b" })}>Payslip</span>
            <Link to="/employee/payroll/payslips" className={cssClass(
              { fontSize: 12, color: "#f18200", fontWeight: 600, textDecoration: "none" })}>View All →</Link>
          </div>

          {loading ?
          <div className={cssClass({ display: "flex", justifyContent: "center", padding: 30 })}>
              <Loader2 size={24} color="#f18200" className={cssClass({ animation: "spin 1s linear infinite" })} />
            </div> :
          sal.basic === 0 ?
          <p className={cssClass({ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" })}>
              No salary structure found.
            </p> :

          <>
              {showSal ?
            <InteractivePieChart
              size={160}
              donut={true}
              legendBelow={true}
              valueFormatter={fmtINR}
              data={[
              { label: "Net Pay", value: sal.net, color: "#16a34a" },
              { label: "PF", value: sal.pf, color: "#f18200" },
              { label: "Prof. Tax", value: sal.profTax, color: "#dc2626" }]
              } /> :


            <div className={cssClass({ display: "flex", gap: 20, alignItems: "center" })}>
                  {/* Hidden state: grey donut placeholder */}
                  <div className={cssClass({ position: "relative", width: 160, height: 160, flexShrink: 0 })}>
                    <svg width="160" height="160" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="70" fill="#f1f5f9" />
                      <circle cx="80" cy="80" r="42" fill="#fff" />
                    </svg>
                    <div className={cssClass({ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center" })}>
                      <span className={cssClass({ fontSize: 22, color: "#94a3b8", letterSpacing: "0.15em" })}>•••</span>
                      <span className={cssClass({ fontSize: 11, color: "#cbd5e1", marginTop: 4 })}>Hidden</span>
                    </div>
                  </div>
                  {/* Legend placeholders */}
                  <div className={cssClass({ flex: 1, display: "flex", flexDirection: "column", gap: 10 })}>
                    {[
                { label: "Net Pay", color: "#16a34a" },
                { label: "PF", color: "#f18200" },
                { label: "Prof. Tax", color: "#dc2626" }].
                map((row) =>
                <div key={row.label} className={cssClass({ display: "flex", justifyContent: "space-between",
                  alignItems: "center", fontSize: 13 })}>
                        <span className={cssClass({ display: "flex", alignItems: "center", gap: 6, color: "#64748b" })}>
                          <span className={cssClass({ width: 10, height: 10, borderRadius: "50%",
                      background: row.color, display: "inline-block" })} />
                          {row.label}
                        </span>
                        <span className={cssClass({ color: "#94a3b8", letterSpacing: "0.15em" })}>•••••</span>
                      </div>
                )}
                  </div>
                </div>
            }
              {!sal.fromPayslip &&
            <div className={cssClass({ fontSize: 11, color: "#f59e0b", background: "#fffbeb",
              border: "1px solid #fde68a", borderRadius: 6, padding: "4px 10px",
              marginBottom: 12, textAlign: "center" })}>
                  Projected from salary structure — payslip not yet generated
                </div>
            }
              <div className={cssClass({ display: "flex", gap: 10 })}>
                <button onClick={handleDownload} disabled={downloading} className={cssClass(
                { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 0", border: "1px solid #f18200", borderRadius: 6, background: "#fff",
                  color: "#f18200", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: downloading ? 0.6 : 1 })}>
                  <Download size={13} />
                  {downloading ? "…" : "Download"}
                </button>
                <button onClick={() => setShowSal((v) => !v)} className={cssClass(
                { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 0", border: "1px solid #f18200", borderRadius: 6, background: "#fff",
                  color: "#f18200", fontWeight: 600, fontSize: 13, cursor: "pointer" })}>
                  {showSal ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showSal ? "Hide" : "Show Salary"}
                </button>
              </div>
            </>
          }
        </div>

        {/* ── Salary breakdown ── */}
        {sal.basic > 0 &&
        <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
            <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 })}>
              <span className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b" })}>Salary Components</span>
              <button onClick={() => setShowSal((v) => !v)} className={cssClass(
              { background: "none", border: "none", cursor: "pointer", color: "#f18200",
                fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 })}>
                {showSal ? <EyeOff size={12} /> : <Eye size={12} />}
                {showSal ? "Hide" : "Reveal"}
              </button>
            </div>

            <div className={cssClass({ fontSize: 10, color: "#f18200", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.07em", marginBottom: 6 })}>Earnings</div>
            {[
          { label: "Basic", value: sal.basic },
          { label: "HRA", value: sal.hra },
          { label: "Special Allowance", value: sal.special },
          { label: "LTA", value: sal.lta },
          { label: "Telephone", value: sal.telephone },
          { label: "Conveyance", value: sal.conveyance },
          { label: "Medical", value: sal.medical }].
          filter((r) => r.value > 0).map((r) =>
          <div key={r.label} className={cssClass({ display: "flex", justifyContent: "space-between",
            padding: "5px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 })}>
                <span className={cssClass({ color: "#475569" })}>{r.label}</span>
                <span className={cssClass({ color: "#1e293b", fontWeight: 500, letterSpacing: showSal ? 0 : "0.1em" })}>
                  {showSal ? `₹${fmt(r.value)}` : "•••"}
                </span>
              </div>
          )}

            <div className={cssClass({ fontSize: 10, color: "#e11d48", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.07em", marginTop: 10, marginBottom: 6 })}>Deductions</div>
            {[
          { label: "Provident Fund", value: sal.pf },
          { label: "Professional Tax", value: sal.profTax }].
          filter((r) => r.value > 0).map((r) =>
          <div key={r.label} className={cssClass({ display: "flex", justifyContent: "space-between",
            padding: "5px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 })}>
                <span className={cssClass({ color: "#475569" })}>{r.label}</span>
                <span className={cssClass({ color: "#e11d48", fontWeight: 500, letterSpacing: showSal ? 0 : "0.1em" })}>
                  {showSal ? `₹${fmt(r.value)}` : "•••"}
                </span>
              </div>
          )}

            <div className={cssClass({ display: "flex", justifyContent: "space-between",
            marginTop: 10, paddingTop: 10, borderTop: "2px solid #f1f5f9" })}>
              <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b" })}>Net Pay</span>
              <span className={cssClass({ fontSize: 14, fontWeight: 800, color: "#16a34a", letterSpacing: showSal ? 0 : "0.1em" })}>
                {showSal ? `₹${fmt(sal.net)}` : "•••••"}
              </span>
            </div>
          </div>
        }

        {/* ── Leave balances ── */}
        <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
          <div className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 })}>Leave Balance</div>
          {loading ?
          <div className={cssClass({ color: "#94a3b8", fontSize: 13 })}>Loading…</div> :
          leaveBalance.length === 0 ?
          <div className={cssClass({ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "16px 0" })}>
              No leave balance data.
            </div> :

          <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
              {leaveBalance.map((lb) => {
              const used = Number(lb.used_days ?? lb.used ?? 0);
              const total = Number(lb.total_days ?? lb.total ?? lb.annual_quota ?? 0);
              const avail = Number(lb.available ?? lb.balance ?? total - used);
              const pct = total > 0 ? Math.min(used / total * 100, 100) : 0;
              return (
                <div key={lb.leave_type_id || lb.id}>
                    <div className={cssClass({ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 })}>
                      <span className={cssClass({ color: "#334155", fontWeight: 600 })}>{lb.leave_type_name || lb.name}</span>
                      <span className={cssClass({ color: "#64748b" })}>
                        <span className={cssClass({ fontWeight: 700, color: "#16a34a" })}>{avail}</span> / {total} avail
                      </span>
                    </div>
                    <div className={cssClass({ height: 6, background: "#f1f5f9", borderRadius: 3 })}>
                      <div className={cssClass({ height: "100%", borderRadius: 3, width: `${pct}%`,
                      background: pct > 70 ? "#ef4444" : pct > 40 ? "#f59e0b" : "#f18200",
                      transition: "width 0.4s" })} />
                    </div>
                  </div>);

            })}
            </div>
          }
        </div>

        {/* ── Upcoming holidays ── */}
        <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
          <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 })}>
            <span className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b" })}>Upcoming Holidays</span>
            <Link to="/employee/leave/holiday-calendar" className={cssClass(
              { fontSize: 12, color: "#f18200", fontWeight: 600, textDecoration: "none" })}>View All →</Link>
          </div>
          {loading ?
          <div className={cssClass({ color: "#94a3b8", fontSize: 13 })}>Loading…</div> :
          holidays.length === 0 ?
          <div className={cssClass({ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "16px 0" })}>
              No upcoming holidays.
            </div> :

          <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
              {holidays.map((hol) => {
              const dateStr = hol.holiday_date || hol.date;
              const { badge, weekday } = fmtHolDate(dateStr);
              return (
                <div key={hol.holiday_id || dateStr} className={cssClass(
                  { display: "flex", alignItems: "center", gap: 14 })}>
                    <div className={cssClass({ background: "#fff8f0", border: "1px solid #fde8c8",
                    borderRadius: 8, padding: "6px 10px", textAlign: "center", minWidth: 52 })}>
                      <div className={cssClass({ fontSize: 13, fontWeight: 800, color: "#f18200" })}>{badge.split(" ")[0]}</div>
                      <div className={cssClass({ fontSize: 10, color: "#94a3b8" })}>{badge.split(" ")[1]}</div>
                    </div>
                    <div>
                      <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b" })}>
                        {hol.holiday_name || hol.name}
                      </div>
                      <div className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{weekday}</div>
                    </div>
                  </div>);

            })}
            </div>
          }
        </div>

        {/* ── Quick access ── */}
        <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
          <div className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 })}>Quick Access</div>
          <div className={cssClass({ display: "flex", flexDirection: "column", gap: 8 })}>
            {QUICK_LINKS.map((item) =>
            <Link key={item.to} to={item.to} className={cssClass(
              { display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 12px", background: "#fff8f0", borderRadius: 8, border: "1px solid #fde8c8",
                color: "#f18200", fontWeight: 600, fontSize: 13, textDecoration: "none" })}>
                {item.label}
                <span>→</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── IT Declaration ── */}
        <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          padding: 20, borderLeft: "4px solid #f18200" })}>
          <div className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 10 })}>IT Declaration</div>
          <div className={cssClass({ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 })}>
            <AlertCircle size={18} color="#f18200" className={cssClass({ flexShrink: 0, marginTop: 1 })} />
            <p className={cssClass({ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 })}>
              Submit your IT declaration before the window closes to ensure correct TDS deduction.
            </p>
          </div>
          <Link to="/employee/payroll/it-declaration" className={cssClass(
            { display: "block", textAlign: "center", padding: "9px 0",
              border: "1px solid #f18200", borderRadius: 8, color: "#f18200",
              fontWeight: 600, fontSize: 13, textDecoration: "none" })}>
            Declare Now
          </Link>
        </div>

        {/* ── POI ── */}
        <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
          <div className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 })}>POI</div>
          <div className={cssClass({ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0" })}>
            <FileText size={36} color="#cbd5e1" className={cssClass({ marginBottom: 10 })} />
            <p className={cssClass({ fontSize: 13, color: "#64748b", textAlign: "center", margin: "0 0 14px" })}>
              Submit Proof of Investments once the window is released.
            </p>
            <Link to="/employee/payroll/proof-investment" className={cssClass(
              { padding: "8px 24px", border: "1px solid #f18200", borderRadius: 8,
                color: "#f18200", fontWeight: 600, fontSize: 13, textDecoration: "none" })}>
              Track
            </Link>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className={cssClass({ marginTop: 36, display: "flex", justifyContent: "center",
        gap: 20, fontSize: 12, color: "#94a3b8" })}>
        <span>Privacy Policy</span><span>|</span><span>Terms of Service</span>
      </div>
    </div>);

}

function fmtHolDate(dateStr) {
  const d = new Date(dateStr);
  return {
    badge: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    weekday: d.toLocaleDateString("en-US", { weekday: "long" })
  };
}
