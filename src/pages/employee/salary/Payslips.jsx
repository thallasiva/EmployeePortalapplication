import React, { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  getMyPayslips,
  getPayslipFull,
  generateMyPayslip,
  getMySalaryStructure,
} from "../../../api/payroll.api";
import { calculatePayslip } from "../../../utils/payslipCalculations";
import { downloadPayslipPdf } from "../../../utils/payslipPdfGenerator";
import { errorToast } from "../../../utils/ToastControllers";
import { getCurrentUser } from "../../../api/auth.api";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function fmtAmt(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Employee details side panel ───────────────────────────────────────────────
function EmployeePanel({ user, payslip, structure, month, year, onHide }) {
  const empNo   = payslip?.emp_code     || user?.emp_code     || user?.employee_code || "—";
  const empName = [
    payslip?.first_name || user?.first_name || "",
    payslip?.last_name  || user?.last_name  || "",
  ].join(" ").trim() || user?.name || "—";
  const bank    = payslip?.bank_name          || structure?.bank_name          || user?.bank_name          || "—";
  const bankAcc = payslip?.bank_account_number || structure?.bank_account_number || user?.bank_account_number || "—";
  const rawDate = payslip?.emp_joining_date   || user?.emp_joining_date        || user?.joining_date       || structure?.joining_date;
  const joinDate = rawDate
    ? new Date(rawDate).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })
    : "—";
  const pfNo    = payslip?.pf_number  || structure?.pf_number  || user?.pf_number  || user?.pf_no  || "—";
  const netPay  = Number(payslip?.net_salary ?? payslip?.net_pay ?? 0);
  const monthLabel = month ? `${MONTH_NAMES[Number(month) - 1]} ${year}` : "—";

  return (
    <div style={{ background:"#fffde7", border:"1px solid #e8e1a0", borderRadius:8, padding:16, minWidth:220 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:11, color:"#7b7b3b", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em" }}>
          Employee details
        </span>
        <button
          type="button"
          onClick={onHide}
          style={{ fontSize:11, color:"#f18200", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}
        >
          Hide
        </button>
      </div>
      {[
        { label:"Employee No",      value: empNo },
        { label:"Name",             value: empName },
        { label:"Bank",             value: bank },
        { label:"Bank Account No",  value: bankAcc },
        { label:"Joining Date",     value: joinDate },
        { label:"PF No",            value: pfNo },
      ].map(({ label, value }) => (
        <div key={label} style={{ marginBottom:10 }}>
          <div style={{ fontSize:10, color:"#9e9e5a" }}>{label}</div>
          <div style={{ fontSize:13, color: value !== "—" ? "#333" : "#bbb", fontWeight:500, marginTop:2, wordBreak:"break-all" }}>{value}</div>
        </div>
      ))}
      <div style={{ marginTop:14, paddingTop:12, borderTop:"1px dashed #d4ce7a" }}>
        <div style={{ fontSize:11, color:"#7b7b3b" }}>Net Pay for {monthLabel}</div>
        <div style={{ fontSize:22, fontWeight:800, color:"#1a1a1a", marginTop:4 }}>
          ₹{fmtAmt(netPay)}
        </div>
      </div>
    </div>
  );
}

// ── Payslip tab ───────────────────────────────────────────────────────────────
function PayslipTab({ payslip, structure }) {
  const b = useMemo(() => {
    const basic = Number(payslip?.basic || structure?.basic || 0);
    return basic > 0 ? calculatePayslip(basic) : null;
  }, [payslip, structure]);

  const earnings = b ? [
    { label:"BASIC",                           value: b.basic },
    { label:"HRA",                             value: b.hra },
    { label:"SPECIAL ALLOWANCE",               value: b.specialAllowance },
    { label:"LTA",                             value: b.lta },
    { label:"TELEPHONE AND INTERNET EXPENSES", value: b.telephoneAndInternet },
  ] : [];

  const deductions = b ? [
    { label:"PF",          value: b.pf },
    { label:"PROF TAX",    value: b.profTax },
    { label:"INCOME TAX",  value: b.incomeTax },
  ] : [];

  const totalEarnings  = earnings.reduce((s, r) => s + r.value, 0);
  const totalDeductions = deductions.reduce((s, r) => s + r.value, 0);

  const tableSt = { width:"100%", borderCollapse:"collapse", fontSize:13 };
  const thSt   = { background:"#fff8f0", padding:"6px 10px", textAlign:"right", fontSize:11, color:"#5a7a8a", fontWeight:600 };
  const thLSt  = { ...thSt, textAlign:"left" };
  const tdSt   = { padding:"7px 10px", borderBottom:"1px solid #f0f0f0", color:"#333" };
  const tdRSt  = { ...tdSt, textAlign:"right", fontFamily:"monospace", color:"#222" };
  const tfSt   = { padding:"8px 10px", fontWeight:700, color:"#1a1a1a" };
  const tfRSt  = { ...tfSt, textAlign:"right", fontFamily:"monospace", fontSize:14 };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:16, alignItems:"start" }}>
      {/* Earnings */}
      <div style={{ border:"1px solid #ffe0b2", borderRadius:6, overflow:"hidden" }}>
        <table style={tableSt}>
          <thead>
            <tr>
              <th style={thLSt}>Earnings</th>
              <th style={thSt}>Amount in (₹)</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map((r) => (
              <tr key={r.label}>
                <td style={tdSt}>{r.label}</td>
                <td style={tdRSt}>{fmtAmt(r.value)}</td>
              </tr>
            ))}
            {!earnings.length && (
              <tr><td colSpan={2} style={{ ...tdSt, color:"#aaa", textAlign:"center" }}>No data</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ borderTop:"2px solid #ffe0b2" }}>
              <td style={tfSt}>Total</td>
              <td style={tfRSt}>{fmtAmt(totalEarnings)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Deductions */}
      <div style={{ border:"1px solid #ffe0b2", borderRadius:6, overflow:"hidden" }}>
        <table style={tableSt}>
          <thead>
            <tr>
              <th style={thLSt}>Deductions</th>
              <th style={thSt}>Amount in (₹)</th>
            </tr>
          </thead>
          <tbody>
            {deductions.map((r) => (
              <tr key={r.label}>
                <td style={tdSt}>{r.label}</td>
                <td style={tdRSt}>{fmtAmt(r.value)}</td>
              </tr>
            ))}
            {!deductions.length && (
              <tr><td colSpan={2} style={{ ...tdSt, color:"#aaa", textAlign:"center" }}>No data</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ borderTop:"2px solid #ffe0b2" }}>
              <td style={tfSt}>Total</td>
              <td style={tfRSt}>{fmtAmt(totalDeductions)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Employee details */}
      <EmployeePanel
        payslip={payslip}
        structure={structure}
        month={payslip?.month}
        year={payslip?.year}
      />
    </div>
  );
}

// ── CTC Payslip tab ───────────────────────────────────────────────────────────
function CtcPayslipTab({ payslip, structure }) {
  const b = useMemo(() => {
    const basic = Number(payslip?.basic || structure?.basic || 0);
    return basic > 0 ? calculatePayslip(basic) : null;
  }, [payslip, structure]);

  const items = b ? [
    { label:"FULL BASIC",                           value: b.basic },
    { label:"FULL HRA",                             value: b.hra },
    { label:"FULL SPECIAL ALLOWANCE",               value: b.specialAllowance },
    { label:"FULL LTA",                             value: b.lta },
    { label:"FULL TELEPHONE AND INTERNET EXEPENSES",value: b.telephoneAndInternet },
    { label:"FULL EMPLOYER PF",                     value: b.pf, highlight:"#c8380a" },
    { label:"MONTHLY GROSS",                        value: b.totalEarnings, highlight:"#f18200", bold:true },
    { label:"MONTHLY CTC",                          value: b.totalEarnings + b.pf, highlight:"#f18200", bold:true },
  ] : [];

  const tableSt = { width:"100%", borderCollapse:"collapse", fontSize:13 };
  const thSt = { background:"#fff8f0", padding:"6px 10px", fontSize:11, color:"#5a7a8a", fontWeight:600, textAlign:"right" };
  const thLSt = { ...thSt, textAlign:"left" };
  const tdSt = { padding:"7px 10px", borderBottom:"1px solid #f0f0f0" };
  const tdRSt = { ...tdSt, textAlign:"right", fontFamily:"monospace" };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:16, alignItems:"start" }}>
      <div style={{ border:"1px solid #ffe0b2", borderRadius:6, overflow:"hidden" }}>
        <table style={tableSt}>
          <thead>
            <tr>
              <th style={thLSt}>Items</th>
              <th style={thSt}>Amount in (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.label}>
                <td style={{ ...tdSt, color: r.highlight || "#333", fontWeight: r.bold ? 700 : 400 }}>{r.label}</td>
                <td style={{ ...tdRSt, color: r.highlight || "#222", fontWeight: r.bold ? 700 : 400 }}>{fmtAmt(r.value)}</td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={2} style={{ ...tdSt, color:"#aaa", textAlign:"center" }}>No salary structure found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <EmployeePanel
        payslip={payslip}
        structure={structure}
        month={payslip?.month}
        year={payslip?.year}
      />
    </div>
  );
}

// ── Reimb. Payslip tab ────────────────────────────────────────────────────────
function ReimbPayslipTab() {
  return (
    <div style={{ border:"1px solid #e0e0e0", borderRadius:8, padding:60, textAlign:"center", background:"#fafbfc", minHeight:260 }}>
      <div style={{ fontSize:52, marginBottom:12 }}>📋</div>
      <p style={{ color:"#94a3b8", fontSize:13 }}>
        Looks like your reimbursement payslip has not been generated yet. Drop by later and we'll have it ready for you.
      </p>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key:"payslip", label:"Payslip" },
  { key:"ctc",     label:"CTC Payslip" },
  { key:"reimb",   label:"Reimb. Payslip" },
];

export default function Payslips() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState("payslip");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());

  const [structure, setStructure]   = useState(null);
  const [myPayslips, setMyPayslips] = useState([]);
  const [user, setUser]             = useState(null);
  const [showInfo, setShowInfo]     = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      getMySalaryStructure().catch(() => null),
      getMyPayslips({ limit: 36 }).then((r) => r?.data || r || []).catch(() => []),
      getCurrentUser().catch(() => null),
    ]).then(([s, p, u]) => {
      setStructure(s);
      setMyPayslips(Array.isArray(p) ? p : []);
      setUser(u);
    }).finally(() => setLoading(false));
  }, []);

  // Current payslip (for selected month/year)
  const currentPayslip = useMemo(() =>
    myPayslips.find((p) => Number(p.month) === selectedMonth && Number(p.year) === selectedYear),
    [myPayslips, selectedMonth, selectedYear]
  );

  // Month options from payslips + last 12 months
  const monthOptions = useMemo(() => {
    const opts = new Map();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      opts.set(`${y}-${m}`, { month: m, year: y });
    }
    myPayslips.forEach((p) => {
      const key = `${p.year}-${p.month}`;
      opts.set(key, { month: Number(p.month), year: Number(p.year) });
    });
    return [...opts.values()].sort((a, b) => b.year - a.year || b.month - a.month);
  }, [myPayslips]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const record = await generateMyPayslip({ month: selectedMonth, year: selectedYear });
      const full   = await getPayslipFull(record.payslip_id);
      await downloadPayslipPdf(full);
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message || "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200, color:"#94a3b8" }}>
        <Loader2 size={20} style={{ marginRight:8, animation:"spin 1s linear infinite" }} />
        Loading payslips…
      </div>
    );
  }

  return (
    <div style={{ background:"#f5f7fb", minHeight:"100vh", padding:20 }}>
      {/* Tab bar + controls */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ display:"flex", gap:0 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{
                padding:"8px 22px", fontSize:13, fontWeight:600, cursor:"pointer",
                background: activeTab === t.key ? "#f18200" : "#fff",
                color:      activeTab === t.key ? "#fff" : "#555",
                border:     "1px solid #d0dde8",
                borderRadius: t.key === "payslip" ? "6px 0 0 6px" : t.key === "reimb" ? "0 6px 6px 0" : "0",
                borderLeft:   t.key !== "payslip" ? "none" : undefined,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"8px 14px", background:"#f18200", color:"#fff",
              border:"none", borderRadius:6, fontSize:13, fontWeight:600, cursor:"pointer",
              opacity: downloading ? 0.7 : 1,
            }}
          >
            <Download size={14} />
            {downloading ? "…" : ""}
          </button>
          <select
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-").map(Number);
              setSelectedYear(y);
              setSelectedMonth(m);
            }}
            style={{ padding:"7px 12px", border:"1px solid #cdd5e0", borderRadius:6, fontSize:13, outline:"none", background:"#fff" }}
          >
            {monthOptions.map(({ month, year }) => (
              <option key={`${year}-${month}`} value={`${year}-${month}`}>
                {MONTH_NAMES[month - 1]} {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab content + Employee panel */}
      <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
        <div style={{ flex:1, background:"#fff", border:"1px solid #ffe0b2", borderRadius:8, padding:20 }}>
          {activeTab === "payslip" && (
            <PayslipTab payslip={currentPayslip} structure={structure} />
          )}
          {activeTab === "ctc" && (
            <CtcPayslipTab payslip={currentPayslip} structure={structure} />
          )}
          {activeTab === "reimb" && <ReimbPayslipTab />}
        </div>

        {/* Info toggle button (shown when panel hidden) */}
        {!showInfo && (
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            style={{ padding:"8px 14px", background:"#fff", border:"1px solid #e8e1a0", borderRadius:6, fontSize:12, fontWeight:600, color:"#7b7b3b", cursor:"pointer", whiteSpace:"nowrap" }}
          >
            Show Info
          </button>
        )}

        {/* Employee panel */}
        {showInfo && (
          <EmployeePanel
            user={user}
            payslip={currentPayslip}
            structure={structure}
            month={selectedMonth}
            year={selectedYear}
            onHide={() => setShowInfo(false)}
          />
        )}
      </div>

      {/* Month label footer */}
      <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"#94a3b8" }}>
        Showing payslip for <strong>{monthLabel}</strong>
        {!currentPayslip && activeTab !== "reimb" && (
          <span style={{ color:"#f59e0b", marginLeft:8 }}>· Payslip not yet generated for this month</span>
        )}
      </div>
    </div>
  );
}
