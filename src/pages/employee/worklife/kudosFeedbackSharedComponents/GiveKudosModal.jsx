import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Award, Loader2, Send } from "lucide-react";
import { getErrorMessage } from "../../../../api/client";
import { giveKudos, listKfCategories } from "../../../../api/kudosFeedback.api";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";
import { Modal } from "./Modal";
import { Label } from "./Label";
import { EmployeePicker } from "./EmployeePicker";
const GiveKudosModal = ({
  onClose,
  onSent,
  teamOnly = false,
  preset = []
}) => {
  const [to, setTo] = useState(preset.map(p => p.employee_id));
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    listKfCategories({
      type: "kudos"
    }).then(rows => {
      setCategories(rows || []);
      if (rows?.length) setCategoryId(rows[0].category_id);
    }).catch(() => {});
  }, []);
  const submit = async e => {
    e.preventDefault();
    if (!to.length) return toast.error("Select at least one person");
    if (message.trim().length < 5) return toast.error("Write a short message (at least 5 characters)");
    setSaving(true);
    try {
      const res = await giveKudos({
        to_employee_ids: to,
        category_id: categoryId,
        message: message.trim(),
        is_public: isPublic
      });
      toast.success(res?.message || "Kudos sent");
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not send kudos"));
    } finally {
      setSaving(false);
    }
  };
  return <Modal title="Give Kudos" icon={<Award size={20} className="text-amber-500" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>To {teamOnly ? "(your team)" : ""}</Label>
          <EmployeePicker multiple value={to} onChange={setTo} teamOnly={teamOnly} preset={preset} />
        </div>
        <fieldset>
          <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => <button type="button" key={c.category_id} aria-pressed={categoryId === c.category_id} onClick={() => setCategoryId(c.category_id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${categoryId === c.category_id ? "bg-[#e87500] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} title={c.description || undefined}>
                {c.category_name}
              </button>)}
          </div>
        </fieldset>
        <div>
          <Label htmlFor="kudos-message">Message</Label>
          <textarea id="kudos-message" value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={1000} placeholder="What did they do that you appreciated?" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#e87500] resize-none" />
          <p className="text-[11px] text-slate-400 text-right">{message.length}/1000</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4 accent-[#e87500]" />
          Show on the Kudos Wall for everyone
        </label>
        <div className="flex gap-2 pt-1">
          <SecondaryButton type="button" onClick={onClose} className="flex-1">Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving} className="flex-1">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {to.length > 1 ? `Send Kudos to ${to.length}` : "Send Kudos"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>;
};
export { GiveKudosModal };
