import React, { useState, useEffect, useCallback } from "react";
import { Plus, UserPlus, Eye, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  PageHeader, Card, Btn, Field, Select,
  Table, Modal, SearchBar, StatusBadge, DetailRow,
} from "./shared";
import { POSITION_TYPES, BUSINESS_UNITS, ASSIGNMENT_STATUSES, JOB_STATUSES } from "./mockData";
import {
  listJobs, getJob, updateJob, assignRecruiters as apiAssignRecruiters, listRecruiters, getErrorMessage,
} from "../../../api/recruitment.api";
import { errorToast, successToast } from "../../../utils/ToastControllers";

// ── Period filter helpers ────────────────────────────────────────────
const PERIODS = [
  { key: "all",   label: "All Time" },
  { key: "week",  label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year",  label: "This Year" },
];

function periodStart(key) {
  const now = new Date();
  if (key === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay()); // Sunday start
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (key === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (key === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }
  return null;
}

export default function JobsPage({ role }) {
  const navigate = useNavigate();

  const [jobs, setJobs]               = useState([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [recruiters, setRecruiters]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [period, setPeriod]           = useState("all");
  const [detailJob, setDetailJob]     = useState(null);
  const [assignOpen, setAssignOpen]   = useState(null);
  const [assignIds, setAssignIds]     = useState([]);
  const [originalIds, setOriginalIds] = useState([]);
  const [assigning, setAssigning]     = useState(false);
  const [loadingAssign, setLoadingAssign] = useState(false);

  const isAdmin  = role === 1;
  const isTL     = role === 4;
  const canCreate = isAdmin || isTL;
  const canAssign = isAdmin || isTL;
  const canClose  = isAdmin || isTL;

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.assignmentStatus = filterStatus;
      if (search)       params.search = search;
      const { data, meta } = await listJobs({ ...params, limit: 200 });
      setJobs(data ?? []);
      setTotalCount(meta?.total ?? (data?.length ?? 0));
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load jobs"));
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  useEffect(() => {
    listRecruiters().then(rows => setRecruiters(rows ?? [])).catch(() => {});
  }, []);

  async function openAssign(row) {
    setAssignOpen(row);
    setLoadingAssign(true);
    try {
      const job = await getJob(row.job_req_id);
      const ids = (job.recruiters ?? []).map(r => r.employee_id);
      setAssignIds(ids);
      setOriginalIds(ids);
    } catch {
      setAssignIds([]); setOriginalIds([]);
    } finally {
      setLoadingAssign(false);
    }
  }

  async function handleAssign() {
    setAssigning(true);
    try {
      await apiAssignRecruiters(assignOpen.job_req_id, assignIds);
      successToast("Recruiters assigned successfully");
      setAssignOpen(null); setAssignIds([]);
      loadJobs();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to assign recruiters"));
    } finally {
      setAssigning(false);
    }
  }

  async function handleClose(job) {
    if (!window.confirm(`Close "${job.title}"? This will move it from Open to Closed.`)) return;
    try {
      await updateJob(job.job_req_id, { assignmentStatus: "Closed" });
      successToast("Job request closed");
      setDetailJob(null);
      loadJobs();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to close job"));
    }
  }

  // Local filter: search + status + period
  const start = periodStart(period);
  const visibleJobs = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchQ = !q || (j.title || "").toLowerCase().includes(q)
      || (j.client || "").toLowerCase().includes(q)
      || (j.job_req_code || "").toLowerCase().includes(q);
    const matchS = !filterStatus || j.assignment_status === filterStatus;
    const matchP = !start || new Date(j.created_at) >= start;
    return matchQ && matchS && matchP;
  });

  // Period counts for badges
  const periodCounts = {};
  PERIODS.forEach(p => {
    const s = periodStart(p.key);
    periodCounts[p.key] = jobs.filter(j => !s || new Date(j.created_at) >= s).length;
  });

  const columns = [
    { header: "Job ID",   key: "job_req_code", width: 90 },
    { header: "Position", key: "title", render: (v, row) => (
      <div>
        <div className="font-semibold text-gray-900">{v}</div>
        <div className="text-[11px] text-gray-500">{row.client}</div>
      </div>
    )},
    { header: "Type",          key: "position_type" },
    { header: "Business Unit", key: "business_unit" },
    { header: "Bill / Pay",    key: "bill_rate", render: (v, row) =>
      `${row.bill_currency || "$"}${v} / ${row.pay_currency || "$"}${row.pay_rate}` },
    { header: "Vacancies",  key: "vacancies" },
    { header: "Job Status", key: "job_status",        render: v => <StatusBadge status={v} /> },
    { header: "Assignment", key: "assignment_status", render: v => <StatusBadge status={v} /> },
    { header: "Candidates", key: "total_candidates" },
    { header: "Assigned To", key: "assigned_recruiters", render: v =>
      v ? <span className="text-xs text-gray-700">{v}</span>
        : <span className="text-xs text-gray-400">Unassigned</span>
    },
    { header: "", key: "job_req_id", width: 130, render: (_, row) => (
      <div className="flex gap-1.5">
        <Btn size="sm" variant="ghost" icon={<Eye size={14} />}
          onClick={e => { e.stopPropagation(); setDetailJob(row); }}>View</Btn>
        {canAssign && (
          <Btn size="sm" variant="secondary" icon={<UserPlus size={13} />}
            onClick={e => { e.stopPropagation(); openAssign(row); }}>Assign</Btn>
        )}
        {canClose && row.assignment_status === "Open" && (
          <Btn size="sm" variant="danger" icon={<XCircle size={13} />}
            onClick={e => { e.stopPropagation(); handleClose(row); }}>Close</Btn>
        )}
      </div>
    )},
  ];

  const totalOpen      = jobs.filter(j => j.assignment_status === "Open").length;
  const totalCompleted = jobs.filter(j => j.assignment_status === "Completed").length;

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Jobs"]}
        title={role === 5 ? "My Jobs" : "Job Requests"}
        subtitle="Manage open positions and recruiter assignments"
        action={canCreate ? (
          <div className="flex gap-2">
            <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadJobs} />
            <Btn icon={<Plus size={16} />} onClick={() => navigate("create-new")}>New Job Request</Btn>
          </div>
        ) : null}
      />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        {[
          { label: "Total Jobs",     value: totalCount,     color: "text-[#1a2535]" },
          { label: "Open",           value: totalOpen,      color: "text-green-600" },
          { label: "Completed",      value: totalCompleted, color: "text-purple-600" },
          { label: "Total Openings", value: totalCount,     color: "text-[#f18200]" },
        ].map(s => (
          <Card key={s.label} style={{ padding: "14px 18px" }}>
            <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">{s.label}</div>
            <div className={`text-[26px] font-bold ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        {/* ── Period tabs ── */}
        <div className="flex items-center gap-1 px-4 pt-3.5 border-b border-gray-100">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer bg-transparent ${
                period === p.key
                  ? "border-[#f18200] text-[#f18200]"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}>
              {p.label}
              <span className={`text-[10px] font-bold px-1.5 py-px rounded-full ${
                period === p.key ? "bg-[#f18200] text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {periodCounts[p.key]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by title, client, ID..." />
          <Select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            options={[{ value: "", label: "All Statuses" }, ...ASSIGNMENT_STATUSES.map(s => ({ value: s, label: s }))]}
          />
          <div className="ml-auto text-xs text-gray-500">
            {loading ? "Loading…" : `${visibleJobs.length} job${visibleJobs.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-12 text-gray-500">
            <Loader2 size={20} className="animate-spin" /> Loading jobs…
          </div>
        ) : (
          <Table columns={columns} data={visibleJobs} onRowClick={row => setDetailJob(row)} />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal open={!!detailJob} onClose={() => setDetailJob(null)}
        title={detailJob?.title || "Job Details"} width={640}
        footer={
          <div className="flex gap-2 w-full">
            {canClose && detailJob?.assignment_status === "Open" && (
              <Btn variant="danger" icon={<XCircle size={14} />} onClick={() => handleClose(detailJob)}>
                Close Job Request
              </Btn>
            )}
            <div className="flex-1" />
            <Btn variant="secondary" onClick={() => setDetailJob(null)}>Dismiss</Btn>
          </div>
        }>
        {detailJob && (
          <div>
            <div className="flex gap-2.5 mb-4 flex-wrap">
              <StatusBadge status={detailJob.job_status} />
              <StatusBadge status={detailJob.assignment_status} />
              <span className="text-xs bg-gray-100 px-2.5 py-0.5 rounded-xl text-gray-700 font-medium">{detailJob.position_type}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-5">
              <DetailRow label="Job ID"         value={detailJob.job_req_code} />
              <DetailRow label="Client"         value={detailJob.client} />
              <DetailRow label="Business Unit"  value={detailJob.business_unit} />
              <DetailRow label="Company / Dept" value={detailJob.company_dept} />
              <DetailRow label="Bill Rate"      value={`${detailJob.bill_currency || "$"}${detailJob.bill_rate}/hr`} />
              <DetailRow label="Pay Rate"       value={`${detailJob.pay_currency || "$"}${detailJob.pay_rate}/hr`} />
              <DetailRow label="Vacancies"      value={detailJob.vacancies} />
              <DetailRow label="Candidates"     value={detailJob.total_candidates} />
              {detailJob.city    && <DetailRow label="City"       value={detailJob.city} />}
              {detailJob.country && <DetailRow label="Country"    value={detailJob.country} />}
              {detailJob.experience_level && <DetailRow label="Experience" value={detailJob.experience_level} />}
              <DetailRow label="Created" value={detailJob.created_at?.slice(0, 10)} />
            </div>
            {detailJob.skill_set && (
              <div className="mt-3">
                <div className="text-xs font-semibold text-gray-500 mb-2">SKILLS REQUIRED</div>
                <div className="flex gap-1.5 flex-wrap">
                  {detailJob.skill_set.split(",").map(s => s.trim()).filter(Boolean).map(s => (
                    <span key={s} className="bg-gray-100 px-2.5 py-0.5 rounded-full text-xs text-gray-700">{s}</span>
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

      {/* Assign Recruiter Modal */}
      <Modal open={!!assignOpen}
        onClose={() => { setAssignOpen(null); setAssignIds([]); setOriginalIds([]); }}
        title={`Assign Recruiter — ${assignOpen?.title || ""}`} width={420}
        footer={
          <>
            <Btn variant="secondary" onClick={() => { setAssignOpen(null); setAssignIds([]); setOriginalIds([]); }}>Cancel</Btn>
            <Btn onClick={handleAssign} disabled={assigning}>
              {assigning ? "Saving…" : "Confirm Assignment"}
            </Btn>
          </>
        }>
        {assignOpen && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Select recruiters for <strong>{assignOpen.client}</strong> — <strong>{assignOpen.title}</strong>.
            </p>
            {loadingAssign ? (
              <div className="flex justify-center py-6 text-gray-500">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : (
              <>
                {recruiters.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No recruiters found</p>
                )}
                {recruiters.map(r => {
                  const empId    = r.employee_id;
                  const name     = `${r.first_name || ""} ${r.last_name || ""}`.trim();
                  const isChecked  = assignIds.includes(empId);
                  const isOriginal = originalIds.includes(empId);
                  return (
                    <label key={empId} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-2 cursor-pointer border transition-colors ${
                      isChecked ? "border-[#f18200] bg-amber-50" : "border-gray-200 bg-white"
                    }`}>
                      <input type="checkbox"
                        checked={isChecked}
                        onChange={e => setAssignIds(ids => e.target.checked ? [...ids, empId] : ids.filter(i => i !== empId))}
                        className="accent-[#f18200]" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{name}</div>
                        <div className="text-[11px] text-gray-500">{r.email}</div>
                      </div>
                      {isOriginal && (
                        <span className={`text-[10px] font-semibold px-1.5 py-px rounded-full ${
                          isChecked ? "bg-yellow-100 text-amber-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {isChecked ? "Assigned" : "Removed"}
                        </span>
                      )}
                    </label>
                  );
                })}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
