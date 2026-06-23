import React, { useEffect, useMemo, useState } from "react";
import { Download, ChevronDown, ChevronUp, ChevronRight, Info } from "lucide-react";
import { getMyPayslips, getMySalaryStructure } from "../../../api/payroll.api";
import { getCurrentUser } from "../../../api/auth.api";
import { calculatePayslip } from "../../../utils/payslipCalculations";
import { FiscalYearPicker } from "../../../component/YearPicker";
import {
  getCurrentFiscalYearStart,
  getFiscalYearRangeLabel,
  getFiscalMonthColumns,
} from "../../../lib/dateUtils";

const tbl = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits:2, maximumFractionDigits:2 });

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FISCAL_ORDER = [3,4,5,6,7,8,9,10,11,0,1,2];

/* ─── Tax calculation ─────────────────────────────────────────────────────── */
const NEW_SLABS  = [[400000,0],[400000,0.05],[400000,0.10],[400000,0.15],[400000,0.20],[Infinity,0.30]];
const OLD_SLABS  = [[250000,0],[250000,0.05],[500000,0.20],[Infinity,0.30]];

function slabTax(income, slabs) {
  let tax = 0, rem = income;
  for (const [limit, rate] of slabs) {
    if (rem <= 0) break;
    tax += Math.min(rem, limit) * rate;
    rem -= Math.min(rem, limit);
  }
  return Math.round(tax);
}

/* ─── Section-change mapping ─────────────────────────────────────────────── */
const SECTION_MAP = {
  exemption: [
    { old:"Section 10(5)",    new25:"Section 11 (Sch III (8))",  desc:"Travel concession or assistance (LTA/LTC)", key:"lta" },
    { old:"Section 10(10)",   new25:"Section 19 (1)(3)",          desc:"Death-cum-retirement gratuity exemption",   key:null },
    { old:"Section 10(10A)",  new25:"Section 19 (1)(7)",          desc:"Commuted value of pension exemption",       key:null },
    { old:"Section 10(10AA)", new25:"Section 19 (1)(14)",         desc:"Leave encashment on retirement",            key:null },
    { old:"Section 10(10B)",  new25:"Section 19 (1)(10)",         desc:"Retrenchment compensation",                 key:null },
    { old:"Section 10(13)",   new25:"Section 11 (Sch II (8))",   desc:"Approved superannuation fund",             key:null },
    { old:"Section 10(13A)",  new25:"Section 11 (Sch III (11))", desc:"House rent allowance (HRA)",               key:"hra" },
    { old:"Section 10(14)",   new25:"Section 11 (Sch III (12))", desc:"Special allowances",                       key:"special" },
    { old:"Section 10",       new25:"Section 11",                  desc:"Total exemption",                          key:null },
  ],
  deduction: [
    { old:"Section 16(ia)",    new25:"Section 19 (1)(2)",    desc:"Standard deduction",                  key:"basic" },
    { old:"Section 16(iii)",   new25:"Section 19 (1)(1)",    desc:"Professional tax",                    key:"profTax" },
    { old:"Section 24",        new25:"Section 22",            desc:"Housing loan interest",               key:null },
    { old:"Section 80C",       new25:"Section 123",           desc:"Investments (PPF, ELSS, etc.)",       key:"pf" },
    { old:"Section 80CCC",     new25:"Section 123",           desc:"Pension funds",                       key:null },
    { old:"Section 80CCD(1)",  new25:"Section 124 (5)",       desc:"NPS contribution",                    key:null },
    { old:"Section 80CCD(1B)", new25:"Section 124 (3)",       desc:"Additional NPS ₹50,000",         key:null },
    { old:"Section 80CCD(2)",  new25:"Section 124 (1)",       desc:"Employer NPS",                        key:null },
    { old:"Section 80CCE",     new25:"Section 123",           desc:"₹1.5 lakh aggregate limit",      key:"pf" },
    { old:"Section 80CCH",     new25:"Section 125",           desc:"Agnipath Scheme",                     key:null },
    { old:"Section 80D",       new25:"Section 126",           desc:"Health insurance",                    key:null },
    { old:"Section 80DD",      new25:"Section 127",           desc:"Dependent disability",                key:null },
    { old:"Section 80DDB",     new25:"Section 128",           desc:"Specified diseases",                  key:null },
    { old:"Section 80E",       new25:"Section 129",           desc:"Education loan interest",             key:null },
    { old:"Section 80EE",      new25:"Section 130",           desc:"Home loan interest (affordable)",     key:null },
    { old:"Section 80EEA",     new25:"Section 131",           desc:"Housing loan",                        key:null },
    { old:"Section 80EEB",     new25:"Section 132",           desc:"—",                              key:null },
    { old:"Section 80G",       new25:"Section 133",           desc:"Donations",                           key:null },
    { old:"Section 80GG",      new25:"Section 134",           desc:"Rent without HRA",                    key:null },
    { old:"Section 80GGA",     new25:"Section 135",           desc:"Scientific research donations",       key:null },
    { old:"Section 80GGC",     new25:"Section 137",           desc:"Political contributions",             key:null },
    { old:"Section 80TTA",     new25:"Section 153 (2)(a)",    desc:"Savings interest (₹10k)",        key:null },
    { old:"Section 80TTB",     new25:"Section 153 (2)(b)",    desc:"Senior citizen interest (₹50k)", key:null },
    { old:"Section 80U",       new25:"Section 154",           desc:"Disability deduction",                key:null },
    { old:"Chapter VI-A",      new25:"Chapter VIII",           desc:"Other deductions",                   key:null },
  ],
  regime: [
    { old:"Section 115BAC", new25:"Section 202", desc:"New tax regime",      key:"basic" },
    { old:"Section 87A",    new25:"Section 156", desc:"Tax rebate",           key:null },
    { old:"Section 89",     new25:"Section 157", desc:"Relief for arrears",   key:null },
  ],
  tds: [
    { old:"Section 192",     new25:"Section 392",    desc:"TDS on salary",                   key:"basic" },
    { old:"Section 192(2B)", new25:"Section 392(4)", desc:"Other income declaration",         key:null },
    { old:"Section 194P",    new25:"Section 392(8)", desc:"Senior citizen TDS exemption",     key:null },
    { old:"Section 197",     new25:"Section 395",    desc:"Lower TDS certificate",            key:null },
    { old:"Section 234E",    new25:"Section 427",    desc:"Late fee for TDS",                 key:null },
  ],
  forms: [
    { old:"Form 16",   new25:"Form 130", desc:"TDS certificate",        key:"basic" },
    { old:"Form 24Q",  new25:"Form 143", desc:"Quarterly TDS return",   key:"basic" },
    { old:"Form 12BB", new25:"Form 124", desc:"Employee declaration",   key:"basic" },
  ],
};

const GROUPS = [
  { key:"exemption", label:"EXEMPTION",      color:"#1565c0", bg:"#e8f0fe" },
  { key:"deduction", label:"DEDUCTION",      color:"#6a1b9a", bg:"#f3e5f5" },
  { key:"regime",    label:"REGIME / REBATE",color:"#2e7d32", bg:"#e8f5e9" },
  { key:"tds",       label:"TDS",            color:"#e65100", bg:"#fff3e0" },
  { key:"forms",     label:"FORMS",          color:"#37474f", bg:"#eceff1" },
];

/* ─── Primitives ─────────────────────────────────────────────────────────── */
const TH = { padding:"8px 12px", fontSize:11, fontWeight:700, color:"#475569", borderBottom:"1px solid #d5dbe3", whiteSpace:"nowrap", background:"#e8f4fa" };
const TS = { padding:"7px 12px", fontSize:12, borderBottom:"1px solid #f1f5f9", whiteSpace:"nowrap" };
const TSS = (left, bold) => ({ ...TS, position:"sticky", left, background:"#fff", fontWeight:bold?700:400, color:"#334155", borderRight:"1px solid #e8edf2" });
const TN  = (bold) => ({ ...TS, textAlign:"right", fontWeight:bold?700:400, color:bold?"#1e293b":"#334155" });

function ColHead({ fiscalMonths }) {
  return (
    <thead><tr>
      <th style={{ ...TH, textAlign:"left", position:"sticky", left:0, zIndex:2, minWidth:160, borderRight:"1px solid #d5dbe3" }}>Items</th>
      <th style={{ ...TH, textAlign:"right", position:"sticky", left:160, zIndex:2, minWidth:110, borderRight:"1px solid #d5dbe3" }}>Total</th>
      {fiscalMonths.map((c) => <th key={c.key} style={{ ...TH, textAlign:"right", minWidth:90 }}>{c.label}</th>)}
    </tr></thead>
  );
}

function SecHdr({ label, amount, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 14px", background:"#e8f4fa", borderBottom:"1px solid #d5dbe3", cursor:onToggle?"pointer":"default", userSelect:"none" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:13, color:"#475569", lineHeight:1 }}>{onToggle?(expanded?"−":"+"):""}</span>
        <span style={{ fontSize:12, fontWeight:700, color:"#1e293b" }}>{label}</span>
      </div>
      {amount!=null && <span style={{ fontSize:12, fontWeight:700, color:"#1e293b" }}>{"₹"}{Number(amount||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>}
    </div>
  );
}

function CalcRow({ label, amount }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 14px", background:"#d6e4f0", borderBottom:"1px solid #d5dbe3" }}>
      <span style={{ fontSize:12, fontWeight:700, color:"#1e293b" }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:700, color:"#1e293b" }}>{"₹"}{Number(amount||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
    </div>
  );
}

function NoData() {
  return <div style={{ padding:"20px 14px", textAlign:"center", color:"#f18200", fontSize:12, fontWeight:600, background:"#fff", borderBottom:"1px solid #e2e8f0" }}>No data to display !!!</div>;
}

function KpiCard({ label, value, isLabel, green, orange }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #d5dbe3", borderRadius:6, padding:"10px 16px", flex:1, minWidth:0 }}>
      <div style={{ fontSize:9, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600, marginBottom:6 }}>{label}</div>
      {isLabel
        ? <div style={{ fontSize:13, fontWeight:700, color:green?"#16a34a":orange?"#f18200":"#1e293b" }}>{value}</div>
        : <div style={{ fontSize:16, fontWeight:800, color:"#1e293b" }}>{tbl(value)}</div>}
    </div>
  );
}

function FourColTable({ rows }) {
  return (
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
      <thead><tr style={{ background:"#e8f4fa" }}>
        <th style={{ ...TH, textAlign:"left", minWidth:180 }}>Items</th>
        <th style={{ ...TH, textAlign:"right", minWidth:120 }}>Raw Tax</th>
        <th style={{ ...TH, textAlign:"right", minWidth:100 }}>Surcharge</th>
        <th style={{ ...TH, textAlign:"right", minWidth:140 }}>Health &amp; Edu Cess</th>
        <th style={{ ...TH, textAlign:"right", minWidth:120 }}>Total</th>
      </tr></thead>
      <tbody>
        {rows.map((r,i) => (
          <tr key={i} style={{ background:r.bold?"#e8f4fa":"#fff", borderBottom:"1px solid #f1f5f9" }}>
            <td style={{ padding:"7px 12px", fontSize:12, color:"#475569", fontWeight:r.bold?700:400 }}>{r.label}</td>
            <td style={{ padding:"7px 12px", textAlign:"right", fontSize:12, fontWeight:r.bold?700:400, color:"#334155" }}>{tbl(r.raw)}</td>
            <td style={{ padding:"7px 12px", textAlign:"right", fontSize:12, fontWeight:r.bold?700:400, color:"#334155" }}>{tbl(r.surcharge)}</td>
            <td style={{ padding:"7px 12px", textAlign:"right", fontSize:12, fontWeight:r.bold?700:400, color:"#334155" }}>{tbl(r.cess)}</td>
            <td style={{ padding:"7px 12px", textAlign:"right", fontSize:12, fontWeight:r.bold?700:400, color:r.bold?"#f18200":"#334155" }}>{tbl(r.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ─── Regime Slab Info Panel ─────────────────────────────────────────────── */
function SlabInfoPanel({ regime, taxableIncome }) {
  const slabData = regime === "new"
    ? [
        { range:"Up to ₹4,00,000",             rate:"0%",  from:0,       to:400000 },
        { range:"₹4,00,001 – ₹8,00,000",   rate:"5%",  from:400000,  to:800000 },
        { range:"₹8,00,001 – ₹12,00,000",  rate:"10%", from:800000,  to:1200000 },
        { range:"₹12,00,001 – ₹16,00,000", rate:"15%", from:1200000, to:1600000 },
        { range:"₹16,00,001 – ₹20,00,000", rate:"20%", from:1600000, to:2000000 },
        { range:"Above ₹20,00,000",              rate:"30%", from:2000000, to:Infinity },
      ]
    : [
        { range:"Up to ₹2,50,000",              rate:"0%",  from:0,       to:250000 },
        { range:"₹2,50,001 – ₹5,00,000",   rate:"5%",  from:250000,  to:500000 },
        { range:"₹5,00,001 – ₹10,00,000",  rate:"20%", from:500000,  to:1000000 },
        { range:"Above ₹10,00,000",              rate:"30%", from:1000000, to:Infinity },
      ];

  return (
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
      <thead><tr style={{ background:"#e8f4fa" }}>
        <th style={{ ...TH, textAlign:"left" }}>Income Slab</th>
        <th style={{ ...TH, textAlign:"center" }}>Rate</th>
        <th style={{ ...TH, textAlign:"right" }}>Taxable Amount</th>
        <th style={{ ...TH, textAlign:"right" }}>Tax</th>
      </tr></thead>
      <tbody>
        {slabData.map(({ range, rate, from, to }) => {
          const taxable = Math.max(0, Math.min(taxableIncome, to) - from);
          const tax = Math.round(taxable * parseFloat(rate) / 100);
          const active = taxable > 0;
          return (
            <tr key={range} style={{ background:active?"#fffbeb":"#fff", borderBottom:"1px solid #f1f5f9" }}>
              <td style={{ padding:"7px 12px", color:active?"#1e293b":"#94a3b8", fontWeight:active?600:400 }}>{range}</td>
              <td style={{ padding:"7px 12px", textAlign:"center" }}>
                <span style={{ fontSize:11, fontWeight:700, color:active?"#f18200":"#94a3b8", background:active?"#fff7ed":"#f8fafc", padding:"2px 8px", borderRadius:10 }}>{rate}</span>
              </td>
              <td style={{ padding:"7px 12px", textAlign:"right", color:active?"#334155":"#94a3b8" }}>{active ? tbl(taxable) : "—"}</td>
              <td style={{ padding:"7px 12px", textAlign:"right", color:active?"#1e293b":"#94a3b8", fontWeight:active?700:400 }}>{active ? tbl(tax) : "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ─── View Details Modal ─────────────────────────────────────────────────── */
function ViewDetailsModal({ onClose, totals }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"32px 16px", overflowY:"auto" }}>
      <div style={{ background:"#fff", borderRadius:12, width:"100%", maxWidth:860, boxShadow:"0 24px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #e2e8f0" }}>
          <div>
            <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1e293b" }}>Income Tax Act 2025 — Section Changes</h3>
            <p style={{ margin:"4px 0 0", fontSize:12, color:"#64748b" }}>Mapping of old sections (IT Act 1961) to new sections (IT Act 2025)</p>
          </div>
          <button type="button" onClick={onClose} style={{ background:"none", border:"none", fontSize:18, color:"#64748b", cursor:"pointer", lineHeight:1 }}>{"✕"}</button>
        </div>
        <div style={{ padding:"16px 20px", maxHeight:"70vh", overflowY:"auto" }}>
          {GROUPS.map(({ key, label, color, bg }) => (
            <div key={key} style={{ marginBottom:20 }}>
              <div style={{ background:bg, padding:"6px 12px", borderRadius:6, marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color, letterSpacing:"0.06em" }}>{label}</span>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr style={{ background:"#f8fafc" }}>
                  <th style={{ padding:"7px 12px", textAlign:"left", fontWeight:700, color:"#475569", borderBottom:"1px solid #e2e8f0", width:"22%" }}>IT Act 1961</th>
                  <th style={{ padding:"7px 12px", textAlign:"left", fontWeight:700, color:"#475569", borderBottom:"1px solid #e2e8f0", width:"28%" }}>IT Act 2025</th>
                  <th style={{ padding:"7px 12px", textAlign:"left", fontWeight:700, color:"#475569", borderBottom:"1px solid #e2e8f0" }}>Description</th>
                  <th style={{ padding:"7px 12px", textAlign:"center", fontWeight:700, color:"#475569", borderBottom:"1px solid #e2e8f0", width:90 }}>Applicable</th>
                </tr></thead>
                <tbody>
                  {SECTION_MAP[key].map((row, i) => {
                    const active = row.key ? (totals[row.key] || 0) > 0 : false;
                    return (
                      <tr key={i} style={{ background:active?"#fffbeb":"#fff", borderBottom:"1px solid #f1f5f9" }}>
                        <td style={{ padding:"7px 12px", color:"#334155", fontWeight:active?600:400 }}>{row.old}</td>
                        <td style={{ padding:"7px 12px", color:active?color:"#334155", fontWeight:active?700:400 }}>{row.new25}</td>
                        <td style={{ padding:"7px 12px", color:"#475569" }}>{row.desc}</td>
                        <td style={{ padding:"7px 12px", textAlign:"center" }}>
                          {active
                            ? <span style={{ fontSize:11, fontWeight:700, color:"#16a34a", background:"#dcfce7", padding:"2px 8px", borderRadius:10 }}>{"✓"} Active</span>
                            : <span style={{ fontSize:11, color:"#94a3b8" }}>{"—"}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <div style={{ padding:"12px 20px", borderTop:"1px solid #e2e8f0", textAlign:"right" }}>
          <button type="button" onClick={onClose} style={{ padding:"8px 20px", background:"#f18200", color:"#fff", border:"none", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ITStatement() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [payslips, setPayslips]   = useState([]);
  const [structure, setStructure] = useState(null);
  const [empInfo, setEmpInfo]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [regime, setRegime]       = useState("new"); // "new" | "old"
  const [showInfo, setShowInfo]   = useState(false);
  const [allOpen, setAllOpen]     = useState(true);
  const [showHRA, setShowHRA]     = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [open, setOpen] = useState({ a:true,b:true,c:true,d:true,f:true,g:true,i:true,k:true,ki:false,kh:false,m:true,o:true,p:true,q:true,r:true });
  const tog = (k) => setOpen((p) => ({ ...p, [k]:!p[k] }));
  const toggleAll = () => {
    const next = !allOpen; setAllOpen(next);
    setOpen({ a:next,b:next,c:next,d:next,f:next,g:next,i:next,k:next,ki:false,kh:false,m:next,o:next,p:next,q:next,r:next });
  };

  useEffect(() => {
    Promise.all([
      getMyPayslips({ limit:24 }).then((r) => Array.isArray(r) ? r : r?.data ?? []),
      getMySalaryStructure().catch(() => null),
      getCurrentUser().catch(() => null),
    ])
      .then(([p, s, u]) => {
        setPayslips(p);
        setStructure(s);
        const latestSlip = Array.isArray(p) ? p[0] : null;
        setEmpInfo({
          name:      `${u?.first_name ?? u?.name ?? latestSlip?.first_name ?? ""}${u?.last_name ? " "+u.last_name : latestSlip?.last_name ? " "+latestSlip.last_name : ""}`.trim() || "—",
          bank:      latestSlip?.bank_name      || s?.bank_name      || u?.bank_name      || "—",
          bankAcc:   latestSlip?.bank_account_number || s?.bank_account_number || u?.bank_account_number || "—",
          joining:   latestSlip?.emp_joining_date || u?.emp_joining_date
                       ? new Date(latestSlip?.emp_joining_date || u?.emp_joining_date)
                           .toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })
                       : "—",
          pfNo:      latestSlip?.pf_number || s?.pf_number || u?.pf_number || "—",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fiscalMonths = getFiscalMonthColumns(fiscalYearStart);

  const monthData = useMemo(() => {
    const fy = Number(fiscalYearStart);
    return FISCAL_ORDER.map((mIdx) => {
      const year = mIdx >= 3 ? fy : fy + 1;
      const slip = payslips.find((p) => Number(p.month)===mIdx+1 && Number(p.year)===year);
      if (slip) return { label:MONTH_LABELS[mIdx],
        basic:Number(slip.basic??0), hra:Number(slip.hra??0), special:Number(slip.special_allowance??0),
        lta:Number(slip.lta??0), telephone:Number(slip.telephone_and_internet??0),
        gross:Number(slip.gross_salary??slip.total_earnings??0),
        pf:Number(slip.pf_employee??slip.pf??0), profTax:Number(slip.professional_tax??200),
        netPay:Number(slip.net_salary??slip.net_pay??0) };
      if (structure?.basic) {
        const b = calculatePayslip(Number(structure.basic));
        return { label:MONTH_LABELS[mIdx], basic:b.basic, hra:b.hra, special:b.specialAllowance,
          lta:b.lta, telephone:b.telephoneAndInternet, gross:b.totalEarnings,
          pf:b.pf, profTax:b.profTax, netPay:b.netSalary };
      }
      return { label:MONTH_LABELS[mIdx], basic:0,hra:0,special:0,lta:0,telephone:0,gross:0,pf:0,profTax:0,netPay:0 };
    });
  }, [payslips, structure, fiscalYearStart]);

  const T = useMemo(() => {
    const sum = (k) => monthData.reduce((a,m)=>a+(m[k]||0),0);
    return { basic:sum("basic"),hra:sum("hra"),special:sum("special"),lta:sum("lta"),
      telephone:sum("telephone"),gross:sum("gross"),pf:sum("pf"),profTax:sum("profTax"),netPay:sum("netPay") };
  }, [monthData]);

  /* ── Tax computation based on regime ── */
  const isNew = regime === "new";

  const grossSalary      = T.gross;
  const hraExemption     = 0;
  const prevEmployerInc  = 0;
  const incAfterExempt   = grossSalary - hraExemption + prevEmployerInc;

  // Standard deduction: ₹75,000 new | ₹50,000 old
  const STD_DED          = isNew ? 75000 : 50000;
  const stdDed           = Math.min(STD_DED, incAfterExempt);
  const chargeableSal    = Math.max(0, incAfterExempt - stdDed);
  const grossTotal       = chargeableSal;

  // Chapter VI-A / VIII deductions: 0 under new regime, PF under old (capped ₹1.5L)
  const ch8Ded           = isNew ? 0 : Math.min(T.pf, 150000);
  const taxableIncome    = Math.max(0, grossTotal - ch8Ded);

  const rawTax           = slabTax(taxableIncome, isNew ? NEW_SLABS : OLD_SLABS);
  const cess             = Math.round(rawTax * 0.04);
  const totalTax         = rawTax + cess;
  const monthlyTDS       = Math.round(totalTax / 12);

  const now      = new Date();
  const elapsed  = now.getMonth() < 3 ? now.getMonth()+9 : now.getMonth()-3;
  const taxPaid  = monthlyTDS * Math.min(elapsed, 12);
  const remaining= Math.max(0, totalTax - taxPaid);
  const remMonths= Math.max(1, 12 - elapsed);
  const monthlyCess  = Math.round(cess / 12);
  const monthlyRaw   = monthlyTDS - monthlyCess;

  const INCOME_ROWS = [
    { key:"basic",     label:"Basic" },
    { key:"hra",       label:"HRA" },
    { key:"special",   label:"Special Allowance" },
    { key:"lta",       label:"Lta" },
    { key:"telephone", label:"Telephone And Internet Expenses" },
  ];
  const DED_ROWS = [{ key:"pf", label:"PF" }, { key:"profTax", label:"Prof Tax" }];

  if (loading) return <div style={{ padding:40,textAlign:"center",color:"#94a3b8",fontSize:14 }}>Loading...</div>;

  return (
    <div style={{ minHeight:"100vh", background:"#f0f4f8", padding:20 }}>
      {showViewDetails && <ViewDetailsModal onClose={() => setShowViewDetails(false)} totals={T} />}

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:10 }}>
        {/* Info banner */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", background:"#e8f4fb", border:"1px solid #b8d9f0", borderRadius:6, fontSize:12, color:"#1e6b9e", flex:1 }}>
          <span>&#9432;</span>
          <span>Section names updated as per Income Tax Act 2025. Your saved data remains unchanged.</span>
          <button onClick={() => setShowViewDetails(true)} style={{ color:"#f18200", fontWeight:700, background:"none", border:"none", cursor:"pointer", fontSize:12 }}>View Details</button>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#f18200", color:"#fff", borderRadius:6, border:"none", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            <Download size={13} />
          </button>
          <FiscalYearPicker value={fiscalYearStart} onChange={setFiscalYearStart} />
        </div>
      </div>

      {/* Regime toggle */}
      <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:16, background:"#fff", border:"1px solid #d5dbe3", borderRadius:8, padding:4, width:"fit-content" }}>
        {[
          { key:"new", label:"New Tax Regime", sub:"IT Act 2025" },
          { key:"old", label:"Old Tax Regime", sub:"IT Act 1961" },
        ].map(({ key, label, sub }) => (
          <button
            key={key}
            type="button"
            onClick={() => setRegime(key)}
            style={{
              padding:"8px 22px", border:"none", borderRadius:6, cursor:"pointer", transition:"all 0.15s",
              background: regime===key ? "#f18200" : "transparent",
              color: regime===key ? "#fff" : "#64748b",
              fontWeight: regime===key ? 700 : 400,
              fontSize:13,
            }}
          >
            <div>{label}</div>
            <div style={{ fontSize:10, opacity:0.8, fontWeight:400 }}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Regime comparison note */}
      <div style={{ marginBottom:14, padding:"10px 14px", background: isNew?"#fffbeb":"#f0fdf4", border:`1px solid ${isNew?"#fde68a":"#bbf7d0"}`, borderRadius:6, fontSize:12 }}>
        {isNew ? (
          <span style={{ color:"#92400e" }}>
            <strong>New Tax Regime (IT Act 2025):</strong> Standard deduction ₹75,000. No Chapter VI-A/VIII deductions. Lower slab rates (0%–30% in 6 bands).
          </span>
        ) : (
          <span style={{ color:"#166534" }}>
            <strong>Old Tax Regime (IT Act 1961):</strong> Standard deduction ₹50,000. Chapter VI-A deductions applicable (80C PF up to ₹1.5L, etc.). Slab rates: 0%/5%/20%/30%.
          </span>
        )}
      </div>

      {/* Employee Info toggle */}
      <div style={{ marginBottom:14 }}>
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:"#fff", border:"1px solid #d5dbe3", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:600, color:"#334155" }}
        >
          <Info size={14} color="#f18200" />
          {showInfo ? "Hide Employee Info" : "Show Employee Info"}
        </button>

        {showInfo && (
          <div style={{ marginTop:8, background:"#fff", border:"1px solid #d5dbe3", borderRadius:8, padding:"14px 20px", display:"flex", flexWrap:"wrap", gap:"18px 40px" }}>
            {[
              { label:"Name",            value: empInfo?.name },
              { label:"Bank",            value: empInfo?.bank },
              { label:"Bank Account No", value: empInfo?.bankAcc },
              { label:"Joining Date",    value: empInfo?.joining },
              { label:"PF No",           value: empInfo?.pfNo },
            ].map(({ label, value }) => (
              <div key={label} style={{ minWidth:160 }}>
                <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:700, color: value && value !== "—" ? "#1e293b" : "#94a3b8" }}>{value || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI */}
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        <KpiCard label="Tax Calculated As Per" value={isNew ? "NEW TAX REGIME" : "OLD TAX REGIME"} isLabel green={isNew} orange={!isNew} />
        <KpiCard label="Standard Deduction" value={stdDed} />
        <KpiCard label={isNew ? "Chapter VIII Deduction" : "Chapter VI-A Deduction (80C PF)"} value={ch8Ded} />
        <KpiCard label="Net Tax In ₹" value={totalTax} />
        <KpiCard label="Tax Deductible Per Month In ₹" value={monthlyTDS} />
      </div>

      {/* Collapse all */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <button type="button" onClick={toggleAll} style={{ fontSize:12, color:"#1e6b9e", background:"none", border:"none", cursor:"pointer", padding:0, fontWeight:600, textDecoration:"underline" }}>
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
        <span style={{ fontSize:12, color:"#64748b" }}>Value in ₹</span>
      </div>

      <div style={{ background:"#fff", border:"1px solid #d5dbe3", borderRadius:8, overflow:"hidden" }}>

        {/* A */}
        <SecHdr label="A. Income" amount={grossSalary} expanded={open.a} onToggle={() => tog("a")} />
        {open.a && (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <ColHead fiscalMonths={fiscalMonths} />
              <tbody>
                <tr style={{ background:"#f8fafc" }}>
                  <td colSpan={fiscalMonths.length+2} style={{ padding:"6px 14px", fontSize:11, fontWeight:700, color:"#64748b", borderBottom:"1px solid #e2e8f0" }}>{"▾"} Monthly Income</td>
                </tr>
                {INCOME_ROWS.map(({ key, label }) => (
                  <tr key={key}>
                    <td style={TSS(0,false)}>{label}</td>
                    <td style={{ ...TSS(160,false), textAlign:"right" }}>{tbl(T[key])}</td>
                    {monthData.map((m,i) => <td key={i} style={{ ...TN(false), color:m[key]>0?"#334155":"#94a3b8" }}>{tbl(m[key])}</td>)}
                  </tr>
                ))}
                <tr style={{ background:"#e8f4fa" }}>
                  <td style={{ ...TSS(0,true), background:"#e8f4fa" }}>Sub Total</td>
                  <td style={{ ...TSS(160,true), background:"#e8f4fa", textAlign:"right" }}>{tbl(T.gross)}</td>
                  {monthData.map((m,i) => <td key={i} style={{ ...TN(true), color:m.gross>0?"#1e293b":"#94a3b8" }}>{tbl(m.gross)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* B */}
        <SecHdr label="B. Deductions" amount={T.pf+T.profTax} expanded={open.b} onToggle={() => tog("b")} />
        {open.b && (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <ColHead fiscalMonths={fiscalMonths} />
              <tbody>
                <tr style={{ background:"#f8fafc" }}>
                  <td colSpan={fiscalMonths.length+2} style={{ padding:"6px 14px", fontSize:11, fontWeight:700, color:"#64748b", borderBottom:"1px solid #e2e8f0" }}>{"▾"} (Blanks)</td>
                </tr>
                {DED_ROWS.map(({ key, label }) => (
                  <tr key={key}>
                    <td style={TSS(0,false)}>{label}</td>
                    <td style={{ ...TSS(160,false), textAlign:"right" }}>{tbl(T[key])}</td>
                    {monthData.map((m,i) => <td key={i} style={{ ...TN(false), color:m[key]>0?"#334155":"#94a3b8" }}>{tbl(m[key])}</td>)}
                  </tr>
                ))}
                <tr style={{ background:"#e8f4fa" }}>
                  <td style={{ ...TSS(0,true), background:"#e8f4fa" }}>Total</td>
                  <td style={{ ...TSS(160,true), background:"#e8f4fa", textAlign:"right" }}>{tbl(T.pf+T.profTax)}</td>
                  {monthData.map((m,i) => <td key={i} style={{ ...TN(true), color:(m.pf+m.profTax)>0?"#1e293b":"#94a3b8" }}>{tbl((m.pf||0)+(m.profTax||0))}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* C */}
        <SecHdr label="C. Perquisites" amount={0} expanded={open.c} onToggle={() => tog("c")} />
        {open.c && <NoData />}

        {/* D */}
        <SecHdr label="D. Income Excluded From Tax" amount={0} expanded={open.d} onToggle={() => tog("d")} />
        {open.d && <NoData />}

        {/* E */}
        <CalcRow label="E. Gross Salary (A + C - D)" amount={grossSalary} />

        {/* F */}
        <SecHdr label="F. Exemption Under Section 11" amount={hraExemption} expanded={open.f} onToggle={() => tog("f")} />
        {open.f && (
          <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 14px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>Items</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>Exemption</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 14px", borderBottom:"1px solid #f1f5f9" }}>
              <span style={{ fontSize:12, color:"#475569" }}>HOUSE RENT ALLOWANCE : Section 11 (Sch III (11))</span>
              <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                <button type="button" onClick={() => setShowHRA(!showHRA)} style={{ fontSize:11, color:"#1e6b9e", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>
                  {showHRA ? "Hide HRA Details" : "Show HRA Details"}
                </button>
                <span style={{ fontSize:12, color:"#334155", minWidth:60, textAlign:"right" }}>{tbl(hraExemption)}</span>
              </div>
            </div>
            {showHRA && [
              { label:"TOTAL RENT PAID P.A.",      value:0 },
              { label:"HRA RECEIVED",               value:T.hra, hi:true },
              { label:"60% OF BASIC",               value:T.basic*0.6 },
              { label:"RENT PAID - 10% (BASIC)",    value:0 },
            ].map(({ label, value, hi }) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 14px 7px 28px", borderBottom:"1px solid #f1f5f9" }}>
                <span style={{ fontSize:12, color:"#475569" }}>{label}</span>
                <span style={{ fontSize:12, fontWeight:500, color:hi?"#f18200":"#334155", minWidth:60, textAlign:"right" }}>{tbl(value)}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 14px", background:"#f8fafc" }}>
              <span style={{ fontSize:12, fontWeight:700, color:"#1e293b" }}>Total</span>
              <span style={{ fontSize:12, fontWeight:700, color:"#1e293b" }}>{tbl(hraExemption)}</span>
            </div>
          </div>
        )}

        {/* G */}
        <SecHdr label="G. Income From Previous Employer" amount={prevEmployerInc} expanded={open.g} onToggle={() => tog("g")} />
        {open.g && (
          <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 14px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>Items</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>Amount</span>
            </div>
            {["TOTAL INCOME","INCOME TAX","PROFESSIONAL TAX","PROVIDENT FUND"].map((label) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 14px", borderBottom:"1px solid #f1f5f9" }}>
                <span style={{ fontSize:12, color:"#475569" }}>{label}</span>
                <span style={{ fontSize:12, color:"#94a3b8" }}>{tbl(0)}</span>
              </div>
            ))}
          </div>
        )}

        {/* H */}
        <CalcRow label="H. Income After Exemption (E - F + G)" amount={incAfterExempt} />

        {/* I */}
        <SecHdr label={isNew ? "I. Less Deduction under Section 19 (Standard Deduction)" : "I. Less Deduction under Section 16 (Standard Deduction)"} amount={stdDed} expanded={open.i} onToggle={() => tog("i")} />
        {open.i && (
          <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 14px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>Items</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>Amount</span>
            </div>
            {[
              { label: isNew ? "TAX ON EMPLOYMENT - Section 19(1)(1)" : "TAX ON EMPLOYMENT - Section 16(b)(iii)", value:0 },
              { label: isNew ? "STANDARD DEDUCTION - Section 19(1)(2) (₹75,000)" : "STANDARD DEDUCTION - Section 16(1)(2) (₹50,000)", value:STD_DED },
            ].map(({ label, value }) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 14px", borderBottom:"1px solid #f1f5f9" }}>
                <span style={{ fontSize:12, color:"#475569" }}>{label}</span>
                <span style={{ fontSize:12, color:value>0?"#334155":"#94a3b8" }}>{tbl(value)}</span>
              </div>
            ))}
          </div>
        )}

        {/* J */}
        <CalcRow label="J. Income Chargeable Under The Head Salaries (H - I)" amount={chargeableSal} />

        {/* K */}
        <SecHdr label="K. Income From Other Sources (Including House Properties)" amount={0} expanded={open.k} onToggle={() => tog("k")} />
        {open.k && (
          <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0" }}>
            <div onClick={() => tog("ki")} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 14px", borderBottom:"1px solid #f1f5f9", cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {open.ki ? <ChevronDown size={12} color="#64748b" /> : <ChevronRight size={12} color="#64748b" />}
                <span style={{ fontSize:12, color:"#475569" }}>Other Incomes</span>
              </div>
              <span style={{ fontSize:12, color:"#94a3b8" }}>{tbl(0)}</span>
            </div>
            <div onClick={() => tog("kh")} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 14px", borderBottom:"1px solid #f1f5f9", cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {open.kh ? <ChevronDown size={12} color="#64748b" /> : <ChevronRight size={12} color="#64748b" />}
                <span style={{ fontSize:12, color:"#475569" }}>Income/Loss from house properties</span>
              </div>
              <span style={{ fontSize:12, color:"#94a3b8" }}>{tbl(0)}</span>
            </div>
          </div>
        )}

        {/* L */}
        <CalcRow label="L. Gross Total Income (J + K)" amount={grossTotal} />

        {/* M */}
        <SecHdr
          label={isNew ? "M. Deduction Under Chapter VIII (Not applicable under New Regime)" : "M. Deduction Under Chapter VI-A (80C, 80D, etc.)"}
          amount={ch8Ded}
          expanded={open.m}
          onToggle={() => tog("m")}
        />
        {open.m && (
          isNew ? (
            <div style={{ padding:"12px 14px", background:"#fffbeb", borderBottom:"1px solid #e2e8f0", fontSize:12, color:"#92400e" }}>
              Chapter VIII deductions are <strong>not applicable</strong> under the New Tax Regime (IT Act 2025). Switch to Old Tax Regime to claim 80C, 80D and other deductions.
            </div>
          ) : (
            <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0" }}>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 14px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
                <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>Section</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>Amount</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 14px", borderBottom:"1px solid #f1f5f9" }}>
                <span style={{ fontSize:12, color:"#475569" }}>Section 80C — Provident Fund (capped ₹1,50,000)</span>
                <span style={{ fontSize:12, color:"#334155" }}>{tbl(ch8Ded)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 14px", background:"#f8fafc" }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#1e293b" }}>Total</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#1e293b" }}>{tbl(ch8Ded)}</span>
              </div>
            </div>
          )
        )}

        {/* N */}
        <CalcRow label="N. Taxable Income (L - M)" amount={taxableIncome} />

        {/* O */}
        <SecHdr label="O. Annual Tax" amount={totalTax} expanded={open.o} onToggle={() => tog("o")} />
        {open.o && (
          <>
            <SlabInfoPanel regime={regime} taxableIncome={taxableIncome} />
            <FourColTable rows={[{ label:"Total Annual Tax", raw:rawTax, surcharge:0, cess, total:totalTax, bold:true }]} />
          </>
        )}

        {/* P */}
        <SecHdr label="P. Tax Paid Till Date" amount={taxPaid} expanded={open.p} onToggle={() => tog("p")} />
        {open.p && (
          <FourColTable rows={[
            { label:"Deduction (through Payroll)", raw:0, surcharge:0, cess:0, total:0 },
            { label:"Direct TDS",                   raw:0, surcharge:0, cess:0, total:0 },
            { label:"Previous Employment",           raw:0, surcharge:0, cess:0, total:0 },
            { label:"Total", raw:0, surcharge:0, cess:0, total:0, bold:true },
          ]} />
        )}

        {/* Q */}
        <SecHdr label="Q. Balance Payable" amount={remaining} expanded={open.q} onToggle={() => tog("q")} />
        {open.q && <FourColTable rows={[{ label:"", raw:rawTax, surcharge:0, cess, total:remaining }]} />}

        {/* R */}
        <SecHdr label="R. TDS Recovered in Current Month" amount={monthlyTDS} expanded={open.r} onToggle={() => tog("r")} />
        {open.r && (
          <>
            <div style={{ padding:"6px 14px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#64748b" }}>(i) Monthly Tax</span>
            </div>
            <FourColTable rows={[{ label:"", raw:monthlyRaw, surcharge:0, cess:monthlyCess, total:monthlyTDS }]} />
          </>
        )}

      </div>
    </div>
  );
}
