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
import { getMyTodayAttendance, getMyMonthlyAttendance } from "../../../api/attendance.api";
import { buildSalaryBreakdown } from "../../../utils/salaryBreakdown";
import InteractivePieChart, { formatINR as fmtINR } from "../../../component/charts/InteractivePieChart";
import { downloadPayslipPdf } from "../../../utils/payslipPdfGenerator";
import { errorToast } from "../../../utils/ToastControllers";

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

  const checkIn = todayAtt?.check_in_time || todayAtt?.checkIn || null;
  const checkOut = todayAtt?.check_out_time || todayAtt?.checkOut || null;

  const fmtTime = (t) => {
    if (!t) return "—";
    try {
      const d = new Date(t);
      if (isNaN(d)) return t;
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {return t;}
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
        <div className={cssClass({ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 20px",
          minWidth: 180, textAlign: "center" })}>
          <div className={cssClass({ fontSize: 11, opacity: 0.8, marginBottom: 4, fontWeight: 600, textTransform: "uppercase" })}>
            Today's Attendance
          </div>
          <div className={cssClass({ fontSize: 13, fontWeight: 600 })}>
            In: {loading ? "…" : fmtTime(checkIn)} &nbsp;|&nbsp; Out: {loading ? "…" : fmtTime(checkOut)}
          </div>
          {todayAtt?.status &&
          <div className={cssClass({ fontSize: 11, marginTop: 4, opacity: 0.8 })}>{todayAtt.status}</div>
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
