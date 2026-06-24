import { useEffect, useState } from "react";
import { Plus, X, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getMySalaryStructure } from "../../../api/payroll.api";
import { buildSalaryBreakdown } from "../../../utils/salaryBreakdown";
import { FiscalYearPicker } from "../../../component/YearPicker";
import { getCurrentFiscalYearStart, getFiscalYearRangeLabel } from "../../../lib/dateUtils";

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const STATUS_STYLES = {
  Approved: { bg: "#dcfce7", color: "#15803d", icon: <CheckCircle2 size={12} /> },
  Pending:  { bg: "#fef9c3", color: "#a16207", icon: <Clock size={12} /> },
  Rejected: { bg: "#fee2e2", color: "#dc2626", icon: <XCircle size={12} /> },
};

const CLAIM_TYPES = ["Mobile / Internet", "Fuel", "LTA", "Medical", "Food", "Conveyance"];

const HISTORY = [
  { date: "01-Jun-2026", type: "Mobile / Internet", amount: 1500, status: "Approved" },
  { date: "15-May-2026", type: "Fuel",              amount: 2500, status: "Pending"  },
  { date: "10-Apr-2026", type: "LTA",               amount: 5000, status: "Approved" },
];

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["Pending"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.icon}{status}
    </span>
  );
}

function ClaimModal({ onClose }) {
  const [form, setForm] = useState({ type: CLAIM_TYPES[0], amount: "", remarks: "", file: null });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Add Claim</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 5 }}>Claim Type</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" }}>
              {CLAIM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 5 }}>Amount (₹)</label>
            <input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="Enter amount"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 5 }}>Upload Bill</label>
            <label style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              border: "2px dashed #e2e8f0", borderRadius: 8, cursor: "pointer", background: "#fafbfc",
            }}>
              <Upload size={16} style={{ color: "#94a3b8" }} />
              <span style={{ fontSize: 13, color: form.file ? "#15803d" : "#64748b" }}>{form.file ? form.file.name : "Choose file"}</span>
              <input type="file" style={{ display: "none" }} onChange={(e) => set("file", e.target.files[0])} />
            </label>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 5 }}>Remarks</label>
            <input type="text" value={form.remarks} onChange={(e) => set("remarks", e.target.value)} placeholder="Optional remarks"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#fff", color: "#64748b", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={onClose}
              style={{ flex: 1, padding: 10, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#f18200", color: "#fff", cursor: "pointer" }}>
              Submit Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Reimbursement() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [activeTab, setActiveTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [entitlements, setEntitlements] = useState([]);

  useEffect(() => {
    getMySalaryStructure()
      .then((s) => {
        if (s?.basic) {
          const b = buildSalaryBreakdown(s);
          setEntitlements([
            { title: "Telephone & Internet", annual: b.telephone * 12, claimed: 1500, color: "#f97316" },
            { title: "LTA (Leave Travel)", annual: b.lta * 12, claimed: 5000, color: "#f59e0b" },
            { title: "Medical Allowance", annual: b.medicalAllowance * 12, claimed: 0, color: "#10b981" },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fyLabel = getFiscalYearRangeLabel(fiscalYearStart);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", padding: 24 }}>
      {showModal && <ClaimModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Reimbursements</h1>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>{fyLabel}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <FiscalYearPicker value={fiscalYearStart} onChange={setFiscalYearStart}
            selectClassName="h-[38px] px-4 border border-[#d5dbe3] bg-white rounded text-[14px] outline-none" />
          <button onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "#f18200", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={15} />Add Claim
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 20 }}>
        {[{ k: "overview", l: "Overview" }, { k: "claims", l: "My Claims" }].map(({ k, l }) => (
          <button key={k} type="button" onClick={() => setActiveTab(k)}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: activeTab === k ? 700 : 400,
              color: activeTab === k ? "#f18200" : "#64748b", background: "none", border: "none",
              borderBottom: activeTab === k ? "2px solid #f18200" : "2px solid transparent",
              cursor: "pointer", marginBottom: -1,
            }}>{l}</button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {entitlements.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>No reimbursement entitlements found.</p>
            </div>
          ) : entitlements.map((item) => {
            const balance = item.annual - item.claimed;
            const usedPct = Math.round((item.claimed / (item.annual || 1)) * 100);
            return (
              <div key={item.title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Donut */}
                  <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ width: 60, height: 60, transform: "rotate(-90deg)" }}>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={item.color} strokeWidth="4"
                        strokeDasharray={`${usedPct} ${100 - usedPct}`} strokeLinecap="round" />
                    </svg>
                    <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: item.color }}>
                      {usedPct}%
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>{item.title}</p>
                    <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 13, color: "#64748b" }}>
                      <span>Annual Entitlement: <strong style={{ color: "#1e293b" }}>{fmt(item.annual)}</strong></span>
                      <span>|</span>
                      <span>Claimed: <strong style={{ color: "#1e293b" }}>{fmt(item.claimed)}</strong></span>
                    </div>
                    <div style={{ height: 5, width: 280, background: "#f1f5f9", borderRadius: 999, marginTop: 8 }}>
                      <div style={{ width: `${usedPct}%`, height: "100%", background: item.color, borderRadius: 999 }} />
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Balance</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: balance > 0 ? "#15803d" : "#ef4444", margin: "4px 0 0" }}>{fmt(balance)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Claims tab */}
      {activeTab === "claims" && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          {HISTORY.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>No claims submitted yet.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px", padding: "10px 18px", background: "#f8fafc", borderBottom: "1px solid #e8edf2", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>Date / Type</span><span>Amount</span><span>Status</span><span>Action</span>
              </div>
              {HISTORY.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px", padding: "14px 18px", borderBottom: "1px solid #f8fafc", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0 }}>{c.type}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{c.date}</p>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{fmt(c.amount)}</span>
                  <StatusBadge status={c.status} />
                  <button style={{ fontSize: 12, color: "#f18200", background: "none", border: "none", cursor: "pointer", padding: 0 }}>View</button>
                </div>
              ))}
              <div style={{ padding: "12px 18px", background: "#f8fafc", borderTop: "1px solid #e8edf2", display: "flex", justifyContent: "flex-end", gap: 24 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Total Claimed: <strong style={{ color: "#1e293b" }}>{fmt(HISTORY.reduce((a, c) => a + c.amount, 0))}</strong></span>
                <span style={{ fontSize: 12, color: "#15803d" }}>Approved: <strong>{fmt(HISTORY.filter((c) => c.status === "Approved").reduce((a, c) => a + c.amount, 0))}</strong></span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
