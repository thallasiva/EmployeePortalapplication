import React from "react";
import { Modal, Field, Select, Textarea, Btn } from "../../shared";
import { FEEDBACK_STATUSES } from "../../mockData";
const RecruiterFeedbackModal = React.memo(function RecruiterFeedbackModal({
  fbRecruiterOpen,
  fbRecruiter,
  saving,
  onClose,
  onChangeFeedbackStatus,
  onChangeComments,
  onSubmit
}) {
  return <Modal open={!!fbRecruiterOpen} onClose={onClose} title={"Your Feedback — " + (fbRecruiterOpen?.candidate_name || "") + " (" + (fbRecruiterOpen?.level || "") + ")"} width={500} footer={<>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={onSubmit} disabled={saving || !fbRecruiter.feedbackStatus}>
            {saving ? "Saving..." : "Submit Feedback"}
          </Btn>
        </>}>
      {fbRecruiterOpen && <div>
          <div className="mb-4 px-3.5 py-2.5 bg-violet-50 rounded-lg border border-violet-200">
            <div className="text-[12px] font-bold text-violet-700 mb-1">RECRUITER FEEDBACK</div>
            <div className="text-[13px] text-gray-900 font-semibold">
              {fbRecruiterOpen.candidate_name}
            </div>
            <div className="text-[12px] text-gray-500">
              {fbRecruiterOpen.level} · {fbRecruiterOpen.interview_type}
              {fbRecruiterOpen.interview_date ? " · " + fbRecruiterOpen.interview_date.slice(0, 10) : ""}
            </div>
            <div className="text-[11px] text-violet-600 mt-1">
              Your feedback will be reviewed by the HR Manager before the next round is scheduled.
            </div>
          </div>
          <Field label="Select Action" required>
            <Select name="feedbackStatus" value={fbRecruiter.feedbackStatus} onChange={onChangeFeedbackStatus} options={[{
          value: "",
          label: "Select outcome"
        }, ...FEEDBACK_STATUSES.map(s => ({
          value: s,
          label: s
        }))]} />
          </Field>
          <Field label="Comments">
            <Textarea name="feedbackComments" value={fbRecruiter.feedbackComments} onChange={onChangeComments} rows={4} placeholder="Share your observations about the candidate..." />
          </Field>
        </div>}
    </Modal>;
});
export { RecruiterFeedbackModal };
