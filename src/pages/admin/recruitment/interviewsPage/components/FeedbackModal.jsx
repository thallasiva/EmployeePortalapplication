import React from "react";
import { Modal, Field, Input, Select, Textarea, Btn } from "../shared";
import { FEEDBACK_STATUSES } from "../mockData";

export const HrFeedbackModal = React.memo(function HrFeedbackModal({
  fbOpen,
  fb,
  saving,
  onClose,
  onChange,
  onSubmit,
}) {
  return (
    <Modal
      open={!!fbOpen}
      onClose={onClose}
      title={
        "HR Feedback — " +
        (fbOpen?.candidate_name || "") +
        " (" +
        (fbOpen?.level || "") +
        ")"
      }
      width={500}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Feedback"}
          </Btn>
        </>
      }
    >
      {fbOpen && (
        <div>
          <div className="mb-4 px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-[12px] font-bold text-gray-500 mb-1">INTERVIEW DETAILS</div>
            <div className="text-[13px] text-gray-900 font-semibold">{fbOpen.candidate_name}</div>
            <div className="text-[12px] text-gray-500">
              {fbOpen.level} — {fbOpen.interview_type}
              {fbOpen.interview_date ? " · " + fbOpen.interview_date.slice(0, 10) : ""}
              {fbOpen.interview_time ? " at " + fbOpen.interview_time.slice(0, 5) : ""}
            </div>
            {fbOpen.interviewer && (
              <div className="text-[12px] text-gray-500 mt-0.5">
                Interviewer: {fbOpen.interviewer}
              </div>
            )}
          </div>
          <Field label="Interviewer Name">
            <Input value={fbOpen.interviewer || "—"} readOnly style={{ background: "#f9fafb" }} />
          </Field>
          <Field label="Outcome" required>
            <Select
              name="feedbackStatus"
              value={fb.feedbackStatus}
              onChange={onChange}
              options={[
                { value: "", label: "Select outcome" },
                ...FEEDBACK_STATUSES.map((s) => ({ value: s, label: s })),
              ]}
            />
          </Field>
          <Field label="Feedback Comments">
            <Textarea
              name="feedbackComments"
              value={fb.feedbackComments}
              onChange={onChange}
              rows={4}
              placeholder="Enter detailed interviewer feedback..."
            />
          </Field>
          <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer mt-2">
            <input
              type="checkbox"
              name="shortlisted"
              checked={fb.shortlisted}
              onChange={onChange}
              className="accent-[#f18200]"
            />
            Mark as Shortlisted
          </label>
        </div>
      )}
    </Modal>
  );
});

export const RecruiterFeedbackModal = React.memo(function RecruiterFeedbackModal({
  fbRecruiterOpen,
  fbRecruiter,
  saving,
  onClose,
  onChangeFeedbackStatus,
  onChangeComments,
  onSubmit,
}) {
  return (
    <Modal
      open={!!fbRecruiterOpen}
      onClose={onClose}
      title={
        "Your Feedback — " +
        (fbRecruiterOpen?.candidate_name || "") +
        " (" +
        (fbRecruiterOpen?.level || "") +
        ")"
      }
      width={500}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={onSubmit} disabled={saving || !fbRecruiter.feedbackStatus}>
            {saving ? "Saving..." : "Submit Feedback"}
          </Btn>
        </>
      }
    >
      {fbRecruiterOpen && (
        <div>
          <div className="mb-4 px-3.5 py-2.5 bg-violet-50 rounded-lg border border-violet-200">
            <div className="text-[12px] font-bold text-violet-700 mb-1">RECRUITER FEEDBACK</div>
            <div className="text-[13px] text-gray-900 font-semibold">
              {fbRecruiterOpen.candidate_name}
            </div>
            <div className="text-[12px] text-gray-500">
              {fbRecruiterOpen.level} · {fbRecruiterOpen.interview_type}
              {fbRecruiterOpen.interview_date
                ? " · " + fbRecruiterOpen.interview_date.slice(0, 10)
                : ""}
            </div>
            <div className="text-[11px] text-violet-600 mt-1">
              Your feedback will be reviewed by the HR Manager before the next round is scheduled.
            </div>
          </div>
          <Field label="Your Assessment" required>
            <Select
              name="feedbackStatus"
              value={fbRecruiter.feedbackStatus}
              onChange={onChangeFeedbackStatus}
              options={[
                { value: "", label: "Select outcome" },
                ...FEEDBACK_STATUSES.map((s) => ({ value: s, label: s })),
              ]}
            />
          </Field>
          <Field label="Comments">
            <Textarea
              name="feedbackComments"
              value={fbRecruiter.feedbackComments}
              onChange={onChangeComments}
              rows={4}
              placeholder="Share your observations about the candidate..."
            />
          </Field>
        </div>
      )}
    </Modal>
  );
});
