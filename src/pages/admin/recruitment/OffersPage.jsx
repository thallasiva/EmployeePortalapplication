import React, { useState } from "react";
import { Plus, Eye, CheckCircle, XCircle } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input, Select, Textarea,
  Table, Modal, SlideOver, SearchBar, StatusBadge,
  TwoColGrid, DetailRow, EmptyState,
} from "./shared";
import {
  MOCK_OFFERS, MOCK_CANDIDATES, MOCK_JOBS,
  getCandidateName, getJobTitle, formatCurrency,
} from "./mockData";

const BLANK_OFFER = {
  candidateId: "", jobId: "", designation: "",
  dateOfJoining: "", ctcAmount: "",
  basic: "", hra: "", telephone: "12000", specialAllowance: "",
  ctcInWords: "",
};

function numToWords(n) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (!n || n === 0) return "Zero";
  const lakh = Math.floor(n / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  let result = "";
  if (lakh) result += (lakh < 20 ? ones[lakh] : tens[Math.floor(lakh/10)] + (lakh%10 ? " " + ones[lakh%10] : "")) + " Lakh ";
  if (thousand) result += (thousand < 20 ? ones[thousand] : tens[Math.floor(thousand/10)] + (thousand%10 ? " " + ones[thousand%10] : "")) + " Thousand ";
  if (hundred) result += ones[hundred] + " Hundred ";
  if (rest) result += (rest < 20 ? ones[rest] : tens[Math.floor(rest/10)] + (rest%10 ? " " + ones[rest%10] : "")) + " ";
  return result.trim() + " Rupees Only";
}

function computeCTC(basic) {
  basic = Number(basic) || 0;
  const hra = Math.round(basic * 0.4);
  const telephone = 12000;
  const gross = basic + hra + telephone;
  const specialAllowance = Math.round(gross * 0.144);
  const grossSalary = gross + specialAllowance;
  const pfContribution = Math.round(basic * 0.12);
  const statutoryBonus = 46250;
  const gratuity = Math.round(basic * 4.81 / 100);
  const esi = 0;
  const costToCompany = grossSalary + pfContribution + statutoryBonus + gratuity;
  return { hra, telephone, specialAllowance, grossSalary, pfContribution, statutoryBonus, gratuity, esi, costToCompany };
}

export default function OffersPage({ role }) {
  const [offers, setOffers] = useState(MOCK_OFFERS);
  const [search, setSearch] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(BLANK_OFFER);
  const [computed, setComputed] = useState({});

  const isAdmin = role === 1;
  const isTL = role === 4;
  const canCreate = isAdmin || isTL;

  const filtered = offers.filter(o => {
    const q = search.toLowerCase();
    const cn = getCandidateName(o.candidateId).toLowerCase();
    const jt = getJobTitle(o.jobId).toLowerCase();
    return !q || cn.includes(q) || jt.includes(q) || o.id.toLowerCase().includes(q);
  });

  function handleChange(e) {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    if (name === "basic") {
      const c = computeCTC(value);
      setComputed(c);
      next.hra = c.hra;
      next.specialAllowance = c.specialAllowance;
      next.ctcAmount = c.costToCompany;
      next.ctcInWords = numToWords(c.costToCompany);
    }
    setForm(next);
  }

  function handleCreate(e) {
    e.preventDefault();
    const c = computed;
    const newOffer = {
      ...form,
      id: `OFF${String(offers.length + 1).padStart(3, "0")}`,
      ctcAmount: c.costToCompany || Number(form.ctcAmount),
      ...c,
      approvalStatus: "Pending", approvedBy: null,
      offerStatus: "Offer Released",
      sentDate: new Date().toISOString().slice(0, 10),
      respondedDate: null,
    };
    setOffers(o => [newOffer, ...o]);
    setOfferOpen(false);
    setForm(BLANK_OFFER);
    setComputed({});
  }

  function updateOfferStatus(id, status) {
    setOffers(os => os.map(o => o.id === id ? { ...o, offerStatus: status, respondedDate: new Date().toISOString().slice(0, 10) } : o));
    setDetail(d => d?.id === id ? { ...d, offerStatus: status } : d);
  }

  const OFFER_COLORS = {
    "Offer Released": { color: "#d97706", bg: "#fef3c7" },
    "Offer Accepted": { color: "#059669", bg: "#d1fae5" },
    "Offer Rejected": { color: "#dc2626", bg: "#fee2e2" },
  };

  const columns = [
    { header: "Offer ID", key: "id", width: 90 },
    { header: "Candidate", key: "candidateId", render: v => (
      <div>
        <div style={{ fontWeight: 600, color: "#111827" }}>{getCandidateName(v)}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{MOCK_OFFERS.find(o => o.candidateId === v)?.designation}</div>
      </div>
    )},
    { header: "Position", key: "jobId", render: v => getJobTitle(v) },
    { header: "CTC", key: "ctcAmount", render: v => formatCurrency(v) },
    { header: "Date of Joining", key: "dateOfJoining" },
    { header: "Approval", key: "approvalStatus", render: v => {
      const c = v === "Approved" ? { color: "#059669", bg: "#d1fae5" } : v === "Pending" ? { color: "#d97706", bg: "#fef3c7" } : { color: "#dc2626", bg: "#fee2e2" };
      return <span style={{ background: c.bg, color: c.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{v}</span>;
    }},
    { header: "Offer Status", key: "offerStatus", render: v => {
      const c = OFFER_COLORS[v] || { color: "#6b7280", bg: "#f3f4f6" };
      return <span style={{ background: c.bg, color: c.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{v}</span>;
    }},
    { header: "", key: "id", width: 60, render: (_, row) => (
      <Btn size="sm" variant="ghost" icon={<Eye size={13} />} onClick={e => { e.stopPropagation(); setDetail(row); }}>View</Btn>
    )},
  ];

  const Row = ({ label, value, highlight }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? "#f18200" : "#111827" }}>{value}</span>
    </div>
  );

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Offers"]}
        title="Offer Management"
        subtitle="Release, track and manage candidate offer letters"
        action={canCreate && (
          <Btn icon={<Plus size={16} />} onClick={() => setOfferOpen(true)}>
            Release Offer
          </Btn>
        )}
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total Offers", count: offers.length, color: "#6b7280", bg: "#f3f4f6" },
          { label: "Pending", count: offers.filter(o => o.offerStatus === "Offer Released").length, color: "#d97706", bg: "#fef3c7" },
          { label: "Accepted", count: offers.filter(o => o.offerStatus === "Offer Accepted").length, color: "#059669", bg: "#d1fae5" },
          { label: "Rejected", count: offers.filter(o => o.offerStatus === "Offer Rejected").length, color: "#dc2626", bg: "#fee2e2" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: s.bg }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 12, color: s.color, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f0f0f0" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by candidate, job, offer ID..." />
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>{filtered.length} offers</div>
        </div>
        <Table columns={columns} data={filtered} onRowClick={r => setDetail(r)} />
      </Card>

      {/* ── Release Offer SlideOver ── */}
      <SlideOver
        open={offerOpen}
        onClose={() => { setOfferOpen(false); setForm(BLANK_OFFER); setComputed({}); }}
        title="Release Offer Letter"
        width={560}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setOfferOpen(false)}>Cancel</Btn>
            <Btn onClick={handleCreate}>Release Offer</Btn>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <TwoColGrid>
            <Field label="Candidate" required>
              <Select name="candidateId" value={form.candidateId} onChange={handleChange}
                options={MOCK_CANDIDATES.filter(c => c.status === "Shortlisted" || c.status === "Offer Released").map(c => ({ value: c.id, label: c.name }))}
                placeholder="Select candidate" />
            </Field>
            <Field label="Job Position" required>
              <Select name="jobId" value={form.jobId} onChange={handleChange}
                options={MOCK_JOBS.map(j => ({ value: j.id, label: j.title }))} placeholder="Select job" />
            </Field>
            <Field label="Designation" required>
              <Input name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Senior Java Developer" />
            </Field>
            <Field label="Date of Joining" required>
              <Input name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handleChange} />
            </Field>
          </TwoColGrid>

          <div style={{ padding: "14px", background: "#f9fafb", borderRadius: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 10 }}>CTC BREAKDOWN (Auto-Computed)</div>
            <Field label="Basic Salary (Annual ₹)" required>
              <Input name="basic" type="number" value={form.basic} onChange={handleChange} placeholder="Enter basic salary, rest auto-computes" />
            </Field>
            {form.basic && (
              <>
                <Row label="HRA (40% of Basic)" value={formatCurrency(computed.hra)} />
                <Row label="Telephone Allowance" value={formatCurrency(computed.telephone)} />
                <Row label="Special Allowance (~14.4%)" value={formatCurrency(computed.specialAllowance)} />
                <Row label="Gross Salary" value={formatCurrency(computed.grossSalary)} />
                <div style={{ height: 8 }} />
                <Row label="PF Contribution (12% of Basic)" value={formatCurrency(computed.pfContribution)} />
                <Row label="Statutory Bonus" value={formatCurrency(computed.statutoryBonus)} />
                <Row label="Gratuity (4.81% of Basic)" value={formatCurrency(computed.gratuity)} />
                <Row label="ESI" value="Nil" />
                <Row label="Cost to Company (CTC)" value={formatCurrency(computed.costToCompany)} highlight />
              </>
            )}
          </div>

          <Field label="CTC in Words">
            <Input name="ctcInWords" value={form.ctcInWords} onChange={handleChange} placeholder="Auto-generated above" />
          </Field>
        </form>
      </SlideOver>

      {/* ── Offer Detail Modal ── */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Offer Letter Details"
        width={640}
        footer={
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            {detail?.offerStatus === "Offer Released" && (
              <>
                <Btn icon={<CheckCircle size={14} />} onClick={() => updateOfferStatus(detail.id, "Offer Accepted")}>Mark Accepted</Btn>
                <Btn variant="danger" icon={<XCircle size={14} />} onClick={() => updateOfferStatus(detail.id, "Offer Rejected")}>Mark Rejected</Btn>
              </>
            )}
            <div style={{ flex: 1 }} />
            <Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>
          </div>
        }
      >
        {detail && (() => {
          const sc = OFFER_COLORS[detail.offerStatus] || { color: "#6b7280", bg: "#f3f4f6" };
          return (
            <div>
              {/* Header */}
              <div style={{ padding: "14px 16px", background: "#f9fafb", borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{getCandidateName(detail.candidateId)}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{detail.designation} — {getJobTitle(detail.jobId)}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <span style={{ background: sc.bg, color: sc.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{detail.offerStatus}</span>
                    <span style={{ background: detail.approvalStatus === "Approved" ? "#d1fae5" : "#fef3c7", color: detail.approvalStatus === "Approved" ? "#059669" : "#d97706", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{detail.approvalStatus}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Offer ID</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f18200" }}>{detail.id}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                <DetailRow label="Date of Joining" value={detail.dateOfJoining} />
                <DetailRow label="Sent Date" value={detail.sentDate} />
                <DetailRow label="Responded Date" value={detail.respondedDate || "—"} />
                <DetailRow label="Approved By" value={detail.approvedBy || "—"} />
              </div>

              <div style={{ marginTop: 14, padding: "14px", background: "#fff7ed", borderRadius: 8, borderLeft: "3px solid #f18200" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 10 }}>CTC BREAKDOWN</div>
                <Row label="Basic Salary" value={formatCurrency(detail.basic)} />
                <Row label="HRA" value={formatCurrency(detail.hra)} />
                <Row label="Telephone Allowance" value={formatCurrency(detail.telephone)} />
                <Row label="Special Allowance" value={formatCurrency(detail.specialAllowance)} />
                <Row label="Gross Salary" value={formatCurrency(detail.grossSalary)} />
                <div style={{ height: 8 }} />
                <Row label="PF Contribution" value={formatCurrency(detail.pfContribution)} />
                <Row label="Statutory Bonus" value={formatCurrency(detail.statutoryBonus)} />
                <Row label="Gratuity" value={formatCurrency(detail.gratuity)} />
                <Row label="ESI" value="Nil" />
                <Row label="Cost to Company (CTC)" value={formatCurrency(detail.ctcAmount)} highlight />
                {detail.ctcInWords && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "#78350f", fontStyle: "italic" }}>
                    <strong>In Words:</strong> {detail.ctcInWords}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
