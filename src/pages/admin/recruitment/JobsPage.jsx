import React, { useState, useEffect, useCallback } from "react";
import { Plus, UserPlus, Eye, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  PageHeader, Card, Btn, Field, Select,
  Table, Modal, SearchBar, StatusBadge, DetailRow,
} from "./shared";
import { POSITION_TYPES, BUSINESS_UNITS, ASSIGNMENT_STATUSES, JOB_STATUSES } from "./mockData";
import {
  listJobs, assignRecruiters as apiAssignRecruiters, listRecruiters, getErrorMessage,
} from "../../../api/recruitment.api";
import { errorToast, successToast } from "../../../utils/ToastControllers";

export default function JobsPage({ role }) {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detailJob, setDetailJob] = useState(null);
  const [assignOpen, setAssignOpen] = useState(null);
  const [assignIds, setAssignIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const isAdmin = role === 1;
  const isTL = role === 4;
  const canCreate = isAdmin || isTL;
  const canAssign = isAdmin || isTL;

  // ── Fetch jobs ──────────────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.assignmentStatus = filterStatus;
      if (search)       params.search = search;
      const { data } = await listJobs({ ...params, limit: 100 });
      setJobs(data ?? []);
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
            onClick={e => { e.stopPropagation(); setAssignOpen(row); setAssignIds([]); }}>Assign</Btn>
        )}
      </div>
    )},
  ];

  // Summary counts
  const totalOpen = jobs.filter(j => j.assignment_status === "Open").length;
  const totalCompleted = jobs.filter(j => j.assignment_status === "Completed").length;
  const totalVacancies = jobs.reduce((s, j) => s + (Number(j.vacancies) || 0), 0);

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
          { label: "Total Jobs",     value: jobs.length,   color: "#1a2535" },
          { label: "Open",           value: totalOpen,     color: "#059669" },
          { label: "Completed",      value: totalCompleted,color: "#7c3aed" },
          { label: "Total Openings", value: totalVacancies,color: "#f18200" },
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
        footer={<Btn variant="secondary" onClick={() => setDetailJob(null)}>Close</Btn>}>
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
        onClose={() => { setAssignOpen(null); setAssignIds([]); }}
        title={`Assign Recruiter — ${assignOpen?.title || ""}`} width={420}
        footer={
          <>
            <Btn variant="secondary" onClick={() => { setAssignOpen(null); setAssignIds([]); }}>Cancel</Btn>
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
            {recruiters.length === 0 && (
              <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 16 }}>No recruiters found</p>
            )}
            {recruiters.map(r => {
              const empId = r.employee_id;
              const name = `${r.first_name || ""} ${r.last_name || ""}`.trim();
              return (
                <label key={empId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 8, cursor: "pointer", background: assignIds.includes(empId) ? "#fff7ed" : "#fff" }}>
                  <input type="checkbox" checked={assignIds.includes(empId)}
                    onChange={e => setAssignIds(ids => e.target.checked ? [...ids, empId] : ids.filter(i => i !== empId))}
                    style={{ accentColor: "#f18200" }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{r.email}</div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
