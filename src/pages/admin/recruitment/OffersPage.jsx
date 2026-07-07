import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Eye, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input,
  Table, Modal, SlideOver, SearchBar,
  TwoColGrid, DetailRow,
} from "./shared";
import {
  listOffers, createOffer, releaseOffer, respondOffer,
  listCandidates, listJobs, getErrorMessage,
} from "../../../api/recruitment.api";
import { successToast, errorToast } from "../../../utils/ToastControllers";

const BLANK_OFFER = {
  candidateId: "", jobReqId: "", designation: "",
  dateOfJoining: "", basic: "",
};

// ── CTC auto-compute ──────────────────────────────────────────────────
function computeCTC(basic) {
  basic = Number(basic) || 0;
  const hra = Math.round(basic * 0.4);
  const telephoneAllowance = 12000;
  const gross = basic + hra + telephoneAllowance;
  const specialAllowance = Math.round(gross * 0.144);
  const grossSalary = gross + specialAllowance;
  const pfContribution = Math.round(basic * 0.12);
  const statutoryBonus = 46250;
  const gratuity = Math.round(basic * 4.81 / 100);
  const esi = 0;
  const ctc = grossSalary + pfContribution + statutoryBonus + gratuity;
  return { hra, telephoneAllowance, specialAllowance, grossSalary, pfContribution, statutoryBonus, gratuity, esi, ctc };
}

function numToWords(n) {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (!n || n === 0) return "Zero";
  const lakh = Math.floor(n / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  let r = "";
  if (lakh) r += (lakh < 20 ? ones[lakh] : tens[Math.floor(lakh/10)] + (lakh%10 ? " "+ones[lakh%10] : "")) + " Lakh ";
  if (thousand) r += (thousand < 20 ? ones[thousand] : tens[Math.floor(thousand/10)] + (thousand%10 ? " "+ones[thousand%10] : "")) + " Thousand ";
  if (hundred) r += ones[hundred] + " Hundred ";
  if (rest) r += (rest < 20 ? ones[rest] : tens[Math.floor(rest/10)] + (rest%10 ? " "+ones[rest%10] : "")) + " ";
  return r.trim() + " Rupees Only";
}

function fmt(v) {
  if (!v && v !== 0) return "—";
  return "₹" + Number(v).toLocaleString("en-IN");
}

const OFFER_COLORS = {
  Draft:    { color: "#6b7280", bg: "#f3f4f6" },
  Released: { color: "#d97706", bg: "#fef3c7" },
  Accepted: { color: "#059669", bg: "#d1fae5" },
  Rejected: { color: "#dc2626", bg: "#fee2e2" },
};

function CtcRow({ label, value, highlight }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f3f4f6" }}>
      <span style={{ fontSize:13, color:"#6b7280" }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:highlight?700:500, color:highlight?"#f18200":"#111827" }}>{value}</span>
    </div>
  );
}

export default function OffersPage({ role }) {
  const [offers, setOffers]         = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [offerOpen, setOfferOpen]   = useState(false);
  const [detail, setDetail]         = useState(null);
  const [form, setForm]             = useState(BLANK_OFFER);
  const [computed, setComputed]     = useState({});
  const [saving, setSaving]         = useState(false);
  const [acting, setActing]         = useState(false);

  const tableRef = useRef(null);

  const isAdmin   = role === 1;
  const canCreate = isAdmin;

  function selectFilter(val) {
    setFilterStatus(val);
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listOffers({
        status: filterStatus || undefined,
        search: search || undefined,
        limit: 100,
      });
      setOffers(data ?? []);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load offers"));
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  useEffect(() => {
    listCandidates({ status: "Shortlisted", limit: 200 })
      .then(r => setCandidates(r.data ?? [])).catch(() => {});
    listJobs({ limit: 200 })
      .then(r => setJobs(r.data ?? [])).catch(() => {});
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    if (name === "basic") setComputed(computeCTC(value));
    setForm(next);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.candidateId || !form.jobReqId || !form.designation || !form.basic) {
      errorToast("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const c = computed;
      await createOffer({
        candidateId:        Number(form.candidateId),
        jobReqId:           Number(form.jobReqId),
        designation:        form.designation,
        dateOfJoining:      form.dateOfJoining || null,
        basic:              Number(form.basic),
        hra:                c.hra ?? 0,
        telephoneAllowance: c.telephoneAllowance ?? 0,
        specialAllowance:   c.specialAllowance ?? 0,
        grossSalary:        c.grossSalary ?? 0,
        pfContribution:     c.pfContribution ?? 0,
        statutoryBonus:     c.statutoryBonus ?? 0,
        gratuity:           c.gratuity ?? 0,
        esi:                0,
        ctc:                c.ctc ?? 0,
        ctcInWords:         numToWords(c.ctc ?? 0),
      });
      successToast("Offer created");
      setOfferOpen(false);
      setForm(BLANK_OFFER);
      setComputed({});
      loadOffers();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to create offer"));
    } finally {
      setSaving(false);
    }
  }

  async function handleRelease(offerId) {
    setActing(true);
    try {
      const updated = await releaseOffer(offerId);
      successToast("Offer released");
      setDetail(updated);
      loadOffers();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to release offer"));
    } finally { setActing(false); }
  }

  async function handleRespond(offerId, response) {
    setActing(true);
    try {
      const updated = await respondOffer(offerId, response);
      successToast(`Offer ${response.toLowerCase()}`);
      setDetail(updated);
      loadOffers();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to update offer"));
    } finally { setActing(false); }
  }

  const visible = offers.filter(o => {
    const q = search.toLowerCase();
    return (!q || (o.candidate_name||"").toLowerCase().includes(q) || (o.job_title||"").toLowerCase().includes(q) || (o.offer_code||"").toLowerCase().includes(q))
      && (!filterStatus || o.status === filterStatus);
  });

  const columns = [
    { header: "Offer ID",  key: "offer_code", width: 100 },
    { header: "Candidate", key: "candidate_name", render: (v, row) => (
      <div>
        <div style={{ fontWeight:600, color:"#111827" }}>{v}</div>
        <div style={{ fontSize:11, color:"#6b7280" }}>{row.designation}</div>
      </div>
    )},
    { header: "Position", key: "job_title" },
    { header: "CTC",      key: "ctc", render: v => fmt(v) },
    { header: "Joining",  key: "date_of_joining", render: v => v?.slice(0,10) || "—" },
    { header: "Status",   key: "status", render: v => {
      const c = OFFER_COLORS[v] || { color:"#6b7280", bg:"#f3f4f6" };
      return <span style={{ background:c.bg, color:c.color, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:600 }}>{v}</span>;
    }},
    { header: "", key: "offer_id", width: 60, render: (_, row) => (
      <Btn size="sm" variant="ghost" icon={<Eye size={13} />}
        onClick={e => { e.stopPropagation(); setDetail(row); }}>View</Btn>
    )},
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard","Offers"]}
        title="Offer Management"
        subtitle="Release, track and manage candidate offer letters"
        action={canCreate && (
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadOffers} />
            <Btn icon={<Plus size={16} />} onClick={() => setOfferOpen(true)}>Release Offer</Btn>
          </div>
        )}
      />

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { label:"Total",    val:"",         count:offers.length,                                  color:"#6b7280", bg:"#f3f4f6", border:"1px solid #e5e7eb" },
          { label:"Draft",    val:"Draft",    count:offers.filter(o=>o.status==="Draft").length,    color:"#6b7280", bg:"#f3f4f6", border:"1px solid #e5e7eb" },
          { label:"Released", val:"Released", count:offers.filter(o=>o.status==="Released").length, color:"#d97706", bg:"#fef3c7", border:"1px solid #fde68a" },
          { label:"Accepted", val:"Accepted", count:offers.filter(o=>o.status==="Accepted").length, color:"#059669", bg:"#d1fae5", border:"1px solid #6ee7b7" },
          { label:"Rejected", val:"Rejected", count:offers.filter(o=>o.status==="Rejected").length, color:"#dc2626", bg:"#fee2e2", border:"1px solid #fca5a5" },
        ].map(s => (
          <div key={s.label} onClick={() => selectFilter(s.val)}
            style={{
              display:"flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:20,
              background:s.bg, cursor:"pointer",
              border: filterStatus === s.val ? `2px solid ${s.color}` : s.border,
              boxShadow: filterStatus === s.val ? `0 0 0 2px ${s.color}30` : "none",
              transition:"all 0.15s",
            }}>
            <span style={{ fontSize:16, fontWeight:700, color:s.color }}>{s.count}</span>
            <span style={{ fontSize:12, color:s.color, fontWeight:500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div ref={tableRef} style={{ scrollMarginTop: 16 }}>
      <Card style={{ padding:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", borderBottom:"1px solid #f0f0f0", flexWrap:"wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search candidate, position, offer ID…" />
          {filterStatus && (
            <span onClick={() => setFilterStatus("")}
              style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, background:"#e0e7ff", color:"#4338ca", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {filterStatus} ✕
            </span>
          )}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ fontSize:13, padding:"6px 10px", border:"1px solid #e5e7eb", borderRadius:8, color:"#374151" }}>
            <option value="">All Statuses</option>
            {["Draft","Released","Accepted","Rejected"].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ marginLeft:"auto", fontSize:12, color:"#6b7280" }}>
            {loading ? "Loading…" : `${visible.length} offer${visible.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        {loading
          ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:48, color:"#6b7280" }}>
              <Loader2 size={20} style={{ animation:"spin 1s linear infinite" }} /> Loading offers…
            </div>
          : <Table columns={columns} data={visible} onRowClick={r => setDetail(r)} />
        }
      </Card>
      </div>

      {/* ── Create Offer SlideOver ── */}
      <SlideOver open={offerOpen}
        onClose={() => { setOfferOpen(false); setForm(BLANK_OFFER); setComputed({}); }}
        title="Release Offer Letter" width={560}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setOfferOpen(false)}>Cancel</Btn>
            <Btn onClick={handleCreate} disabled={saving}>{saving ? "Saving…" : "Create Offer"}</Btn>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <TwoColGrid>
            <Field label="Candidate" required>
              <select name="candidateId" value={form.candidateId} onChange={handleChange}
                style={{ width:"100%", fontSize:13, padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, color:"#374151" }}>
                <option value="">Select shortlisted candidate</option>
                {candidates.map(c => <option key={c.candidate_id} value={c.candidate_id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Job Position" required>
              <select name="jobReqId" value={form.jobReqId} onChange={handleChange}
                style={{ width:"100%", fontSize:13, padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, color:"#374151" }}>
                <option value="">Select job</option>
                {jobs.map(j => <option key={j.job_req_id} value={j.job_req_id}>{j.title}</option>)}
              </select>
            </Field>
            <Field label="Designation" required>
              <Input name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Senior Java Developer" />
            </Field>
            <Field label="Date of Joining">
              <Input name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handleChange} />
            </Field>
          </TwoColGrid>

          <div style={{ padding:"14px", background:"#f9fafb", borderRadius:8, marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#6b7280", marginBottom:10 }}>CTC BREAKDOWN (Auto-Computed)</div>
            <Field label="Basic Salary (Annual ₹)" required>
              <Input name="basic" type="number" value={form.basic} onChange={handleChange} placeholder="Enter basic salary" />
            </Field>
            {form.basic && computed.ctc ? (
              <>
                <CtcRow label="HRA (40%)"                 value={fmt(computed.hra)} />
                <CtcRow label="Telephone Allowance"        value={fmt(computed.telephoneAllowance)} />
                <CtcRow label="Special Allowance (~14.4%)" value={fmt(computed.specialAllowance)} />
                <CtcRow label="Gross Salary"               value={fmt(computed.grossSalary)} />
                <div style={{ height:8 }} />
                <CtcRow label="PF Contribution (12%)"      value={fmt(computed.pfContribution)} />
                <CtcRow label="Statutory Bonus"            value={fmt(computed.statutoryBonus)} />
                <CtcRow label="Gratuity (4.81%)"           value={fmt(computed.gratuity)} />
                <CtcRow label="ESI"                        value="Nil" />
                <CtcRow label="Cost to Company (CTC)"      value={fmt(computed.ctc)} highlight />
                <div style={{ marginTop:8, fontSize:12, color:"#78350f", fontStyle:"italic" }}>
                  In Words: {numToWords(computed.ctc)}
                </div>
              </>
            ) : null}
          </div>
        </form>
      </SlideOver>

      {/* ── Offer Detail Modal ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Offer Letter Details" width={640}
        footer={
          <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%" }}>
            {detail?.status === "Draft" && canCreate && (
              <Btn icon={<CheckCircle size={14} />} onClick={() => handleRelease(detail.offer_id)} disabled={acting}>
                {acting ? "…" : "Release Offer"}
              </Btn>
            )}
            {detail?.status === "Released" && canCreate && (
              <>
                <Btn icon={<CheckCircle size={14} />} onClick={() => handleRespond(detail.offer_id, "Accepted")} disabled={acting}>
                  {acting ? "…" : "Mark Accepted"}
                </Btn>
                <Btn variant="danger" icon={<XCircle size={14} />} onClick={() => handleRespond(detail.offer_id, "Rejected")} disabled={acting}>
                  {acting ? "…" : "Mark Rejected"}
                </Btn>
              </>
            )}
            <div style={{ flex:1 }} />
            <Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>
          </div>
        }
      >
        {detail && (() => {
          const sc = OFFER_COLORS[detail.status] || { color:"#6b7280", bg:"#f3f4f6" };
          return (
            <div>
              <div style={{ padding:"14px 16px", background:"#f9fafb", borderRadius:10, marginBottom:16, display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:17, fontWeight:700, color:"#111827" }}>{detail.candidate_name}</div>
                  <div style={{ fontSize:13, color:"#6b7280" }}>{detail.designation} — {detail.job_title}</div>
                  <div style={{ marginTop:6 }}>
                    <span style={{ background:sc.bg, color:sc.color, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{detail.status}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:"#6b7280" }}>Offer ID</div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#f18200" }}>{detail.offer_code}</div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
                <DetailRow label="Date of Joining"  value={detail.date_of_joining?.slice(0,10) || "—"} />
                <DetailRow label="Released At"      value={detail.released_at?.slice(0,10) || "—"} />
                <DetailRow label="Responded At"     value={detail.responded_at?.slice(0,10) || "—"} />
                <DetailRow label="Created By"       value={detail.created_by_name || "—"} />
              </div>

              <div style={{ marginTop:14, padding:"14px", background:"#fff7ed", borderRadius:8, borderLeft:"3px solid #f18200" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#92400e", marginBottom:10 }}>CTC BREAKDOWN</div>
                <CtcRow label="Basic Salary"         value={fmt(detail.basic)} />
                <CtcRow label="HRA"                  value={fmt(detail.hra)} />
                <CtcRow label="Telephone Allowance"  value={fmt(detail.telephone_allowance)} />
                <CtcRow label="Special Allowance"    value={fmt(detail.special_allowance)} />
                <CtcRow label="Gross Salary"         value={fmt(detail.gross_salary)} />
                <div style={{ height:8 }} />
                <CtcRow label="PF Contribution"      value={fmt(detail.pf_contribution)} />
                <CtcRow label="Statutory Bonus"      value={fmt(detail.statutory_bonus)} />
                <CtcRow label="Gratuity"             value={fmt(detail.gratuity)} />
                <CtcRow label="ESI"                  value="Nil" />
                <CtcRow label="Cost to Company"      value={fmt(detail.ctc)} highlight />
                {detail.ctc_in_words && (
                  <div style={{ marginTop:10, fontSize:12, color:"#78350f", fontStyle:"italic" }}>
                    <strong>In Words:</strong> {detail.ctc_in_words}
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
