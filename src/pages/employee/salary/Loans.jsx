import React, { useState } from "react";
import { DollarSign, PiggyBank, Calendar, TrendingDown, Plus, X } from "lucide-react";import { cssClass, joinClasses } from "../../../utils/classStyles";

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const LOAN_TYPES = ["Personal Loan", "Home Loan", "Vehicle Loan", "Emergency Advance", "Medical Advance"];

const HISTORY = [
{ id: "LN001", type: "Personal Loan", amount: 120000, outstanding: 70000, emi: 10000, tenure: 12, remaining: 7, status: "Active", date: "01-Apr-2025" },
{ id: "LN002", type: "Emergency Advance", amount: 50000, outstanding: 0, emi: 5000, tenure: 10, remaining: 0, status: "Closed", date: "01-Jan-2024" }];


function StatCard({ icon, label, value, color = "#1e293b", bg = "#fff" }) {
  return (
    <div className={cssClass({ background: bg, border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14 })}>
      <div className={cssClass({ width: 44, height: 44, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 })}>
        {React.cloneElement(icon, { size: 20, style: { color } })}
      </div>
      <div>
        <p className={cssClass({ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 })}>{label}</p>
        <p className={cssClass({ fontSize: 20, fontWeight: 800, color, margin: "6px 0 0" })}>{value}</p>
      </div>
    </div>);

}

function ApplyModal({ onClose }) {
  const [form, setForm] = useState({ type: LOAN_TYPES[0], amount: "", tenure: "", reason: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const emi = form.amount && form.tenure ? Math.round(Number(form.amount) / Number(form.tenure)) : 0;

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 })}>
      <div className={cssClass({ background: "#fff", borderRadius: 14, width: 440, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" })}>
        <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f1f5f9" })}>
          <span className={cssClass({ fontSize: 16, fontWeight: 700, color: "#1e293b" })}>Apply for Loan</span>
          <button onClick={onClose} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" })}><X size={20} /></button>
        </div>
        <div className={cssClass({ padding: 22 })}>
          {[
          { label: "Loan Type", key: "type", type: "select" },
          { label: "Loan Amount (₹)", key: "amount", type: "number", placeholder: "e.g. 100000" },
          { label: "Repayment Tenure (months)", key: "tenure", type: "number", placeholder: "e.g. 12" },
          { label: "Reason / Purpose", key: "reason", type: "text", placeholder: "Brief reason for loan" }].
          map(({ label, key, type, placeholder }) =>
          <div key={key} className={cssClass({ marginBottom: 16 })}>
              <label className={cssClass({ fontSize: 12, color: "#64748b", display: "block", marginBottom: 5 })}>{label}</label>
              {type === "select" ?
            <select value={form[key]} onChange={(e) => set(key, e.target.value)} className={cssClass(
              { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" })}>
                  {LOAN_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select> :

            <input type={type} value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} className={cssClass(
              { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" })} />
            }
            </div>
          )}

          {emi > 0 &&
          <div className={cssClass({ padding: "12px 16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, marginBottom: 18 })}>
              <p className={cssClass({ fontSize: 12, color: "#0369a1", margin: 0 })}>
                Estimated monthly EMI: <strong className={cssClass({ fontSize: 14 })}>{fmt(emi)}</strong>
              </p>
            </div>
          }

          <div className={cssClass({ display: "flex", gap: 10 })}>
            <button onClick={onClose} className={cssClass(
              { flex: 1, padding: "10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#fff", color: "#64748b", cursor: "pointer" })}>
              Cancel
            </button>
            <button onClick={onClose} className={cssClass(
              { flex: 1, padding: "10px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#f18200", color: "#fff", cursor: "pointer" })}>
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>);

}

export default function Loans() {
  const [tab, setTab] = useState("active");
  const [showModal, setShowModal] = useState(false);

  const active = HISTORY.filter((l) => l.status === "Active");
  const closed = HISTORY.filter((l) => l.status === "Closed");

  const totalOutstanding = active.reduce((a, l) => a + l.outstanding, 0);
  const totalEMI = active.reduce((a, l) => a + l.emi, 0);

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: 24 })}>
      {showModal && <ApplyModal onClose={() => setShowModal(false)} />}

      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 })}>
        <h1 className={cssClass({ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 })}>Loans & Advances</h1>
        <button
          onClick={() => setShowModal(true)} className={cssClass(
            { display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "#f18200", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" })}>
          
          <Plus size={15} />Apply for Loan
        </button>
      </div>

      {/* KPI cards */}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 })}>
        <StatCard icon={<DollarSign />} label="Total Borrowed" value={fmt(HISTORY.reduce((a, l) => a + l.amount, 0))} color="#f18200" />
        <StatCard icon={<TrendingDown />} label="Outstanding" value={fmt(totalOutstanding)} color="#ef4444" bg="#fff5f5" />
        <StatCard icon={<PiggyBank />} label="Monthly EMI" value={fmt(totalEMI)} color="#f59e0b" bg="#fffbeb" />
        <StatCard icon={<Calendar />} label="Active Loans" value={active.length} color="#15803d" bg="#f0fdf4" />
      </div>

      {/* Tabs */}
      <div className={cssClass({ display: "flex", gap: 8, marginBottom: 14 })}>
        {["active", "closed"].map((t) =>
        <button key={t} type="button" onClick={() => setTab(t)} className={cssClass(
          {
            padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: tab === t ? "#f18200" : "#fff", color: tab === t ? "#fff" : "#64748b",
            border: tab === t ? "none" : "1px solid #e2e8f0", textTransform: "capitalize"
          })}>{t === "active" ? "Active Loans" : "Closed Loans"}</button>
        )}
      </div>

      {/* List */}
      {(tab === "active" ? active : closed).length === 0 ?
      <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "60px 24px", textAlign: "center" })}>
          <PiggyBank size={52} strokeWidth={1} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
          <p className={cssClass({ color: "#94a3b8", fontSize: 14 })}>No {tab} loans found.</p>
        </div> :

      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
          {(tab === "active" ? active : closed).map((loan) => {
          const progress = Math.round((loan.amount - loan.outstanding) / loan.amount * 100);
          return (
            <div key={loan.id} className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 })}>
                <div className={cssClass({ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 })}>
                  <div>
                    <div className={cssClass({ display: "flex", alignItems: "center", gap: 10 })}>
                      <span className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b" })}>{loan.type}</span>
                      <span className={cssClass({ fontSize: 10, padding: "2px 8px", borderRadius: 999, fontWeight: 700,
                      background: loan.status === "Active" ? "#dcfce7" : "#f1f5f9",
                      color: loan.status === "Active" ? "#15803d" : "#64748b"
                    })}>{loan.status}</span>
                    </div>
                    <p className={cssClass({ fontSize: 12, color: "#94a3b8", margin: "3px 0 0" })}>ID: {loan.id} · Issued: {loan.date}</p>
                  </div>
                  <span className={cssClass({ fontSize: 18, fontWeight: 800, color: "#1e293b" })}>{fmt(loan.amount)}</span>
                </div>

                <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 })}>
                  {[
                { label: "Outstanding", value: fmt(loan.outstanding), color: "#ef4444" },
                { label: "Monthly EMI", value: fmt(loan.emi), color: "#f59e0b" },
                { label: "Total Tenure", value: `${loan.tenure} months`, color: "#64748b" },
                { label: "Remaining", value: `${loan.remaining} months`, color: "#f18200" }].
                map(({ label, value, color }) =>
                <div key={label} className={cssClass({ padding: "10px 12px", background: "#f8fafc", borderRadius: 8 })}>
                      <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: 0 })}>{label}</p>
                      <p className={cssClass({ fontSize: 14, fontWeight: 700, color, margin: "4px 0 0" })}>{value}</p>
                    </div>
                )}
                </div>

                {/* Repayment progress */}
                <div>
                  <div className={cssClass({ display: "flex", justifyContent: "space-between", marginBottom: 5 })}>
                    <span className={cssClass({ fontSize: 11, color: "#64748b" })}>Repayment Progress</span>
                    <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#f18200" })}>{progress}%</span>
                  </div>
                  <div className={cssClass({ height: 6, background: "#f1f5f9", borderRadius: 999 })}>
                    <div className={cssClass({ width: `${progress}%`, height: "100%", background: "#f18200", borderRadius: 999 })} />
                  </div>
                  <div className={cssClass({ display: "flex", justifyContent: "space-between", marginTop: 4 })}>
                    <span className={cssClass({ fontSize: 11, color: "#22c55e" })}>Paid: {fmt(loan.amount - loan.outstanding)}</span>
                    <span className={cssClass({ fontSize: 11, color: "#ef4444" })}>Outstanding: {fmt(loan.outstanding)}</span>
                  </div>
                </div>
              </div>);

        })}
        </div>
      }
    </div>);

}
