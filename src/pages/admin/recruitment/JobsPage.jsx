import React, { useState } from "react";
import { Plus, UserPlus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  PageHeader, Card, Btn, Field, Input, Select, Textarea,
  Table, Modal, SearchBar, StatusBadge, DetailRow,
} from "./shared";
import {
  MOCK_JOBS, MOCK_RECRUITERS, POSITION_TYPES, BUSINESS_UNITS,
  ASSIGNMENT_STATUSES, JOB_STATUSES,
} from "./mockData";
import { newJobsStore } from "./CreateJobPage";

export default function JobsPage({ role }) {
  const navigate = useNavigate();
  const [extraJobs] = useState(() => newJobsStore);
  const [jobs, setJobs] = useState(() => [...newJobsStore, ...MOCK_JOBS]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detailJob, setDetailJob] = useState(null);
  const [assignOpen, setAssignOpen] = useState(null);
  const [assignIds, setAssignIds] = useState([]);

  const isAdmin = role === 1;
  const isTL = role === 4;
  const canCreate = isAdmin || isTL;
  const canAssign = isAdmin || isTL;

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchQ = !q || j.title.toLowerCase().includes(q) || j.client.toLowerCase().includes(q) || j.id.toLowerCase().includes(q);
    const matchS = !filterStatus || j.assignmentStatus === filterStatus;
    return matchQ && matchS;
  });

  const visibleJobs = role === 5
    ? filtered.filter(j => j.assignedRecruiters?.includes(22) || j.assignedRecruiters?.includes(23))
    : filtered;

  function handleAssign() {
    setJobs(js => js.map(j => j.id === assignOpen.id ? { ...j, assignedRecruiters: assignIds.map(Number) } : j));
    setAssignOpen(null);
    setAssignIds([]);
  }

  const columns = [
    { header: "Job ID", key: "id", width: 90 },
    { header: "Position", key: "title", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: "#111827" }}>{v}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{row.client}</div>
      </div>
    )},
    { header: "Type", key: "positionType" },
    { header: "Business Unit", key: "businessUnit" },
    { header: "Bill / Pay", key: "billRate", render: (v, row) => `$${v} / $${row.payRate}` },
    { header: "Vacancies", key: "openings" },
    { header: "Job Status", key: "jobStatus", render: v => <StatusBadge status={v} /> },
    { header: "Assignment", key: "assignmentStatus", render: v => <StatusBadge status={v} /> },
    { header: "Candidates", key: "totalCandidates" },
    { header: "Assigned To", key: "assignedRecruiters", render: ids => {
      if (!ids || ids.length === 0) return <span style={{ color: "#9ca3af", fontSize: 12 }}>Unassigned</span>;
      return ids.map(id => {
        const r = MOCK_RECRUITERS.find(r => r.id === id);
        return <div key={id} style={{ fontSize: 11 }}>{r?.name || id}</div>;
      });
    }},
    { header: "", key: "id", width: 130, render: (_, row) => (
      <div style={{ display: "flex", gap: 6 }}>
        <Btn size="sm" variant="ghost" icon={<Eye size={14} />} onClick={e => { e.stopPropagation(); setDetailJob(row); }}>View</Btn>
        {canAssign && (
          <Btn size="sm" variant="secondary" icon={<UserPlus size={13} />} onClick={e => { e.stopPropagation(); setAssignOpen(row); setAssignIds(row.assignedRecruiters || []); }}>Assign</Btn>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Jobs"]}
        title={role === 5 ? "My Jobs" : "Job Requests"}
        subtitle="Manage open positions and recruiter assignments"
        action={canCreate ? (
          <Btn icon={<Plus size={16} />} onClick={() => navigate("create-new")}>
            New Job Request
          </Btn>
        ) : null}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Jobs",     value: jobs.length, color: "#1a2535" },
          { label: "Open",           value: jobs.filter(j => j.assignmentStatus === "Open").length, color: "#059669" },
          { label: "Completed",      value: jobs.filter(j => j.assignmentStatus === "Completed").length, color: "#7c3aed" },
          { label: "Total Openings", value: jobs.reduce((s, j) => s + (Number(j.openings) || 0), 0), color: "#f18200" },
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
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>{visibleJobs.length} job{visibleJobs.length !== 1 ? "s" : ""}</div>
        </div>
        <Table columns={columns} data={visibleJobs} onRowClick={row => setDetailJob(row)} />
      </Card>

      {/* Detail Modal */}
      <Modal open={!!detailJob} onClose={() => setDetailJob(null)} title={detailJob?.title || "Job Details"} width={640}
        footer={<Btn variant="secondary" onClick={() => setDetailJob(null)}>Close</Btn>}>
        {detailJob && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <StatusBadge status={detailJob.jobStatus} />
              <StatusBadge status={detailJob.assignmentStatus} />
              <span style={{ fontSize: 12, background: "#f3f4f6", padding: "2px 9px", borderRadius: 12, color: "#374151", fontWeight: 500 }}>{detailJob.positionType}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <DetailRow label="Job ID" value={detailJob.id} />
              <DetailRow label="Client" value={detailJob.client} />
              <DetailRow label="Business Unit" value={detailJob.businessUnit} />
              <DetailRow label="Company / Dept" value={detailJob.company} />
              <DetailRow label="Bill Rate" value={`$${detailJob.billRate}/hr`} />
              <DetailRow label="Pay Rate" value={`$${detailJob.payRate}/hr`} />
              <DetailRow label="Vacancies" value={detailJob.openings} />
              <DetailRow label="Total Candidates" value={detailJob.totalCandidates} />
              {detailJob.city && <DetailRow label="City" value={detailJob.city} />}
              {detailJob.country && <DetailRow label="Country" value={detailJob.country} />}
              {detailJob.experienceLevel && <DetailRow label="Experience Level" value={detailJob.experienceLevel} />}
              <DetailRow label="Created" value={detailJob.createdDate} />
            </div>
            {detailJob.skills?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>SKILLS REQUIRED</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {detailJob.skills.map(s => <span key={s} style={{ background: "#f3f4f6", padding: "3px 10px", borderRadius: 20, fontSize: 12, color: "#374151" }}>{s}</span>)}
                </div>
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>JOB DESCRIPTION</div>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{detailJob.description}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Recruiter Modal */}
      <Modal open={!!assignOpen} onClose={() => { setAssignOpen(null); setAssignIds([]); }}
        title={`Assign Recruiter — ${assignOpen?.title || ""}`} width={420}
        footer={<><Btn variant="secondary" onClick={() => { setAssignOpen(null); setAssignIds([]); }}>Cancel</Btn><Btn onClick={handleAssign}>Confirm Assignment</Btn></>}>
        {assignOpen && (
          <div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Select recruiters for <strong>{assignOpen.client}</strong> — <strong>{assignOpen.title}</strong>.</p>
            {MOCK_RECRUITERS.map(r => (
              <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 8, cursor: "pointer", background: assignIds.includes(r.id) ? "#fff7ed" : "#fff" }}>
                <input type="checkbox" checked={assignIds.includes(r.id)}
                  onChange={e => setAssignIds(ids => e.target.checked ? [...ids, r.id] : ids.filter(i => i !== r.id))}
                  style={{ accentColor: "#f18200" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{r.role} · {r.email}</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
