import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { getErrorMessage } from "../../../../api/client";
import { giveFeedback, listKfCategories } from "../../../../api/kudosFeedback.api";
import { FEEDBACK_TYPES } from "./shared";
import { Avatar } from "./Avatar";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";
import { Modal } from "./Modal";
import { Label } from "./Label";
import { EmployeePicker } from "./EmployeePicker";
const GiveFeedbackModal = ({
  onClose,
  onSent,
  request = null,
  presetEmployee = null,
  teamOnly = false
}) => {
  const lockedTo = request ? request.requester_employee_id : presetEmployee?.employee_id;
  const [to, setTo] = useState(lockedTo || null);
  const [type, setType] = useState("Positive");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    listKfCategories({
      type: "feedback"
    }).then(rows => setCategories(rows || [])).catch(() => {});
  }, []);
  const submit = async e => {
    e.preventDefault();
    if (!to) return toast.error("Select who the feedback is for");
    if (message.trim().length < 5) return toast.error("Write your feedback (at least 5 characters)");
    setSaving(true);
    try {
      await giveFeedback({
        to_employee_id: to,
        feedback_type: type,
        category_id: categoryId,
        message: message.trim(),
        is_anonymous: anonymous,
        request_id: request?.request_id || null
      });
      toast.success("Feedback sent");
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not send feedback"));
    } finally {
      setSaving(false);
    }
  };
  const lockedName = request?.requester_name || presetEmployee?.name;
  return <Modal title={request ? "Respond to feedback request" : "Give Feedback"} icon={<MessageSquare size={20} className="text-[#e87500]" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {lockedTo ? <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <Avatar name={lockedName} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">{lockedName}</p>
              {request && <p className="text-xs text-slate-500 truncate">Asked about: {request.topic}</p>}
            </div>
          </div> : <div>
            <Label>For</Label>
            <EmployeePicker value={to} onChange={setTo} teamOnly={teamOnly} />
          </div>}
        {request?.message && <p className="text-sm text-slate-600 bg-orange-50/50 rounded-xl p-3">“{request.message}”</p>}
        <fieldset>
          <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Type</legend>
          <div className="grid grid-cols-3 gap-2">
            {FEEDBACK_TYPES.map(t => <button type="button" key={t} aria-pressed={type === t} onClick={() => setType(t)} className={`h-10 rounded-xl text-xs font-bold border transition-all ${type === t ? "border-[#e87500] bg-orange-50 text-[#b45309]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {t}
              </button>)}
          </div>
        </fieldset>
        {categories.length > 0 && <div>
            <Label htmlFor="fb-category">Area (optional)</Label>
            <select id="fb-category" value={categoryId || ""} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:border-[#e87500] bg-white">
              <option value="">General</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
          </div>}
        <div>
          <Label htmlFor="fb-message">Feedback</Label>
          <textarea id="fb-message" value={message} onChange={e => setMessage(e.target.value)} rows={4} maxLength={2000} placeholder="Be specific: what happened, the impact, and what to keep or change." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#e87500] resize-none" />
          <p className="text-[11px] text-slate-400 text-right">{message.length}/2000</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="w-4 h-4 accent-[#e87500]" />
          Send anonymously (your name is hidden from the receiver)
        </label>
        <div className="flex gap-2 pt-1">
          <SecondaryButton type="button" onClick={onClose} className="flex-1">Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving} className="flex-1">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Feedback
          </PrimaryButton>
        </div>
      </form>
    </Modal>;
};
export { GiveFeedbackModal };
