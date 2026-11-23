import React, { useState } from "react";
import { toast } from "react-toastify";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { getErrorMessage } from "../../../../api/client";
import { requestFeedback } from "../../../../api/kudosFeedback.api";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";
import { Modal } from "./Modal";
import { Label } from "./Label";
import { EmployeePicker } from "./EmployeePicker";
const RequestFeedbackModal = ({
  onClose,
  onSent
}) => {
  const [reviewers, setReviewers] = useState([]);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async e => {
    e.preventDefault();
    if (!reviewers.length) return toast.error("Select at least one person");
    if (topic.trim().length < 3) return toast.error("Add a topic");
    setSaving(true);
    try {
      const res = await requestFeedback({
        reviewer_employee_ids: reviewers,
        topic: topic.trim(),
        message: message.trim()
      });
      toast.success(res?.message || "Feedback requested");
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not send request"));
    } finally {
      setSaving(false);
    }
  };
  return <Modal title="Request Feedback" icon={<MessageSquare size={20} className="text-[#e87500]" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Ask (up to 10 people)</Label>
          <EmployeePicker multiple max={10} value={reviewers} onChange={setReviewers} />
        </div>
        <div>
          <Label htmlFor="rq-topic">Topic</Label>
          <input id="rq-topic" value={topic} onChange={e => setTopic(e.target.value)} maxLength={150} placeholder="e.g. Sprint 42 delivery, client demo, code reviews" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:border-[#e87500]" />
        </div>
        <div>
          <Label htmlFor="rq-message">Note (optional)</Label>
          <textarea id="rq-message" value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={1000} placeholder="Anything specific you want them to comment on?" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#e87500] resize-none" />
        </div>
        <div className="flex gap-2 pt-1">
          <SecondaryButton type="button" onClick={onClose} className="flex-1">Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving} className="flex-1">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Request
          </PrimaryButton>
        </div>
      </form>
    </Modal>;
};
export { RequestFeedbackModal };
