import React, { useState } from "react";
import { Eye, CheckSquare } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input, Select,
  Table, Modal, SearchBar, StatusBadge,
  DetailRow, Tabs, TwoColGrid,
} from "./shared";
import {
  MOCK_ONBOARDING, MOCK_CANDIDATES, MOCK_OFFERS,
  getCandidateName, formatCurrency,
} from "./mockData";

const FORMALITY_STEPS = [
  { key: "employeeInfoSubmitted", label: "Employee Info Submitted" },
  { key: "photoUploaded", label: "Photo Uploaded" },
  { key: "joiningFormalities", label: "Joining Formalities" },
  { key: "teamLifeInsurance", label: "Team Life Insurance" },
  { key: "gratuityNomination", label: "Gratuity Nomination" },
  { key: "insuranceNomination", label: "Insurance Nomination" },
  { key: "pfDeclaration", label: "PF Declaration" },
  { key: "hrVerified", label: "HR Verification" },
];

const STEP_STATUS = ["Pending", "In Progress", "Completed"];

function StepStatus({ value, boolean }) {
  if (boolean) {
    return value
      ? <span style={{ background: "#d1fae5", color: "#059669", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ Done</span>
      : <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Pending</span>;
  }
  const colors = { Pending: { bg: "#fee2e2", color: "#dc2626" }, "In Progress": { bg: "#fef3c7", color: "#d97706" }, Completed: { bg: "#d1fae5", color: "#059669" } };
  const c = colors[value] || { bg: "#f3f4f6", color: "#6b7280" };
  return <span style={{ background: c.bg, color: c.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{value || "Pending"}</span>;
}

export default function OnboardingPage({ role }) {
  const [onboarding, setOnboarding] = useState(MOCK_ONBOARDING);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const filtered = onboarding.filter(o => {
    const q = search.toLowerCase();
    const cn = getCandidateName(o.candidateId).toLowerCase();
    return !q || cn.includes(q) || o.id.toLowerCase().includes(q);
  });

  function updateStep(id, key, value) {
    setOnboarding(os => os.map(o => o.id === id ? { ...o, [key]: value } : o));
    setDetail(d => d?.id === id ? { ...d, [key]: value } : d);
  }

  function markComplete(id) {
    setOnboarding(os => os.map(o => o.id === id ? {
      ...o, status: "Onboarded", hrVerified: true,
      joiningFormalities: "Completed", teamLifeInsurance: "Completed",
      gratuityNomination: "Completed", insuranceNomination: "Completed",
      pfDeclaration: "Completed",
    } : o));
    setDetail(d => d?.id === id ? { ...d, status: "Onboarded", hrVerified: true } : d);
  }

  const columns = [
    { header: "Onboarding ID", key: "id", width: 110 },
    { header: "Candidate", key: "candidateId", render: v => (
      <div>
        <div style={{ fontWeight: 600, color: "#111827" }}>{getCandidateName(v)}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{v}</div>
      </div>
    )},
    { header: "Effective Date", key: "effectiveDate" },
    { header: "Joining Formalities", key: "joiningFormalities", render: v => <StepStatus value={v} /> },
    { header: "PF Declaration", key: "pfDeclaration", render: v => <StepStatus value={v} /> },
    { header: "HR Verified", key: "hrVerified", render: v => <StepStatus value={v} boolean /> },
    { header: "Status", key: "status", render: v => {
      const c = v === "Onboarded" ? { bg: "#d1fae5", color: "#059669" } : { bg: "#fef3c7", color: "#d97706" };
      return <span style={{ background: c.bg, color: c.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{v}</span>;
    }},
    { header: "", key: "id", width: 70, render: (_, row) => (
      <Btn size="sm" variant="ghost" icon={<Eye size={13} />} onClick={e => { e.stopPropagation(); setDetail(row); setActiveTab(0); }}>View</Btn>
    )},
  ];

  const detailOffer = detail ? MOCK_OFFERS.find(o => o.id === detail.offerId) : null;

  const completedSteps = detail
    ? FORMALITY_STEPS.filter(s => {
        const v = detail[s.key];
        return v === true || v === "Completed";
      }).length
    : 0;
  const totalSteps = FORMALITY_STEPS.length;

  const tabs = ["Joining Formalities", "Offer Summary"];

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Onboarding"]}
        title="Onboarding"
        subtitle="Track joining formalities and finalize employee onboarding"
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total", count: onboarding.length, color: "#6b7280", bg: "#f3f4f6" },
          { label: "In Progress", count: onboarding.filter(o => o.status === "In Progress").length, color: "#d97706", bg: "#fef3c7" },
          { label: "Onboarded", count: onboarding.filter(o => o.status === "Onboarded").length, color: "#059669", bg: "#d1fae5" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: s.bg }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 12, color: s.color, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f0f0f0" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by candidate, ID..." />
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>{filtered.length} records</div>
        </div>
        <Table columns={columns} data={filtered} onRowClick={r => { setDetail(r); setActiveTab(0); }} />
      </Card>

      {/* ── Detail Modal ── */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`Onboarding — ${detail ? getCandidateName(detail.candidateId) : ""}`}
        width={620}
        footer={
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            {detail?.status !== "Onboarded" && (
              <Btn icon={<CheckSquare size={14} />} onClick={() => markComplete(detail.id)}>
                Finalize Onboarding
              </Btn>
            )}
            <div style={{ flex: 1 }} />
            <Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>
          </div>
        }
      >
        {detail && (
          <div>
            {/* Progress bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                <span>Onboarding Progress</span>
                <span style={{ fontWeight: 700, color: completedSteps === totalSteps ? "#059669" : "#f18200" }}>{completedSteps}/{totalSteps} steps</span>
              </div>
              <div style={{ height: 8, background: "#f3f4f6", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(completedSteps / totalSteps) * 100}%`, background: completedSteps === totalSteps ? "#059669" : "#f18200", transition: "width 0.4s", borderRadius: 8 }} />
              </div>
            </div>

            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {activeTab === 0 && (
              <div style={{ marginTop: 14 }}>
                {FORMALITY_STEPS.map((step, i) => {
                  const value = detail[step.key];
                  const isBoolean = typeof value === "boolean";
                  const isDone = value === true || value === "Completed";
                  return (
                    <div key={step.key} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", borderRadius: 8, marginBottom: 8,
                      background: isDone ? "#f0fdf4" : "#fafafa",
                      border: `1px solid ${isDone ? "#bbf7d0" : "#e5e7eb"}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: isDone ? "#059669" : "#e5e7eb", color: isDone ? "#fff" : "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                          {isDone ? "✓" : i + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{step.label}</span>
                      </div>
                      {isBoolean ? (
                        <button
                          style={{ cursor: "pointer", padding: "3px 12px", borderRadius: 20, border: "none", fontSize: 11, fontWeight: 700, background: value ? "#d1fae5" : "#fee2e2", color: value ? "#059669" : "#dc2626" }}
                          onClick={() => updateStep(detail.id, step.key, !value)}
                        >
                          {value ? "✓ Done" : "Pending"}
                        </button>
                      ) : (
                        <select
                          value={value || "Pending"}
                          onChange={e => updateStep(detail.id, step.key, e.target.value)}
                          style={{ fontSize: 12, fontWeight: 600, border: "1px solid #e5e7eb", borderRadius: 20, padding: "2px 10px", background: "transparent", cursor: "pointer" }}
                        >
                          {STEP_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })}

                <div style={{ marginTop: 14 }}>
                  <Field label="Effective Date">
                    <Input type="date" value={detail.effectiveDate || ""} onChange={e => updateStep(detail.id, "effectiveDate", e.target.value)} />
                  </Field>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div style={{ marginTop: 14 }}>
                {detailOffer ? (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                      <DetailRow label="Designation" value={detailOffer.designation} />
                      <DetailRow label="Date of Joining" value={detailOffer.dateOfJoining} />
                      <DetailRow label="Offer Status" value={detailOffer.offerStatus} />
                      <DetailRow label="Approval" value={detailOffer.approvalStatus} />
                    </div>
                    <div style={{ marginTop: 14, padding: "14px", background: "#fff7ed", borderRadius: 8, borderLeft: "3px solid #f18200" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 10 }}>CTC BREAKDOWN</div>
                      {[
                        ["Basic", detailOffer.basic],
                        ["HRA", detailOffer.hra],
                        ["Telephone Allowance", detailOffer.telephone],
                        ["Special Allowance", detailOffer.specialAllowance],
                        ["Gross Salary", detailOffer.grossSalary],
                        ["PF Contribution", detailOffer.pfContribution],
                        ["Statutory Bonus", detailOffer.statutoryBonus],
                        ["Gratuity", detailOffer.gratuity],
                        ["ESI", 0],
                        ["Cost to Company", detailOffer.ctcAmount],
                      ].map(([label, val], i) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                          <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: i === 9 ? 700 : 500, color: i === 9 ? "#f18200" : "#111827" }}>{val === 0 ? "Nil" : formatCurrency(val)}</span>
                        </div>
                      ))}
                    </div>
                    {detailOffer.ctcInWords && (
                      <div style={{ marginTop: 10, padding: "8px 12px", background: "#f9fafb", borderRadius: 6, fontSize: 12, color: "#374151", fontStyle: "italic" }}>
                        <strong>In Words:</strong> {detailOffer.ctcInWords}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "30px 0", color: "#9ca3af", fontSize: 13 }}>
                    No offer letter linked to this onboarding record.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
