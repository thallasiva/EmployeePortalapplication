import React from "react";
import { Loader2, UserCheck } from "lucide-react";
import { Modal, Field, Input, Btn } from "../../shared";

const OnboardModal = React.memo(function OnboardModal({
  open, candidateName, effDate, onEffDateChange, onboarding, onClose, onConfirm
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start Onboarding"
      width={400}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn
            icon={onboarding ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
            disabled={onboarding || !effDate}
            onClick={onConfirm}>
            {onboarding ? "Starting…" : "Confirm"}
          </Btn>
        </>
      }>
      <div className="space-y-4">
        <p className="text-[13px] text-gray-600">
          Starting onboarding for <span className="font-semibold text-gray-900">{candidateName}</span>.
          This will move the candidate to <span className="font-semibold text-amber-700">Joining Formalities</span> status
          and create an onboarding checklist.
        </p>
        <Field label="Effective Date (Date of Joining)" required>
          <Input type="date" value={effDate} onChange={(e) => onEffDateChange(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
});

export default OnboardModal;
