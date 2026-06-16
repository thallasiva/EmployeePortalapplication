import { useEffect, useState } from "react";
import { Info, Save, Send, Calculator } from "lucide-react";
import { getMySalaryStructure } from "../../../api/payroll.api";
import { calculatePayslip } from "../../../utils/payslipCalculations";
import { FiscalYearPicker } from "../../../component/YearPicker";
import { getCurrentFiscalYearStart } from "../../../lib/dateUtils";

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const cap80C = 150000;

function InputField({ label, value, onChange, readOnly }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 13, color: "#475569" }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange && onChange(Number(e.target.value) || 0)}
        readOnly={readOnly}
        style={{
          width: 130, padding: "6px 10px", fontSize: 13,
          border: "1px solid #e2e8f0", borderRadius: 6,
          background: readOnly ? "#f8fafc" : "#fff",
          color: "#1e293b", textAlign: "right", outline: "none",
        }}
        onFocus={(e) => { if (!readOnly) e.target.style.borderColor = "#3b82f6"; }}
        onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; }}
      />
    </div>
  );
}

function SectionCard({ title, badge, children, total, totalLabel }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{title}</span>
          {badge && (
            <span style={{ fontSize: 10, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>{badge}</span>
          )}
        </div>
        {total !== undefined && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
            {totalLabel || "Total:"} {fmt(total)}
          </span>
        )}
      </div>
      <div style={{ padding: "4px 18px 10px" }}>{children}</div>
    </div>
  );
}

export default function ITDeclaration() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [loading, setLoading] = useState(true);
  const [structure, setStructure] = useState(null);
  const [saved, setSaved] = useState(false);

  // 80C fields
  const [pfContrib, setPfContrib] = useState(0);
  const [elss, setElss]           = useState(0);
  const [lifeIns, setLifeIns]     = useState(0);
  const [ppf, setPpf]             = useState(0);
  const [nsc, setNsc]             = useState(0);
  const [tuitionFee, setTuitionFee] = useState(0);

  // 80D
  const [medIns, setMedIns] = useState(0);

  // Home loan
  const [homeLoan, setHomeLoan] = useState(0);

  // HRA
  const [rentPaid, setRentPaid] = useState(0);

  useEffect(() => {
    getMySalaryStructure()
      .then((s) => {
        setStructure(s);
        if (s?.basic) {
          const b = calculatePayslip(Number(s.basic));
          setPfContrib(b.pf * 12); // annual PF
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total80C = pfContrib + elss + lifeIns + ppf + nsc + tuitionFee;
  const effective80C = Math.min(total80C, cap80C);
  const effective80D = Math.min(medIns, 25000);
  const effectiveHomeLoan = Math.min(homeLoan, 200000);

  // Estimated tax saved (30% slab assumed for simplicity)
  const totalDeductions = effective80C + effective80D + effectiveHomeLoan;
  const estTaxSaving = Math.round(totalDeductions * 0.3);

  const breakdown = structure?.basic ? calculatePayslip(Number(structure.basic)) : null;
  const annualGross = breakdown ? breakdown.totalEarnings * 12 : 0;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading salary data…</div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>IT Declaration</h1>
          {annualGross > 0 && (
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
              Annual Gross Income: <strong style={{ color: "#1e293b" }}>{fmt(annualGross)}</strong>
            </p>
          )}
          <div style={{
            marginTop: 10, padding: "8px 14px", background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: 8, display: "flex", alignItems: "center", gap: 8, maxWidth: 520,
          }}>
            <Info size={14} style={{ color: "#3b82f6", flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
              Declarations are pre-filled with your salary structure. Update as needed and submit.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <FiscalYearPicker
            value={fiscalYearStart}
            onChange={setFiscalYearStart}
            selectClassName="h-[38px] px-4 border border-[#d5dbe3] bg-white rounded text-[14px] outline-none"
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        {/* Left: Declaration form */}
        <div>
          {/* 80C */}
          <SectionCard title="Section 80C — Investments" badge={`Limit: ${fmt(cap80C)}`} total={total80C} totalLabel="Total 80C:">
            <InputField label="PF Contribution (auto)" value={pfContrib} onChange={setPfContrib} />
            <InputField label="ELSS Mutual Funds" value={elss} onChange={setElss} />
            <InputField label="Life Insurance Premium" value={lifeIns} onChange={setLifeIns} />
            <InputField label="PPF (Public Provident Fund)" value={ppf} onChange={setPpf} />
            <InputField label="NSC" value={nsc} onChange={setNsc} />
            <InputField label="Tuition Fees (Children)" value={tuitionFee} onChange={setTuitionFee} />
            {total80C > cap80C && (
              <p style={{ fontSize: 11, color: "#dc2626", margin: "6px 0 0" }}>
                ⚠️ Total exceeds ₹1,50,000 limit. Only {fmt(cap80C)} will be considered.
              </p>
            )}
          </SectionCard>

          {/* 80D */}
          <SectionCard title="Section 80D — Medical Insurance" badge="Limit: ₹25,000" total={medIns} totalLabel="Declared:">
            <InputField label="Medical Insurance Premium" value={medIns} onChange={setMedIns} />
          </SectionCard>

          {/* Home Loan */}
          <SectionCard title="Section 24B — Home Loan Interest" badge="Limit: ₹2,00,000" total={homeLoan} totalLabel="Declared:">
            <InputField label="Annual Interest Paid" value={homeLoan} onChange={setHomeLoan} />
          </SectionCard>

          {/* HRA */}
          <SectionCard title="HRA Exemption" total={rentPaid} totalLabel="Annual Rent:">
            <InputField label="Annual Rent Paid" value={rentPaid} onChange={setRentPaid} />
            {breakdown && rentPaid > 0 && (
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                Annual HRA received: {fmt(breakdown.hra * 12)}
              </p>
            )}
          </SectionCard>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: "1px solid #3b82f6", color: "#3b82f6", background: "#eff6ff", cursor: "pointer",
              }}
            >
              <Save size={15} />{saved ? "Saved!" : "Save Draft"}
            </button>
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer",
            }}>
              <Send size={15} />Submit Declaration
            </button>
          </div>
        </div>

        {/* Right: Summary */}
        <div style={{ position: "sticky", top: 20 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", background: "#1e293b", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calculator size={16} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Tax Summary</span>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              {[
                { label: "Annual Gross", value: annualGross, color: "#1e293b" },
                { label: "Standard Deduction", value: 50000, color: "#64748b" },
                { label: "80C (effective)", value: effective80C, color: "#64748b" },
                { label: "80D (effective)", value: effective80D, color: "#64748b" },
                { label: "Home Loan Int.", value: effectiveHomeLoan, color: "#64748b" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f8fafc" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color }}>{fmt(value)}</span>
                </div>
              ))}

              <div style={{ marginTop: 12, padding: "12px 14px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px" }}>Estimated Tax Saving</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#15803d", margin: 0 }}>{fmt(estTaxSaving)}</p>
                <p style={{ fontSize: 10, color: "#86efac", margin: "4px 0 0" }}>Based on 30% tax slab</p>
              </div>

              <div style={{ marginTop: 12, padding: "12px 14px", background: "#fafbfc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px" }}>Total Declared</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>{fmt(totalDeductions)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
