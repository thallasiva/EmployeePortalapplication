import React from "react";
import { XCircle } from "lucide-react";
import { Modal, Btn, StatusBadge, DetailRow } from "../shared";

function JobDetailModal({ detailJob, onClose, canClose, handleClose }) {
  return (
    <Modal
      open={!!detailJob}
      onClose={onClose}
      title={detailJob?.title || "Job Details"}
      width={640}
      footer={
        <div className="flex gap-2 w-full">
          {canClose && detailJob?.assignment_status === "Open" && (
            <Btn
              variant="danger"
              icon={<XCircle size={14} />}
              onClick={() => handleClose(detailJob)}
            >
              Close Job Request
            </Btn>
          )}
          <div className="flex-1" />
          <Btn variant="secondary" onClick={onClose}>
            Dismiss
          </Btn>
        </div>
      }
    >
      {detailJob && (
        <div>
          <div className="flex gap-2.5 mb-4 flex-wrap">
            <StatusBadge status={detailJob.job_status} />
            <StatusBadge status={detailJob.assignment_status} />
            <span className="text-xs bg-gray-100 px-2.5 py-0.5 rounded-xl text-gray-700 font-medium">
              {detailJob.position_type}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-5">
            <DetailRow label="Job ID" value={detailJob.job_req_code} />
            <DetailRow label="Client" value={detailJob.client} />
            <DetailRow label="Business Unit" value={detailJob.business_unit} />
            <DetailRow label="Company / Dept" value={detailJob.company_dept} />
            <DetailRow label="Bill Rate" value={`${detailJob.bill_currency || "$"}${detailJob.bill_rate}/hr`} />
            <DetailRow label="Pay Rate" value={`${detailJob.pay_currency || "$"}${detailJob.pay_rate}/hr`} />
            <DetailRow label="Vacancies" value={detailJob.vacancies} />
            <DetailRow label="Candidates" value={detailJob.total_candidates} />
            {detailJob.city && <DetailRow label="City" value={detailJob.city} />}
            {detailJob.country && <DetailRow label="Country" value={detailJob.country} />}
            {detailJob.experience_level && <DetailRow label="Experience" value={detailJob.experience_level} />}
            <DetailRow label="Created" value={detailJob.created_at?.slice(0, 10)} />
          </div>
          {detailJob.skill_set && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-gray-500 mb-2">SKILLS REQUIRED</div>
              <div className="flex gap-1.5 flex-wrap">
                {detailJob.skill_set
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((s) => (
                    <span key={s} className="bg-gray-100 px-2.5 py-0.5 rounded-full text-xs text-gray-700">
                      {s}
                    </span>
                  ))}
              </div>
            </div>
          )}
          {detailJob.description && (
            <div className="mt-3.5">
              <div className="text-xs font-semibold text-gray-500 mb-1.5">JOB DESCRIPTION</div>
              <p className="text-sm text-gray-700 leading-relaxed m-0">{detailJob.description}</p>
            </div>
          )}
          {detailJob.assigned_recruiters && (
            <div className="mt-3.5">
              <div className="text-xs font-semibold text-gray-500 mb-1.5">ASSIGNED RECRUITERS</div>
              <p className="text-sm text-gray-700 m-0">{detailJob.assigned_recruiters}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default React.memo(JobDetailModal);
