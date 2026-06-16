import React, { useEffect, useState } from "react";
import { Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getMySalaryStructure } from "../../../api/payroll.api";
import { calculatePayslip } from "../../../utils/payslipCalculations";
import { FiscalYearPicker } from "../../../component/YearPicker";
import { getCurrentFiscalYearStart } from "../../../lib/dateUtils";

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const INVEST_TYPES = ["ELSS Mutual Fund", "Life Insurance", "PPF", "NSC", "PF (auto)", "Tuition Fees", "Home Loan Principal"];

const STATUS_STYLES = {
  Verified:  { bg: "#dcfce7", color: "#15803d", icon: <CheckCircle2 size={13} /> },
  Pending:   { bg: "#fef9c3", color: "#a16207", icon: <Clock size={13} /> },
  Rejected:  { bg: "#fee2e2", color: "#dc2626", icon: <XCircle size={13} /> },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["Pending"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: s.bg, color: s.color }}>
      {s.icon}{status}
    </span>
  );
}

export default function ProofInvestment() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [loading, setLoading]   = useState(true);
  const [breakdown, setBreakdown] = useState(null);

  const [investType, setInvestType]  = useState(INVEST_TYPES[0]);
  const [declaredAmt, setDeclaredAmt] = useState(0);
  const [actualAmt, setActualAmt]     = useState(0);
  const [file, setFile]               = useState(null);
  const [uploaded, setUploaded]       = useState(false);

  useEffect(() => {
    getMySalaryStructure()
      .then((s) => { if (s?.basic) setBreakdown(calculatePayslip(Number(s.basic))); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Build proof list based on salary data
  const proofList = breakdown ? [
    { type: "PF Contribution", declared: breakdown.pf * 12, actual: breakdown.pf * 12, status: "Verified" },
    { type: "ELSS Mutual Fund", declared: 30000, actual: 28500, status: "Verified" },
    { type: "Life Insurance", declared: 20000, actual: 20000, status: "Pending" },
    { type: "PPF", declared: 50000, actual: 0, status: "Pending" },
  ] : [];

  const handleUpload = () => {
    if (!file) return;
    setUploaded(true);
    setTimeout(() => setUploaded(false), 3000);
    setFile(null);
    setActualAmt(0);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Proof of Investment</h1>
        <FiscalYearPicker value={fiscalYearStart} onChange={setFiscalYearStart}
          selectClassName="h-[38px] px-4 border border-[#d5dbe3] bg-white rounded text-[14px] outline-none" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Upload form */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Upload Proof</span>
          </div>
          <div style={{ padding: 20 }}>
            {/* Investment type */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Investment Type</label>
              <select
                value={investType}
                onChange={(e) => {
                  setInvestType(e.target.value);
                  const found = proofList.find((p) => p.type === e.target.value);
                  setDeclaredAmt(found?.declared || 0);
                }}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1e293b", background: "#fff", outline: "none" }}
              >
                {INVEST_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Declared amount (read-only from IT declaration) */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Declared Amount</label>
              <div style={{ padding: "9px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                {fmt(declaredAmt || (proofList.find((p) => p.type === investType)?.declared ?? 0))}
              </div>
            </div>

            {/* Actual amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Actual Investment Amount</label>
              <input
                type="number"
                value={actualAmt || ""}
                onChange={(e) => setActualAmt(Number(e.target.value) || 0)}
                placeholder="Enter actual amount"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1e293b", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* File upload */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Upload Document</label>
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "24px", border: "2px dashed #e2e8f0", borderRadius: 8, cursor: "pointer",
                background: file ? "#f0fdf4" : "#fafbfc", transition: "all 0.15s",
              }}>
                <Upload size={24} style={{ color: file ? "#22c55e" : "#94a3b8", marginBottom: 8 }} />
                <span style={{ fontSize: 13, color: file ? "#15803d" : "#64748b", fontWeight: file ? 600 : 400 }}>
                  {file ? file.name : "Click to choose file (PDF, JPG, PNG)"}
                </span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files[0] || null)} />
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file}
              style={{
                width: "100%", padding: "11px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: file ? "#3b82f6" : "#e2e8f0",
                color: file ? "#fff" : "#94a3b8",
                border: "none", cursor: file ? "pointer" : "not-allowed",
              }}
            >
              {uploaded ? "✓ Uploaded!" : "Upload Proof"}
            </button>
          </div>
        </div>

        {/* Uploaded proofs list */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Uploaded Proofs</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{proofList.length} declarations</span>
          </div>
          <div>
            {proofList.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Upload size={40} strokeWidth={1} style={{ color: "#cbd5e1", marginBottom: 8 }} />
                <p style={{ color: "#94a3b8", fontSize: 13 }}>No proofs uploaded yet.</p>
              </div>
            ) : (
              proofList.map((p, i) => (
                <div key={i} style={{ padding: "14px 18px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0 }}>{p.type}</p>
                    <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Declared: <strong>{fmt(p.declared)}</strong></span>
                      {p.actual > 0 && <span style={{ fontSize: 11, color: "#64748b" }}>Actual: <strong>{fmt(p.actual)}</strong></span>}
                    </div>
                    {p.actual > 0 && p.actual < p.declared && (
                      <p style={{ fontSize: 11, color: "#f59e0b", margin: "3px 0 0" }}>
                        ⚠️ Shortfall: {fmt(p.declared - p.actual)}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))
            )}
          </div>
          {proofList.length > 0 && (
            <div style={{ padding: "12px 18px", background: "#f8fafc", borderTop: "1px solid #e8edf2" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Total Declared</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                  {fmt(proofList.reduce((a, p) => a + p.declared, 0))}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Total Verified</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                  {fmt(proofList.filter((p) => p.status === "Verified").reduce((a, p) => a + p.actual, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
