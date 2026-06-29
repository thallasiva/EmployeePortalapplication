/**
 * AdminPayrollStatement — Verify section
 * Tabs: Quick Salary Statement | Payroll Statement | CTC Payslip | Payroll Differences
 */
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { listPayslips } from "../../api/payroll.api";

const ORANGE = "#f18200";
const TABS = [
  { key: "quick",      label: "Quick Salary Statement" },
  { key: "statement",  label: "Payroll Statement" },
  { key: "ctc",        label: "CTC Payslip" },
  { key: "diff",       label: "Payroll Differences" },
];

const fmtINR = (v) =>
  "₹ " + Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });

function MonthBar({ month, year, onChange }) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const years = [];
  const now = new Date();
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) years.push(y);
  return (
    <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:20 }}>
      <select
        value={month}
        onChange={e => onChange(Number(e.target.value), year)}
        style={{ padding:"6px 12px", borderRadius:6, border:"1px solid #ddd", fontSize:14 }}
      >
        {months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
      </select>
      <select
        value={year}
        onChange={e => onChange(month, Number(e.target.value))}
        style={{ padding:"6px 12px", borderRadius:6, border:"1px solid #ddd", fontSize:14 }}
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

function Table({ cols, rows, emptyMsg = "No data" }) {
  if (!rows.length) return (
    <div style={{ textAlign:"center", padding:60, color:"#aaa", fontSize:14 }}>{emptyMsg}</div>
  );
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
          <tr style={{ background:"#fafafa" }}>
            {cols.map(c => (
              <th key={c.key} style={{
                padding:"10px 12px", textAlign:c.right?"right":"left",
                borderBottom:"2px solid #eee", color:"#555", fontWeight:600,
                whiteSpace:"nowrap"
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i%2===0?"#fff":"#fafafa" }}>
              {cols.map(c => (
                <td key={c.key} style={{
                  padding:"9px 12px", borderBottom:"1px solid #f0f0f0",
                  textAlign:c.right?"right":"left", color:"#333", whiteSpace:"nowrap"
                }}>
                  {c.render ? c.render(r) : (r[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── QUICK SALARY STATEMENT ─────────────────────────────────── */
function QuickStatement({ payslips }) {
  const cols = [
    { key:"sno",     label:"S.No",        render:(_,i)=>i+1 },
    { key:"emp_code",label:"Emp Code" },
    { key:"employee_name", label:"Employee Name" },
    { key:"department_name", label:"Department" },
    { key:"working_days", label:"Work Days", right:true },
    { key:"paid_days",    label:"Paid Days",  right:true },
    { key:"lop_days",     label:"LOP Days",   right:true },
    { key:"gross_earnings", label:"Gross",    right:true, render:r=>fmtINR(r.gross_earnings) },
    { key:"deductions",   label:"Deductions", right:true, render:r=>fmtINR(r.deductions) },
    { key:"net_pay",      label:"Net Pay",    right:true, render:r=>(
      <span style={{ fontWeight:600, color:ORANGE }}>{fmtINR(r.net_pay)}</span>
    )},
  ];
  const rows = payslips.map((r,i)=>({...r,sno:i+1}));
  const totalNet = payslips.reduce((s,r)=>s+Number(r.net_pay||0),0);
  return (
    <>
      <Table cols={cols} rows={rows} emptyMsg="No payslips for this month" />
      {payslips.length>0 && (
        <div style={{ textAlign:"right", padding:"12px 0", fontWeight:600, fontSize:14 }}>
          Total Net Pay: <span style={{ color:ORANGE }}>{fmtINR(totalNet)}</span>
        </div>
      )}
    </>
  );
}

/* ── PAYROLL STATEMENT ──────────────────────────────────────── */
function PayrollStatement({ payslips }) {
  const cols = [
    { key:"emp_code",      label:"Emp Code" },
    { key:"employee_name", label:"Name" },
    { key:"department_name",label:"Dept" },
    { key:"basic",         label:"Basic",       right:true, render:r=>fmtINR(r.basic) },
    { key:"hra",           label:"HRA",         right:true, render:r=>fmtINR(r.hra) },
    { key:"allowances",    label:"Allowances",  right:true, render:r=>fmtINR(r.allowances) },
    { key:"gross_earnings",label:"Gross",       right:true, render:r=>fmtINR(r.gross_earnings) },
    { key:"deductions",    label:"Deductions",  right:true, render:r=>fmtINR(r.deductions) },
    { key:"net_pay",       label:"Net Pay",     right:true, render:r=>(
      <span style={{ fontWeight:600, color:ORANGE }}>{fmtINR(r.net_pay)}</span>
    )},
    { key:"lop_days",      label:"LOP",         right:true },
    { key:"status",        label:"Status",      render:r=>{
      const clr = r.status==="paid"?"#16a34a":r.status==="generated"?"#2563eb":"#888";
      return <span style={{
        background:clr+"22", color:clr, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600
      }}>{(r.status||"draft").toUpperCase()}</span>;
    }},
  ];
  return <Table cols={cols} rows={payslips} emptyMsg="No payslips for this month" />;
}

/* ── CTC PAYSLIP ─────────────────────────────────────────────── */
function CTCPayslip({ payslips }) {
  const cols = [
    { key:"emp_code",      label:"Emp Code" },
    { key:"employee_name", label:"Employee" },
    { key:"designation_name", label:"Designation" },
    { key:"basic",         label:"Basic",      right:true, render:r=>fmtINR(r.basic) },
    { key:"hra",           label:"HRA",        right:true, render:r=>fmtINR(r.hra) },
    { key:"allowances",    label:"Allowances", right:true, render:r=>fmtINR(r.allowances) },
    { key:"gross_earnings",label:"Gross",      right:true, render:r=>fmtINR(r.gross_earnings) },
    { key:"ctc",           label:"CTC",        right:true, render:r=>{
      const ctc = Number(r.ctc)>0 ? Number(r.ctc) : Number(r.ctc_computed)||0;
      return <span style={{ fontWeight:600 }}>{fmtINR(ctc)}</span>;
    }},
    { key:"ctcAnnual",     label:"Annual CTC", right:true, render:r=>{
      const ctc = Number(r.ctc)>0 ? Number(r.ctc) : Number(r.ctc_computed)||0;
      return fmtINR(ctc*12);
    }},
  ];
  return <Table cols={cols} rows={payslips} emptyMsg="No payslips for this month" />;
}

/* ── PAYROLL DIFFERENCES ─────────────────────────────────────── */
function PayrollDiff({ month, year }) {
  const [prevSlips, setPrevSlips] = useState([]);
  const [currSlips, setCurrSlips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    Promise.all([
      listPayslips({ month: prevM, year: prevY, limit: 500 }),
      listPayslips({ month, year, limit: 500 }),
    ]).then(([p, c]) => {
      setPrevSlips(p.data || []);
      setCurrSlips(c.data || []);
    }).finally(() => setLoading(false));
  }, [month, year]);

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"#aaa" }}>Loading…</div>;

  const prevMap = {};
  (prevSlips).forEach(r => { prevMap[r.employee_id] = r; });

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const prevLabel = `${MONTH_NAMES[(month===1?12:month)-2]} ${month===1?year-1:year}`;
  const currLabel = `${MONTH_NAMES[month-1]} ${year}`;

  const rows = currSlips.map(c => {
    const p = prevMap[c.employee_id];
    const diff = Number(c.net_pay||0) - Number(p?.net_pay||0);
    return { ...c, prev_net: p?.net_pay||0, diff };
  });

  const cols = [
    { key:"emp_code",      label:"Emp Code" },
    { key:"employee_name", label:"Employee" },
    { key:"prev_net",      label:`Net (${prevLabel})`, right:true, render:r=>fmtINR(r.prev_net) },
    { key:"net_pay",       label:`Net (${currLabel})`, right:true, render:r=>fmtINR(r.net_pay) },
    { key:"diff",          label:"Difference",          right:true, render:r=>{
      const d = r.diff;
      const clr = d>0?"#16a34a":d<0?"#dc2626":"#888";
      return <span style={{ color:clr, fontWeight:600 }}>{d>=0?"+":""}{fmtINR(d)}</span>;
    }},
    { key:"lop_days",      label:"LOP Days", right:true },
  ];
  return <Table cols={cols} rows={rows} emptyMsg="No data for this month" />;
}

/* ── MAIN ────────────────────────────────────────────────────── */
export default function AdminPayrollStatement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "quick";

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading]   = useState(true);

  const setTab = (t) => setSearchParams({ tab: t });

  const load = useCallback(() => {
    if (tab === "diff") return;
    setLoading(true);
    listPayslips({ month, year, limit: 500 })
      .then(r => setPayslips(r.data || []))
      .catch(() => setPayslips([]))
      .finally(() => setLoading(false));
  }, [month, year, tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding:"28px 32px", fontFamily:"sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1a1a1a" }}>Payroll Reports</h2>
        <p style={{ margin:"4px 0 0", color:"#888", fontSize:13 }}>
          Salary statements and payroll verification
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, borderBottom:"2px solid #eee", marginBottom:24 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding:"10px 20px", border:"none", background:"none", cursor:"pointer",
              fontSize:13, fontWeight: tab===t.key?700:500,
              color: tab===t.key ? ORANGE : "#666",
              borderBottom: tab===t.key ? `2px solid ${ORANGE}` : "2px solid transparent",
              marginBottom:-2, transition:"all .15s"
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Month picker (hidden for diff which manages its own) */}
      {tab !== "diff" && (
        <MonthBar month={month} year={year} onChange={(m,y)=>{ setMonth(m); setYear(y); }} />
      )}

      {/* Content */}
      <div style={{ background:"#fff", borderRadius:10, border:"1px solid #eee", padding:20, boxShadow:"0 1px 4px #0000000a" }}>
        {loading && tab!=="diff" ? (
          <div style={{ padding:60, textAlign:"center", color:"#aaa" }}>Loading…</div>
        ) : (
          <>
            {tab === "quick"     && <QuickStatement payslips={payslips} />}
            {tab === "statement" && <PayrollStatement payslips={payslips} />}
            {tab === "ctc"       && <CTCPayslip payslips={payslips} />}
            {tab === "diff"      && <PayrollDiff month={month} year={year} />}
          </>
        )}
      </div>
    </div>
  );
}
