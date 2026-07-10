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

const OFFER_CLS = {
  Draft:    "bg-gray-100 text-gray-500",
  Released: "bg-amber-100 text-amber-600",
  Accepted: "bg-emerald-100 text-emerald-600",
  Rejected: "bg-red-100 text-red-600",
};

function CtcRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100">
      <span className="text-[13px] text-gray-500">{label}</span>
      <span className={`text-[13px] ${highlight ? "font-bold text-[#f18200]" : "font-medium text-gray-900"}`}>{value}</span>
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
      const { data } = await listOffers({ status: filterStatus || undefined, search: search || undefined, limit: 100 });
      setOffers(data ?? []);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load offers"));
    } finally { setLoading(false); }
  }, [filterStatus, search]);

  useEffect(() => { loadOffers(); }, [loadOffers]);
  useEffect(() => {
    listCandidates({ status: "Shortlisted", limit: 200 }).then(r => setCandidates(r.data ?? [])).catch(() => {});
    listJobs({ limit: 200 }).then(r => setJobs(r.data ?? [])).catch(() => {});
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
      errorToast("Please fill all required fields"); return;
    }
    setSaving(true);
    try {
      const c = computed;
      await createOffer({
        candidateId: Number(form.candidateId), jobReqId: Number(form.jobReqId),
        designation: form.designation, dateOfJoining: form.dateOfJoining || null,
        basic: Number(form.basic), hra: c.hra ?? 0,
        telephoneAllowance: c.telephoneAllowance ?? 0, specialAllowance: c.specialAllowance ?? 0,
        grossSalary: c.grossSalary ?? 0, pfContribution: c.pfContribution ?? 0,
        statutoryBonus: c.statutoryBonus ?? 0, gratuity: c.gratuity ?? 0, esi: 0,
        ctc: c.ctc ?? 0, ctcInWords: numToWords(c.ctc ?? 0),
      });
      successToast("Offer created");
      setOfferOpen(false); setForm(BLANK_OFFER); setComputed({});
      loadOffers();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to create offer"));
    } finally { setSaving(false); }
  }

  async function handleRelease(offerId) {
    setActing(true);
    try {
      const updated = await releaseOffer(offerId);
      successToast("Offer released"); setDetail(updated); loadOffers();
    } catch (err) { errorToast(getErrorMessage(err, "Failed to release offer")); }
    finally { setActing(false); }
  }

  async function handleRespond(offerId, response) {
    setActing(true);
    try {
      const updated = await respondOffer(offerId, response);
      successToast(`Offer ${response.toLowerCase()}`); setDetail(updated); loadOffers();
    } catch (err) { errorToast(getErrorMessage(err, "Failed to update offer")); }
    finally { setActing(false); }
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
        <div className="font-semibold text-gray-900">{v}</div>
        <div className="text-[11px] text-gray-500">{row.designation}</div>
      </div>
    )},
    { header: "Position", key: "job_title" },
    { header: "CTC",      key: "ctc", render: v => fmt(v) },
    { header: "Joining",  key: "date_of_joining", render: v => v?.slice(0,10) || "—" },
    { header: "Status",   key: "status", render: v => (
      <span className={`px-2.5 py-[2px] rounded-full text-[11px] font-semibold ${OFFER_CLS[v] ?? "bg-gray-100 text-gray-500"}`}>{v}</span>
    )},
    { header: "", key: "offer_id", width: 60, render: (_, row) => (
      <Btn size="sm" variant="ghost" icon={<Eye size={13} />}
        onClick={e => { e.stopPropagation(); setDetail(row); }}>View</Btn>
    )},
  ];

  const STAT_BTNS = [
    { label:"Total",    val:"",         count:offers.length,                                  colorCls:"text-gray-500",   bgCls:"bg-gray-100",   activeBorder:"border-gray-500" },
    { label:"Draft",    val:"Draft",    count:offers.filter(o=>o.status==="Draft").length,    colorCls:"text-gray-500",   bgCls:"bg-gray-100",   activeBorder:"border-gray-500" },
    { label:"Released", val:"Released", count:offers.filter(o=>o.status==="Released").length, colorCls:"text-amber-600",  bgCls:"bg-amber-100",  activeBorder:"border-amber-600" },
    { label:"Accepted", val:"Accepted", count:offers.filter(o=>o.status==="Accepted").length, colorCls:"text-emerald-600",bgCls:"bg-emerald-100",activeBorder:"border-emerald-600" },
    { label:"Rejected", val:"Rejected", count:offers.filter(o=>o.status==="Rejected").length, colorCls:"text-red-600",   bgCls:"bg-red-100",    activeBorder:"border-red-600" },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard","Offers"]}
        title="Offer Management"
        subtitle="Release, track and manage candidate offer letters"
        action={canCreate && (
          <div className="flex gap-2">
            <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadOffers} />
            <Btn icon={<Plus size={16} />} onClick={() => setOfferOpen(true)}>Release Offer</Btn>
          </div>
        )}
      />

      <div className="flex gap-2.5 mb-5 flex-wrap">
        {STAT_BTNS.map(s => (
          <div key={s.label} onClick={() => selectFilter(s.val)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full cursor-pointer border-2 transition-all ${s.bgCls} ${
              filterStatus === s.val ? s.activeBorder + " shadow-sm" : "border-transparent"
            }`}>
            <span className={`text-base font-bold ${s.colorCls}`}>{s.count}</span>
            <span className={`text-[12px] font-medium ${s.colorCls}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div ref={tableRef} className="scroll-mt-4">
        <Card className="!p-0">
          <div className="flex items-center gap-3 px-[18px] py-3.5 border-b border-gray-100 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search candidate, position, offer ID…" />
            {filterStatus && (
              <span onClick={() => setFilterStatus("")}
                className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full bg-indigo-100 text-indigo-700 text-[12px] font-semibold cursor-pointer">
                {filterStatus} ✕
              </span>
            )}
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="text-[13px] px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-700 bg-white outline-none"
              style={{ fontFamily: "inherit" }}>
              <option value="">All Statuses</option>
              {["Draft","Released","Accepted","Rejected"].map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="ml-auto text-[12px] text-gray-500">
              {loading ? "Loading…" : `${visible.length} offer${visible.length !== 1 ? "s" : ""}`}
            </div>
          </div>
          {loading
            ? <div className="flex items-center justify-center gap-2.5 py-12 text-gray-500"><Loader2 size={20} /> Loading offers…</div>
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
                className="w-full text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 outline-none bg-white"
                style={{ fontFamily: "inherit" }}>
                <option value="">Select shortlisted candidate</option>
                {candidates.map(c => <option key={c.candidate_id} value={c.candidate_id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Job Position" required>
              <select name="jobReqId" value={form.jobReqId} onChange={handleChange}
                className="w-full text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 outline-none bg-white"
                style={{ fontFamily: "inherit" }}>
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

          <div className="px-3.5 py-3.5 bg-gray-50 rounded-lg mb-3.5">
            <div className="text-[12px] font-bold text-gray-500 mb-2.5">CTC BREAKDOWN (Auto-Computed)</div>
            <Field label="Basic Salary (Annual ₹)" required>
              <Input name="basic" type="number" value={form.basic} onChange={handleChange} placeholder="Enter basic salary" />
            </Field>
            {form.basic && computed.ctc ? (
              <>
                <CtcRow label="HRA (40%)"                 value={fmt(computed.hra)} />
                <CtcRow label="Telephone Allowance"        value={fmt(computed.telephoneAllowance)} />
                <CtcRow label="Special Allowance (~14.4%)" value={fmt(computed.specialAllowance)} />
                <CtcRow label="Gross Salary"               value={fmt(computed.grossSalary)} />
                <div className="h-2" />
                <CtcRow label="PF Contribution (12%)"      value={fmt(computed.pfContribution)} />
                <CtcRow label="Statutory Bonus"            value={fmt(computed.statutoryBonus)} />
                <CtcRow label="Gratuity (4.81%)"           value={fmt(computed.gratuity)} />
                <CtcRow label="ESI"                        value="Nil" />
                <CtcRow label="Cost to Company (CTC)"      value={fmt(computed.ctc)} highlight />
                <div className="mt-2 text-[12px] text-amber-900 italic">
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
          <div className="flex items-center gap-2.5 w-full">
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
            <div className="flex-1" />
            <Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>
          </div>
        }
      >
        {detail && (() => {
          const sc = OFFER_CLS[detail.status] ?? "bg-gray-100 text-gray-500";
          return (
            <div>
              <div className="px-4 py-3.5 bg-gray-50 rounded-[10px] mb-4 flex items-center gap-3.5">
                <div className="flex-1">
                  <div className="text-[17px] font-bold text-gray-900">{detail.candidate_name}</div>
                  <div className="text-[13px] text-gray-500">{detail.designation} — {detail.job_title}</div>
                  <div className="mt-1.5">
                    <span className={`px-2.5 py-[2px] rounded-full text-[11px] font-bold ${sc}`}>{detail.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-500">Offer ID</div>
                  <div className="text-[15px] font-bold text-[#f18200]">{detail.offer_code}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-5">
                <DetailRow label="Date of Joining"  value={detail.date_of_joining?.slice(0,10) || "—"} />
                <DetailRow label="Released At"      value={detail.released_at?.slice(0,10) || "—"} />
                <DetailRow label="Responded At"     value={detail.responded_at?.slice(0,10) || "—"} />
                <DetailRow label="Created By"       value={detail.created_by_name || "—"} />
              </div>

              <div className="mt-3.5 px-3.5 py-3.5 bg-[#fff7ed] rounded-lg border-l-[3px] border-[#f18200]">
                <div className="text-[12px] font-bold text-[#92400e] mb-2.5">CTC BREAKDOWN</div>
                <CtcRow label="Basic Salary"         value={fmt(detail.basic)} />
                <CtcRow label="HRA"                  value={fmt(detail.hra)} />
                <CtcRow label="Telephone Allowance"  value={fmt(detail.telephone_allowance)} />
                <CtcRow label="Special Allowance"    value={fmt(detail.special_allowance)} />
                <CtcRow label="Gross Salary"         value={fmt(detail.gross_salary)} />
                <div className="h-2" />
                <CtcRow label="PF Contribution"      value={fmt(detail.pf_contribution)} />
                <CtcRow label="Statutory Bonus"      value={fmt(detail.statutory_bonus)} />
                <CtcRow label="Gratuity"             value={fmt(detail.gratuity)} />
                <CtcRow label="ESI"                  value="Nil" />
                <CtcRow label="Cost to Company"      value={fmt(detail.ctc)} highlight />
                {detail.ctc_in_words && (
                  <div className="mt-2.5 text-[12px] text-amber-900 italic">
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
