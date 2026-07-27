import React from "react";
import { Eye, UserPlus, XCircle } from "lucide-react";
import { Btn, StatusBadge } from "../shared";

export function makeColumns({ canAssign, canClose, setDetailJob, openAssign, handleClose }) {
  return [
    { header: "Job ID", key: "job_req_code", width: 90 },
    {
      header: "Position",
      key: "title",
      render: (v, row) => (
        <div>
          <div className="font-semibold text-gray-900">{v}</div>
          <div className="text-[11px] text-gray-500">{row.client}</div>
        </div>
      ),
    },
    { header: "Type", key: "position_type" },
    { header: "Business Unit", key: "business_unit" },
    {
      header: "Bill / Pay",
      key: "bill_rate",
      render: (v, row) =>
        `${row.bill_currency || "$"}${v} / ${row.pay_currency || "$"}${row.pay_rate}`,
    },
    { header: "Vacancies", key: "vacancies" },
    { header: "Job Status", key: "job_status", render: (v) => <StatusBadge status={v} /> },
    { header: "Assignment", key: "assignment_status", render: (v) => <StatusBadge status={v} /> },
    { header: "Candidates", key: "total_candidates" },
    {
      header: "Assigned To",
      key: "assigned_recruiters",
      render: (v) =>
        v ? (
          <span className="text-xs text-gray-700">{v}</span>
        ) : (
          <span className="text-xs text-gray-400">Unassigned</span>
        ),
    },
    {
      header: "",
      key: "job_req_id",
      width: 130,
      render: (_, row) => (
        <div className="flex gap-1.5">
          <Btn
            size="sm"
            variant="ghost"
            icon={<Eye size={14} />}
            onClick={(e) => { e.stopPropagation(); setDetailJob(row); }}
          >
            View
          </Btn>
          {canAssign && (
            <Btn
              size="sm"
              variant="secondary"
              icon={<UserPlus size={13} />}
              onClick={(e) => { e.stopPropagation(); openAssign(row); }}
            >
              Assign
            </Btn>
          )}
          {canClose && row.assignment_status === "Open" && (
            <Btn
              size="sm"
              variant="danger"
              icon={<XCircle size={13} />}
              onClick={(e) => { e.stopPropagation(); handleClose(row); }}
            >
              Close
            </Btn>
          )}
        </div>
      ),
    },
  ];
}
