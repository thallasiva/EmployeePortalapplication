import { useEffect, useState, useCallback } from "react";
import { X, ChevronRight, Plus, Trash2, Lock, CheckCircle2, XCircle, Clock, Save, Send } from "lucide-react";
import { getMySalaryStructure } from "../../../api/payroll.api";
import { buildSalaryBreakdown } from "../../../utils/salaryBreakdown";
import { getMyITDeclaration, saveMyITDeclaration } from "../../../api/itDeclaration.api";

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtDec = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, onSave, onClear, children }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000, background:"rgba(15,23,42,0.55)",
      display:"flex", alignItems:"flex-start", justifyContent:"center",
      padding:"28px 16px", overflowY:"auto", backdropFilter:"blur(2px)",
    }}>
      <div style={{
        background:"#fff", borderRadius:14, width:"100%", maxWidth:640,
        boxShadow:"0 24px 64px rgba(0,0,0,0.22)", overflow:"hidden",
      }}>
        {/* Orange accent strip */}
        <div style={{ height:4, background:"linear-gradient(90deg,#f18200,#ffb347)" }} />
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 22px", borderBottom:"1px solid #f1f5f9" }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#1e293b", letterSpacing:"-0.01em" }}>{title}</h3>
          <button type="button" onClick={onClose}
            style={{ width:30, height:30, borderRadius:"50%", border:"none", background:"#f1f5f9",
              cursor:"pointer", color:"#64748b", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={15} />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding:"18px 22px", maxHeight:"62vh", overflowY:"auto" }}>
          {children}
        </div>
        {/* Footer */}
        <div style={{ display:"flex", gap:10, padding:"14px 22px", borderTop:"1px solid #f1f5f9", background:"#fafafa" }}>
          <button type="button" onClick={onSave} style={{
            flex:1, padding:"10px", background:"#f18200", color:"#fff", border:"none",
            borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer",
            boxShadow:"0 2px 8px rgba(241,130,0,0.3)",
          }}>Save & Close</button>
          <button type="button" onClick={onClear} style={{
            padding:"10px 20px", background:"#fff", color:"#64748b",
            border:"1px solid #e2e8f0", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer",
          }}>Clear</button>
        </div>
      </div>
    </div>
  );
}

// ── Amount row ────────────────────────────────────────────────────────────────
function AmtRow({ section, label, maxLimit, value, onChange }) {
  const filled = !!value && Number(value) > 0;
  return (
    <div style={{
      display:"flex", alignItems:"center", padding:"10px 10px",
      borderBottom:"1px solid #f1f5f9", gap:10,
      background: filled ? "#fffbf5" : "transparent",
      borderRadius: filled ? 6 : 0,
      marginBottom: filled ? 2 : 0,
      transition:"background 0.15s",
    }}>
      <div style={{ flex:1 }}>
        {section && (
          <span style={{
            fontSize:9, fontWeight:700, color:"#f18200",
            background:"#fff7ed", border:"1px solid #fed7aa",
            borderRadius:4, padding:"1px 5px", marginRight:6,
            display:"inline-block", verticalAlign:"middle",
          }}>{section}</span>
        )}
        <span style={{ fontSize:12.5, color:"#334155" }}>{label}</span>
        {maxLimit && (
          <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>
            Limit: ₹{maxLimit}
          </div>
        )}
      </div>
      <div style={{ flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", border:"1px solid #e2e8f0",
          borderRadius:6, overflow:"hidden", background:"#fff",
          boxShadow: filled ? "0 0 0 2px rgba(241,130,0,0.15)" : "none" }}>
          <span style={{ padding:"6px 8px", background:"#f8fafc", borderRight:"1px solid #e2e8f0",
            fontSize:12, color:"#64748b", userSelect:"none" }}>₹</span>
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            placeholder="0"
            style={{ width:100, padding:"6px 8px", border:"none", fontSize:12,
              textAlign:"right", outline:"none", color:"#1e293b", background:"transparent" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── SECTION 123 & 124 Modal ───────────────────────────────────────────────────
const SEC123_ITEMS = [
  { section:"123", label:"5 Years of Fixed Deposit in Scheduled Bank", max:"1,50,000.00" },
  { section:"123", label:"Children Tuition Fees", max:"1,50,000.00" },
  { section:"123", label:"Contribution to Pension Fund", max:"1,50,000.00" },
  { section:"123", label:"Deposit in NSC", max:"1,50,000.00" },
  { section:"123", label:"Deposit in NSS", max:"1,50,000.00" },
  { section:"123", label:"Deposit in Post Office Savings Schemes", max:"1,50,000.00" },
  { section:"123", label:"Equity Linked Savings Scheme ( ELSS )", max:"1,50,000.00" },
  { section:"123", label:"Interest on NSC Reinvested", max:"1,50,000.00" },
  { section:"123", label:"Life Insurance Premium", max:"1,50,000.00" },
  { section:"123", label:"Long term Infrastructure Bonds", max:"1,50,000.00" },
  { section:"123", label:"Mutual Funds", max:"1,50,000.00" },
  { section:"123", label:"NABARD Rural Bonds", max:"1,50,000.00" },
  { section:"123", label:"National Pension Scheme", max:"1,50,000.00" },
  { section:"123", label:"NHB Scheme", max:"1,50,000.00" },
  { section:"123", label:"Post office time deposit for 5 years", max:"1,50,000.00" },
  { section:"123", label:"Pradhan Mantri Suraksha Bima Yojana", max:"1,50,000.00" },
  { section:"123", label:"Public Provident Fund", max:"1,50,000.00" },
  { section:"123", label:"Repayment of Housing loan(Principal amount)", max:"1,50,000.00" },
  { section:"123", label:"Stamp duty and Registration charges", max:"1,50,000.00" },
  { section:"123", label:"Sukanya Samriddhi Yojana", max:"1,50,000.00" },
  { section:"123", label:"Unit Linked Insurance Premium (ULIP)", max:"1,50,000.00" },
];

function Modal123({ values, setValues, onClose }) {
  const total = SEC123_ITEMS.reduce((s, item) => s + (Number(values[item.label]) || 0), 0);
  const effective = Math.min(total, 150000);
  const pct = Math.min((effective / 150000) * 100, 100);
  return (
    <Modal
      title="Section 123 and 124"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setValues({})}
    >
      {/* Summary card */}
      <div style={{ borderRadius:10, overflow:"hidden", border:"1px solid #fed7aa", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 16px", background:"linear-gradient(135deg,#fff7ed,#ffedd5)" }}>
          <div>
            <div style={{ fontSize:11, color:"#92400e", fontWeight:600, marginBottom:2 }}>Total Declared</div>
            <div style={{ fontSize:20, fontWeight:800, color:"#f18200" }}>{fmt(effective)}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:"#92400e", fontWeight:600, marginBottom:2 }}>Limit</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#c2410c" }}>₹1,50,000</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height:5, background:"#fed7aa" }}>
          <div style={{ height:"100%", width:`${pct}%`,
            background: pct >= 100 ? "#16a34a" : "#f18200",
            transition:"width 0.3s" }} />
        </div>
      </div>
      {/* Note */}
      <div style={{ fontSize:11, color:"#64748b", background:"#f8fafc", borderRadius:6,
        padding:"7px 12px", marginBottom:14, border:"1px solid #e2e8f0" }}>
        All items share the combined limit of ₹1,50,000 under Sections 123 &amp; 124.
      </div>
      {SEC123_ITEMS.map((item) => (
        <AmtRow
          key={item.label}
          section={item.section}
          label={item.label}
          maxLimit={item.max}
          value={values[item.label] || 0}
          onChange={(v) => setValues((prev) => ({ ...prev, [item.label]: v }))}
        />
      ))}
    </Modal>
  );
}

// ── CHAPTER VIII Modal ─────────────────────────────────────────────────────────
const CH8_ITEMS = [
  { section:"130", label:"Additional Interest on housing loan borrowed as on 1st Apr 2016", max:"50,000.00" },
  { section:"131", label:"Additional Interest on Housing loan borrowed as on 1st Apr 2019", max:"1,50,000.00" },
  { section:"137", label:"Donations made to Political Party or Electoral Trust", max:"9,99,99,999.00" },
  { section:"135", label:"Donations made for Scientific Research or Rural Development", max:"9,99,99,999.00" },
  { section:"124(5)", label:"Employee Contribution to NPS", max:"1,50,000.00" },
  { section:"132", label:"Interest on Electric Vehicle borrowed as on 1st Apr 2019", max:"1,50,000.00" },
  { section:"124(3)", label:"Contribution to NPS 2015", max:"50,000.00" },
  { section:"19(1)(10)", label:"Retrenchment Compensation", max:"5,00,000.00" },
  { section:"153(2)(b)", label:"Interest on Deposits in Savings Account, Post Office And Cooperative Society for Senior Citizen", max:"50,000.00" },
  { section:"133", label:"Donation - 100% Exemption", max:"9,99,99,999.00" },
  { section:"133", label:"Donation - 50% Exemption", max:"9,99,99,999.00" },
  { section:"133", label:"Donation - Children Education", max:"9,99,99,999.00" },
  { section:"133", label:"Donation - Political Parties", max:"9,99,99,999.00" },
  { section:"153(2)(a)", label:"Interest on Deposits in Savings Account, Post Office And Cooperative Society", max:"10,000.00" },
  { section:"129", label:"Interest on Loan of higher Self education", max:"9,99,99,999.00" },
  { section:"127", label:"Medical Treatment / Insurance of handicapped Dependant - (Between 40% - 80%)", max:"75,000.00" },
  { section:"127", label:"Medical Treatment / Insurance of handicapped Dependant (Severe - Above 80%)", max:"1,25,000.00" },
  { section:"128", label:"Medical Treatment ( Specified Disease only )", max:"40,000.00" },
  { section:"128", label:"Medical Treatment (Specified Disease only)- Senior Citizen", max:"1,00,000.00" },
  { section:"154", label:"Permanent Physical Disability (Above 80%)", max:"1,25,000.00" },
  { section:"154", label:"Permanent Physical Disability (Between 40% - 80%)", max:"75,000.00" },
];

function ModalCh8({ values, setValues, onClose }) {
  const total = CH8_ITEMS.reduce((s, item) => s + (Number(values[item.label]) || 0), 0);
  return (
    <Modal
      title="Other Chapter VIII Deductions"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setValues({})}
    >
      {/* Summary card */}
      <div style={{ borderRadius:10, border:"1px solid #fed7aa", marginBottom:14,
        background:"linear-gradient(135deg,#fff7ed,#ffedd5)", padding:"12px 16px",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, color:"#92400e", fontWeight:600, marginBottom:2 }}>Total Declared</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#f18200" }}>{fmt(total)}</div>
        </div>
        <div style={{ fontSize:11, color:"#92400e", textAlign:"right" }}>
          Multiple sections<br/>
          <span style={{ fontWeight:700 }}>No combined limit</span>
        </div>
      </div>
      {/* Info note */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:8,
        fontSize:11, color:"#92400e", background:"#fffbeb",
        border:"1px solid #fde68a", borderRadius:7, padding:"8px 12px", marginBottom:14 }}>
        <span style={{ fontSize:14, lineHeight:1 }}>ⓘ</span>
        Amount declared under 153(2)(a) / 153(2)(b) will be auto-considered under Other Income.
      </div>
      {CH8_ITEMS.map((item) => (
        <AmtRow
          key={item.label}
          section={item.section}
          label={item.label}
          maxLimit={item.max}
          value={values[item.label] || 0}
          onChange={(v) => setValues((prev) => ({ ...prev, [item.label]: v }))}
        />
      ))}
    </Modal>
  );
}

// ── HRA helpers ───────────────────────────────────────────────────────────────
const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const LANDLORD_RELATIONS = ["Spouse","Parent","Sibling","Friend","Other"];

function getFYMonths() {
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const months = [];
  for (let i = 3; i <= 14; i++) {
    months.push(`${MN[i % 12]} ${fyStart + Math.floor(i / 12)}`);
  }
  return months;
}

function countMonths(from, to) {
  if (!from || !to) return 0;
  const [fm, fy] = from.split(" ");
  const [tm, ty] = to.split(" ");
  const a = new Date(`${fm} 1, ${fy}`);
  const b = new Date(`${tm} 1, ${ty}`);
  const diff = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return diff >= 0 ? diff + 1 : 0;
}

function blankHouse(fyMonths) {
  return {
    from: fyMonths[0] || "", to: fyMonths[fyMonths.length - 1] || "",
    monthlyRent: 0,
    houseName: "", street: "", city: "", pincode: "",
    landlordHasPan: false,
    landlordName: "", landlordPan: "", landlordRelationship: "",
    landlordHouseName: "", landlordStreet: "", landlordCity: "", landlordPincode: "",
  };
}

// ── HRA Modal ─────────────────────────────────────────────────────────────────
function ModalHRA({ hraData, setHraData, annualHraReceived, onClose }) {
  const fyMonths = getFYMonths();
  const houses   = (hraData.houses && hraData.houses.length) ? hraData.houses : [blankHouse(fyMonths)];
  const [tab, setTab] = useState(0);

  const setHouses = (h) => setHraData(prev => ({ ...prev, houses: h }));
  const upd = (i, k, v) => setHouses(houses.map((h, idx) => idx === i ? { ...h, [k]: v } : h));

  const totalAnnual = houses.reduce((s, h) =>
    s + (Number(h.monthlyRent) || 0) * countMonths(h.from, h.to), 0);

  const h = houses[tab] || blankHouse(fyMonths);
  const annualRent = (Number(h.monthlyRent) || 0) * countMonths(h.from, h.to);

  const inp = {
    width:"100%", boxSizing:"border-box", padding:"7px 10px",
    border:"1px solid #d1d5db", borderRadius:4, fontSize:13,
    outline:"none", fontFamily:"inherit", background:"#fff",
  };
  const lbl = { fontSize:12, color:"#374151", marginBottom:4, display:"block" };
  const req = <span style={{ color:"red" }}>*</span>;

  return (
    <Modal
      title="House Rent Allowance Exemption"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setHraData({ houses: [blankHouse(fyMonths)] })}
    >
      {/* Total declared banner */}
      <div style={{ borderRadius:10, border:"1px solid #fed7aa", marginBottom:16,
        background:"linear-gradient(135deg,#fff7ed,#ffedd5)",
        padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, color:"#92400e", fontWeight:600, marginBottom:2 }}>Total Annual HRA Declared</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#f18200" }}>
            {totalAnnual > 0 ? `₹${totalAnnual.toLocaleString("en-IN")}` : "—"}
          </div>
        </div>
        <div style={{ fontSize:11, color:"#92400e", textAlign:"right" }}>
          {houses.length} house{houses.length > 1 ? "s" : ""}<br/>
          <span style={{ fontWeight:700 }}>this financial year</span>
        </div>
      </div>

      {/* House tabs */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {houses.map((_, i) => (
          <button key={i} type="button" onClick={() => setTab(i)}
            style={{ padding:"6px 16px", fontSize:12, borderRadius:20, cursor:"pointer",
              fontWeight: tab===i ? 700 : 500, border:"none",
              background: tab===i ? "#f18200" : "#f1f5f9",
              color: tab===i ? "#fff" : "#64748b",
              boxShadow: tab===i ? "0 2px 8px rgba(241,130,0,0.3)" : "none",
            }}>
            House {i + 1}
          </button>
        ))}
        <button type="button" onClick={() => { setHouses([...houses, blankHouse(fyMonths)]); setTab(houses.length); }}
          style={{ marginLeft:"auto", fontSize:12, color:"#f18200", border:"1px dashed #f18200",
            background:"none", cursor:"pointer", fontWeight:600, padding:"5px 12px", borderRadius:20 }}>
          + Add house
        </button>
      </div>

      {/* Period + rent */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#334155", marginBottom:12 }}>Rent Period & Amount</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div>
            <label style={lbl}>From {req}</label>
            <select value={h.from} onChange={e => upd(tab,"from",e.target.value)} style={inp}>
              {fyMonths.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>To {req}</label>
            <select value={h.to} onChange={e => upd(tab,"to",e.target.value)} style={inp}>
              {fyMonths.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, alignItems:"flex-end" }}>
          <div>
            <label style={lbl}>Monthly Rent Amount {req}</label>
            <div style={{ display:"flex", border:"1px solid #d1d5db", borderRadius:6, overflow:"hidden" }}>
              <span style={{ padding:"7px 10px", background:"#f9fafb", borderRight:"1px solid #d1d5db",
                fontSize:12, color:"#64748b" }}>₹</span>
              <input type="number" placeholder="Enter amount"
                value={h.monthlyRent || ""}
                onChange={e => upd(tab,"monthlyRent", Number(e.target.value)||0)}
                style={{ flex:1, padding:"7px 10px", border:"none", outline:"none", fontSize:13 }}/>
            </div>
          </div>
          <div style={{ padding:"8px 12px", background:"#fff7ed", border:"1px solid #fed7aa",
            borderRadius:8, textAlign:"center" }}>
            <div style={{ fontSize:10, color:"#92400e", fontWeight:600, marginBottom:2 }}>Annual Rent</div>
            <div style={{ fontSize:15, fontWeight:800, color:"#f18200" }}>
              ₹{annualRent.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Rental address */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#334155", marginBottom:12 }}>Rental Address</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={lbl}>House Name / Number</label>
            <input placeholder="Enter name" value={h.houseName||""} onChange={e=>upd(tab,"houseName",e.target.value)} style={inp}/>
          </div>
          <div>
            <label style={lbl}>Street / Area / Locality</label>
            <input placeholder="Enter details" value={h.street||""} onChange={e=>upd(tab,"street",e.target.value)} style={inp}/>
          </div>
          <div>
            <label style={lbl}>Town / City</label>
            <input placeholder="Enter details" value={h.city||""} onChange={e=>upd(tab,"city",e.target.value)} style={inp}/>
          </div>
          <div>
            <label style={lbl}>Pincode {req}</label>
            <input placeholder="Enter pincode" value={h.pincode||""} onChange={e=>upd(tab,"pincode",e.target.value)} style={inp}/>
          </div>
        </div>
      </div>

      {/* Landlord PAN toggle */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#334155", marginBottom:10 }}>Landlord Details</div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, color:"#475569", display:"block", marginBottom:8 }}>
            Does your landlord have a PAN?
          </label>
          <div style={{ display:"flex", gap:10 }}>
            {[["Yes",true],["No",false]].map(([lbl2, val]) => (
              <label key={lbl2} style={{
                display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12,
                padding:"7px 18px", borderRadius:6,
                border:`1.5px solid ${h.landlordHasPan === val ? "#f18200" : "#e2e8f0"}`,
                background: h.landlordHasPan === val ? "#fff7ed" : "#fff",
                color: h.landlordHasPan === val ? "#c2410c" : "#64748b",
                fontWeight: h.landlordHasPan === val ? 700 : 400,
              }}>
                <input type="radio" name={`llpan_${tab}`}
                  checked={h.landlordHasPan === val}
                  onChange={() => upd(tab,"landlordHasPan",val)}
                  style={{ accentColor:"#f18200" }}/>
                {lbl2}
              </label>
            ))}
          </div>
        </div>

        {h.landlordHasPan && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div>
                <label style={lbl}>Landlord's Name {req}</label>
                <input placeholder="Enter name" value={h.landlordName||""}
                  onChange={e=>upd(tab,"landlordName",e.target.value)} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Landlord's PAN {req}</label>
                <input placeholder="e.g. AXPRA1222M" value={h.landlordPan||""}
                  onChange={e=>upd(tab,"landlordPan",e.target.value.toUpperCase())} style={inp}/>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Relationship with landlord</label>
              <select value={h.landlordRelationship||""} onChange={e=>upd(tab,"landlordRelationship",e.target.value)} style={inp}>
                <option value="">Select relationship</option>
                {LANDLORD_RELATIONS.map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:"#334155", marginBottom:10 }}>Landlord's Address</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={lbl}>House Name / Number</label>
                <input placeholder="Enter name" value={h.landlordHouseName||""} onChange={e=>upd(tab,"landlordHouseName",e.target.value)} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Street / Area / Locality</label>
                <input placeholder="Enter details" value={h.landlordStreet||""} onChange={e=>upd(tab,"landlordStreet",e.target.value)} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Town / City</label>
                <input placeholder="Enter details" value={h.landlordCity||""} onChange={e=>upd(tab,"landlordCity",e.target.value)} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Pincode</label>
                <input placeholder="Enter pincode" value={h.landlordPincode||""} onChange={e=>upd(tab,"landlordPincode",e.target.value)} style={inp}/>
              </div>
            </div>
          </>
        )}
      </div>

      {houses.length > 1 && (
        <button type="button"
          onClick={() => { const h2=houses.filter((_,i)=>i!==tab); setHouses(h2); setTab(Math.max(0,tab-1)); }}
          style={{ fontSize:12, color:"#dc2626", border:"1px solid #fecaca",
            background:"#fff1f2", borderRadius:6, cursor:"pointer", padding:"6px 14px",
            display:"flex", alignItems:"center", gap:4 }}>
          <Trash2 size={12}/> Remove House {tab + 1}
        </button>
      )}
    </Modal>
  );
}

// ── Medical Modal ─────────────────────────────────────────────────────────────
const MED_ITEMS = [
  { key:"checkupParents", section:"126", label:"Preventive Health Checkup - Dependant Parents", max:"5,000.00" },
  { key:"medBillsSenior", section:"126", label:"Medical Bills - Senior Citizen (>60)", max:"50,000.00" },
  { key:"medInsurance", section:"126", label:"Medical Insurance Premium", max:"25,000.00", hasAge:true },
  { key:"medInsParents", section:"126", label:"Medical Insurance Premium - Dependant Parents", max:"50,000.00", hasParentAge:true },
  { key:"preventiveCheckup", section:"126", label:"Preventive Health Check-up", max:"5,000.00" },
];

function ModalMedical({ values, setValues, onClose }) {
  const total = MED_ITEMS.reduce((s, item) => s + (Number(values[item.key]) || 0), 0);
  const selStyle = {
    padding:"7px 10px", border:"1px solid #e2e8f0", borderRadius:6,
    fontSize:12, outline:"none", color:"#1e293b", background:"#fff",
    cursor:"pointer",
  };
  return (
    <Modal
      title="Medical (Section 126)"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setValues({})}
    >
      {/* Summary card */}
      <div style={{ borderRadius:10, border:"1px solid #fed7aa", marginBottom:16,
        background:"linear-gradient(135deg,#fff7ed,#ffedd5)",
        padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, color:"#92400e", fontWeight:600, marginBottom:2 }}>Total Declared</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#f18200" }}>{fmt(total)}</div>
        </div>
        <div style={{ fontSize:11, color:"#92400e", textAlign:"right" }}>
          Section 126<br/>
          <span style={{ fontWeight:700 }}>Medical Benefits</span>
        </div>
      </div>

      {MED_ITEMS.map((item) => (
        <div key={item.key}>
          {item.hasAge ? (
            <div style={{ padding:"10px 10px", borderBottom:"1px solid #f1f5f9",
              background: Number(values[item.key]) > 0 ? "#fffbf5" : "transparent", borderRadius:6, marginBottom:2 }}>
              <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:8 }}>
                <span style={{ fontSize:9, fontWeight:700, color:"#f18200", background:"#fff7ed",
                  border:"1px solid #fed7aa", borderRadius:4, padding:"1px 5px", marginTop:2, whiteSpace:"nowrap" }}>
                  {item.section}
                </span>
                <div>
                  <div style={{ fontSize:12.5, color:"#334155" }}>{item.label}</div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>Limit: ₹{item.max}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:"#94a3b8", marginBottom:3 }}>Age Group</div>
                  <select value={values[item.key + "_age"] || ""} style={{ ...selStyle, width:"100%" }}
                    onChange={(e) => setValues((prev) => ({ ...prev, [item.key + "_age"]: e.target.value }))}>
                    <option value="">Select age</option>
                    <option value="below60">Below 60</option>
                    <option value="60to79">60 to 79</option>
                    <option value="above80">80 &amp; above</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginBottom:3 }}>Declared Amount</div>
                  <div style={{ display:"flex", border:"1px solid #e2e8f0", borderRadius:6, overflow:"hidden", background:"#fff" }}>
                    <span style={{ padding:"7px 8px", background:"#f8fafc", borderRight:"1px solid #e2e8f0", fontSize:12, color:"#64748b" }}>₹</span>
                    <input type="number" value={values[item.key] || ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [item.key]: Number(e.target.value) || 0 }))}
                      placeholder="0"
                      style={{ width:100, padding:"7px 8px", border:"none", fontSize:12, textAlign:"right", outline:"none" }}/>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <AmtRow
              section={item.section}
              label={item.label}
              maxLimit={item.max}
              value={values[item.key] || 0}
              onChange={(v) => setValues((prev) => ({ ...prev, [item.key]: v }))}
            />
          )}
          {item.hasParentAge && (
            <div style={{ padding:"6px 10px 10px 22px", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontWeight:600 }}>Parent's Age Group</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {["< 60", "60 to 79", ">= 80"].map((opt) => (
                  <label key={opt} style={{
                    display:"flex", alignItems:"center", gap:5, cursor:"pointer", fontSize:12,
                    padding:"5px 14px", borderRadius:6,
                    border:`1.5px solid ${values.parentAge === opt ? "#f18200" : "#e2e8f0"}`,
                    background: values.parentAge === opt ? "#fff7ed" : "#fff",
                    color: values.parentAge === opt ? "#c2410c" : "#64748b",
                    fontWeight: values.parentAge === opt ? 700 : 400,
                  }}>
                    <input type="radio" name="parentAge" value={opt}
                      checked={values.parentAge === opt}
                      onChange={() => setValues((prev) => ({ ...prev, parentAge: opt }))}
                      style={{ accentColor:"#f18200" }}/>
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </Modal>
  );
}

// ── House Property Modal ──────────────────────────────────────────────────────
function HouseForm({ house, onChange }) {
  const setField = (k, v) => onChange({ ...house, [k]: v });
  const net = (Number(house.annualValue || 0)) - (Number(house.municipalTax || 0)) - (Number(house.unrealizedRent || 0));
  const stdDed = Math.round(Math.max(net, 0) * 0.3);
  const incLoss = net - stdDed - (Number(house.homeLoanInterest || 0));

  const fieldStyle = {
    width:"100%", padding:"8px 10px", border:"1px solid #e2e8f0",
    borderRadius:6, fontSize:12, outline:"none", background:"#fff",
    boxSizing:"border-box",
  };
  const amtStyle = {
    width:130, padding:"7px 10px", border:"1px solid #e2e8f0",
    borderRadius:6, fontSize:12, outline:"none", textAlign:"right",
    background:"#fff", flexShrink:0,
  };
  const rowStyle = {
    display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:12, color:"#475569", gap:8,
  };

  return (
    <div style={{ padding:"2px 0" }}>
      <div style={rowStyle}>
        <span style={{ flex:1 }}>1. Annual Letable Value / Rent Received or Receivable</span>
        <input type="number" value={house.annualValue || ""} onChange={(e) => setField("annualValue", Number(e.target.value)||0)}
          placeholder="₹ 0" style={amtStyle} />
      </div>
      <div style={rowStyle}>
        <span style={{ flex:1 }}>2. Less: Municipal Taxes Paid During the Year</span>
        <input type="number" value={house.municipalTax || ""} onChange={(e) => setField("municipalTax", Number(e.target.value)||0)}
          placeholder="₹ 0" style={amtStyle} />
      </div>
      <div style={rowStyle}>
        <span style={{ flex:1 }}>3. Less: Unrealized Rent</span>
        <input type="number" value={house.unrealizedRent || ""} onChange={(e) => setField("unrealizedRent", Number(e.target.value)||0)}
          placeholder="₹ 0" style={amtStyle} />
      </div>
      {/* Net — computed */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"8px 10px", borderRadius:6, margin:"4px 0",
        background:"#f8fafc", border:"1px solid #e2e8f0", fontSize:12 }}>
        <span style={{ color:"#64748b" }}>4. Net Annual Value (1 − 2 − 3)</span>
        <strong style={{ color:"#1e293b" }}>{fmtDec(net)}</strong>
      </div>
      {/* Deductions */}
      <div style={{ fontSize:12, fontWeight:600, color:"#64748b", padding:"6px 0 2px" }}>
        5. Less: Deductions from Net Annual Value
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"6px 0 6px 14px", borderBottom:"1px solid #f1f5f9", fontSize:12, color:"#64748b" }}>
        <span>5.1. Standard Deduction @ 30% of Net Annual Value</span>
        <strong style={{ color:"#1e293b" }}>{fmtDec(stdDed)}</strong>
      </div>
      {/* 5.2 Interest on Loan */}
      <div style={{ padding:"8px 0 8px 14px", borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ fontSize:12, color:"#475569", marginBottom:8 }}>5.2. Interest on Housing Loan (Let-out)</div>
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:3 }}>Lender's Name</div>
            <input type="text" value={house.lenderName || ""} onChange={(e) => setField("lenderName", e.target.value)}
              placeholder="Enter lender name" style={fieldStyle} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:3 }}>Lender's PAN</div>
            <input type="text" value={house.lenderPAN || ""} onChange={(e) => setField("lenderPAN", e.target.value)}
              placeholder="Enter PAN" style={fieldStyle} />
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:12, color:"#64748b" }}>Interest Amount (₹)</span>
          <input type="number" value={house.homeLoanInterest || ""} onChange={(e) => setField("homeLoanInterest", Number(e.target.value)||0)}
            placeholder="₹ 0" style={amtStyle} />
        </div>
      </div>
      {/* Income/Loss result */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"10px 12px", borderRadius:8, marginTop:8,
        background: incLoss < 0 ? "#fff1f2" : "#f0fdf4",
        border:`1px solid ${incLoss < 0 ? "#fecdd3" : "#bbf7d0"}` }}>
        <span style={{ fontSize:12, fontWeight:600, color: incLoss < 0 ? "#be123c" : "#15803d" }}>
          6. Income / Loss from Let Out Property
        </span>
        <strong style={{ fontSize:13, color: incLoss < 0 ? "#be123c" : "#15803d" }}>{fmtDec(incLoss)}</strong>
      </div>
    </div>
  );
}

function ModalHouseProperty({ houseData, setHouseData, selfOccupied, setSelfOccupied, onClose }) {
  const [activeTab, setActiveTab] = useState(0);

  const addHouse = () => {
    setHouseData((prev) => { const n = [...prev, {}]; setActiveTab(n.length - 1); return n; });
  };
  const removeHouse = (i) => {
    setHouseData((prev) => {
      const n = prev.filter((_, idx) => idx !== i);
      setActiveTab((t) => Math.min(t, n.length - 1));
      return n;
    });
  };
  const updateHouse = (i, h) => setHouseData((prev) => prev.map((x, idx) => idx === i ? h : x));

  const selfOccupiedInt = Math.min(Number(selfOccupied.interest || 0), 200000);
  const letOutLoss = Math.min(
    -(houseData.reduce((s, h) => {
      const net = (Number(h.annualValue||0)) - (Number(h.municipalTax||0)) - (Number(h.unrealizedRent||0));
      const stdDed = Math.round(Math.max(net,0)*0.3);
      return s + net - stdDed - (Number(h.homeLoanInterest||0));
    }, 0)),
    200000
  );
  const totalExemption = selfOccupiedInt + Math.max(letOutLoss, 0);

  const inputStyle = {
    width:"100%", padding:"8px 10px", border:"1px solid #e2e8f0",
    borderRadius:6, fontSize:12, outline:"none", background:"#fff",
    boxSizing:"border-box",
  };

  return (
    <Modal
      title="Income / Loss from House Property"
      onClose={onClose}
      onSave={onClose}
      onClear={() => { setHouseData([{}]); setSelfOccupied({}); setActiveTab(0); }}
    >
      {/* Total Exemption banner */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"10px 14px", borderRadius:8, marginBottom:6,
        background:"linear-gradient(135deg,#fff7ed,#ffedd5)",
        border:"1px solid #fed7aa",
      }}>
        <span style={{ fontSize:12, fontWeight:600, color:"#c2410c" }}>c. Total Exemption in ₹</span>
        <strong style={{ fontSize:15, color:"#f18200" }}>{fmtDec(totalExemption)}</strong>
      </div>
      {/* Note */}
      <div style={{
        fontSize:11, color:"#64748b", background:"#f8fafc", borderRadius:6,
        padding:"7px 12px", marginBottom:18, lineHeight:1.6,
        border:"1px solid #e2e8f0",
      }}>
        <strong>Note:</strong> If (a + b) is less than −₹2,00,000 then −₹2,00,000 will be exempted, else the actual (a + b) will be exempted.
      </div>

      {/* ── Section a: Self-Occupied ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{
          display:"flex", alignItems:"center",
          padding:"8px 12px", borderRadius:7,
          background:"#f1f5f9", marginBottom:12,
          borderLeft:"3px solid #94a3b8",
        }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#334155" }}>
            a. Income from Self-Occupied Property
          </span>
        </div>

        <div style={{ padding:"0 2px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
            padding:"0 0 12px", borderBottom:"1px solid #f1f5f9", gap:12, marginBottom:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:"#475569", marginBottom:5 }}>
                Interest on Housing Loan (Self Occupied) in ₹
              </div>
              <div style={{ fontSize:11, color:"#f18200", fontWeight:600 }}>
                Eligible Amount in ₹: 2,00,000.00
              </div>
            </div>
            <input type="number" value={selfOccupied.interest || ""}
              onChange={(e) => setSelfOccupied((p) => ({ ...p, interest: Number(e.target.value)||0 }))}
              placeholder="₹ 0"
              style={{ width:130, padding:"7px 10px", border:"1px solid #e2e8f0", borderRadius:6,
                fontSize:12, textAlign:"right", outline:"none", background:"#fff", flexShrink:0 }} />
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>Lender's Name</div>
              <input type="text" value={selfOccupied.lenderName || ""}
                onChange={(e) => setSelfOccupied((p) => ({ ...p, lenderName: e.target.value }))}
                placeholder="Enter lender name" style={inputStyle} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>Lender's PAN</div>
              <input type="text" value={selfOccupied.lenderPAN || ""}
                onChange={(e) => setSelfOccupied((p) => ({ ...p, lenderPAN: e.target.value }))}
                placeholder="Enter PAN" style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section b: Let-out Property ── */}
      <div>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"8px 12px", borderRadius:7,
          background:"#fff7ed", marginBottom:12,
          borderLeft:"3px solid #f18200",
        }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#c2410c" }}>
            b. Income from Let-out Property
          </span>
          <button type="button" onClick={addHouse}
            style={{ display:"flex", alignItems:"center", gap:4, fontSize:11,
              color:"#f18200", background:"none", border:"none", cursor:"pointer",
              fontWeight:600, padding:0 }}>
            <Plus size={13} /> Add new property
          </button>
        </div>

        {/* Property tabs */}
        {houseData.length > 0 && (
          <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
            {houseData.map((_, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center" }}>
                <button type="button" onClick={() => setActiveTab(i)}
                  style={{
                    padding:"5px 14px", fontSize:12,
                    borderRadius: houseData.length > 1 ? "6px 0 0 6px" : 6,
                    cursor:"pointer", fontWeight: activeTab === i ? 700 : 400,
                    background: activeTab === i ? "#f18200" : "#f8fafc",
                    color: activeTab === i ? "#fff" : "#64748b",
                    border: activeTab === i ? "1px solid #f18200" : "1px solid #e2e8f0",
                    borderRight: houseData.length > 1 ? "none" : undefined,
                  }}>
                  Property {i + 1}
                </button>
                {houseData.length > 1 && (
                  <button type="button" onClick={() => removeHouse(i)}
                    style={{
                      padding:"5px 7px", borderRadius:"0 6px 6px 0",
                      cursor:"pointer",
                      background: activeTab === i ? "#ea580c" : "#f8fafc",
                      color: activeTab === i ? "#fff" : "#94a3b8",
                      border: activeTab === i ? "1px solid #f18200" : "1px solid #e2e8f0",
                      lineHeight:1, display:"flex", alignItems:"center",
                    }}>
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Active property form */}
        {houseData[activeTab] !== undefined && (
          <div style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 14px", background:"#fafafa" }}>
            <HouseForm
              house={houseData[activeTab]}
              idx={activeTab}
              onChange={(nh) => updateHouse(activeTab, nh)}
              onRemove={() => removeHouse(activeTab)}
              canRemove={houseData.length > 1}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Other Income Modal ────────────────────────────────────────────────────────
function ModalOtherIncome({ incomes, setIncomes, onClose }) {
  const list = incomes.length ? incomes : [{ particulars:"", amount:0 }];
  const addIncome = () => setIncomes((prev) => [...prev, { particulars:"", amount:0 }]);
  const remove = (i) => setIncomes((prev) => prev.filter((_, idx) => idx !== i));
  const update = (i, k, v) => setIncomes((prev) => prev.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const total = list.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const inp = {
    padding:"7px 10px", border:"1px solid #d1d5db", borderRadius:4,
    fontSize:13, outline:"none", fontFamily:"inherit", background:"#fff",
  };

  return (
    <Modal
      title="Other Income"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setIncomes([{ particulars:"", amount:0 }])}
    >
      {/* Top info bar */}
      <div style={{ display:"flex", borderBottom:"1px solid #e5e7eb", marginBottom:0 }}>
        <div style={{ padding:"10px 16px", borderRight:"1px solid #e5e7eb", minWidth:130 }}>
          <div style={{ fontSize:11, color:"#94a3b8" }}>Total declared in ₹</div>
          <div style={{ fontSize:14, fontWeight:700, color:"#1e293b", marginTop:2 }}>
            {total > 0 ? total.toLocaleString("en-IN") : "-"}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", fontSize:12, color:"#374151" }}>
          <span style={{ color:"#3b82f6", fontSize:15, lineHeight:1 }}>ⓘ</span>
          Amount declared under 153(2)(a)/153(2)(b) would be auto considered under Other Income
        </div>
      </div>

      {/* Income rows */}
      {list.map((inc, i) => (
        <div key={i}>
          {/* Section header */}
          <div style={{ background:"#f3f4f6", padding:"8px 16px", fontSize:13, fontWeight:600,
            color:"#374151", borderBottom:"1px solid #e5e7eb", borderTop:"1px solid #e5e7eb",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            Other Income {i + 1}
            {list.length > 1 && (
              <button type="button" onClick={() => remove(i)}
                style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", padding:0 }}>
                <Trash2 size={14}/>
              </button>
            )}
          </div>

          {/* Fields */}
          <div style={{ padding:"16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 }}>Particulars</div>
              <input type="text" value={inc.particulars || ""}
                onChange={(e) => update(i, "particulars", e.target.value)}
                placeholder="Enter income type"
                style={{ ...inp, width:"100%", boxSizing:"border-box" }}/>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 }}>Declared Amount</div>
              <div style={{ display:"flex", border:"1px solid #d1d5db", borderRadius:4, overflow:"hidden" }}>
                <span style={{ padding:"7px 10px", background:"#f9fafb", borderRight:"1px solid #d1d5db",
                  fontSize:13, color:"#64748b" }}>₹</span>
                <input type="number" value={inc.amount || ""}
                  onChange={(e) => update(i, "amount", Number(e.target.value)||0)}
                  placeholder="Enter amount"
                  style={{ flex:1, padding:"7px 10px", border:"none", outline:"none", fontSize:13 }}/>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Add button */}
      <div style={{ padding:"8px 16px 4px" }}>
        <button type="button" onClick={addIncome}
          style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#f18200",
            background:"none", border:"none", cursor:"pointer", padding:0, fontWeight:600 }}>
          <Plus size={13}/> Add Income
        </button>
      </div>
    </Modal>
  );
}

// ── TCS/TDS Modal ─────────────────────────────────────────────────────────────
function ModalTcsTds({ values, setValues, onClose }) {
  const tcs = Number(values.tcs) || 0;
  const tds = Number(values.tds) || 0;
  const total = tcs + tds;

  const ITEMS = [
    { key:"tcs", label:"TCS — Tax Collected at Source",   desc:"Tax deducted by seller on high-value transactions" },
    { key:"tds", label:"TDS — Tax Deducted at Source",    desc:"Tax withheld by payer on income payments" },
  ];

  return (
    <Modal
      title="TCS / TDS Deduction"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setValues({ tcs:0, tds:0 })}
    >
      {/* Summary */}
      <div style={{ borderRadius:10, border:"1px solid #fed7aa", marginBottom:18,
        background:"linear-gradient(135deg,#fff7ed,#ffedd5)",
        padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, color:"#92400e", fontWeight:600, marginBottom:2 }}>Total Declared</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#f18200" }}>{fmt(total)}</div>
        </div>
        <div style={{ display:"flex", gap:16, fontSize:12 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:10, color:"#92400e", fontWeight:600 }}>TCS</div>
            <div style={{ fontWeight:700, color:"#1e293b" }}>{fmt(tcs)}</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:10, color:"#92400e", fontWeight:600 }}>TDS</div>
            <div style={{ fontWeight:700, color:"#1e293b" }}>{fmt(tds)}</div>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {ITEMS.map(({ key, label, desc }) => {
          const filled = (Number(values[key]) || 0) > 0;
          return (
            <div key={key} style={{
              border:`1.5px solid ${filled ? "#fed7aa" : "#e2e8f0"}`,
              borderRadius:10, padding:"14px 16px",
              background: filled ? "#fffbf5" : "#fafafa",
            }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:11, color:"#94a3b8", marginBottom:12 }}>{desc}</div>
              <div>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:5, fontWeight:600 }}>Declared Amount (₹)</div>
                <div style={{ display:"flex", border:"1px solid #e2e8f0", borderRadius:7, overflow:"hidden",
                  background:"#fff", boxShadow: filled ? "0 0 0 2px rgba(241,130,0,0.15)" : "none" }}>
                  <span style={{ padding:"9px 12px", background:"#f8fafc", borderRight:"1px solid #e2e8f0",
                    fontSize:13, color:"#64748b", fontWeight:600 }}>₹</span>
                  <input type="number" value={values[key] || ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [key]: Number(e.target.value)||0 }))}
                    placeholder="Enter amount"
                    style={{ flex:1, padding:"9px 12px", border:"none", fontSize:13,
                      textAlign:"right", outline:"none", color:"#1e293b" }}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

// ── Declaration card ──────────────────────────────────────────────────────────
function DeclCard({ icon, title, declared, onClick, locked }) {
  const hasDeclared = !!declared;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center",
        padding:"24px 16px 20px", background:"#fff",
        border:`1px solid ${hasDeclared ? "#fed7aa" : "#e8edf5"}`,
        borderTop:`3px solid ${hasDeclared ? "#f18200" : "#e2e8f0"}`,
        borderRadius:12, cursor: locked ? "default" : "pointer",
        textAlign:"center", gap:0, transition:"all 0.18s",
        opacity: locked ? 0.72 : 1, width:"100%",
        boxSizing:"border-box",
      }}
      onMouseEnter={(e) => {
        if (!locked) {
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(241,130,0,0.13)";
          e.currentTarget.style.borderTopColor = "#f18200";
          e.currentTarget.style.borderColor = "#fed7aa";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderTopColor = hasDeclared ? "#f18200" : "#e2e8f0";
        e.currentTarget.style.borderColor = hasDeclared ? "#fed7aa" : "#e8edf5";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Icon circle */}
      <div style={{
        width:52, height:52, borderRadius:"50%",
        background: hasDeclared ? "#fff7ed" : "#f8fafc",
        border:`1.5px solid ${hasDeclared ? "#fed7aa" : "#e2e8f0"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:24, marginBottom:14, flexShrink:0,
      }}>
        {icon}
      </div>
      {/* Title */}
      <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", lineHeight:1.4, marginBottom:12 }}>
        {title}
      </div>
      {/* CTA / status */}
      {hasDeclared ? (
        <div style={{
          display:"inline-flex", alignItems:"center", gap:4,
          padding:"4px 12px", borderRadius:999,
          background:"#f0fdf4", border:"1px solid #bbf7d0",
        }}>
          <span style={{ fontSize:11, color:"#15803d", fontWeight:700 }}>
            ✓ {fmt(declared)}
          </span>
        </div>
      ) : locked ? (
        <span style={{ fontSize:12, color:"#cbd5e1" }}>—</span>
      ) : (
        <div style={{
          display:"inline-flex", alignItems:"center", gap:4,
          padding:"4px 12px", borderRadius:999,
          background:"#fff7ed", border:"1px solid #fed7aa",
        }}>
          <span style={{ fontSize:11, color:"#f18200", fontWeight:700 }}>Add to declaration</span>
          <ChevronRight size={11} color="#f18200" />
        </div>
      )}
    </button>
  );
}

// ── Serialise / deserialise ──────────────────────────────────────────────────
function buildItems({ vals123, valsCh8, hraData, medVals, houseData, selfOccupied, incomes, tcsTds }) {
  const items = [];
  SEC123_ITEMS.forEach(it => {
    const amt = Number(vals123[it.label]) || 0;
    if (amt) items.push({ section_key:'80C', section_label:'Section 123 and 124', sub_label:it.label, declared_amount:amt });
  });
  CH8_ITEMS.forEach(it => {
    const amt = Number(valsCh8[it.label]) || 0;
    if (amt) items.push({ section_key:'CH8', section_label:'Other Chapter VIII Deductions', sub_label:it.label, declared_amount:amt });
  });
  const hraHouses = hraData.houses || [];
  const totalHRA = hraHouses.reduce((s, h) => s + (Number(h.monthlyRent)||0) * countMonths(h.from, h.to), 0);
  if (totalHRA > 0) {
    items.push({ section_key:'HRA', section_label:'House Rent Allowance Exemption',
      sub_label: JSON.stringify(hraHouses),
      declared_amount: totalHRA });
  }
  MED_ITEMS.forEach(it => {
    const amt = Number(medVals[it.key]) || 0;
    if (amt) items.push({ section_key:'MEDICAL', section_label:'Medical (Section 126)', sub_label:it.key, declared_amount:amt });
  });
  const houseLoss = houseData.reduce((s, h) => {
    const net = (Number(h.annualValue||0)) - (Number(h.municipalTax||0)) - (Number(h.unrealizedRent||0));
    return s + net - Math.round(Math.max(net,0)*0.3) - (Number(h.homeLoanInterest||0));
  }, 0);
  if (selfOccupied.interest > 0 || houseLoss !== 0) {
    items.push({ section_key:'HOUSE', section_label:'Income / Loss from House Property',
      sub_label: JSON.stringify({ selfOccupied, houseData }), declared_amount: Math.max(-houseLoss,0) + Math.min(Number(selfOccupied.interest||0),200000) });
  }
  incomes.forEach(inc => {
    const amt = Number(inc.amount) || 0;
    if (amt && inc.particulars) items.push({ section_key:'OTHER_INCOME', section_label:'Other Income', sub_label:inc.particulars, declared_amount:amt });
  });
  if (tcsTds.tcs > 0) items.push({ section_key:'TCS', section_label:'TCS Deduction', sub_label:'TCS', declared_amount:Number(tcsTds.tcs) });
  if (tcsTds.tds > 0) items.push({ section_key:'TDS', section_label:'TDS Deduction', sub_label:'TDS', declared_amount:Number(tcsTds.tds) });
  return items;
}

function loadStateFromItems(items) {
  const v123={}, vCh8={}, med={};
  let hra={ houses: [] };
  let house=[{}], selfOcc={}, incs=[{ particulars:"", amount:0 }], tcs={ tcs:0, tds:0 };
  items.forEach(it => {
    if (it.section_key==='80C') v123[it.sub_label] = it.declared_amount;
    else if (it.section_key==='CH8') vCh8[it.sub_label] = it.declared_amount;
    else if (it.section_key==='HRA') {
      try {
        const parsed = JSON.parse(it.sub_label || '[]');
        hra = { houses: Array.isArray(parsed) ? parsed : [] };
      } catch { hra = { houses: [] }; }
    }
    else if (it.section_key==='MEDICAL') med[it.sub_label] = it.declared_amount;
    else if (it.section_key==='HOUSE') {
      try { const m = JSON.parse(it.sub_label||'{}'); house = m.houseData||[{}]; selfOcc = m.selfOccupied||{}; } catch {}
    }
    else if (it.section_key==='OTHER_INCOME') {
      if (incs.length===1 && !incs[0].particulars) incs=[];
      incs.push({ particulars: it.sub_label, amount: it.declared_amount });
    }
    else if (it.section_key==='TCS') tcs.tcs = it.declared_amount;
    else if (it.section_key==='TDS') tcs.tds = it.declared_amount;
  });
  if (incs.length===0) incs=[{ particulars:"", amount:0 }];
  return { vals123:v123, valsCh8:vCh8, hraData:hra, medVals:med, houseData:house, selfOccupied:selfOcc, incomes:incs, tcsTds:tcs };
}

const STATUS_CFG = {
  draft:     { bg:'#fef9c3', color:'#a16207', icon:<Clock size={14}/>, label:'Draft' },
  submitted: { bg:'#dbeafe', color:'#1d4ed8', icon:<Clock size={14}/>, label:'Submitted — Pending Review' },
  approved:  { bg:'#dcfce7', color:'#15803d', icon:<CheckCircle2 size={14}/>, label:'Approved' },
  rejected:  { bg:'#fee2e2', color:'#dc2626', icon:<XCircle size={14}/>, label:'Rejected' },
};

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ITDeclaration() {
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [structure, setStructure] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  // API state
  const [cycle,       setCycle]       = useState(null);
  const [declaration, setDeclaration] = useState(null);

  // Section states
  const [vals123,      setVals123]      = useState({});
  const [valsCh8,      setValsCh8]      = useState({});
  const [hraData,      setHraData]      = useState({ houses: [] });
  const [medVals,      setMedVals]      = useState({});
  const [houseData,    setHouseData]    = useState([{}]);
  const [selfOccupied, setSelfOccupied] = useState({});
  const [incomes,      setIncomes]      = useState([{ particulars:"", amount:0 }]);
  const [tcsTds,       setTcsTds]       = useState({ tcs:0, tds:0 });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [salaryRes, declRes] = await Promise.all([
        getMySalaryStructure().catch(() => null),
        getMyITDeclaration().catch(() => null),
      ]);
      if (salaryRes?.basic) setStructure(salaryRes);
      if (declRes) {
        setCycle(declRes.cycle);
        setDeclaration(declRes.declaration);
        if (declRes.items?.length) {
          const parsed = loadStateFromItems(declRes.items);
          setVals123(parsed.vals123);
          setValsCh8(parsed.valsCh8);
          setHraData(parsed.hraData);
          setMedVals(parsed.medVals);
          setHouseData(parsed.houseData);
          setSelfOccupied(parsed.selfOccupied);
          setIncomes(parsed.incomes);
          setTcsTds(parsed.tcsTds);
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSave = async (submit = false) => {
    setSaving(true);
    try {
      const items = buildItems({ vals123, valsCh8, hraData, medVals, houseData, selfOccupied, incomes, tcsTds });
      const res = await saveMyITDeclaration({ items, submit });
      setCycle(res.cycle);
      setDeclaration(res.declaration);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const breakdown   = structure?.basic ? buildSalaryBreakdown(structure) : null;
  const annualHRA   = breakdown ? breakdown.hra * 12 : 0;
  const annualGross = breakdown ? breakdown.gross * 12 : 0;

  const declared123   = Math.min(SEC123_ITEMS.reduce((s, i) => s + (Number(vals123[i.label])||0), 0), 150000);
  const declaredCh8   = CH8_ITEMS.reduce((s, i) => s + (Number(valsCh8[i.label])||0), 0);
  const declaredHRA   = (hraData.houses||[]).reduce((s,h)=>s+(Number(h.monthlyRent)||0)*countMonths(h.from,h.to),0);
  const declaredMed   = MED_ITEMS.reduce((s, i) => s + (Number(medVals[i.key])||0), 0);
  const declaredHouse = houseData.some((h) => h.annualValue || h.homeLoanInterest) ? 1 : null;
  const declaredIncome = incomes.reduce((s, r) => s + (Number(r.amount)||0), 0);
  const declaredTcsTds = (Number(tcsTds.tcs)||0) + (Number(tcsTds.tds)||0);
  const totalDeclared  = declared123 + declaredCh8 + declaredHRA + declaredMed + declaredIncome + declaredTcsTds;

  const isLocked   = !cycle || cycle.status !== 'active';
  const isReadOnly = declaration?.status === 'submitted' || declaration?.status === 'approved';
  const status     = declaration?.status;
  const statusCfg  = STATUS_CFG[status] || null;

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"#94a3b8", fontSize:14 }}>Loading…</div>;

  const CARDS = [
    { key:"123",    icon:"📊", title:"Section 123 and 124",               declared: declared123 || null },
    { key:"ch8",    icon:"📋", title:"Other Chapter VIII Deductions",      declared: declaredCh8 || null },
    { key:"hra",    icon:"🏠", title:"House Rent Allowance Exemption",     declared: declaredHRA || null },
    { key:"med",    icon:"🏥", title:"Medical (Section 126)",              declared: declaredMed || null },
    { key:"house",  icon:"🏡", title:"Income / Loss from House Property",  declared: declaredHouse },
    { key:"income", icon:"💰", title:"Other Income",                       declared: declaredIncome || null },
    { key:"tcs",    icon:"📄", title:"TCS / TDS Deduction",               declared: declaredTcsTds || null },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f5f7fb", padding:24 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1e293b" }}>IT Declaration</h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#94a3b8" }}>
            {cycle ? `${cycle.fy_label} · Deadline: ${cycle.end_date ? new Date(cycle.end_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}` : 'No active cycle'}
            &nbsp;|&nbsp; Total Declared: <strong style={{ color:"#f18200" }}>₹{Math.round(totalDeclared).toLocaleString('en-IN')}</strong>
            &nbsp;|&nbsp; Annual Gross: ₹{Math.round(annualGross).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Cycle locked banner */}
      {isLocked && (
        <div style={{ background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 18px",
          display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <Lock size={20} style={{ color:"#94a3b8", flexShrink:0 }} />
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#64748b" }}>IT Declaration cycle is not active</p>
            <p style={{ margin:"2px 0 0", fontSize:12, color:"#94a3b8" }}>Admin must open the declaration window before you can submit.</p>
          </div>
        </div>
      )}

      {/* Status banner */}
      {statusCfg && (
        <div style={{ background:statusCfg.bg, border:`1px solid ${statusCfg.color}30`, borderRadius:10,
          padding:"12px 18px", display:"flex", alignItems:"flex-start", gap:10, marginBottom:20 }}>
          <span style={{ color:statusCfg.color, marginTop:1 }}>{statusCfg.icon}</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color:statusCfg.color }}>{statusCfg.label}</p>
            {declaration?.submitted_at && (
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748b" }}>
                Submitted: {new Date(declaration.submitted_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
              </p>
            )}
            {declaration?.admin_remarks && (
              <p style={{ margin:"6px 0 0", fontSize:13, color:"#334155", background:"rgba(0,0,0,0.04)", borderRadius:6, padding:"6px 10px" }}>
                <strong>Admin remarks:</strong> {declaration.admin_remarks}
              </p>
            )}
            {status === 'rejected' && (
              <button onClick={() => handleSave(false)} style={{ marginTop:8, fontSize:12, color:"#f18200", background:"none", border:"1px solid #f18200", borderRadius:6, padding:"4px 12px", cursor:"pointer" }}>
                Edit & Resubmit
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:16, opacity: isReadOnly ? 0.7 : 1 }}>
        {CARDS.map((card) => (
          <DeclCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            declared={card.declared}
            onClick={() => !isLocked && !isReadOnly && setOpenModal(card.key)}
            locked={isLocked || isReadOnly}
          />
        ))}
      </div>

      {/* Action bar */}
      {!isLocked && !isReadOnly && (
        <div style={{ display:"flex", gap:12, marginTop:24, justifyContent:"flex-end" }}>
          <button onClick={() => handleSave(false)} disabled={saving}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 22px", borderRadius:8,
              border:"1px solid #e2e8f0", background:"#fff", color:"#374151", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            <Save size={15}/> {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving || totalDeclared === 0}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 22px", borderRadius:8,
              border:"none", background: totalDeclared > 0 ? "#f18200" : "#e2e8f0",
              color: totalDeclared > 0 ? "#fff" : "#94a3b8",
              fontSize:13, fontWeight:600, cursor: totalDeclared > 0 ? "pointer" : "not-allowed" }}>
            <Send size={15}/> {saving ? 'Submitting…' : 'Submit Declaration'}
          </button>
        </div>
      )}

      {/* Modals */}
      {openModal === "123" && <Modal123 values={vals123} setValues={setVals123} onClose={() => setOpenModal(null)} />}
      {openModal === "ch8" && <ModalCh8 values={valsCh8} setValues={setValsCh8} onClose={() => setOpenModal(null)} />}
      {openModal === "hra" && <ModalHRA hraData={hraData} setHraData={setHraData} annualHraReceived={annualHRA} onClose={() => setOpenModal(null)} />}
      {openModal === "med" && <ModalMedical values={medVals} setValues={setMedVals} onClose={() => setOpenModal(null)} />}
      {openModal === "house" && <ModalHouseProperty houseData={houseData} setHouseData={setHouseData} selfOccupied={selfOccupied} setSelfOccupied={setSelfOccupied} onClose={() => setOpenModal(null)} />}
      {openModal === "income" && <ModalOtherIncome incomes={incomes} setIncomes={setIncomes} onClose={() => setOpenModal(null)} />}
      {openModal === "tcs" && <ModalTcsTds values={tcsTds} setValues={setTcsTds} onClose={() => setOpenModal(null)} />}
    </div>
  );
}
