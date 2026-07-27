import React, { useMemo } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Card, Btn, Select, Table, SearchBar } from "../../shared";
import CandidateStatusBadge from "../../../../../features/recruitment/components/CandidateStatusBadge";
import { NO_NEXT_STATUSES, STATUS_OPTS } from "../constants";

const CandidateTable = React.memo(function CandidateTable({
  loading, filtered, jobs, search, filterJob, filterStatus,
  isRecruiter, isHRMgr, isTL,
  setSearch, setFilterJob, setFilterStatus,
  setDetail, openSchedule, updateStatus, tableRef
}) {
  const jobOpts = useMemo(() => [
    { value: "", label: "All Jobs" },
    ...jobs.map((j) => ({ value: String(j.job_req_id), label: j.title }))
  ], [jobs]);

  const statusOpts = useMemo(() => [
    { value: "", label: "All Statuses" },
    ...STATUS_OPTS.map((s) => ({ value: s, label: s }))
  ], []);

  const columns = useMemo(() => [
    { header: "ID", key: "candidate_code", width: 90 },
    { header: "Name", key: "name", render: (v, row) =>
      <div>
        <div className="font-semibold text-gray-900">{v}</div>
        <div className="text-[11px] text-gray-500">{row.email}</div>
      </div>
    },
    { header: "Applied For", key: "job_title", render: (v, row) =>
      <div>
        <div className="font-medium">{v}</div>
        <div className="text-[11px] text-gray-500">{row.job_client}</div>
      </div>
    },
    { header: "Experience", key: "total_experience", render: (v) => (v || 0) + " Yrs" },
    { header: "Current CTC", key: "current_ctc", render: (v) => v ? (v / 100000).toFixed(1) + " LPA" : "N/A" },
    { header: "Expected CTC", key: "expected_ctc", render: (v) => v ? (v / 100000).toFixed(1) + " LPA" : "N/A" },
    { header: "Notice", key: "notice_period_serving", render: (v) => v ? "Serving" : "Immediate" },
    { header: "Status", key: "status", render: (v) => <CandidateStatusBadge status={v} /> },
    { header: "Source", key: "source" },
    { header: "", key: "candidate_id", width: 180, render: (_, row) =>
      <div className="flex gap-1 flex-wrap">
        {row.status === "Schedule Interview" && isRecruiter &&
          <button onClick={(e) => { e.stopPropagation(); setDetail(row); openSchedule(row); }}
            className="text-[11px] font-bold px-2.5 py-1 bg-[#f18200] text-white border-0 rounded-md cursor-pointer whitespace-nowrap">
            Schedule
          </button>
        }
        {row.status === "Schedule Interview" && isHRMgr &&
          <button onClick={(e) => { e.stopPropagation(); updateStatus(row.candidate_id, "Shortlisted"); }}
            className="text-[11px] font-bold px-2.5 py-1 bg-blue-600 text-white border-0 rounded-md cursor-pointer whitespace-nowrap">
            Shortlist
          </button>
        }
        {isTL && row.last_interview_feedback === "Selected" && !NO_NEXT_STATUSES.includes(row.status) &&
          <button onClick={(e) => { e.stopPropagation(); updateStatus(row.candidate_id, "Schedule Interview"); }}
            className="text-[11px] font-bold px-2.5 py-1 bg-violet-600 text-white border-0 rounded-md cursor-pointer whitespace-nowrap">
            Next Round
          </button>
        }
        <Btn size="sm" variant="ghost" icon={<Eye size={14} />} onClick={(e) => { e.stopPropagation(); setDetail(row); }}>View</Btn>
      </div>
    }
  ], [isRecruiter, isHRMgr, isTL, setDetail, openSchedule, updateStatus]);

  return (
    <div ref={tableRef} className="scroll-mt-4">
      <Card style={{ padding: 0 }}>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, ID..." />
          <Select value={filterJob} onChange={(e) => setFilterJob(e.target.value)} options={jobOpts} />
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} options={statusOpts} />
          <div className="ml-auto flex items-center gap-2">
            {filterStatus &&
              <span onClick={() => setFilterStatus("")}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-[#f18200] border border-orange-200 cursor-pointer">
                {filterStatus} ×
              </span>
            }
            <span className="text-xs text-gray-500">
              {loading ? "Loading..." : filtered.length + " candidate" + (filtered.length !== 1 ? "s" : "")}
            </span>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-12 text-gray-500">
            <Loader2 size={20} className="animate-spin" /> Loading candidates...
          </div>
        ) : (
          <Table columns={columns} data={filtered} onRowClick={(r) => setDetail(r)} />
        )}
      </Card>
    </div>
  );
});

export default CandidateTable;
