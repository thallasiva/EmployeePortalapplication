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

export default function JobsPage({ role }) {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detailJob, setDetailJob] = useState(null);
  const [assignOpen, setAssignOpen] = useState(null);
  const [assignIds, setAssignIds] = useState([]);
  const [originalIds, setOriginalIds] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [loadingAssign, setLoadingAssign] = useState(false);

  const isAdmin = role === 1;
  const isTL = role === 4;
  const canCreate = isAdmin || isTL;
  const canAssign = isAdmin || isTL;
  const canClose  = isAdmin || isTL;

  // ── Fetch jobs ──────────────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.assignmentStatus = filterStatus;
      if (search)       params.search = search;
      const { data, meta } = await listJobs({ ...params, limit: 100 });
      setJobs(data ?? []);
      setTotalCount(meta?.total ?? (data?.length ?? 0));
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load jobs"));
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // ── Fetch recruiters (for assign modal) ────────────────────────────
  useEffect(() => {
    listRecruiters()
      .then(rows => setRecruiters(rows ?? []))
      .catch(() => {});
  }, []);

  // ── Open assign modal, pre-load current recruiter IDs ─────────────
  async function openAssign(row) {
    setAssignOpen(row);
    setLoadingAssign(true);
    try {
      const job = await getJob(row.job_req_id);
      const ids = (job.recruiters ?? []).map(r => r.employee_id);
      setAssignIds(ids);
      setOriginalIds(ids);
    } catch {
      setAssignIds([]);
      setOriginalIds([]);
    } finally {
      setLoadingAssign(false);
    }
  }

  // ── Assign recruiters ──────────────────────────────────────────────
  async function handleAssign() {
    setAssigning(true);
    try {
      await apiAssignRecruiters(assignOpen.job_req_id, assignIds);
      successToast("Recruiters assigned successfully");
      setAssignOpen(null);
      setAssignIds([]);
      loadJobs();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to assign recruiters"));
    } finally {
      setAssigning(false);
    }
  }

  // ── Close job request ─────────────────────────────────────────────
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

  // ── Filter locally for immediate feel ─────────────────────────────
  const visibleJobs = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchQ = !q || (j.title || "").toLowerCase().includes(q)
      || (j.client || "").toLowerCase().includes(q)
      || (j.job_req_code || "").toLowerCase().includes(q);
    const matchS = !filterStatus || j.assignment_status === filterStatus;
    return matchQ && matchS;
  });

  const columns = [
    { header: "Job ID", key: "job_req_code", width: 90 },
    { header: "Position", key: "title", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: "#111827" }}>{v}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{row.client}</div>
      </div>
    )},
    { header: "Type",          key: "position_type" },
    { header: "Business Unit", key: "business_unit" },
    { header: "Bill / Pay",    key: "bill_rate", render: (v, row) =>
      `${row.bill_currency || "$"}${v} / ${row.pay_currency || "$"}${row.pay_rate}` },
    { header: "Vacancies",     key: "vacancies" },
    { header: "Job Status",    key: "job_status",        render: v => <StatusBadge status={v} /> },
    { header: "Assignment",    key: "assignment_status", render: v => <StatusBadge status={v} /> },
    { header: "Candidates",    key: "total_candidates" },
    { header: "Assigned To",   key: "assigned_recruiters", render: v =>
      v ? <span style={{ fontSize: 12, color: "#374151" }}>{v}</span>
        : <span style={{ color: "#9ca3af", fontSize: 12 }}>Unassigned</span>
    },
    { header: "", key: "job_req_id", width: 130, render: (_, row) => (
      <div style={{ display: "flex", gap: 6 }}>
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

  // Summary counts
  const openJobs       = jobs.filter(j => j.assignment_status === "Open");
  const totalOpen      = openJobs.length;
  const totalCompleted = jobs.filter(j => j.assignment_status === "Completed").length;

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Jobs"]}
        title={role === 5 ? "My Jobs" : "Job Requests"}
        subtitle="Manage open positions and recruiter assignments"
        action={canCreate ? (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadJobs} />
            <Btn icon={<Plus size={16} />} onClick={() => navigate("create-new")}>New Job Request</Btn>
          </div>
        ) : null}
      />

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Jobs",     value: totalCount,    color: "#1a2535" },
          { label: "Open",           value: totalOpen,     color: "#059669" },
          { label: "Completed",      value: totalCompleted,color: "#7c3aed" },
          { label: "Total Openings", value: totalCount,     color: "#f18200" },
        ].map(s => (
          <Card key={s.label} style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by title, client, ID..." />
          <Select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            options={[{ value: "", label: "All Statuses" }, ...ASSIGNMENT_STATUSES.map(s => ({ value: s, label: s }))]}
          />
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
            {loading ? "Loading…" : `${visibleJobs.length} job${visibleJobs.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 48, color: "#6b7280" }}>
            <Loader2 size={20} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} /> Loading jobs…
          </div>
        ) : (
          <Table columns={columns} data={visibleJobs} onRowClick={row => setDetailJob(row)} />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal open={!!detailJob} onClose={() => setDetailJob(null)}
        title={detailJob?.title || "Job Details"} width={640}
        footer={
          <div style={{ display:"flex", gap:8, width:"100%" }}>
            {canClose && detailJob?.assignment_status === "Open" && (
              <Btn variant="danger" icon={<XCircle size={14} />} onClick={() => handleClose(detailJob)}>
                Close Job Request
              </Btn>
            )}
            <div style={{ flex:1 }} />
            <Btn variant="secondary" onClick={() => setDetailJob(null)}>Dismiss</Btn>
          </div>
        }>
        {detailJob && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <StatusBadge status={detailJob.job_status} />
              <StatusBadge status={detailJob.assignment_status} />
              <span style={{ fontSize: 12, background: "#f3f4f6", padding: "2px 9px", borderRadius: 12, color: "#374151", fontWeight: 500 }}>{detailJob.position_type}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <DetailRow label="Job ID"         value={detailJob.job_req_code} />
              <DetailRow label="Client"         value={detailJob.client} />
              <DetailRow label="Business Unit"  value={detailJob.business_unit} />
              <DetailRow label="Company / Dept" value={detailJob.company_dept} />
              <DetailRow label="Bill Rate"      value={`${detailJob.bill_currency || "$"}${detailJob.bill_rate}/hr`} />
              <DetailRow label="Pay Rate"       value={`${detailJob.pay_currency || "$"}${detailJob.pay_rate}/hr`} />
              <DetailRow label="Vacancies"      value={detailJob.vacancies} />
              <DetailRow label="Candidates"     value={detailJob.total_candidates} />
              {detailJob.city    && <DetailRow label="City"             value={detailJob.city} />}
              {detailJob.country && <DetailRow label="Country"          value={detailJob.country} />}
              {detailJob.experience_level && <DetailRow label="Experience" value={detailJob.experience_level} />}
              <DetailRow label="Created"        value={detailJob.created_at?.slice(0, 10)} />
            </div>
            {detailJob.skill_set && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>SKILLS REQUIRED</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {detailJob.skill_set.split(",").map(s => s.trim()).filter(Boolean).map(s => (
                    <span key={s} style={{ background: "#f3f4f6", padding: "3px 10px", borderRadius: 20, fontSize: 12, color: "#374151" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {detailJob.description && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>JOB DESCRIPTION</div>
                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{detailJob.description}</p>
              </div>
            )}
            {detailJob.assigned_recruiters && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>ASSIGNED RECRUITERS</div>
                <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{detailJob.assigned_recruiters}</p>
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
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              Select recruiters for <strong>{assignOpen.client}</strong> — <strong>{assignOpen.title}</strong>.
            </p>
            {loadingAssign ? (
              <div style={{ display:"flex", justifyContent:"center", padding:24, color:"#6b7280" }}>
                <Loader2 size={18} style={{ animation:"spin 1s linear infinite" }} />
              </div>
            ) : (
              <>
                {recruiters.length === 0 && (
                  <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 16 }}>No recruiters found</p>
                )}
                {recruiters.map(r => {
                  const empId = r.employee_id;
                  const name = `${r.first_name || ""} ${r.last_name || ""}`.trim();
                  const isChecked = assignIds.includes(empId);
                  const isOriginal = originalIds.includes(empId);
                  const isLocked = false; // Both Admin and HR Manager can freely check/uncheck
                  return (
                    <label key={empId} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                      borderRadius: 8, marginBottom: 8, cursor: isLocked ? "default" : "pointer",
                      border: isChecked ? "1px solid #f18200" : "1px solid #e5e7eb",
                      background: isChecked ? "#fff7ed" : "#fff",
                      opacity: isLocked ? 0.85 : 1,
                    }}>
                      <input type="checkbox"
                        checked={isChecked}
                        disabled={isLocked}
                        onChange={e => {
                          if (isLocked) return;
                          setAssignIds(ids => e.target.checked ? [...ids, empId] : ids.filter(i => i !== empId));
                        }}
                        style={{ accentColor: "#f18200" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{r.email}</div>
                      </div>
                      {isOriginal && isLocked && (
                        <span style={{ fontSize: 10, color: "#059669", fontWeight: 600, background: "#d1fae5", padding: "2px 7px", borderRadius: 20 }}>Assigned</span>
                      )}
                      {isOriginal && !isLocked && (
                        <span style={{ fontSize: 10, color: isChecked ? "#b45309" : "#6b7280", fontWeight: 600, background: isChecked ? "#fef3c7" : "#f3f4f6", padding: "2px 7px", borderRadius: 20 }}>
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
