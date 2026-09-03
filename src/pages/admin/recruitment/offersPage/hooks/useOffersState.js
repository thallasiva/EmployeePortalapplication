import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  listOffers, createOffer, releaseOffer, respondOffer,
  listCandidates, listJobs, getErrorMessage, createOnboarding
} from "../../../../../api/recruitment.api";
import { getJoiningByOffer, resendJoiningInvitation } from "../../../../../api/joining.api";
import { apiErrorToast, successToast, errorToast } from "../../../../../utils/ToastControllers";
import { BLANK_OFFER } from "../constants";
import { computeFromCTC, numToWords } from "../utils/ctcUtils";
import { buildChecks } from "../utils/buildChecks";

export function useOffersState(role) {
  const [offers, setOffers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [form, setForm] = useState(BLANK_OFFER);
  const [computed, setComputed] = useState({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("form");
  const [checks, setChecks] = useState([]);
  const [detail, setDetail] = useState(null);
  const [joiningInv, setJoiningInv] = useState(null);
  const [acting, setActing] = useState(false);
  const [resending, setResending] = useState(false);
  const [onboardModal, setOnboardModal] = useState(false);
  const [onboardEffDate, setOnboardEffDate] = useState("");
  const [onboarding, setOnboarding] = useState(false);
  const tableRef = useRef(null);

  const isAdmin = role === 1;
  const canCreate = isAdmin;

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listOffers({ status: filterStatus || undefined, search: search || undefined, limit: 100 });
      setOffers(data ?? []);
    } catch (err) {
      apiErrorToast(err, "Failed to load offers");
    } finally { setLoading(false); }
  }, [filterStatus, search]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  useEffect(() => {
    listCandidates({ status: "Shortlisted", limit: 200 }).then((r) => setCandidates(r.data ?? [])).catch(() => {});
    listJobs({ limit: 200 }).then((r) => setJobs(r.data ?? [])).catch(() => {});
  }, []);

  const selectFilter = useCallback((val) => {
    setFilterStatus(val);
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let next = { ...form, [name]: value };
    if (name === "candidateId" && value) {
      const cand = candidates.find((c) => String(c.candidate_id) === String(value));
      if (cand) {
        next.jobReqId = cand.job_req_id ? String(cand.job_req_id) : next.jobReqId;
        next.designation = cand.job_title ? cand.job_title : next.designation;
        if (cand.expected_ctc && Number(cand.expected_ctc) > 0) {
          const monthly = Math.round(Number(cand.expected_ctc) / 12);
          next.ctcInput = String(monthly);
          setComputed(computeFromCTC(monthly));
        }
      }
    }
    if (name === "jobReqId" && value && !form.designation) {
      const job = jobs.find((j) => String(j.job_req_id) === String(value));
      if (job) next.designation = job.title;
    }
    if (name === "ctcInput") setComputed(computeFromCTC(value));
    setForm(next);
  }, [form, candidates, jobs]);

  const closeCreateForm = useCallback(() => {
    setOfferOpen(false);
    setStep("form");
    setForm({ ...BLANK_OFFER });
    setComputed({});
    setChecks([]);
  }, []);

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    if (!form.candidateId || !form.jobReqId || !form.designation || !form.ctcInput || !form.dateOfJoining) {
      errorToast("Please fill all required fields including Date of Joining"); return;
    }
    if (step === "form") {
      if (!computed.ctc) { errorToast("Enter CTC (Monthly) — breakdown not ready yet"); return; }
      setChecks(buildChecks(form, computed, candidates));
      setStep("review");
      return;
    }
    setSaving(true);
    try {
      const c = computed;
      await createOffer({
        candidateId: Number(form.candidateId), jobReqId: Number(form.jobReqId),
        designation: form.designation, dateOfJoining: form.dateOfJoining,
        basic: c.basic ?? 0, hra: c.hra ?? 0,
        telephoneAllowance: c.telephoneAllowance ?? 0, leaveTravel: c.leaveTravel ?? 0,
        specialAllowance: c.specialAllowance ?? 0, grossSalary: c.grossSalary ?? 0,
        pfContribution: c.pfContribution ?? 0, statutoryBonus: c.statutoryBonus ?? 0,
        gratuity: c.gratuity ?? 0, esi: 0, ctc: c.ctc ?? 0,
        ctcInWords: numToWords(c.ctc ?? 0)
      });
      successToast("Offer created");
      closeCreateForm();
      loadOffers();
    } catch (err) {
      apiErrorToast(err, "Failed to create offer");
    } finally { setSaving(false); }
  }, [form, computed, step, candidates, closeCreateForm, loadOffers]);

  const openDetail = useCallback((row) => {
    setDetail(row);
    setJoiningInv(null);
    if (row.status === "Released" || row.status === "Accepted") {
      getJoiningByOffer(row.offer_id).then((inv) => setJoiningInv(inv || null)).catch(() => {});
    }
  }, []);

  const closeDetail = useCallback(() => { setDetail(null); setJoiningInv(null); }, []);

  const handleRelease = useCallback(async (offerId) => {
    setActing(true);
    try {
      const updated = await releaseOffer(offerId);
      successToast("Offer released");
      setDetail(updated);
      getJoiningByOffer(offerId).then((inv) => setJoiningInv(inv || null)).catch(() => {});
      loadOffers();
    } catch (err) { apiErrorToast(err, "Failed to release offer"); }
    finally { setActing(false); }
  }, [loadOffers]);

  const handleResend = useCallback(async () => {
    if (!joiningInv) return;
    setResending(true);
    try {
      await resendJoiningInvitation(joiningInv.id);
      successToast("Joining invitation resent");
    } catch (err) { apiErrorToast(err, "Failed to resend invitation"); }
    finally { setResending(false); }
  }, [joiningInv]);

  const copyJoiningLink = useCallback(() => {
    if (!joiningInv?.token) return;
    const url = `${window.location.origin}/joining/${joiningInv.token}`;
    navigator.clipboard.writeText(url).then(() => successToast("Link copied!")).catch(err => apiErrorToast(err, "Copy failed"));
  }, [joiningInv]);

  const handleRespond = useCallback(async (offerId, response) => {
    setActing(true);
    try {
      const updated = await respondOffer(offerId, response);
      successToast(`Offer ${response.toLowerCase()}`);
      setDetail(updated);
      loadOffers();
    } catch (err) { apiErrorToast(err, "Failed to update offer"); }
    finally { setActing(false); }
  }, [loadOffers]);

  const handleStartOnboarding = useCallback(async () => {
    if (!onboardEffDate) { errorToast("Please select an effective date"); return; }
    setOnboarding(true);
    try {
      await createOnboarding({
        candidateId: detail.candidate_id,
        offerId: detail.offer_id,
        effectiveDate: onboardEffDate
      });
      successToast(`Onboarding started for ${detail.candidate_name}`);
      setOnboardModal(false);
      setOnboardEffDate("");
      setDetail(null);
      loadOffers();
    } catch (err) { apiErrorToast(err, "Failed to start onboarding"); }
    finally { setOnboarding(false); }
  }, [detail, onboardEffDate, loadOffers]);

  const visible = useMemo(() => offers.filter((o) => {
    const q = search.toLowerCase();
    return (
      (!q || (o.candidate_name || "").toLowerCase().includes(q) ||
        (o.job_title || "").toLowerCase().includes(q) ||
        (o.offer_code || "").toLowerCase().includes(q)) &&
      (!filterStatus || o.status === filterStatus)
    );
  }), [offers, search, filterStatus]);

  return {
    offers, candidates, jobs, loading, search, setSearch,
    filterStatus, setFilterStatus, selectFilter, loadOffers, visible, tableRef,
    offerOpen, setOfferOpen, form, computed, saving, step, setStep, checks,
    detail, joiningInv, acting, resending,
    onboardModal, setOnboardModal, onboardEffDate, setOnboardEffDate, onboarding,
    isAdmin, canCreate,
    handleChange, closeCreateForm, handleCreate,
    openDetail, closeDetail, handleRelease, handleResend, copyJoiningLink,
    handleRespond, handleStartOnboarding
  };
}
