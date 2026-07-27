import React, { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  getMyPayslips,
  getPayslipFull,
  generateMyPayslip,
  getMySalaryStructure } from
"../../../api/payroll.api";
import { getMyProfile } from "../../../api/employee.api";
import { buildSalaryBreakdown } from "../../../utils/salaryBreakdown";
import { downloadPayslipPdf } from "../../../utils/payslipPdfGenerator";
import { errorToast } from "../../../utils/ToastControllers";
import { getCurrentUser } from "../../../api/auth.api";
import { cssClass, joinClasses } from "../../../utils/classStyles";

const MONTH_NAMES = [
"January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"];


function fmtAmt(n)
{
  const v = Number(n) || 0;
  return v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Employee details side panel ───────────────────────────────────────────────
function EmployeePanel({ user, payslip, structure, empProfile, bankDetails, month, year, onHide })
{
  const empNo = empProfile?.emp_code || payslip?.emp_code || user?.empCode || "—";
  const empName = empProfile
    ? [empProfile.first_name, empProfile.last_name].filter(Boolean).join(" ")
    : (user?.name || "—");
  const bank    = bankDetails?.bank_name      || empProfile?.bank_name      || "—";
  const bankAcc = bankDetails?.account_number || empProfile?.account_number || "—";
  const rawDate = empProfile?.emp_joining_date || empProfile?.joining_date;
  const joinDate = rawDate ?
    new Date(rawDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) :
    "—";
  const pfNo = empProfile?.pf_number || bankDetails?.pf_number || "—";
  const netPay = Number(payslip?.net_salary ?? payslip?.net_pay ?? 0);
  const monthLabel = month ? `${MONTH_NAMES[Number(month) - 1]} ${year}` : "—";

  return (
    <div className={cssClass({ background: "#fffde7", border: "1px solid #e8e1a0", borderRadius: 8, padding: 16, minWidth: 220 })}>
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 })}>
        <span className={cssClass({ fontSize: 11, color: "#7b7b3b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" })}>
          Employee details
        </span>
        <button
          type="button"
          onClick={onHide} className={cssClass(
            { fontSize: 11, color: "#f18200", background: "none", border: "none", cursor: "pointer", fontWeight: 600 })}>
          
          Hide
        </button>
      </div>
      {[
      { label: "Employee No", value: empNo },
      { label: "Name", value: empName },
      { label: "Bank", value: bank },
      { label: "Bank Account No", value: bankAcc },
      { label: "Joining Date", value: joinDate },
      { label: "PF No", value: pfNo }].
      map(({ label, value }) =>
      <div key={label} className={cssClass({ marginBottom: 10 })}>
          <div className={cssClass({ fontSize: 10, color: "#9e9e5a" })}>{label}</div>
          <div className={cssClass({ fontSize: 13, color: value !== "—" ? "#333" : "#bbb", fontWeight: 500, marginTop: 2, wordBreak: "break-all" })}>{value}</div>
        </div>
      )}
      <div className={cssClass({ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #d4ce7a" })}>
        <div className={cssClass({ fontSize: 11, color: "#7b7b3b" })}>Net Pay for {monthLabel}</div>
        <div className={cssClass({ fontSize: 22, fontWeight: 800, color: "#1a1a1a", marginTop: 4 })}>
          ₹{fmtAmt(netPay)}
        </div>
      </div>
    </div>);

}

// ── Payslip tab ───────────────────────────────────────────────────────────────
function PayslipTab({ payslip, structure })
{
  const b = useMemo(() => buildSalaryBreakdown(structure, payslip), [payslip, structure]);
  const hasData = b.basic > 0;

  const earnings = hasData ? [
  { label: "BASIC", value: b.basic },
  { label: "HRA", value: b.hra },
  { label: "SPECIAL ALLOWANCE", value: b.special },
  { label: "LTA", value: b.lta },
  { label: "TELEPHONE AND INTERNET EXPENSES", value: b.telephone },
  { label: "CONVEYANCE ALLOWANCE", value: b.conveyance },
  { label: "MEDICAL ALLOWANCE", value: b.medical }].
  filter((r) => r.value > 0) : [];

  const deductions = hasData ? [
  { label: "PROVIDENT FUND (EMPLOYEE)", value: b.pf },
  { label: "PROFESSIONAL TAX", value: b.profTax }].
  filter((r) => r.value > 0) : [];

  const totalEarnings = b.gross;
  const totalDeductions = b.deductions;

  const tableSt = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
  const thSt = { background: "#fff8f0", padding: "6px 10px", textAlign: "right", fontSize: 11, color: "#5a7a8a", fontWeight: 600 };
  const thLSt = { ...thSt, textAlign: "left" };
  const tdSt = { padding: "7px 10px", borderBottom: "1px solid #f0f0f0", color: "#333" };
  const tdRSt = { ...tdSt, textAlign: "right", fontFamily: "monospace", color: "#222" };
  const tfSt = { padding: "8px 10px", fontWeight: 700, color: "#1a1a1a" };
  const tfRSt = { ...tfSt, textAlign: "right", fontFamily: "monospace", fontSize: 14 };

  return (
    <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "start" })}>
      {/* Earnings */}
      <div className={cssClass({ border: "1px solid #ffe0b2", borderRadius: 6, overflow: "hidden" })}>
        <table className={cssClass(tableSt)}>
          <thead>
            <tr>
              <th className={cssClass(thLSt)}>Earnings</th>
              <th className={cssClass(thSt)}>Amount in (₹)</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map((r) =>
            <tr key={r.label}>
                <td className={cssClass(tdSt)}>{r.label}</td>
                <td className={cssClass(tdRSt)}>{fmtAmt(r.value)}</td>
              </tr>
            )}
            {!earnings.length &&
            <tr><td colSpan={2} className={cssClass({ ...tdSt, color: "#aaa", textAlign: "center" })}>No data</td></tr>
            }
          </tbody>
          <tfoot>
            <tr className={cssClass({ borderTop: "2px solid #ffe0b2" })}>
              <td className={cssClass(tfSt)}>Total</td>
              <td className={cssClass(tfRSt)}>{fmtAmt(totalEarnings)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Deductions */}
      <div className={cssClass({ border: "1px solid #ffe0b2", borderRadius: 6, overflow: "hidden" })}>
        <table className={cssClass(tableSt)}>
          <thead>
            <tr>
              <th className={cssClass(thLSt)}>Deductions</th>
              <th className={cssClass(thSt)}>Amount in (₹)</th>
            </tr>
          </thead>
          <tbody>
            {deductions.map((r) =>
            <tr key={r.label}>
                <td className={cssClass(tdSt)}>{r.label}</td>
                <td className={cssClass(tdRSt)}>{fmtAmt(r.value)}</td>
              </tr>
            )}
            {!deductions.length &&
            <tr><td colSpan={2} className={cssClass({ ...tdSt, color: "#aaa", textAlign: "center" })}>No data</td></tr>
            }
          </tbody>
          <tfoot>
            <tr className={cssClass({ borderTop: "2px solid #ffe0b2" })}>
              <td className={cssClass(tfSt)}>Total</td>
              <td className={cssClass(tfRSt)}>{fmtAmt(totalDeductions)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>);

}

// ── CTC Payslip tab ───────────────────────────────────────────────────────────
function CtcPayslipTab({ payslip, structure })
{
  const b = useMemo(() => buildSalaryBreakdown(structure, payslip), [payslip, structure]);
  const hasData = b.basic > 0;

  const items = hasData ? [
  { label: "FULL BASIC", value: b.basic },
  { label: "FULL HRA", value: b.hra },
  { label: "FULL SPECIAL ALLOWANCE", value: b.special },
  { label: "FULL LTA", value: b.lta },
  { label: "FULL TELEPHONE AND INTERNET EXPENSES", value: b.telephone },
  { label: "FULL CONVEYANCE ALLOWANCE", value: b.conveyance },
  { label: "FULL MEDICAL ALLOWANCE", value: b.medical },
  { label: "FULL EMPLOYER PF", value: b.empPf, highlight: "#c8380a" },
  { label: "MONTHLY GROSS", value: b.gross, highlight: "#f18200", bold: true },
  { label: "MONTHLY CTC", value: b.ctc, highlight: "#f18200", bold: true }].
  filter((r) => r.value > 0) : [];

  const tableSt = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
  const thSt = { background: "#fff8f0", padding: "6px 10px", fontSize: 11, color: "#5a7a8a", fontWeight: 600, textAlign: "right" };
  const thLSt = { ...thSt, textAlign: "left" };
  const tdSt = { padding: "7px 10px", borderBottom: "1px solid #f0f0f0" };
  const tdRSt = { ...tdSt, textAlign: "right", fontFamily: "monospace" };

  return (
    <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" })}>
      <div className={cssClass({ border: "1px solid #ffe0b2", borderRadius: 6, overflow: "hidden" })}>
        <table className={cssClass(tableSt)}>
          <thead>
            <tr>
              <th className={cssClass(thLSt)}>Items</th>
              <th className={cssClass(thSt)}>Amount in (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) =>
            <tr key={r.label}>
                <td className={cssClass({ ...tdSt, color: r.highlight || "#333", fontWeight: r.bold ? 700 : 400 })}>{r.label}</td>
                <td className={cssClass({ ...tdRSt, color: r.highlight || "#222", fontWeight: r.bold ? 700 : 400 })}>{fmtAmt(r.value)}</td>
              </tr>
            )}
            {!items.length &&
            <tr><td colSpan={2} className={cssClass({ ...tdSt, color: "#aaa", textAlign: "center" })}>No salary structure found.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <EmployeePanel
        payslip={payslip}
        structure={structure}
        month={payslip?.month}
        year={payslip?.year} />
      
    </div>);

}

// ── Reimb. Payslip tab ────────────────────────────────────────────────────────
function ReimbPayslipTab()
{
  return (
    <div className={cssClass({ border: "1px solid #e0e0e0", borderRadius: 8, padding: 60, textAlign: "center", background: "#fafbfc", minHeight: 260 })}>
      <div className={cssClass({ fontSize: 52, marginBottom: 12 })}>📋</div>
      <p className={cssClass({ color: "#94a3b8", fontSize: 13 })}>
        Looks like your reimbursement payslip has not been generated yet. Drop by later and we'll have it ready for you.
      </p>
    </div>);

}

// ── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
{ key: "payslip", label: "Payslip" },
{ key: "ctc", label: "CTC Payslip" },
{ key: "reimb", label: "Reimb. Payslip" }];


export default function Payslips()
{
  const now = new Date();
  const [activeTab, setActiveTab] = useState("payslip");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [structure, setStructure] = useState(null);
  const [myPayslips, setMyPayslips] = useState([]);
  const [user, setUser] = useState(null);
  const [empProfile, setEmpProfile] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [showInfo, setShowInfo] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() =>
  {
    Promise.all([
      getMySalaryStructure().catch(() => null),
      getMyPayslips({ limit: 36 }).then((r) => r?.data || r || []).catch(() => []),
      getCurrentUser().catch(() => null),
      getMyProfile().catch(() => null),
    ]).then(([s, p, u, profile]) =>
    {
      setStructure(s);
      setMyPayslips(Array.isArray(p) ? p : []);
      setUser(u);
      setEmpProfile(profile);
      // bank details are nested under profile.bankDetails (result set 3 of sp_get_employee_profile)
      if (profile?.bankDetails) {
        setBankDetails(profile.bankDetails);
      }
      // If no salary structure assigned yet, build a synthetic one from employee's base_salary / ctc
      if (!s && profile) {
        const basicMonthly = Number(profile.base_salary) || 0;
        const ctcAnnual    = Number(profile.ctc)         || 0;
        if (basicMonthly > 0 || ctcAnnual > 0) {
          setStructure({ basic: basicMonthly, ctc: ctcAnnual > 0 ? Math.round(ctcAnnual / 12) : undefined });
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  // Current payslip (for selected month/year)
  const currentPayslip = useMemo(() =>
  myPayslips.find((p) => Number(p.month) === selectedMonth && Number(p.year) === selectedYear),
  [myPayslips, selectedMonth, selectedYear]
  );

  // Month options from payslips + last 12 months
  const monthOptions = useMemo(() =>
  {
    const opts = new Map();
    for (let i = 0; i < 12; i++)
    {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      opts.set(`${y}-${m}`, { month: m, year: y });
    }
    myPayslips.forEach((p) =>
    {
      const key = `${p.year}-${p.month}`;
      opts.set(key, { month: Number(p.month), year: Number(p.year) });
    });
    return [...opts.values()].sort((a, b) => b.year - a.year || b.month - a.month);
  }, [myPayslips]);

  const handleDownload = async () =>
  {
    setDownloading(true);
    try
    {
      const record = await generateMyPayslip({ month: selectedMonth, year: selectedYear });
      const full = await getPayslipFull(record.payslip_id);
      await downloadPayslipPdf(full);
    } catch (err)
    {
      errorToast(err?.response?.data?.message || err?.message || "Download failed.");
    } finally
    {
      setDownloading(false);
    }
  };

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  if (loading)
  {
    return (
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#94a3b8" })}>
        <Loader2 size={20} className={cssClass({ marginRight: 8, animation: "spin 1s linear infinite" })} />
        Loading payslips…
      </div>);

  }

  return (
    <div className={cssClass({ background: "#f5f7fb", minHeight: "100vh", padding: 20 })}>
      {/* Tab bar + controls */}
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 })}>
        <div className={cssClass({ display: "flex", gap: 0 })}>
          {TABS.map((t) =>
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)} className={cssClass(
              {
                padding: "8px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: activeTab === t.key ? "#f18200" : "#fff",
                color: activeTab === t.key ? "#fff" : "#555",
                border: "1px solid #d0dde8",
                borderRadius: t.key === "payslip" ? "6px 0 0 6px" : t.key === "reimb" ? "0 6px 6px 0" : "0",
                borderLeft: t.key !== "payslip" ? "none" : undefined
              })}>
            
              {t.label}
            </button>
          )}
        </div>

        <div className={cssClass({ display: "flex", alignItems: "center", gap: 10 })}>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading} className={cssClass(
              {
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", background: "#f18200", color: "#fff",
                border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
                opacity: downloading ? 0.7 : 1
              })}>
            
            <Download size={14} />
            {downloading ? "…" : ""}
          </button>
          <select
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) =>
            {
              const [y, m] = e.target.value.split("-").map(Number);
              setSelectedYear(y);
              setSelectedMonth(m);
            }} className={cssClass(
              { padding: "7px 12px", border: "1px solid #cdd5e0", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff" })}>
            
            {monthOptions.map(({ month, year }) =>
            <option key={`${year}-${month}`} value={`${year}-${month}`}>
                {MONTH_NAMES[month - 1]} {year}
              </option>
            )}
          </select>
        </div>
      </div>

      {/* Tab content + Employee panel */}
      <div className={cssClass({ display: "flex", gap: 16, alignItems: "flex-start" })}>
        <div className={cssClass({ flex: 1, background: "#fff", border: "1px solid #ffe0b2", borderRadius: 8, padding: 20 })}>
          {activeTab === "payslip" &&
          <PayslipTab payslip={currentPayslip} structure={structure} empProfile={empProfile} />
          }
          {activeTab === "ctc" &&
          <CtcPayslipTab payslip={currentPayslip} structure={structure} empProfile={empProfile} />
          }
          {activeTab === "reimb" && <ReimbPayslipTab />}
        </div>

        {/* Info toggle button (shown when panel hidden) */}
        {!showInfo &&
        <p

          onClick={() => setShowInfo(true)} className={cssClass(
            { padding: "8px 14px", background: "#fff", border: "1px solid #e8e1a0", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#7b7b3b", cursor: "pointer", whiteSpace: "nowrap" })}>
          
            Show Info
          </p>
        }

        {/* Employee panel */}
        {showInfo &&
        <EmployeePanel
          user={user}
          payslip={currentPayslip}
          structure={structure}
          empProfile={empProfile}
          bankDetails={bankDetails}
          month={selectedMonth}
          year={selectedYear}
          onHide={() => setShowInfo(false)} />
        }
      </div>

      {/* Month label footer */}
      <div className={cssClass({ textAlign: "center", marginTop: 12, fontSize: 12, color: "#94a3b8" })}>
        Showing payslip for <strong>{monthLabel}</strong>
        {!currentPayslip && activeTab !== "reimb" &&
        <span className={cssClass({ color: "#f59e0b", marginLeft: 8 })}>· Payslip not yet generated for this month</span>
        }
      </div>
    </div>);

}
