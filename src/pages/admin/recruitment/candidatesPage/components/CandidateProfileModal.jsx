import React from "react";
import { Calendar } from "lucide-react";
import { Modal, Btn, Select } from "../../shared";
import CandidateStatusBadge from "../../../../../features/recruitment/components/CandidateStatusBadge";
import { DetailRow } from "../../shared";
import { STATUS_OPTS } from "../constants";
import MatchScoreWidget from "./MatchScoreWidget";
import InterviewHistory from "./InterviewHistory";

const CandidateProfileModal = React.memo(function CandidateProfileModal({
  detail, role, isAdmin, isTL, isHRMgr, isRecruiter,
  onClose, updateStatus, openSchedule
}) {
  if (!detail) return null;

  const recruiterOpts = ["Work in Progress", "Schedule Interview"].map((s) => ({ value: s, label: s }));
  const hrMgrOpts = ["Shortlisted"].map((s) => ({ value: s, label: s }));
  const tlOpts = ["Work in Progress", "Schedule Interview"].map((s) => ({ value: s, label: s }));
  const adminOpts = STATUS_OPTS.map((s) => ({ value: s, label: s }));

  const footer = (
    <div className="flex items-center gap-2.5 w-full">
      {isRecruiter &&
        <div className="flex-1">
          <Select value={detail.status || ""} onChange={(e) => updateStatus(detail.candidate_id, e.target.value)} options={recruiterOpts} />
        </div>
      }
      {isHRMgr && <>
        <div className="flex-1">
          <Select value={detail.status || ""} onChange={(e) => updateStatus(detail.candidate_id, e.target.value)} options={hrMgrOpts} />
        </div>
        <Btn icon={<Calendar size={15} />} onClick={() => updateStatus(detail.candidate_id, "Schedule Interview")}
          style={{ background: "#1e3a5f", color: "#fff", border: "none" }}>Next Round</Btn>
        <Btn onClick={() => updateStatus(detail.candidate_id, "Offer Rejected")}
          style={{ background: "#dc2626", color: "#fff", border: "none" }}>Reject</Btn>
      </>}
      {isTL &&
        <div className="flex-1">
          <Select value={detail.status || ""} onChange={(e) => updateStatus(detail.candidate_id, e.target.value)} options={tlOpts} />
        </div>
      }
      {isAdmin &&
        <div className="flex-1">
          <Select value={detail.status || ""} onChange={(e) => updateStatus(detail.candidate_id, e.target.value)} options={adminOpts} />
        </div>
      }
      {isRecruiter && detail.status === "Schedule Interview" &&
        <Btn icon={<Calendar size={15} />} onClick={() => openSchedule(detail)}
          style={{ background: "#f18200", color: "#fff", border: "none" }}>Schedule Interview</Btn>
      }
      <Btn variant="secondary" onClick={onClose}>Close</Btn>
    </div>
  );

  return (
    <Modal open={!!detail} onClose={onClose} title="Candidate Profile" width={680} footer={footer}>
      <div>
        <div className="flex items-center gap-4 px-4 py-3.5 bg-gray-50 rounded-xl mb-5">
          <div className="w-[52px] h-[52px] rounded-full bg-[#1a2535] text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            {(detail.name || "?").charAt(0)}
          </div>
          <div className="flex-1">
            <div className="text-[17px] font-bold text-gray-900">{detail.name}</div>
            <div className="text-sm text-gray-500">{detail.email}{detail.mobile ? " · " + detail.mobile : ""}</div>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <CandidateStatusBadge status={detail.status} />
              {detail.source && <span className="text-[11px] bg-gray-100 px-2.5 py-0.5 rounded-xl text-gray-500">{detail.source}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-gray-500">Candidate ID</div>
            <div className="text-sm font-bold text-[#f18200]">{detail.candidate_code}</div>
          </div>
        </div>

        {detail.job_title &&
          <div className="px-3.5 py-2.5 bg-amber-50 rounded-lg mb-4 border-l-[3px] border-l-[#f18200]">
            <div className="text-[11px] text-amber-800 font-semibold">APPLIED FOR</div>
            <div className="text-sm font-semibold text-gray-900">
              {detail.job_title} <span className="text-gray-500 font-normal">@ {detail.job_client}</span>
            </div>
          </div>
        }

        <div className="grid grid-cols-2 gap-x-5">
          <DetailRow label="Total Experience" value={(detail.total_experience || 0) + " Years"} />
          <DetailRow label="Relevant Experience" value={(detail.relevant_experience || 0) + " Years"} />
          <DetailRow label="Current CTC" value={detail.current_ctc ? (detail.current_ctc / 100000).toFixed(1) + " LPA" : "N/A"} />
          <DetailRow label="Expected CTC" value={detail.expected_ctc ? (detail.expected_ctc / 100000).toFixed(1) + " LPA" : "N/A"} />
          <DetailRow label="Notice Period" value={detail.notice_period_serving ? "Serving (LWD: " + (detail.last_working_day || "?") + ")" : "Immediate Joiner"} />
          <DetailRow label="Gender" value={detail.gender} />
          <DetailRow label="City" value={detail.city} />
          <DetailRow label="State" value={detail.state} />
          <DetailRow label="Added" value={detail.created_at?.slice(0, 10)} />
        </div>

        {detail.skill_set &&
          <div className="mt-3">
            <div className="text-xs font-semibold text-gray-500 mb-2">SKILL SET</div>
            <div className="flex gap-1.5 flex-wrap">
              {detail.skill_set.split(",").map((s) => s.trim()).filter(Boolean).map((s) =>
                <span key={s} className="bg-gray-100 px-2.5 py-0.5 rounded-full text-xs text-gray-700 font-medium">{s}</span>
              )}
            </div>
          </div>
        }

        <MatchScoreWidget candidateId={detail.candidate_id} jobReqId={detail.job_req_id} />

        {detail.status === "Schedule Interview" && isRecruiter &&
          <div className="mt-4 px-4 py-3.5 bg-amber-50 border border-orange-200 border-l-4 border-l-[#f18200] rounded-xl flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-amber-800">Ready for Next Interview Round</div>
              <div className="text-[11px] text-amber-700 mt-0.5">HR has approved this candidate - schedule the next interview</div>
            </div>
            <button onClick={() => openSchedule(detail)}
              className="text-xs font-bold text-white bg-[#f18200] border-0 rounded-lg px-4 py-2 cursor-pointer flex-shrink-0">
              Schedule Interview
            </button>
          </div>
        }

        <InterviewHistory
          candidateId={detail.candidate_id}
          role={role}
          candidateStatus={detail.status}
          onMoveToNextRound={() => updateStatus(detail.candidate_id, "Schedule Interview")} />
      </div>
    </Modal>
  );
});

export default CandidateProfileModal;
