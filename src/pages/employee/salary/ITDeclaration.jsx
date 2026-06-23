import { useEffect, useState } from "react";
import { X, ChevronRight, Home, Plus, Trash2, Info } from "lucide-react";
import { getMySalaryStructure } from "../../../api/payroll.api";
import { calculatePayslip } from "../../../utils/payslipCalculations";
import { FiscalYearPicker } from "../../../component/YearPicker";
import { getCurrentFiscalYearStart } from "../../../lib/dateUtils";

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtDec = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, onSave, onClear, children }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"32px 16px", overflowY:"auto",
    }}>
      <div style={{ background:"#fff", borderRadius:12, width:"100%", maxWidth:620, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #f0f0f0" }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1e293b" }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding:"16px 20px", maxHeight:"65vh", overflowY:"auto" }}>
          {children}
        </div>
        <div style={{ display:"flex", gap:10, padding:"14px 20px", borderTop:"1px solid #f0f0f0" }}>
          <button type="button" onClick={onSave} style={{
            flex:1, padding:"10px", background:"#f18200", color:"#fff", border:"none",
            borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer",
          }}>Save</button>
          <button type="button" onClick={onClear} style={{
            flex:1, padding:"10px", background:"#f8fafc", color:"#64748b", border:"1px solid #e2e8f0",
            borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer",
          }}>Clear Form</button>
        </div>
      </div>
    </div>
  );
}

// ── Amount row ────────────────────────────────────────────────────────────────
function AmtRow({ section, label, maxLimit, value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f8fafc", gap:8 }}>
      <div style={{ flex:1 }}>
        {section && <span style={{ fontSize:10, color:"#94a3b8", fontWeight:700, marginRight:6 }}>{section}</span>}
        <span style={{ fontSize:13, color:"#334155" }}>{label}</span>
        {maxLimit && (
          <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>Max limit in : {maxLimit}</div>
        )}
      </div>
      <div>
        <div style={{ fontSize:10, color:"#94a3b8", marginBottom:2, textAlign:"right" }}>Declared Amount</div>
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="0"
          style={{
            width:120, padding:"6px 10px", border:"1px solid #e2e8f0", borderRadius:6,
            fontSize:13, textAlign:"right", outline:"none", color:"#1e293b",
          }}
        />
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
  return (
    <Modal
      title="Section 123 and 124"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setValues({})}
    >
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12, padding:"10px 12px", background:"#f8fafc", borderRadius:8, fontSize:13 }}>
        <span style={{ color:"#64748b" }}>Total declared in</span>
        <strong style={{ color:"#1e293b" }}>{fmt(effective)}</strong>
      </div>
      <div style={{ fontSize:11, color:"#64748b", marginBottom:8 }}>Max Limit in : <strong>1,50,000.00</strong></div>
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
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, padding:"10px 12px", background:"#f8fafc", borderRadius:8, fontSize:13 }}>
        <span style={{ color:"#64748b" }}>Total declared in</span>
        <strong style={{ color:"#1e293b" }}>{fmt(total)}</strong>
      </div>
      <div style={{ fontSize:11, color:"#f59e0b", background:"#fffbeb", padding:"6px 10px", borderRadius:6, marginBottom:10 }}>
        Amount declared under 153(2)(a)/153(2)(b) would be auto considered under Other Income
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

// ── HRA Modal ─────────────────────────────────────────────────────────────────
function ModalHRA({ hraData, setHraData, annualHraReceived, onClose }) {
  return (
    <Modal
      title="House Rent Allowance Exemption"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setHraData({ landlordName:"", panNo:"", city:"", annualRent:0, isMetro: false })}
    >
      <div style={{ fontSize:11, color:"#f18200", background:"#fff8f0", padding:"8px 12px", borderRadius:6, marginBottom:12 }}>
        Annual HRA Received: <strong>{fmt(annualHraReceived)}</strong>
      </div>

      {[
        { label:"Landlord's Name", key:"landlordName", type:"text" },
        { label:"Landlord's PAN", key:"panNo", type:"text" },
        { label:"City", key:"city", type:"text" },
        { label:"Annual Rent Paid (₹)", key:"annualRent", type:"number" },
      ].map(({ label, key, type }) => (
        <div key={key} style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>{label}</label>
          <input
            type={type}
            value={hraData[key] || ""}
            onChange={(e) => setHraData((prev) => ({ ...prev, [key]: type === "number" ? Number(e.target.value) || 0 : e.target.value }))}
            style={{ width:"100%", padding:"8px 12px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:13, outline:"none", boxSizing:"border-box" }}
          />
        </div>
      ))}

      <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#334155", cursor:"pointer" }}>
        <input
          type="checkbox"
          checked={hraData.isMetro || false}
          onChange={(e) => setHraData((prev) => ({ ...prev, isMetro: e.target.checked }))}
        />
        Metro City (HRA exemption: 50% of Basic)
      </label>
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
  return (
    <Modal
      title="Medical (Section 126)"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setValues({})}
    >
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, padding:"10px 12px", background:"#f8fafc", borderRadius:8, fontSize:13 }}>
        <span style={{ color:"#64748b" }}>Total declared in</span>
        <strong style={{ color:"#1e293b" }}>{fmt(total)}</strong>
      </div>
      {MED_ITEMS.map((item) => (
        <div key={item.key}>
          {item.hasAge ? (
            /* Medical Insurance Premium — shows Age + Declared Amount side by side */
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f8fafc", gap:8 }}>
              <div style={{ flex:1 }}>
                <span style={{ fontSize:10, color:"#94a3b8", fontWeight:700, marginRight:6 }}>{item.section}</span>
                <span style={{ fontSize:13, color:"#334155" }}>{item.label}</span>
                <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>Max limit in : {item.max}</div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                <div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginBottom:2 }}>Age</div>
                  <select
                    value={values[item.key + "_age"] || ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [item.key + "_age"]: e.target.value }))}
                    style={{ width:90, padding:"6px 8px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:13, outline:"none", color:"#1e293b", background:"#fff" }}
                  >
                    <option value="">Select</option>
                    <option value="below60">Below 60</option>
                    <option value="60to79">60 to 79</option>
                    <option value="above80">80 &amp; above</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginBottom:2 }}>Declared Amount</div>
                  <input
                    type="number"
                    value={values[item.key] || ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [item.key]: Number(e.target.value) || 0 }))}
                    placeholder="0"
                    style={{ width:120, padding:"6px 10px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:13, textAlign:"right", outline:"none", color:"#1e293b" }}
                  />
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
            <div style={{ paddingLeft:12, paddingBottom:8 }}>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Age</div>
              {["< 60", "60 to 79", ">= 80"].map((opt) => (
                <label key={opt} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#334155", marginBottom:3, cursor:"pointer" }}>
                  <input
                    type="radio"
                    name="parentAge"
                    value={opt}
                    checked={values.parentAge === opt}
                    onChange={() => setValues((prev) => ({ ...prev, parentAge: opt }))}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </Modal>
  );
}

// ── House Property Modal ──────────────────────────────────────────────────────
function HouseForm({ house, idx, onChange, onRemove, canRemove }) {
  const setField = (k, v) => onChange({ ...house, [k]: v });
  const net = (Number(house.annualValue || 0)) - (Number(house.municipalTax || 0)) - (Number(house.unrealizedRent || 0));
  const stdDed = Math.round(Math.max(net, 0) * 0.3);
  const incLoss = net - stdDed - (Number(house.homeLoanInterest || 0));

  return (
    <div style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:14, marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>Property {idx + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer" }}>
            <Trash2 size={15} />
          </button>
        )}
      </div>
      {[
        { label:"1. Annual Letable Value/Rent Received or Receivable", key:"annualValue" },
        { label:"2. Less: Municipal Taxes Paid During the Year", key:"municipalTax" },
        { label:"3. Less: Unrealized Rent", key:"unrealizedRent" },
      ].map(({ label, key }) => (
        <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #f8fafc", fontSize:13, color:"#334155" }}>
          <span>{label}</span>
          <input type="number" value={house[key] || ""} onChange={(e) => setField(key, Number(e.target.value) || 0)}
            style={{ width:110, padding:"4px 8px", border:"1px solid #e2e8f0", borderRadius:4, fontSize:12, textAlign:"right", outline:"none" }} />
        </div>
      ))}
      <div style={{ padding:"6px 0", fontSize:12, color:"#64748b", display:"flex", justifyContent:"space-between", borderBottom:"1px solid #f8fafc" }}>
        <span>4. NET VALUE (1 - (2+3))</span><strong>{fmtDec(net)}</strong>
      </div>
      <div style={{ padding:"6px 0 2px", fontSize:12, color:"#64748b" }}>5. Less: Deductions from Net Annual Value</div>
      <div style={{ padding:"3px 0 6px", fontSize:12, color:"#64748b", display:"flex", justifyContent:"space-between", borderBottom:"1px solid #f8fafc", paddingLeft:12 }}>
        <span>5.1. Standard Deduction at 30% of Net Annual Value</span><strong>{fmtDec(stdDed)}</strong>
      </div>
      <div key="hli" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0 6px 12px", borderBottom:"1px solid #f8fafc", fontSize:12, color:"#334155" }}>
        <div>
          <div>5.2. Interest on Housing Loan</div>
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <input type="text" value={house.lenderName || ""} onChange={(e) => setField("lenderName", e.target.value)}
              placeholder="Lender's Name" style={{ width:130, padding:"4px 8px", border:"1px solid #e2e8f0", borderRadius:4, fontSize:11, outline:"none" }} />
            <input type="text" value={house.lenderPAN || ""} onChange={(e) => setField("lenderPAN", e.target.value)}
              placeholder="Lender's PAN" style={{ width:100, padding:"4px 8px", border:"1px solid #e2e8f0", borderRadius:4, fontSize:11, outline:"none" }} />
          </div>
        </div>
        <input type="number" value={house.homeLoanInterest || ""} onChange={(e) => setField("homeLoanInterest", Number(e.target.value) || 0)}
          style={{ width:110, padding:"4px 8px", border:"1px solid #e2e8f0", borderRadius:4, fontSize:12, textAlign:"right", outline:"none" }} />
      </div>
      <div style={{ padding:"6px 0", fontSize:12, color:"#1e293b", display:"flex", justifyContent:"space-between", fontWeight:700 }}>
        <span>6. Income/Loss from Let Out Property</span><strong style={{ color: incLoss < 0 ? "#ef4444" : "#16a34a" }}>{fmtDec(incLoss)}</strong>
      </div>
    </div>
  );
}

function ModalHouseProperty({ houseData, setHouseData, selfOccupied, setSelfOccupied, onClose }) {
  const addHouse = () => setHouseData((prev) => [...prev, {}]);
  const removeHouse = (i) => setHouseData((prev) => prev.filter((_, idx) => idx !== i));
  const updateHouse = (i, h) => setHouseData((prev) => prev.map((x, idx) => idx === i ? h : x));

  const totalLoss = Math.min(
    -(houseData.reduce((s, h) => {
      const net = (Number(h.annualValue||0)) - (Number(h.municipalTax||0)) - (Number(h.unrealizedRent||0));
      const stdDed = Math.round(Math.max(net,0)*0.3);
      return s + net - stdDed - (Number(h.homeLoanInterest||0));
    }, 0)),
    200000
  );
  const selfOccupiedInt = Math.min(Number(selfOccupied.interest || 0), 200000);
  const totalExemption = selfOccupiedInt + Math.max(totalLoss, 0);

  return (
    <Modal
      title="Income / Loss from House Property"
      onClose={onClose}
      onSave={onClose}
      onClear={() => { setHouseData([{}]); setSelfOccupied({}); }}
    >
      <div style={{ padding:"8px 12px", background:"#f8fafc", borderRadius:8, fontSize:12, color:"#64748b", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
        <span>c. Total Exemption</span>
        <strong style={{ color:"#f18200" }}>{fmt(totalExemption)}</strong>
      </div>

      {/* Self-occupied */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", marginBottom:8 }}>
          a. Income from Self-Occupied Property
        </div>
        <div style={{ fontSize:12, color:"#64748b", marginBottom:6 }}>
          Interest on Housing Loan (Self Occupied)
          <span style={{ marginLeft:8, color:"#f18200" }}>Eligible Amount: ₹2,00,000</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {[
            { key:"interest", placeholder:"Interest on Loan (₹)", type:"number" },
            { key:"lenderName", placeholder:"Lender's Name", type:"text" },
            { key:"lenderPAN", placeholder:"Lender's PAN", type:"text" },
          ].map(({ key, placeholder, type }) => (
            <input key={key} type={type} value={selfOccupied[key] || ""}
              onChange={(e) => setSelfOccupied((prev) => ({ ...prev, [key]: type==="number" ? Number(e.target.value)||0 : e.target.value }))}
              placeholder={placeholder}
              style={{ flex:1, padding:"7px 10px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:12, outline:"none" }} />
          ))}
        </div>
      </div>

      {/* Let-out */}
      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>b. Income from Let-out Property</span>
          <button type="button" onClick={addHouse}
            style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#f18200", background:"none", border:"1px solid #f18200", borderRadius:6, padding:"4px 10px", cursor:"pointer" }}>
            <Plus size={12} /> Add Property
          </button>
        </div>
        {houseData.map((h, i) => (
          <HouseForm key={i} house={h} idx={i} onChange={(nh) => updateHouse(i, nh)} onRemove={() => removeHouse(i)} canRemove={houseData.length > 1} />
        ))}
      </div>
    </Modal>
  );
}

// ── Other Income Modal ────────────────────────────────────────────────────────
function ModalOtherIncome({ incomes, setIncomes, onClose }) {
  const addIncome = () => setIncomes((prev) => [...prev, { particulars:"", amount:0 }]);
  const remove = (i) => setIncomes((prev) => prev.filter((_, idx) => idx !== i));
  const update = (i, k, v) => setIncomes((prev) => prev.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const total = incomes.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <Modal
      title="Other Income"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setIncomes([{ particulars:"", amount:0 }])}
    >
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, padding:"10px 12px", background:"#f8fafc", borderRadius:8, fontSize:13 }}>
        <span style={{ color:"#64748b" }}>Total declared in</span>
        <strong style={{ color:"#1e293b" }}>{fmt(total)}</strong>
      </div>
      <div style={{ fontSize:11, color:"#f59e0b", background:"#fffbeb", padding:"6px 10px", borderRadius:6, marginBottom:10 }}>
        Amount declared under 153(2)(a)/153(2)(b) would be auto considered under Other Income
      </div>
      {incomes.map((inc, i) => (
        <div key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:3 }}>Other Income {i + 1} — Particulars</div>
            <input type="text" value={inc.particulars || ""} onChange={(e) => update(i, "particulars", e.target.value)}
              placeholder="e.g. Interest Income"
              style={{ width:"100%", padding:"7px 10px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:13, outline:"none", boxSizing:"border-box" }} />
          </div>
          <div>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:3 }}>Declared Amount</div>
            <input type="number" value={inc.amount || ""} onChange={(e) => update(i, "amount", Number(e.target.value)||0)}
              placeholder="0"
              style={{ width:120, padding:"7px 10px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:13, textAlign:"right", outline:"none" }} />
          </div>
          {incomes.length > 1 && (
            <button type="button" onClick={() => remove(i)} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", marginTop:16 }}>
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={addIncome}
        style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#f18200", background:"none", border:"1px solid #f18200", borderRadius:6, padding:"6px 14px", cursor:"pointer", marginTop:4 }}>
        <Plus size={12} /> Add Income
      </button>
    </Modal>
  );
}

// ── TCS/TDS Modal ─────────────────────────────────────────────────────────────
function ModalTcsTds({ values, setValues, onClose }) {
  const total = (Number(values.tcs)||0) + (Number(values.tds)||0);
  return (
    <Modal
      title="TCS / TDS Deduction"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setValues({ tcs:0, tds:0 })}
    >
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, padding:"10px 12px", background:"#f8fafc", borderRadius:8, fontSize:13 }}>
        <span style={{ color:"#64748b" }}>Total declared in</span>
        <strong style={{ color:"#1e293b" }}>{fmt(total)}</strong>
      </div>
      {[
        { key:"tcs", label:"TCS Deduction" },
        { key:"tds", label:"TDS Deduction" },
      ].map(({ key, label }) => (
        <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f8fafc" }}>
          <span style={{ fontSize:13, color:"#334155" }}>{label}</span>
          <input type="number" value={values[key] || ""} onChange={(e) => setValues((prev) => ({ ...prev, [key]: Number(e.target.value)||0 }))}
            placeholder="0" style={{ width:130, padding:"6px 10px", border:"1px solid #e2e8f0", borderRadius:6, fontSize:13, textAlign:"right", outline:"none" }} />
        </div>
      ))}
    </Modal>
  );
}

// ── Declaration card ──────────────────────────────────────────────────────────
function DeclCard({ icon, title, declared, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:24, background:"#fff", border:"1px dashed #d0d8e8", borderRadius:12,
        cursor:"pointer", textAlign:"center", gap:10, transition:"box-shadow 0.15s",
        minHeight:160,
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(48,71,201,0.12)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ fontSize:36, lineHeight:1 }}>{icon}</div>
      <div style={{ fontSize:13, fontWeight:600, color:"#334155" }}>{title}</div>
      {declared ? (
        <div style={{ fontSize:12, color:"#16a34a", fontWeight:600 }}>Declared: {fmt(declared)}</div>
      ) : (
        <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#f18200", fontWeight:600 }}>
          Add to declaration <ChevronRight size={12} />
        </div>
      )}
    </button>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ITDeclaration() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [loading, setLoading] = useState(true);
  const [structure, setStructure] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  // State for each section
  const [vals123, setVals123]     = useState({});
  const [valsCh8, setValsCh8]     = useState({});
  const [hraData, setHraData]     = useState({ landlordName:"", panNo:"", city:"", annualRent:0, isMetro:false });
  const [medVals, setMedVals]     = useState({});
  const [houseData, setHouseData] = useState([{}]);
  const [selfOccupied, setSelfOccupied] = useState({});
  const [incomes, setIncomes]     = useState([{ particulars:"", amount:0 }]);
  const [tcsTds, setTcsTds]       = useState({ tcs:0, tds:0 });

  useEffect(() => {
    getMySalaryStructure()
      .then((s) => setStructure(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const breakdown = structure?.basic ? calculatePayslip(Number(structure.basic)) : null;
  const annualHRA = breakdown ? breakdown.hra * 12 : 0;
  const annualGross = breakdown ? breakdown.totalEarnings * 12 : 0;

  const declared123  = Math.min(SEC123_ITEMS.reduce((s, i) => s + (Number(vals123[i.label])||0), 0), 150000);
  const declaredCh8  = CH8_ITEMS.reduce((s, i) => s + (Number(valsCh8[i.label])||0), 0);
  const declaredHRA  = hraData.annualRent > 0 ? hraData.annualRent : 0;
  const declaredMed  = MED_ITEMS.reduce((s, i) => s + (Number(medVals[i.key])||0), 0);
  const declaredHouse = houseData.some((h) => h.annualValue || h.homeLoanInterest) ? 1 : 0;
  const declaredIncome = incomes.reduce((s, r) => s + (Number(r.amount)||0), 0);
  const declaredTcsTds = (Number(tcsTds.tcs)||0) + (Number(tcsTds.tds)||0);

  if (loading) {
    return <div style={{ padding:40, textAlign:"center", color:"#94a3b8", fontSize:14 }}>Loading…</div>;
  }

  const CARDS = [
    { key:"123", icon:"📊", title:"Section 123 and 124", declared: declared123 || null },
    { key:"ch8", icon:"📋", title:"Other Chapter VIII Deductions", declared: declaredCh8 || null },
    { key:"hra", icon:"🏠", title:"House Rent Allowance Exemption", declared: declaredHRA || null },
    { key:"med", icon:"🏥", title:"Medical (Section 126)", declared: declaredMed || null },
    { key:"house", icon:"🏡", title:"Income / Loss from House Property", declared: declaredHouse ? 1 : null },
    { key:"income", icon:"💰", title:"Other Income", declared: declaredIncome || null },
    { key:"tcs", icon:"📄", title:"TCS / TDS Deduction", declared: declaredTcsTds || null },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f5f7fb", padding:24 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:"#1e293b" }}>IT Declaration</h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#94a3b8" }}>
            Declared: {fmt(declared123 + declaredCh8 + declaredHRA + declaredMed + declaredIncome + declaredTcsTds)} &nbsp;|&nbsp; Annual Gross: {fmt(annualGross)}
          </p>
        </div>
        <FiscalYearPicker value={fiscalYearStart} onChange={setFiscalYearStart} />
      </div>

      {/* Cards grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:16 }}>
        {CARDS.map((card) => (
          <DeclCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            declared={card.declared}
            onClick={() => setOpenModal(card.key)}
          />
        ))}
      </div>

      {/* Modals */}
      {openModal === "123" && (
        <Modal123 values={vals123} setValues={setVals123} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "ch8" && (
        <ModalCh8 values={valsCh8} setValues={setValsCh8} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "hra" && (
        <ModalHRA
          hraData={hraData}
          setHraData={setHraData}
          annualHraReceived={annualHRA}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "med" && (
        <ModalMedical values={medVals} setValues={setMedVals} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "house" && (
        <ModalHouseProperty
          houseData={houseData}
          setHouseData={setHouseData}
          selfOccupied={selfOccupied}
          setSelfOccupied={setSelfOccupied}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "income" && (
        <ModalOtherIncome incomes={incomes} setIncomes={setIncomes} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "tcs" && (
        <ModalTcsTds values={tcsTds} setValues={setTcsTds} onClose={() => setOpenModal(null)} />
      )}
    </div>
  );
}
