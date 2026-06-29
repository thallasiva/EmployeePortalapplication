/**
 * AdminPayrollSetup — Setup / Configuration section
 * Tabs: Salary Components | Revision Planner | Payroll Settings
 */
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { listSalaryStructures } from "../../api/payroll.api";

const ORANGE = "#f18200";
const TABS = [
  { key:"components", label:"Salary Components" },
  { key:"revision",   label:"Revision Planner" },
  { key:"settings",   label:"Payroll Settings" },
];

const fmtINR = (v) =>
  "₹ " + Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });

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
                borderBottom:"2px solid #eee", color:"#555", fontWeight:600, whiteSpace:"nowrap"
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

/* ── SALARY COMPONENTS ────────────────────────────────────────── */
function SalaryComponents() {
  const [structs, setStructs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    listSalaryStructures({ limit: 500 })
      .then(r => setStructs(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = structs.filter(s => {
    const name = `${s.emp_code} ${s.employee_name || s.emp_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const cols = [
    { key:"emp_code",           label:"Emp Code" },
    { key:"employee_name",      label:"Employee", render:r=>r.employee_name||r.emp_name||"—" },
    { key:"effective_from",     label:"Effective From", render:r=>
      r.effective_from ? new Date(r.effective_from).toLocaleDateString("en-IN") : "—"
    },
    { key:"basic",              label:"Basic",         right:true, render:r=>fmtINR(r.basic) },
    { key:"hra",                label:"HRA",           right:true, render:r=>fmtINR(r.hra) },
    { key:"conveyance",         label:"Conveyance",    right:true, render:r=>fmtINR(r.conveyance) },
    { key:"medical_allowance",  label:"Medical",       right:true, render:r=>fmtINR(r.medical_allowance) },
    { key:"special_allowance",  label:"Special Allow.",right:true, render:r=>fmtINR(r.special_allowance) },
    { key:"lta",                label:"LTA",           right:true, render:r=>fmtINR(r.lta) },
    { key:"telephone_allowance",label:"Telephone",     right:true, render:r=>fmtINR(r.telephone_allowance) },
    { key:"pf_employee",        label:"PF (Emp)",      right:true, render:r=>fmtINR(r.pf_employee) },
    { key:"pf_employer",        label:"PF (Emp'r)",    right:true, render:r=>fmtINR(r.pf_employer) },
    { key:"professional_tax",   label:"Prof. Tax",     right:true, render:r=>fmtINR(r.professional_tax) },
    { key:"ctc",                label:"CTC",           right:true, render:r=>(
      <span style={{ fontWeight:700, color:ORANGE }}>{fmtINR(r.ctc)}</span>
    )},
  ];

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"#aaa" }}>Loading…</div>;
  return (
    <>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:13, color:"#666" }}>{filtered.length} salary structure{filtered.length!==1?"s":""}</div>
        <input
          placeholder="Search employee…"
          value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{ padding:"7px 14px", border:"1px solid #ddd", borderRadius:6, fontSize:13, width:220 }}
        />
      </div>
      <Table cols={cols} rows={filtered} emptyMsg="No salary structures found" />
    </>
  );
}

/* ── REVISION PLANNER ─────────────────────────────────────────── */
function RevisionPlanner() {
  const [structs, setStructs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSalaryStructures({ limit: 500 })
      .then(r => {
        const all = r.data || [];
        // Group by employee, sort by effective_from, show revision history
        const map = {};
        all.forEach(s => {
          if (!map[s.employee_id]) map[s.employee_id] = [];
          map[s.employee_id].push(s);
        });
        // Create rows: each employee + their latest two structures (old → new)
        const revisions = [];
        Object.values(map).forEach(empStructs => {
          const sorted = empStructs.sort((a,b)=>new Date(a.effective_from||0)-new Date(b.effective_from||0));
          for (let i=1;i<sorted.length;i++) {
            const prev = sorted[i-1];
            const curr = sorted[i];
            revisions.push({
              emp_code: curr.emp_code,
              employee_name: curr.employee_name || curr.emp_name,
              revision_date: curr.effective_from,
              prev_ctc: Number(prev.ctc || 0),
              new_ctc: Number(curr.ctc || 0),
              increment: Number(curr.ctc||0) - Number(prev.ctc||0),
              increment_pct: prev.ctc ? (((curr.ctc-prev.ctc)/prev.ctc)*100).toFixed(1) : "0",
            });
          }
          // Also add current structure if no revisions
          if (sorted.length === 1) {
            revisions.push({
              emp_code: sorted[0].emp_code,
              employee_name: sorted[0].employee_name || sorted[0].emp_name,
              revision_date: sorted[0].effective_from,
              prev_ctc: null,
              new_ctc: Number(sorted[0].ctc || 0),
              increment: null,
              increment_pct: null,
              is_initial: true,
            });
          }
        });
        setStructs(revisions.sort((a,b)=>new Date(b.revision_date||0)-new Date(a.revision_date||0)));
      })
      .finally(() => setLoading(false));
  }, []);

  const cols = [
    { key:"emp_code",       label:"Emp Code" },
    { key:"employee_name",  label:"Employee" },
    { key:"revision_date",  label:"Effective Date", render:r=>
      r.revision_date ? new Date(r.revision_date).toLocaleDateString("en-IN") : "—"
    },
    { key:"prev_ctc",       label:"Previous CTC",  right:true, render:r=>
      r.is_initial ? <span style={{ color:"#aaa" }}>Initial</span> : fmtINR(r.prev_ctc)
    },
    { key:"new_ctc",        label:"Revised CTC",   right:true, render:r=>(
      <span style={{ fontWeight:600 }}>{fmtINR(r.new_ctc)}</span>
    )},
    { key:"increment",      label:"Increment",     right:true, render:r=>(
      r.is_initial ? "—" :
      <span style={{ color:r.increment>=0?"#16a34a":"#dc2626", fontWeight:600 }}>
        {r.increment>=0?"+":""}{fmtINR(r.increment)}
      </span>
    )},
    { key:"increment_pct",  label:"Hike %",        right:true, render:r=>(
      r.is_initial ? "—" :
      <span style={{
        background: Number(r.increment_pct)>0?"#dcfce7":"#fee2e2",
        color: Number(r.increment_pct)>0?"#166534":"#dc2626",
        borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600
      }}>{r.increment_pct}%</span>
    )},
  ];

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"#aaa" }}>Loading…</div>;
  return (
    <>
      <div style={{ marginBottom:12, fontSize:13, color:"#666" }}>
        Salary revision history across all employees
      </div>
      <Table cols={cols} rows={structs} emptyMsg="No salary revisions found" />
    </>
  );
}

/* ── PAYROLL SETTINGS ─────────────────────────────────────────── */
function PayrollSettings() {
  const [settings, setSettings] = useState({
    pfEnabled: true,      pfCap: 15000,
    esiEnabled: true,     esiGrossLimit: 21000,
    ptEnabled: true,
    payrollCycleDay: 25,  salaryDay: 1,
    taxRegime: "new",
    emailPayslips: true,
  });

  const ToggleRow = ({ label, desc, field }) => (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"14px 0", borderBottom:"1px solid #f0f0f0"
    }}>
      <div>
        <div style={{ fontWeight:600, fontSize:14, color:"#1a1a1a" }}>{label}</div>
        <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{desc}</div>
      </div>
      <div
        onClick={()=>setSettings(p=>({...p,[field]:!p[field]}))}
        style={{
          width:44, height:24, borderRadius:12, cursor:"pointer", position:"relative",
          background: settings[field] ? ORANGE : "#ddd", transition:"background .2s"
        }}
      >
        <div style={{
          position:"absolute", top:2, width:20, height:20, borderRadius:"50%",
          background:"#fff", transition:"left .2s", boxShadow:"0 1px 3px #0004",
          left: settings[field] ? 22 : 2,
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:640 }}>
      <div style={{ marginBottom:20 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:"#1a1a1a" }}>Statutory Deductions</h3>
        <ToggleRow label="Provident Fund (EPF)" desc={`12% of basic capped at ₹${settings.pfCap.toLocaleString("en-IN")}`} field="pfEnabled" />
        <ToggleRow label="Employee State Insurance (ESI)" desc={`0.75% of gross (employees earning ≤ ₹${settings.esiGrossLimit.toLocaleString("en-IN")}/month)`} field="esiEnabled" />
        <ToggleRow label="Professional Tax" desc="Computed per state slab on gross earnings" field="ptEnabled" />
      </div>

      <div style={{ marginBottom:20 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:"#1a1a1a" }}>Payroll Cycle</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <label style={{ fontSize:13, color:"#555", fontWeight:600 }}>Payroll Processing Day</label>
            <select value={settings.payrollCycleDay} onChange={e=>setSettings(p=>({...p,payrollCycleDay:Number(e.target.value)}))}
              style={{ width:"100%", padding:"8px 12px", borderRadius:6, border:"1px solid #ddd", fontSize:13, marginTop:6 }}>
              {[20,21,22,23,24,25,26,27,28].map(d=><option key={d} value={d}>{d}th of each month</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:13, color:"#555", fontWeight:600 }}>Salary Credit Day</label>
            <select value={settings.salaryDay} onChange={e=>setSettings(p=>({...p,salaryDay:Number(e.target.value)}))}
              style={{ width:"100%", padding:"8px 12px", borderRadius:6, border:"1px solid #ddd", fontSize:13, marginTop:6 }}>
              {[1,2,3,4,5].map(d=><option key={d} value={d}>{d}st of next month</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:"#1a1a1a" }}>Tax Configuration</h3>
        <div style={{ display:"flex", gap:12 }}>
          {["old","new"].map(regime=>(
            <div key={regime}
              onClick={()=>setSettings(p=>({...p,taxRegime:regime}))}
              style={{
                flex:1, padding:"14px 18px", borderRadius:8, cursor:"pointer",
                border: settings.taxRegime===regime ? `2px solid ${ORANGE}` : "2px solid #eee",
                background: settings.taxRegime===regime ? "#fff8f0" : "#fff",
              }}
            >
              <div style={{ fontWeight:700, fontSize:14, color: settings.taxRegime===regime?ORANGE:"#1a1a1a" }}>
                {regime === "new" ? "New Tax Regime (Default)" : "Old Tax Regime"}
              </div>
              <div style={{ fontSize:12, color:"#888", marginTop:4 }}>
                {regime === "new"
                  ? "Lower rates, no exemptions/deductions"
                  : "Higher rates with HRA, 80C, 80D deductions"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <h3 style={{ margin:"0 0 8px", fontSize:15, fontWeight:700, color:"#1a1a1a" }}>Notifications</h3>
        <ToggleRow label="Email payslips to employees" desc="Send payslip PDF via email after payroll is processed" field="emailPayslips" />
      </div>

      <button style={{
        padding:"10px 24px", background:ORANGE, color:"#fff", border:"none",
        borderRadius:6, cursor:"pointer", fontSize:14, fontWeight:600
      }}>Save Settings</button>
    </div>
  );
}

/* ── MAIN ────────────────────────────────────────────────────── */
export default function AdminPayrollSetup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "components";

  const setTab = (t) => setSearchParams({ tab: t });

  return (
    <div style={{ padding:"28px 32px", fontFamily:"sans-serif" }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1a1a1a" }}>Payroll Setup</h2>
        <p style={{ margin:"4px 0 0", color:"#888", fontSize:13 }}>
          Salary structures, revision history and payroll configuration
        </p>
      </div>

      <div style={{ display:"flex", gap:0, borderBottom:"2px solid #eee", marginBottom:24 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding:"10px 20px", border:"none", background:"none", cursor:"pointer",
              fontSize:13, fontWeight: tab===t.key?700:500,
              color: tab===t.key ? ORANGE : "#666",
              borderBottom: tab===t.key ? `2px solid ${ORANGE}` : "2px solid transparent",
              marginBottom:-2
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ background:"#fff", borderRadius:10, border:"1px solid #eee", padding:20, boxShadow:"0 1px 4px #0000000a" }}>
        {tab === "components" && <SalaryComponents />}
        {tab === "revision"   && <RevisionPlanner />}
        {tab === "settings"   && <PayrollSettings />}
      </div>
    </div>
  );
}
