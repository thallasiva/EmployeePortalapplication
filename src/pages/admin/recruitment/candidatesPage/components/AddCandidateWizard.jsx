import React, { useState, useRef } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { Btn, SlideOver } from "../../shared";
import { parseResume, quickResumeMatch, uploadResumeMatch, createCandidate, getErrorMessage } from "../../../../../api/recruitment.api";
import { apiErrorToast, successToast, errorToast } from "../../../../../utils/ToastControllers";
import { BLANK } from "../constants";
import { missingFields } from "../utils";
import StepBar from "./StepBar";
import ResumeUploadStep from "./ResumeUploadStep";
import CandidateFormStep from "./CandidateFormStep";

const AddCandidateWizard = React.memo(function AddCandidateWizard({
  open, onClose, jobs, recruiters, isRecruiter, onSuccess
}) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseErr, setParseErr] = useState("");
  const [parsed, setParsed] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [autoFilled, setAutoFilled] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [preScoring, setPreScoring] = useState(false);
  const [preScore, setPreScore] = useState(null);
  const [scoreErr, setScoreErr] = useState("");

  function reset() {
    setStep(1); setFile(null); setParsing(false); setParseErr("");
    setParsed(null); setMatchScore(null); setAutoFilled([]); setForm(BLANK); setSaving(false);
    setPreScoring(false); setPreScore(null); setScoreErr("");
  }
  function handleClose() { reset(); onClose(); }

  async function triggerScoring(fileToUse, jobId) {
    if (!fileToUse || !jobId) { setPreScore(null); setScoreErr(""); return; }
    setPreScoring(true); setPreScore(null); setScoreErr("");
    try {
      const result = await uploadResumeMatch(Number(jobId), fileToUse);
      setPreScore(result);
    } catch (err) {
      setScoreErr(getErrorMessage(err, "Could not compute match score"));
    } finally {
      setPreScoring(false);
    }
  }

  async function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setParseErr(""); setPreScore(null); setScoreErr("");
    triggerScoring(f, form.jobReqId);
    // Auto-extract skills (and other fields) from resume as soon as it's uploaded
    try {
      const data = await parseResume(f);
      if (data) {
        const updates = {};
        if (data.name && !form.name) updates.name = data.name;
        if (data.email && !form.email) updates.email = data.email;
        if (data.phone && !form.mobile) updates.mobile = data.phone;
        if (data.experience != null && data.experience !== "" && !form.totalExperience) {
          updates.totalExperience = String(data.experience);
          updates.relevantExperience = String(data.experience);
        }
        const skills = (data.skills || []).join(", ");
        if (skills) updates.skillSet = skills;
        if (Object.keys(updates).length) {
          setForm(prev => ({ ...prev, ...updates }));
          setAutoFilled(Object.keys(updates));
        }
        setParsed(data);
      }
    } catch { /* silent — user can still parse manually */ }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;
    setForm((f) => ({ ...f, [name]: newVal }));
    if (name === "jobReqId") { setPreScore(null); setScoreErr(""); triggerScoring(file, newVal); }
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true); setParseErr(""); setAutoFilled([]);
    try {
      const data = preScore && preScore.parsed ? preScore.parsed : await parseResume(file);
      setParsed(data);
      const filled = []; const updates = {};
      if (data.name) { updates.name = data.name; filled.push("name"); }
      if (data.email) { updates.email = data.email; filled.push("email"); }
      if (data.phone) { updates.mobile = data.phone; filled.push("mobile"); }
      if (data.experience != null && data.experience !== "") {
        updates.totalExperience = String(data.experience);
        updates.relevantExperience = String(data.experience);
        filled.push("totalExperience", "relevantExperience");
      }
      const skills = (data.skills || []).join(", ");
      if (skills) { updates.skillSet = skills; filled.push("skillSet"); }
      setForm((prev) => ({ ...prev, ...updates }));
      setAutoFilled(filled);
      if (preScore) {
        setMatchScore(preScore);
      } else if (form.jobReqId) {
        try {
          const score = await quickResumeMatch(Number(form.jobReqId), skills || "", Number(data.experience) || 0);
          setMatchScore(score);
        } catch {}
      }
      setStep(2);
    } catch (err) {
      setParseErr(getErrorMessage(err, "Could not parse resume. Please fill in details manually."));
      setStep(2);
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit() {
    const missing = missingFields(form);
    if (missing.length) { errorToast("Please fill in all required fields: " + missing.join(", ")); return; }
    setSaving(true);
    try {
      await createCandidate({
        jobReqId: Number(form.jobReqId), name: form.name, email: form.email,
        mobile: form.mobile || null, gender: form.gender || null,
        totalExperience: Number(form.totalExperience) || 0,
        relevantExperience: Number(form.relevantExperience) || 0,
        currentCtc: Number(form.currentCtc) || 0, expectedCtc: Number(form.expectedCtc) || 0,
        noticePeriodServing: form.noticePeriodServing, lastWorkingDay: form.lastWorkingDay || null,
        skillSet: form.skillSet || null, source: form.source || null,
        pinCode: form.pinCode || null, city: form.city || null,
        state: form.state || null, district: form.district || null,
        recruiterId: form.recruiterId ? Number(form.recruiterId) : undefined
      });
      successToast("Candidate added successfully");
      reset();
      onSuccess();
    } catch (err) {
      apiErrorToast(err, "Failed to add candidate");
    } finally {
      setSaving(false);
    }
  }

  const missing = missingFields(form);
  const canSubmit = missing.length === 0;

  return (
    <SlideOver open={open} onClose={handleClose} title="Add Candidate" width={600}
      footer={
        step === 1 ? (
          <>
            <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
            <Btn onClick={handleParse} disabled={!file || parsing || preScoring}>
              {preScoring
                ? <><Loader2 size={14} className="animate-spin" /> Analysing…</>
                : parsing
                  ? <><Loader2 size={14} className="animate-spin" /> Parsing…</>
                  : <>Parse Resume <ChevronRight size={14} /></>}
            </Btn>
          </>
        ) : (
          <>
            <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
            <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving || !canSubmit}>
              {saving ? "Submitting…" : "Submit Candidate"}
            </Btn>
          </>
        )
      }>
      <StepBar step={step} />
      {step === 1 && (
        <ResumeUploadStep
          jobs={jobs} form={form} file={file}
          parsing={parsing} preScoring={preScoring} preScore={preScore}
          scoreErr={scoreErr} parseErr={parseErr}
          onFileChange={handleFileChange} onFormChange={handleChange} />
      )}
      {step === 2 && (
        <CandidateFormStep
          form={form} jobs={jobs} recruiters={recruiters} isRecruiter={isRecruiter}
          parsed={parsed} parseErr={parseErr} matchScore={matchScore}
          autoFilled={autoFilled} missing={missing}
          onFormChange={handleChange} />
      )}
    </SlideOver>
  );
});

export default AddCandidateWizard;
