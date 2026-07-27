import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Eye, CheckCircle, XCircle, Loader2, RefreshCw, Link, Copy, Send, FileDown, UserCheck } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input,
  Table, Modal, SlideOver, SearchBar,
  TwoColGrid, DetailRow,
} from "./shared";
import {
  listOffers, createOffer, releaseOffer, respondOffer,
  listCandidates, listJobs, getErrorMessage, downloadOfferDocx,
  createOnboarding,
} from "../../../api/recruitment.api";
import { getJoiningByOffer, resendJoiningInvitation } from "../../../api/joining.api";
import { successToast, errorToast } from "../../../utils/ToastControllers";

const BLANK_OFFER = {
  candidateId: "", jobReqId: "", designation: "",
  dateOfJoining: "", ctcInput: "",
  variablePct: "", joiningBonus: "",
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
  const grat_m    = Math.round(basic_m * 0.0481); // Gratuity = 4.81% of basic

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
    gratuity:           grat_m  * 12,
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


/** Pre-release review panel — shown inside the SlideOver at step='review' */
function OfferReleaseReview({ form, computed, candidates, checks }) {
  const ctcAnn    = Number(form.ctcInput) * 12;
  const varPct    = Number(form.variablePct)  || 0;
  const varAnn    = Math.round(ctcAnn * varPct / 100);
  const joinBonus = Number(form.joiningBonus) || 0;
  const totalCTC  = (computed.ctc || 0) + varAnn + joinBonus;
  const candName  = (candidates.find(x => String(x.candidate_id) === String(form.candidateId)) || {}).name || '—';

  const fixedRows = computed._components
    ? computed._components.filter(cp => cp.category === 'Earning' && cp.show_ctc_breakup !== false)
        .map(cp => ({ label: cp.component_name, ann: cp.annual_amount }))
    : [
        { label: 'Basic Salary',                  ann: computed.basic              || 0 },
        { label: 'HRA',                           ann: computed.hra                || 0 },
        { label: 'Telephone / Internet Expenses', ann: computed.telephoneAllowance || 0 },
        { label: 'Leave Travel Allowance',        ann: computed.leaveTravel        || 0 },
        { label: 'Special Allowance',             ann: computed.specialAllowance   || 0 },
      ];

  const empRows = computed._components
    ? computed._components.filter(cp => cp.category === 'Employer Contribution' && cp.show_ctc_breakup !== false)
        .map(cp => ({ label: cp.component_name, ann: cp.annual_amount }))
    : [
        { label: "Company's PF Contribution", ann: computed.pfContribution || 0 },
        { label: 'Statutory Bonus',            ann: computed.statutoryBonus || 0 },
        { label: 'Gratuity',                   ann: computed.gratuity       || 0 },
        { label: 'ESI',                        ann: computed.esi            || 0 },
      ];

  const failCount = checks.filter(ck => ck.status === 'fail').length;
  const warnCount = checks.filter(ck => ck.status === 'warn').length;

  return (
    <div className="space-y-3 pb-2">

      {/* Offer Summary Banner */}
      <div className="bg-[#1e3a5f] rounded-xl px-4 py-3.5">
        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-2.5">Offer Summary</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {[
            ['Candidate',       candName],
            ['Designation',     form.designation || '—'],
            ['Date of Joining', form.dateOfJoining || '—'],
            ['Annual CTC',      ctcAnn > 0 ? 'Rs.' + ctcAnn.toLocaleString('en-IN') : '—'],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <p className="text-[10px] text-blue-300 uppercase tracking-wider">{lbl}</p>
              <p className="text-[13px] font-semibold text-white">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Pay */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-1 pl-1">&#9679; Fixed Pay (Earnings)</p>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-indigo-700 px-4 py-1.5 grid grid-cols-3">
            <span className="text-[11px] font-semibold text-white">Component</span>
            <span className="text-[10px] text-indigo-200 text-right pr-4">Monthly</span>
            <span className="text-[10px] text-indigo-200 text-right">Annual</span>
          </div>
          {fixedRows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 px-4 py-2 border-b border-gray-50 hover:bg-gray-50">
              <span className="text-[12px] text-gray-600">{row.label}</span>
              <span className="text-[12px] text-gray-800 text-right pr-4">{fmtM(row.ann)}</span>
              <span className="text-[12px] text-gray-800 text-right">{fmt(row.ann)}</span>
            </div>
          ))}
          <div className="grid grid-cols-3 px-4 py-2.5 bg-indigo-50 border-t border-indigo-200">
            <span className="text-[12px] font-bold text-indigo-900">Gross Salary</span>
            <span className="text-[12px] font-bold text-indigo-900 text-right pr-4">{fmtM(computed.grossSalary || 0)}</span>
            <span className="text-[12px] font-bold text-indigo-900 text-right">{fmt(computed.grossSalary || 0)}</span>
          </div>
        </div>
      </div>

      {/* Employer Contributions */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1 pl-1">&#9679; Employer Contributions</p>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-emerald-700 px-4 py-1.5 grid grid-cols-3">
            <span className="text-[11px] font-semibold text-white">Component</span>
            <span className="text-[10px] text-emerald-200 text-right pr-4">Monthly</span>
            <span className="text-[10px] text-emerald-200 text-right">Annual</span>
          </div>
          {empRows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 px-4 py-2 border-b border-gray-50 hover:bg-gray-50">
              <span className="text-[12px] text-gray-600">{row.label}</span>
              <span className="text-[12px] text-gray-800 text-right pr-4">{fmtM(row.ann)}</span>
              <span className="text-[12px] text-gray-800 text-right">{fmt(row.ann)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Variable Pay + One-time side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1 pl-1">&#9679; Variable Pay</p>
          <div className={`px-3 py-3 rounded-xl border h-[84px] flex flex-col justify-center \${varPct > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
            {varPct > 0 ? (
              <>
                <p className="text-[11px] text-amber-800 font-semibold">{varPct}% of Annual CTC</p>
                <p className="text-[15px] font-bold text-amber-900 mt-0.5">Rs.{varAnn.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-amber-600">per year</p>
              </>
            ) : (
              <p className="text-[12px] text-gray-400">Not applicable (0%)</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 mb-1 pl-1">&#9679; One-time Payments</p>
          <div className={`px-3 py-3 rounded-xl border h-[84px] flex flex-col justify-center \${joinBonus > 0 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
            {joinBonus > 0 ? (
              <>
                <p className="text-[11px] text-purple-800 font-semibold">Joining Bonus</p>
                <p className="text-[15px] font-bold text-purple-900 mt-0.5">Rs.{joinBonus.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-purple-600">one-time payment</p>
              </>
            ) : (
              <p className="text-[12px] text-gray-400">No joining bonus</p>
            )}
          </div>
        </div>
      </div>

      {/* CTC Summary */}
      <div className="bg-[#1e3a5f] rounded-xl px-4 py-3">
        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-2">CTC Summary</p>
        <div className="space-y-1">
          <div className="flex justify-between text-[12px] text-blue-200">
            <span>Fixed CTC</span>
            <span className="font-mono">Rs.{(computed.ctc || 0).toLocaleString('en-IN')}</span>
          </div>
          {varAnn > 0 && (
            <div className="flex justify-between text-[12px] text-amber-300">
              <span>+ Variable Pay</span>
              <span className="font-mono">Rs.{varAnn.toLocaleString('en-IN')}</span>
            </div>
          )}
          {joinBonus > 0 && (
            <div className="flex justify-between text-[12px] text-purple-300">
              <span>+ Joining Bonus (one-time)</span>
              <span className="font-mono">Rs.{joinBonus.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-[15px] font-bold text-yellow-300 border-t border-blue-600 pt-2 mt-1">
            <span>= TOTAL CTC</span>
            <span className="font-mono">Rs.{totalCTC.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Validation Checklist */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Validation Checks</p>
          <div className="flex gap-2.5 text-[11px] font-semibold">
            <span className="text-emerald-600">{checks.filter(ck => ck.status === 'ok').length} &#10003; Passed</span>
            {warnCount > 0 && <span className="text-amber-500">{warnCount} &#9888; Warning</span>}
            {failCount > 0 && <span className="text-red-600">{failCount} &#10007; Failed</span>}
          </div>
        </div>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {checks.map(ck => (
            <div key={ck.id}
              className={`flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0 text-[12px] ${ck.status === 'fail' ? 'bg-red-50' : ck.status === 'warn' ? 'bg-amber-50' : ''}`}>
              <div className="flex items-center gap-2">
                <span className={ck.status === 'ok' ? 'text-emerald-500 font-bold' : ck.status === 'warn' ? 'text-amber-500 font-bold' : 'text-red-500 font-bold'}>
                  {ck.status === 'ok' ? '✓' : ck.status === 'warn' ? '⚠' : '✗'}
                </span>
                <span className="text-gray-700">{ck.label}</span>
              </div>
              {ck.value ? <span className="text-[11px] text-gray-500 font-mono ml-2 shrink-0">{ck.value}</span> : null}
            </div>
          ))}
        </div>
        {failCount > 0 && (
          <p className="mt-1.5 text-[11px] text-red-600 font-semibold">
            &#10007; {failCount} check{failCount > 1 ? 's' : ''} failed — go back and fix before releasing.
          </p>
        )}
      </div>
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
  const [step, setStep]             = useState('form'); // 'form' | 'review'
  const [checks, setChecks]         = useState([]);
  const [onboardModal, setOnboardModal] = useState(false);
  const [onboardEffDate, setOnboardEffDate] = useState("");
  const [onboarding, setOnboarding] = useState(false);

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

    // Auto-populate jobReqId + designation + CTC when candidate is selected
    if (name === "candidateId" && value) {
      const cand = candidates.find(c => String(c.candidate_id) === String(value));
      if (cand) {
        next.jobReqId    = cand.job_req_id ? String(cand.job_req_id) : next.jobReqId;
        next.designation = cand.job_title  ? cand.job_title          : next.designation;
        // Auto-populate expected CTC (stored annual → convert to monthly for ctcInput)
        if (cand.expected_ctc && Number(cand.expected_ctc) > 0) {
          const monthly = Math.round(Number(cand.expected_ctc) / 12);
          next.ctcInput = String(monthly);
          setComputed(computeFromCTC(monthly));
        }
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

  function buildChecks(f, c) {
    const ctcAnn    = Number(f.ctcInput) * 12;
    const varPct    = Number(f.variablePct)  || 0;
    const varAnn    = Math.round(ctcAnn * varPct / 100);
    const joinBonus = Number(f.joiningBonus) || 0;
    const today     = new Date(); today.setHours(0, 0, 0, 0);
    const doj       = f.dateOfJoining ? new Date(f.dateOfJoining) : null;
    const isFutureDOJ = doj ? doj >= today : false;
    const candName  = (candidates.find(x => String(x.candidate_id) === String(f.candidateId)) || {}).name || '';
    const fmtAnn    = v => Number(v) > 0 ? `Rs.${Number(v).toLocaleString('en-IN')}` : '—';
    return [
      { id: 'candidate', group: 'Required Fields',        label: 'Candidate selected',            status: f.candidateId    ? 'ok' : 'fail', value: candName },
      { id: 'job',       group: 'Required Fields',        label: 'Job position selected',          status: f.jobReqId       ? 'ok' : 'fail', value: '' },
      { id: 'desig',     group: 'Required Fields',        label: 'Designation filled',             status: f.designation    ? 'ok' : 'fail', value: f.designation },
      { id: 'doj',       group: 'Required Fields',        label: 'Date of Joining set',            status: f.dateOfJoining  ? 'ok' : 'fail', value: f.dateOfJoining || '' },
      { id: 'doj_f',     group: 'Required Fields',        label: 'Joining date ≥ today',          status: isFutureDOJ      ? 'ok' : 'warn', value: '' },
      { id: 'ctc',       group: 'Required Fields',        label: 'Annual CTC > 0',                 status: ctcAnn > 0       ? 'ok' : 'fail', value: ctcAnn > 0 ? `Rs.${ctcAnn.toLocaleString('en-IN')}` : '' },
      { id: 'basic',     group: 'Fixed Pay',              label: 'Basic Salary computed',           status: (c.basic || 0)   > 0 ? 'ok' : 'fail', value: fmtAnn(c.basic || 0) },
      { id: 'hra',       group: 'Fixed Pay',              label: 'HRA computed',                    status: (c.hra   || 0)   > 0 ? 'ok' : 'fail', value: fmtAnn(c.hra   || 0) },
      { id: 'gross',     group: 'Fixed Pay',              label: 'Gross Salary > 0',                status: (c.grossSalary || 0) > 0 ? 'ok' : 'fail', value: fmtAnn(c.grossSalary || 0) },
      { id: 'gross_lt',  group: 'Fixed Pay',              label: 'Gross < Annual CTC',              status: (c.grossSalary || 0) < ctcAnn ? 'ok' : 'fail', value: '' },
      { id: 'var',       group: 'Variable Pay',           label: varPct > 0 ? `Variable Pay @ ${varPct}% of CTC` : 'Variable Pay (not set)', status: varPct > 40 ? 'warn' : 'ok', value: varPct > 0 ? fmtAnn(varAnn) : 'Not applicable' },
      { id: 'pf',        group: 'Employer Contributions', label: 'PF Contribution',                 status: (c.pfContribution || 0) > 0 ? 'ok' : 'warn', value: fmtAnn(c.pfContribution || 0) },
      { id: 'sb',        group: 'Employer Contributions', label: 'Statutory Bonus',                 status: 'ok', value: (c.statutoryBonus || 0) > 0 ? fmtAnn(c.statutoryBonus) : 'Not applicable (Basic > ₹21,000/mo)' },
      { id: 'grat',      group: 'Employer Contributions', label: 'Gratuity',                        status: 'ok', value: fmtAnn(c.gratuity       || 0) },
      { id: 'bonus',     group: 'One-time Payments',      label: 'Joining Bonus',                   status: joinBonus > ctcAnn ? 'warn' : 'ok', value: joinBonus > 0 ? fmtAnn(joinBonus) : 'Not entered' },
    ];
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.candidateId || !form.jobReqId || !form.designation || !form.ctcInput || !form.dateOfJoining) {
      errorToast("Please fill all required fields including Date of Joining"); return;
    }
    if (step === 'form') {
      if (!computed.ctc) { errorToast("Enter CTC (Monthly) — breakdown not ready yet"); return; }
      setChecks(buildChecks(form, computed));
      setStep('review');
      return;
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
        gratuity:           c.gratuity          ?? 0,
        esi:                0,
        ctc:                c.ctc                ?? 0,
        ctcInWords:         numToWords(c.ctc     ?? 0),
      });
      successToast("Offer created");
      setOfferOpen(false); setStep('form'); setForm(BLANK_OFFER); setComputed({}); setChecks([]);
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

  async function handleStartOnboarding() {
    if (!onboardEffDate) { errorToast("Please select an effective date"); return; }
    setOnboarding(true);
    try {
      await createOnboarding({
        candidateId:   detail.candidate_id,
        offerId:       detail.offer_id,
        effectiveDate: onboardEffDate,
      });
      successToast(`Onboarding started for ${detail.candidate_name}`);
      setOnboardModal(false);
      setOnboardEffDate("");
      setDetail(null);
      loadOffers();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to start onboarding"));
    } finally { setOnboarding(false); }
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
        onClose={() => { setOfferOpen(false); setStep('form'); setForm({ ...BLANK_OFFER }); setComputed({}); setChecks([]); }}
        title={step === 'form' ? "Release Offer Letter" : "Pre-Release Validation"} width={580}
        footer={
          step === 'form' ? (
            <>
              <Btn variant="secondary" onClick={() => setOfferOpen(false)}>Cancel</Btn>
              <Btn onClick={handleCreate}>Review &amp; Release →</Btn>
            </>
          ) : (
            <>
              <Btn variant="secondary" onClick={() => setStep('form')}>← Back to Form</Btn>
              <Btn onClick={handleCreate}
                disabled={saving || checks.some(ck => ck.status === 'fail')}>
                {saving ? "Saving…" : checks.some(ck => ck.status === 'fail') ? "Fix issues above" : "✓ Confirm & Create Offer"}
              </Btn>
            </>
          )
        }
      >
        <form onSubmit={handleCreate} className={step !== 'form' ? 'hidden' : ''}>
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
              {form.ctcInput && (
                <p className="text-[11px] text-indigo-600 mt-0.5">
                  Annual: Rs. {((Number(form.ctcInput)||0)*12).toLocaleString("en-IN")}
                </p>
              )}
              {(() => {
                const cand = candidates.find(c => String(c.candidate_id) === String(form.candidateId));
                return cand?.expected_ctc > 0 ? (
                  <p className="text-[11px] text-amber-600 mt-0.5">
                    Candidate expected: Rs. {Number(cand.expected_ctc).toLocaleString("en-IN")} / yr
                    &nbsp;(₹{Math.round(Number(cand.expected_ctc)/12).toLocaleString("en-IN")} /mo)
                  </p>
                ) : null;
              })()}
            </Field>
          </TwoColGrid>

          {/* Variable Pay & Joining Bonus — shown once CTC is entered */}
          {computed.ctc > 0 && (
            <TwoColGrid>
              <Field label="Variable Pay %">
                <Input
                  type="number" name="variablePct" value={form.variablePct} onChange={handleChange}
                  placeholder="e.g. 10" min={0} max={100}
                />
                {Number(form.variablePct) > 0 && (
                  <p className="text-[11px] text-indigo-600 mt-0.5">
                    Annual: Rs. {Math.round((Number(form.ctcInput)||0)*12*(Number(form.variablePct)||0)/100).toLocaleString("en-IN")}
                  </p>
                )}
              </Field>
              <Field label="Joining Bonus (Rs.)">
                <Input
                  type="number" name="joiningBonus" value={form.joiningBonus} onChange={handleChange}
                  placeholder="e.g. 50000" min={0}
                />
                {Number(form.joiningBonus) > 0 && (
                  <p className="text-[11px] text-indigo-600 mt-0.5">
                    One-time: Rs. {(Number(form.joiningBonus)||0).toLocaleString("en-IN")}
                  </p>
                )}
              </Field>
            </TwoColGrid>
          )}

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
                { label: "Gratuity",             m: computed.gratuity,           a: computed.gratuity },
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

        {/* Pre-Release Validation Review */}
        {step === 'review' && (
          <OfferReleaseReview
            form={form}
            computed={computed}
            candidates={candidates}
            checks={checks}
          />
        )}
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
              {detail.status === "Accepted" && isAdmin && (
                <Btn
                  icon={<UserCheck size={14} />}
                  onClick={() => { setOnboardEffDate(detail.date_of_joining?.slice(0,10) || ""); setOnboardModal(true); }}
                >Start Onboarding</Btn>
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

      {/* ── Start Onboarding Modal ── */}
      <Modal
        open={onboardModal}
        onClose={() => { setOnboardModal(false); setOnboardEffDate(""); }}
        title="Start Onboarding"
        width={400}
        footer={
          <>
            <Btn variant="secondary" onClick={() => { setOnboardModal(false); setOnboardEffDate(""); }}>Cancel</Btn>
            <Btn
              icon={onboarding ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
              disabled={onboarding || !onboardEffDate}
              onClick={handleStartOnboarding}
            >
              {onboarding ? "Starting…" : "Confirm"}
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-gray-600">
            Starting onboarding for <span className="font-semibold text-gray-900">{detail?.candidate_name}</span>.
            This will move the candidate to <span className="font-semibold text-amber-700">Joining Formalities</span> status
            and create an onboarding checklist.
          </p>
          <Field label="Effective Date (Date of Joining)" required>
            <Input
              type="date"
              value={onboardEffDate}
              onChange={e => setOnboardEffDate(e.target.value)}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
