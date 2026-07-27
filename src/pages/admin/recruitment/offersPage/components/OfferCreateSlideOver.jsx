import React from "react";
import { SlideOver, Field, Input, TwoColGrid, Btn } from "../../shared";
import CtcTableRow from "./CtcTableRow";
import OfferReleaseReview from "./OfferReleaseReview";
import { fmt } from "../utils/ctcUtils";

const OfferCreateSlideOver = React.memo(function OfferCreateSlideOver({
  open, onClose, form, computed, candidates, jobs, step, checks, saving, onChange, onSubmit, onBack
}) {
  const hasFail = checks.some((ck) => ck.status === "fail");

  const footer = step === "form" ? (
    <>
      <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
      <Btn onClick={onSubmit}>Review &amp; Release →</Btn>
    </>
  ) : (
    <>
      <Btn variant="secondary" onClick={onBack}>← Back to Form</Btn>
      <Btn onClick={onSubmit} disabled={saving || hasFail}>
        {saving ? "Saving…" : hasFail ? "Fix issues above" : "✓ Confirm & Create Offer"}
      </Btn>
    </>
  );

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={step === "form" ? "Release Offer Letter" : "Pre-Release Validation"}
      width={580}
      footer={footer}>

      <form onSubmit={onSubmit} className={step !== "form" ? "hidden" : ""}>
        <Field label="Candidate" required>
          <select name="candidateId" value={form.candidateId} onChange={onChange}
            className="w-full text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 outline-none bg-white"
            style={{ fontFamily: "inherit" }}>
            <option value="">Select shortlisted candidate</option>
            {candidates.map((c) => (
              <option key={c.candidate_id} value={c.candidate_id}>
                {c.name}{c.job_title ? ` — ${c.job_title}` : ""}
              </option>
            ))}
          </select>
        </Field>

        <TwoColGrid>
          <Field label="Job Position" required>
            <select name="jobReqId" value={form.jobReqId} onChange={onChange}
              className="w-full text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 outline-none bg-white"
              style={{ fontFamily: "inherit" }}>
              <option value="">Select job position</option>
              {jobs.map((j) => <option key={j.job_req_id} value={j.job_req_id}>{j.title}</option>)}
            </select>
          </Field>
          <Field label="Designation" required>
            <Input name="designation" value={form.designation} onChange={onChange}
              placeholder="e.g. Senior Developer" readOnly={!!form.candidateId} />
          </Field>
        </TwoColGrid>

        <TwoColGrid>
          <Field label="Date of Joining" required>
            <Input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={onChange} />
          </Field>
          <Field label="CTC (Monthly)" required>
            <Input type="number" name="ctcInput" value={form.ctcInput} onChange={onChange}
              placeholder="e.g. 38000" min={0} />
            {form.ctcInput && (
              <p className="text-[11px] text-indigo-600 mt-0.5">
                Annual: Rs. {((Number(form.ctcInput) || 0) * 12).toLocaleString("en-IN")}
              </p>
            )}
            {(() => {
              const cand = candidates.find((c) => String(c.candidate_id) === String(form.candidateId));
              return cand?.expected_ctc > 0 ? (
                <p className="text-[11px] text-amber-600 mt-0.5">
                  Candidate expected: Rs. {Number(cand.expected_ctc).toLocaleString("en-IN")} / yr
                  &nbsp;(₹{Math.round(Number(cand.expected_ctc) / 12).toLocaleString("en-IN")} /mo)
                </p>
              ) : null;
            })()}
          </Field>
        </TwoColGrid>

        {computed.ctc > 0 && (
          <TwoColGrid>
            <Field label="Variable Pay %">
              <Input type="number" name="variablePct" value={form.variablePct} onChange={onChange}
                placeholder="e.g. 10" min={0} max={100} />
              {Number(form.variablePct) > 0 && (
                <p className="text-[11px] text-indigo-600 mt-0.5">
                  Annual: Rs. {Math.round((Number(form.ctcInput) || 0) * 12 * (Number(form.variablePct) || 0) / 100).toLocaleString("en-IN")}
                </p>
              )}
            </Field>
            <Field label="Joining Bonus (Rs.)">
              <Input type="number" name="joiningBonus" value={form.joiningBonus} onChange={onChange}
                placeholder="e.g. 50000" min={0} />
              {Number(form.joiningBonus) > 0 && (
                <p className="text-[11px] text-indigo-600 mt-0.5">
                  One-time: Rs. {(Number(form.joiningBonus) || 0).toLocaleString("en-IN")}
                </p>
              )}
            </Field>
          </TwoColGrid>
        )}

        {computed.ctc > 0 && (
          <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-[#1e3a5f] px-4 py-2.5 grid grid-cols-3">
              <span className="text-white text-[12px] font-semibold">Component</span>
              <span className="text-white text-[12px] font-semibold text-right pr-4">Monthly</span>
              <span className="text-white text-[12px] font-semibold text-right">Annual</span>
            </div>
            {[
              { label: "Basic Salary", v: computed.basic },
              { label: "HRA", v: computed.hra },
              { label: "Telephone Allowance", v: computed.telephoneAllowance },
              { label: "Leave Travel", v: computed.leaveTravel },
              { label: "Special Allowance", v: computed.specialAllowance },
              { label: "Gross Salary", v: computed.grossSalary, highlight: true },
              { label: "PF Contribution", v: computed.pfContribution },
              { label: "Statutory Bonus", v: computed.statutoryBonus },
              { label: "Gratuity", v: computed.gratuity },
              { label: "ESI", v: 0 },
              { label: "Total CTC", v: computed.ctc, highlight: true }
            ].map((row) => (
              <CtcTableRow
                key={row.label}
                label={row.label}
                monthly={fmt(Math.round((Number(row.v) || 0) / 12))}
                annual={fmt(Number(row.v) || 0)}
                highlight={row.highlight} />
            ))}
          </div>
        )}
      </form>

      {step === "review" && (
        <OfferReleaseReview form={form} computed={computed} candidates={candidates} checks={checks} />
      )}
    </SlideOver>
  );
});

export default OfferCreateSlideOver;
