import React from "react";
import { SlideOver, Field, Input, Select, Textarea, TwoColGrid, Btn } from "../shared";
import { INTERVIEW_LEVELS, INTERVIEW_TYPES } from "../mockData";

const ScheduleSlideOver = React.memo(function ScheduleSlideOver({
  open,
  isExternal,
  form,
  saving,
  candidateOpts,
  jobOpts,
  onClose,
  onChange,
  onSubmit,
}) {
  const isTeams = form.interviewType === "Teams";
  const isGoogleMeet = form.interviewType === "GoogleMeet";
  const isZoom = form.interviewType === "Zoom";
  const isOnline = isTeams || isGoogleMeet || isZoom;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isExternal ? "Update Interview Schedule" : "Schedule Interview"}
      width={540}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={onSubmit} disabled={saving}>
            {saving ? "Scheduling..." : "Confirm & Schedule"}
          </Btn>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        {isExternal ? (
          <div className="mb-4 px-3.5 py-2 bg-blue-100 border-l-[3px] border-blue-700 rounded-lg text-[13px] text-blue-800">
            External recruiters can update interview schedule details only.
          </div>
        ) : (
          <div className="mb-4 px-3.5 py-2 bg-[#fff7ed] border-l-[3px] border-[#f18200] rounded-lg text-[13px] text-[#92400e]">
            Schedule a new interview round. A meeting link will be automatically generated and sent to the candidate when type is Teams, Google Meet, or Zoom.
          </div>
        )}

        <TwoColGrid>
          <Field label="Candidate" required>
            <select
              name="candidateId"
              value={form.candidateId}
              onChange={onChange}
              className="w-full text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 outline-none bg-white"
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Select candidate</option>
              {candidateOpts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Job Position">
            <select
              name="jobReqId"
              value={form.jobReqId}
              onChange={onChange}
              className="w-full text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 outline-none bg-white"
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Select job (optional)</option>
              {jobOpts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Interview Level" required>
            <Select
              name="level"
              value={form.level}
              onChange={onChange}
              options={[
                { value: "", label: "Select level" },
                ...INTERVIEW_LEVELS.map((l) => ({ value: l, label: l })),
              ]}
            />
          </Field>
          <Field label="Interview Type" required>
            <Select
              name="interviewType"
              value={form.interviewType}
              onChange={onChange}
              options={[
                { value: "", label: "Select type" },
                ...INTERVIEW_TYPES.map((t) => ({ value: t, label: t })),
              ]}
            />
          </Field>
          <Field label="Date" required>
            <Input name="interviewDate" type="date" value={form.interviewDate} onChange={onChange} />
          </Field>
          <Field label="Time" required>
            <Input name="interviewTime" type="time" value={form.interviewTime} onChange={onChange} />
          </Field>
        </TwoColGrid>

        <Field
          label={isExternal ? "Interviewer Name (if known)" : "Interviewer Name"}
          required={!isExternal}
        >
          <Input
            name="interviewer"
            value={form.interviewer}
            onChange={onChange}
            placeholder="Full name of the interviewer"
          />
        </Field>

        <Field label="Candidate Type" required>
          <Select
            name="candidateType"
            value={form.candidateType}
            onChange={onChange}
            options={[
              { value: "External", label: "External" },
              { value: "Internal", label: "Internal" },
            ]}
          />
        </Field>

        <Field label="To (participants — separate emails with semicolons)">
          <textarea
            name="toAddresses"
            value={form.toAddresses}
            onChange={onChange}
            placeholder="interviewer@company.com; candidate@email.com; hr@company.com"
            rows={2}
            className="w-full box-border text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 resize-y outline-none leading-relaxed bg-white"
            style={{ fontFamily: "inherit" }}
          />
          <div className="text-[11px] text-gray-400 mt-1">
            Separate multiple email addresses with semicolons ( ; )
          </div>
        </Field>

        {isTeams && !isExternal && (
          <div className="px-3.5 py-3 bg-[#eff6ff] border border-blue-200 rounded-lg mt-2">
            <div className="text-[12px] font-bold text-blue-800 mb-2.5">
              Microsoft Teams Meeting
            </div>
            <div className="text-[11px] text-blue-500 mb-2.5 px-2.5 py-1.5 bg-blue-100 rounded-md">
              A Teams meeting invite will be automatically sent to all participants listed in the
              "To" field above.
            </div>
            <Field label="Meeting Subject">
              <Input
                name="teamsSubject"
                value={form.teamsSubject}
                onChange={onChange}
                placeholder="e.g. Interview - Candidate Name - Round 1"
              />
            </Field>
            <TwoColGrid>
              <Field label="Start">
                <Input name="teamsStart" type="datetime-local" value={form.teamsStart} onChange={onChange} />
              </Field>
              <Field label="End">
                <Input name="teamsEnd" type="datetime-local" value={form.teamsEnd} onChange={onChange} />
              </Field>
            </TwoColGrid>
          </div>
        )}

        {isTeams && isExternal && (
          <div className="mt-2 px-3 py-2 bg-[#eff6ff] rounded-lg border border-blue-200 text-[12px] text-blue-700">
            💼 A Microsoft Teams meeting link will be automatically created and emailed to the candidate after scheduling.
          </div>
        )}

        {isGoogleMeet && (
          <div className="px-3.5 py-3 bg-[#f0fdf4] border border-green-200 rounded-lg mt-2">
            <div className="text-[12px] font-bold text-green-800 mb-1.5">📹 Google Meet</div>
            <div className="text-[11px] text-green-700 px-2.5 py-1.5 bg-green-100 rounded-md">
              A Google Meet link will be automatically created and emailed to the candidate after scheduling.
            </div>
          </div>
        )}

        {isZoom && (
          <div className="px-3.5 py-3 bg-[#fff7ed] border border-orange-200 rounded-lg mt-2">
            <div className="text-[12px] font-bold text-orange-800 mb-1.5">🎥 Zoom Meeting</div>
            <div className="text-[11px] text-orange-700 px-2.5 py-1.5 bg-orange-100 rounded-md">
              A Zoom meeting link will be automatically created and emailed to the candidate after scheduling.
            </div>
          </div>
        )}

        <Field label="Notes">
          <Textarea
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder="Any pre-interview notes or instructions..."
            rows={2}
          />
        </Field>
      </form>
    </SlideOver>
  );
});

export default ScheduleSlideOver;
