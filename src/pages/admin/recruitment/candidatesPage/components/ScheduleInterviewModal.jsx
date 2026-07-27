import React from "react";
import { Modal, Btn, Field, Input, Select, TwoColGrid } from "../../shared";
import { INTERVIEW_LEVELS, INTERVIEW_TYPES } from "../../mockData";
import { BLANK_INT } from "../constants";

const ScheduleInterviewModal = React.memo(function ScheduleInterviewModal({
  open, detail, intForm, scheduling,
  onClose, onSubmit, onChange
}) {
  function handleClose() {
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Schedule Interview"
      width={540}
      footer={
        <>
          <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
          <Btn onClick={onSubmit} disabled={scheduling} style={{ background: "#f18200", color: "#fff", border: "none" }}>
            {scheduling ? "Scheduling..." : "Confirm & Schedule"}
          </Btn>
        </>
      }>
      {detail &&
        <form onSubmit={onSubmit}>
          <div className="px-3.5 py-2.5 bg-amber-50 rounded-lg mb-4 border-l-[3px] border-l-[#f18200]">
            <div className="text-[11px] font-bold text-amber-800 mb-0.5">CANDIDATE</div>
            <div className="text-sm font-bold text-gray-900">{detail.name}</div>
            <div className="text-xs text-gray-500">{detail.email}</div>
            {detail.job_title && <div className="text-xs text-[#f18200] mt-1">Position: {detail.job_title} @ {detail.job_client}</div>}
          </div>
          <TwoColGrid>
            <Field label="Interview Level" required>
              <Select name="level" value={intForm.level} onChange={onChange} options={INTERVIEW_LEVELS} />
            </Field>
            <Field label="Interview Type" required>
              <Select name="interviewType" value={intForm.interviewType} onChange={onChange} options={INTERVIEW_TYPES} />
            </Field>
            <Field label="Date" required>
              <Input name="interviewDate" type="date" value={intForm.interviewDate} onChange={onChange} />
            </Field>
            <Field label="Time" required>
              <Input name="interviewTime" type="time" value={intForm.interviewTime} onChange={onChange} />
            </Field>
          </TwoColGrid>
          <Field label="Interviewer Name" required>
            <Input name="interviewer" value={intForm.interviewer} onChange={onChange} placeholder="Full name of interviewer" />
          </Field>
          {intForm.interviewType === "Teams" &&
            <div className="px-3.5 py-3 bg-amber-50 rounded-lg mt-1">
              <div className="text-xs font-bold text-amber-800 mb-2.5">Microsoft Teams Meeting</div>
              <Field label="Meeting Subject">
                <Input name="teamsSubject" value={intForm.teamsSubject} onChange={onChange} placeholder="e.g. L1 Interview - Candidate Name" />
              </Field>
              <TwoColGrid>
                <Field label="Start"><Input name="teamsStart" type="datetime-local" value={intForm.teamsStart} onChange={onChange} /></Field>
                <Field label="End"><Input name="teamsEnd" type="datetime-local" value={intForm.teamsEnd} onChange={onChange} /></Field>
              </TwoColGrid>
              <Field label="To (separate emails with semicolons)">
                <Input name="teamsParticipants" value={intForm.teamsParticipants} onChange={onChange} placeholder="user1@company.com; user2@company.com" />
              </Field>
            </div>
          }
        </form>
      }
    </Modal>
  );
});

export default ScheduleInterviewModal;
