import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Eye, CheckCircle, XCircle, Loader2, RefreshCw, Link, Copy, Send, FileDown } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input,
  Table, Modal, SlideOver, SearchBar,
  TwoColGrid, DetailRow,
} from "./shared";
import {
  listOffers, createOffer, releaseOffer, respondOffer,
  listCandidates, listJobs, getErrorMessage, downloadOfferDocx,
} from "../../../api/recruitment.api";
import { getJoiningByOffer, resendJoiningInvitation } from "../../../api/joining.api";
import { successToast, errorToast } from "../../../utils/ToastControllers";

const BLANK_OFFER = {
  candidateId: "", jobReqId: "", designation: "",
  dateOfJoining: "", ctcInput: "",
};

/**
 * CTC Structure (matches Word document / image):
 * Input: monthly CTC (e.g. 38000).  All stored values are ANNUAL (×12).
 *   basic_m          = ctc_monthly * 0.50
 *   hra_m            = basic_m * 0.40
 *   telephone        = 1 500 / month  = 18 000 / year
 *   leaveTravel      = 3 333 / month  = 39 996 / year
 *   pf_m             = min(basic_m * 0.12, 1 800)   [EPFO cap at basic 15 000]
 *   statutoryBonus_m = 1 400 if basic_m <= 21 000 else 0
 *   gross_m          = ctc_monthly - pf_m - sb_m
 *   spl_m            = gross_m - (basic_m + hra_m + 1500 + 3333)
 *   gratuity         = 0, esi = 0
 */
function computeFromCTC(ctcMonthly) {
  ctcMonthly = Number(ctcMonthly) || 0;
  if (!ctcMonthly) return {};

  const basic_m   = Math.round(ctcMonthly * 0.5);
  const hra_m     = Math.round(basic_m * 0.4);
  const tel_m     = 1500;
  const lta_m     = 3333;
  const pf_m      = Math.min(Math.round(basic_m * 0.12), 1800);
  const sb_m      = basic_m <= 21000 ? 1400 : 0;
  const gross_m   = ctcMonthly - pf_m - sb_m;
  const spl_m     = gross_m - (basic_m + hra_m + tel_m + lta_m);

  // All values stored as ANNUAL
  return {
    basic:              basic_m * 12,
    hra:                hra_m   * 12,
    telephoneAllowance: tel_m   * 12,
    leaveTravel:        lta_m   * 12,
    specialAllowance:   spl_m   * 12,
    grossSalary:        gross_m * 12,
    pfContribution:     pf_m    * 12,
    statutoryBonus:     sb_m    * 12,
    gratuity:           0,
    esi:                0,
    ctc:                ctcMonthly * 12,
    ctcMonthly,
  };
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
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (isNaN(n)) return "—";
  if (n === 0) return "—";
  return "Rs." + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

function fmtM(annualVal) {
  const m = Math.round((Number(annualVal) || 0) / 12);
  if (m === 0) return "—";
  return "Rs." + m.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

const OFFER_CLS = {
  Draft:    "bg-gray-100 text-gray-500",
  Released: "bg-amber-100 text-amber-600",
  Accepted: "bg-emerald-100 text-emerald-600",
  Rejected: "bg-red-100 text-red-600",
};

function CtcTableRow({ label, monthly, annual, highlight }) {
  return (
    <div className={`grid grid-cols-3 px-4 py-2.5 border-b border-gray-100 ${highlight ? "bg-orange-50" : ""}`}>
      <span className={`text-[13px] ${highlight ? "text-gray-900 font-bold" : "text-gray-600"}`}>{label}</span>
      <span className={`text-[13px] text-right pr-4 ${highlight ? "text-[#f18200] font-bold" : "text-gray-800"}`}>{monthly}</span>
      <span className={`text-[13px] text-right ${highlight ? "text-[#f18200] font-bold" : "text-gray-800"}`}>{annual}</span>
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
  const [joiningInv, setJoiningInv] = useState(null);
  const [form, setForm]             = useState(BLANK_OFFER);
  const [computed, setComputed]     = useState({});
  const [saving, setSaving]         = useState(false);
  const [acting, setActing]         = useState(false);
  const [resending, setResending]   = useState(false);

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
    let next = { ...form, [name]: value };

    // Auto-populate jobReqId + designation when candidate is selected
    if (name === "candidateId" && value) {
      const cand = candidates.find(c => String(c.candidate_id) === String(value));
      if (cand) {
        next.jobReqId     = cand.job_req_id    ? String(cand.job_req_id) : next.jobReqId;
        next.designation  = cand.job_title     ? cand.job_title          : next.designation;
      }
    }

    // Auto-fill designation from selected job title if blank
    if (name === "jobReqId" && value && !form.designation) {
      const job = jobs.find(j => String(j.job_req_id) === String(value));
      if (job) next.designation = job.title;
    }

    if (name === "ctcInput") setComputed(computeFromCTC(value));
    setForm(next);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.candidateId || !form.jobReqId || !form.designation || !form.ctcInput || !form.dateOfJoining) {
      errorToast("Please fill all required fields including Date of Joining"); return;
    }
    setSaving(true);
    try {
      const c = computed;
      await createOffer({
        candidateId:        Number(form.candidateId),
        jobReqId:           Number(form.jobReqId),
        designation:        form.designation,
        dateOfJoining:      form.dateOfJoining,
        basic:              c.basic              ?? 0,
        hra:                c.hra                ?? 0,
        telephoneAllowance: c.telephoneAllowance ?? 0,
        leaveTravel:        c.leaveTravel        ?? 0,
        specialAllowance:   c.specialAllowance   ?? 0,
        grossSalary:        c.grossSalary        ?? 0,
        pfContribution:     c.pfContribution     ?? 0,
        statutoryBonus:     c.statutoryBonus     ?? 0,
        gratuity:           0,
        esi:                0,
        ctc:                c.ctc                ?? 0,
        ctcInWords:         numToWords(c.ctc     ?? 0),
      });
      successToast("Offer created");
      setOfferOpen(false); setForm(BLANK_OFFER); setComputed({});
      loadOffers();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to create offer"));
    } finally { setSaving(false); }
  }

  async function openDetail(row) {
    setDetail(row);
    setJoiningInv(null);
    if (row.status === "Released" || row.status === "Accepted") {
      getJoiningByOffer(row.offer_id).then(inv => setJoiningInv(inv || null)).catch(() => {});
    }
  }

  async function handleRelease(offerId) {
    setActing(true);
    try {
      const updated = await releaseOffer(offerId);
      successToast("Offer released");
      setDetail(updated);
      getJoiningByOffer(offerId).then(inv => setJoiningInv(inv || null)).catch(() => {});
      loadOffers();
    } catch (err) { errorToast(getErrorMessage(err, "Failed to release offer")); }
    finally { setActing(false); }
  }

  async function handleResend() {
    if (!joiningInv) return;
    setResending(true);
    try {
      await resendJoiningInvitation(joiningInv.id);
      successToast("Joining invitation resent");
    } catch { errorToast("Failed to resend invitation"); }
    finally { setResending(false); }
  }

  function copyJoiningLink() {
    if (!joiningInv?.token) return;
    const url = `${window.location.origin}/joining/${joiningInv.token}`;
    navigator.clipboard.writeText(url).then(() => successToast("Link copied!")).catch(() => errorToast("Copy failed"));
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
    { header: "CTC / Month", key: "ctc", render: v => fmtM(v) },
    { header: "Joining",  key: "date_of_joining", render: v => v?.slice(0,10) || "—" },
    { header: "Status",   key: "status", render: v => (
      <span className={`px-2.5 py-[2px] rounded-full text-[11px] font-semibold ${OFFER_CLS[v] ?? "bg-gray-100 text-gray-500"}`}>{v}</span>
    )},
    { header: "", key: "offer_id", width: 60, render: (_, row) => (
      <Btn size="sm" variant="ghost" icon={<Eye size={13} />}
        onClick={e => { e.stopPropagation(); openDetail(row); }}>View</Btn>
    )},
  ];

  const STAT_BTNS = [
    { label:"Total",    val:"",         count:offers.length,                                  colorCls:"text-gray-500",   bgCls:"bg-gray-100",   activeBorder:"border-gray-500" },
    { label:"Draft",    val:"Draft",    count:offers.filter(o=>o.status==="Draft").length,    colorCls:"text-gray-500",   bgCls:"bg-gray-100",   activeBorder:"border-gray-500" },
    { label:"Released", val:"Released", count:offers.filter(o=>o.status==="Released").length, colorCls:"text-amber-600",  bgCls:"bg-amber-100",  activeBorder:"border-amber-600" },
    { label:"Accepted", val:"Accepted", count:offers.filter(o=>o.status==="Accepted").length, colorCls:"text-emerald-600",bgCls:"bg-emerald-100",activeBorder:"border-emerald-600" },
    { label:"Rejected", val:"Rejected", count:offers.filter(o=>o.status==="Rejected").length, colorCls:"text-red-600",   bgCls:"bg-red-100",    activeBorder:"border-red-600" },
  ];

  /* ── CTC preview during creation ── */
  const showCtc = !!(form.ctcInput && computed.ctc);
  const c = computed;

  /* ── CTC detail display (view modal) ── */
  function CtcDetailBreakdown({ d }) {
    return (
      <div className="mt-3.5 px-3.5 py-3.5 bg-[#fff7ed] rounded-lg border-l-[3px] border-[#f18200]">
        <div className="grid grid-cols-3 pb-1.5 mb-1 border-b-2 border-[#f18200]">
          <span className="text-[11px] font-bold text-[#92400e] uppercase">Components</span>
          <span className="text-[11px] font-bold text-[#92400e] uppercase text-right">Monthly</span>
          <span className="text-[11px] font-bold text-[#92400e] uppercase text-right">Annual</span>
        </div>
        <CtcTableRow label="Basic"                                    monthly={fmtM(d.basic)}               annual={fmt(d.basic)} />
        <CtcTableRow label="HRA"                                      monthly={fmtM(d.hra)}                 annual={fmt(d.hra)} />
        <CtcTableRow label="Telephone/Internet Expenses"              monthly={fmtM(d.telephone_allowance)} annual={fmt(d.telephone_allowance)} />
        <CtcTableRow label="Leave Travel Allowance"                   monthly={fmtM(d.leave_travel)}        annual={fmt(d.leave_travel)} />
        <CtcTableRow label="Spl. Allowance"                           monthly={fmtM(d.special_allowance)}   annual={fmt(d.special_allowance)} />
        <CtcTableRow label="Gross Salary"                             monthly={fmtM(d.gross_salary)}        annual={fmt(d.gross_salary)} highlight />
        <CtcTableRow label="Company's PF Contribution"                monthly={fmtM(d.pf_contribution)}     annual={fmt(d.pf_contribution)} />
        <CtcTableRow label="Statutory Bonus"                          monthly={fmtM(d.statutory_bonus)}     annual={fmt(d.statutory_bonus)} />
        <CtcTableRow label="Gratuity"                                 monthly={fmtM(d.gratuity)}            annual={fmt(d.gratuity)} />
        <CtcTableRow label="ESI"                                      monthly={fmtM(d.esi)}                 annual={fmt(d.esi)} />
        <CtcTableRow label="Variable Pay"                             monthly=""                            annual="" />
        <CtcTableRow label="Insurance premiums (GMC, GPA and Term life)" monthly=""                        annual="" />
        <CtcTableRow label="Cost To Company"                          monthly={fmtM(d.ctc)}                 annual={fmt(d.ctc)} highlight />
        {d.ctc_in_words && (
          <div className="mt-2.5 text-[12px] text-amber-900 italic">
            <strong>In Words:</strong> {d.ctc_in_words}
          </div>
        )}
      </div>
    );
  }

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
            : <Table columns={columns} data={visible} onRowClick={r => openDetail(r)} />
          }
        </Card>
      </div>

      {/* ── Create Offer SlideOver ── */}
      <SlideOver open={offerOpen}
        onClose={() => { setOfferOpen(false); setForm({ ...BLANK_OFFER }); setComputed({}); }}
        title="Release Offer Letter" width={580}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setOfferOpen(false)}>Cancel</Btn>
            <Btn onClick={handleCreate} disabled={saving}>{saving ? "Saving…" : "Create Offer"}</Btn>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          {/* Candidate — auto-populates job + designation */}
          <Field label="Candidate" required>
            <select name="candidateId" value={form.candidateId} onChange={handleChange}
              className="w-full text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 outline-none bg-white"
              style={{ fontFamily: "inherit" }}>
              <option value="">Select shortlisted candidate</option>
              {candidates.map(c => (
                <option key={c.candidate_id} value={c.candidate_id}>
                  {c.name}{c.job_title ? ` — ${c.job_title}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <TwoColGrid>
            <Field label="Job Position" required>
              <select name="jobReqId" value={form.jobReqId} onChange={handleChange}
                className="w-full text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 outline-none bg-white"
                style={{ fontFamily: "inherit" }}>
                <option value="">Select job position</option>
                {jobs.map(j => (
                  <option key={j.job_req_id} value={j.job_req_id}>{j.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Designation" required>
              <Input name="designation" value={form.designation} onChange={handleChange}
                placeholder="e.g. Senior Developer" readOnly={!!form.candidateId} />
            </Field>
          </TwoColGrid>

          <TwoColGrid>
            <Field label="Date of Joining" required>
              <Input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={handleChange} />
            </Field>
            <Field label="CTC (Monthly)" required>
              <Input
                type="number" name="ctcInput" value={form.ctcInput} onChange={handleChange}
                placeholder="e.g. 38000" min={0}
              />
              {form.ctcInput && <p className="text-[11px] text-indigo-600 mt-0.5">Annual: Rs. {((Number(form.ctcInput)||0)*12).toLocaleString("en-IN")}</p>}
            </Field>
          </TwoColGrid>

          {/* CTC Preview Table */}
          {computed.ctc > 0 && (
            <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-[#1e3a5f] px-4 py-2.5 grid grid-cols-3">
                <span className="text-white text-[12px] font-semibold">Component</span>
                <span className="text-white text-[12px] font-semibold text-right pr-4">Monthly</span>
                <span className="text-white text-[12px] font-semibold text-right">Annual</span>
              </div>
              {[
                { label: "Basic Salary",         m: computed.basic,              a: computed.basic },
                { label: "HRA",                  m: computed.hra,                a: computed.hra },
                { label: "Telephone Allowance",  m: computed.telephoneAllowance, a: computed.telephoneAllowance },
                { label: "Leave Travel",         m: computed.leaveTravel,        a: computed.leaveTravel },
                { label: "Special Allowance",    m: computed.specialAllowance,   a: computed.specialAllowance },
                { label: "Gross Salary",         m: computed.grossSalary,        a: computed.grossSalary, highlight: true },
                { label: "PF Contribution",      m: computed.pfContribution,     a: computed.pfContribution },
                { label: "Statutory Bonus",      m: computed.statutoryBonus,     a: computed.statutoryBonus },
                { label: "Gratuity",             m: 0,                           a: 0 },
                { label: "ESI",                  m: 0,                           a: 0 },
                { label: "Total CTC",            m: computed.ctc,                a: computed.ctc, highlight: true },
              ].map(row => (
                <CtcTableRow
                  key={row.label}
                  label={row.label}
                  monthly={fmt(Math.round((Number(row.m)||0)/12))}
                  annual={fmt(Number(row.a)||0)}
                  highlight={row.highlight}
                />
              ))}
            </div>
          )}
        </form>
      </SlideOver>

      {/* Detail SlideOver */}
      {detail && (
        <SlideOver
          open={!!detail}
          onClose={() => { setDetail(null); setJoiningInv(null); }}
          title="Offer Details"
          width={580}
          footer={
            <div className="flex gap-2 flex-wrap">
              {detail.status === "Draft" && (
                <Btn
                  icon={acting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  disabled={acting}
                  onClick={() => handleRelease(detail.offer_id)}
                >Release Offer</Btn>
              )}
              {(detail.status === "Released" || detail.status === "Accepted") && (
                <Btn
                  variant="secondary"
                  icon={<FileDown size={14} />}
                  onClick={() => downloadOfferDocx(detail.offer_id, `Offer_Letter_${detail.offer_code || detail.offer_id}.docx`)}
                >Download Word</Btn>
              )}
              {detail.status === "Released" && (
                <>
                  <Btn
                    icon={acting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    disabled={acting}
                    onClick={() => handleRespond(detail.offer_id, "Accepted")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >Accept</Btn>
                  <Btn
                    variant="danger"
                    icon={acting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    disabled={acting}
                    onClick={() => handleRespond(detail.offer_id, "Rejected")}
                  >Reject</Btn>
                </>
              )}
              <Btn variant="secondary" onClick={() => { setDetail(null); setJoiningInv(null); }}>Close</Btn>
            </div>
          }
        >
          <div className="space-y-1 mb-5">
            <DetailRow label="Offer Code"      value={detail.offer_code || "n/a"} />
            <DetailRow label="Candidate"       value={detail.candidate_name || "n/a"} />
            <DetailRow label="Designation"     value={detail.designation || "n/a"} />
            <DetailRow label="Date of Joining" value={detail.date_of_joining ? detail.date_of_joining.slice(0,10) : "n/a"} />
            <DetailRow label="Status" value={
              <span className={`px-2.5 py-[2px] rounded-full text-[11px] font-semibold ${OFFER_CLS[detail.status] ?? "bg-gray-100 text-gray-500"}`}>
                {detail.status}
              </span>
            } />
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden mb-5">
            <div className="bg-[#1e3a5f] px-4 py-2.5 grid grid-cols-3">
              <span className="text-white text-[12px] font-semibold">Component</span>
              <span className="text-white text-[12px] font-semibold text-right pr-4">Monthly</span>
              <span className="text-white text-[12px] font-semibold text-right">Annual</span>
            </div>
            {[
              { label: "Basic Salary",        v: detail.basic },
              { label: "HRA",                 v: detail.hra },
              { label: "Telephone Allowance", v: detail.telephone_allowance },
              { label: "Leave Travel",        v: detail.leave_travel },
              { label: "Special Allowance",   v: detail.special_allowance },
              { label: "Gross Salary",        v: detail.gross_salary, highlight: true },
              { label: "PF Contribution",     v: detail.pf_contribution },
              { label: "Statutory Bonus",     v: detail.statutory_bonus },
              { label: "Gratuity",            v: detail.gratuity },
              { label: "ESI",                 v: detail.esi },
              { label: "Total CTC",           v: detail.ctc, highlight: true },
            ].map(row => (
              <CtcTableRow
                key={row.label}
                label={row.label}
                monthly={fmtM(row.v)}
                annual={fmt(Number(row.v)||0)}
                highlight={row.highlight}
              />
            ))}
          </div>

          {(detail.status === "Released" || detail.status === "Accepted") && (
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-[13px] font-semibold text-indigo-700 mb-2">Joining Invitation</p>
              {joiningInv ? (
                <div className="space-y-2">
                  <p className="text-[12px] text-gray-600">
                    Invitation sent. Token: <span className="font-mono text-gray-800">{joiningInv.token?.slice(0,12)}...</span>
                  </p>
                  <div className="flex gap-2">
                    <Btn
                      size="sm" variant="secondary"
                      icon={resending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      disabled={resending}
                      onClick={handleResend}
                    >Resend</Btn>
                    <Btn
                      size="sm" variant="secondary"
                      icon={<Copy size={12} />}
                      onClick={copyJoiningLink}
                    >Copy Link</Btn>
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-gray-500">No joining invitation sent yet.</p>
              )}
            </div>
          )}
        </SlideOver>
      )}
    </div>
  );
}
