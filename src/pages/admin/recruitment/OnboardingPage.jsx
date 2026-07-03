import React, { useState, useEffect, useCallback } from "react";
import { Eye, CheckSquare, Loader2, RefreshCw } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input,
  Table, Modal, SearchBar, DetailRow, Tabs,
} from "./shared";
import {
  listOnboarding, getOnboarding, updateOnboardingTask, finalizeOnboarding, getErrorMessage,
} from "../../../api/recruitment.api";
import { successToast, errorToast } from "../../../utils/ToastControllers";

// Task steps and their DB column name mapping
const FORMALITY_STEPS = [
  { key: "employee_info_submitted", label: "Employee Info Submitted",   boolean: true },
  { key: "photo_uploaded",          label: "Photo Uploaded",            boolean: true },
  { key: "joining_formalities",     label: "Joining Formalities",       boolean: false },
  { key: "team_life_insurance",     label: "Team Life Insurance",       boolean: false },
  { key: "gratuity_nomination",     label: "Gratuity Nomination",       boolean: false },
  { key: "insurance_nomination",    label: "Insurance Nomination",      boolean: false },
  { key: "pf_declaration",          label: "PF Declaration",            boolean: false },
  { key: "hr_verified",             label: "HR Verification",           boolean: true },
];

const ENUM_OPTS = {
  joining_formalities:  ["Pending","In Progress","Completed"],
  team_life_insurance:  ["Pending","Nominated","Confirmed"],
  gratuity_nomination:  ["Pending","Submitted","Approved"],
  insurance_nomination: ["Pending","Submitted","Confirmed"],
  pf_declaration:       ["Pending","Submitted","Approved"],
};

function fmt(v) {
  if (!v && v !== 0) return "—";
  return "₹" + Number(v).toLocaleString("en-IN");
}

function StepBadge({ value, boolean: isBool }) {
  if (isBool) {
    return value
      ? <span style={{ background:"#d1fae5", color:"#059669", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>✓ Done</span>
      : <span style={{ background:"#fee2e2", color:"#dc2626", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>Pending</span>;
  }
  const colors = { Pending:{ bg:"#fee2e2", color:"#dc2626" }, "In Progress":{ bg:"#fef3c7", color:"#d97706" },
    Completed:{ bg:"#d1fae5", color:"#059669" }, Nominated:{ bg:"#dbeafe", color:"#1d4ed8" },
    Confirmed:{ bg:"#d1fae5", color:"#059669" }, Submitted:{ bg:"#ede9fe", color:"#7c3aed" }, Approved:{ bg:"#d1fae5", color:"#059669" } };
  const c = colors[value] || { bg:"#f3f4f6", color:"#6b7280" };
  return <span style={{ background:c.bg, color:c.color, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{value || "Pending"}</span>;
}

export default function OnboardingPage({ role }) {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [detail, setDetail]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [updating, setUpdating] = useState(false);

  const isAdmin = role === 1;
  const isTL    = role === 4;
  const canEdit = isAdmin || isTL;

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listOnboarding({ limit: 100 });
      setRecords(data ?? []);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load onboarding records"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  async function openDetail(row) {
    setActiveTab(0);
    setDetailLoading(true);
    setDetail(row);
    try {
      const full = await getOnboarding(row.onboarding_id);
      setDetail(full);
    } catch {
      // keep list row data
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleUpdateTask(onboardingId, taskName, taskValue) {
    setUpdating(true);
    try {
      const updated = await updateOnboardingTask(onboardingId, taskName, taskValue);
      setDetail(updated);
      // also update list row
      setRecords(rs => rs.map(r => r.onboarding_id === onboardingId ? { ...r, [taskName]: taskValue } : r));
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to update task"));
    } finally {
      setUpdating(false);
    }
  }

  async function handleFinalize(onboardingId) {
    setUpdating(true);
    try {
      const updated = await finalizeOnboarding(onboardingId);
      successToast("Onboarding finalized");
      setDetail(updated);
      loadRecords();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to finalize onboarding"));
    } finally {
      setUpdating(false);
    }
  }

  const visible = records.filter(r => {
    const q = search.toLowerCase();
    return !q || (r.candidate_name||"").toLowerCase().includes(q) || (r.candidate_code||"").toLowerCase().includes(q);
  });

  // Compute progress for detail
  const completedSteps = detail
    ? FORMALITY_STEPS.filter(s => {
        const v = detail[s.key];
        return v === true || v === 1 || v === "Completed" || v === "Confirmed" || v === "Approved";
      }).length
    : 0;
  const totalSteps = FORMALITY_STEPS.length;

  const columns = [
    { header: "ID",              key: "onboarding_id", width: 60 },
    { header: "Candidate",       key: "candidate_name", render: (v, row) => (
      <div>
        <div style={{ fontWeight:600, color:"#111827" }}>{v}</div>
        <div style={{ fontSize:11, color:"#6b7280" }}>{row.job_title}</div>
      </div>
    )},
    { header: "Effective Date",  key: "effective_date", render: v => v?.slice(0,10) || "—" },
    { header: "Joining Form.",   key: "joining_formalities", render: v => <StepBadge value={v} /> },
    { header: "PF Declaration",  key: "pf_declaration", render: v => <StepBadge value={v} /> },
    { header: "HR Verified",     key: "hr_verified", render: v => <StepBadge value={v} boolean /> },
    { header: "Status",          key: "current_status", render: v => {
      const c = v === "Completed" ? { bg:"#d1fae5", color:"#059669" } : { bg:"#fef3c7", color:"#d97706" };
      return <span style={{ background:c.bg, color:c.color, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{v}</span>;
    }},
    { header: "", key: "onboarding_id", width: 70, render: (_, row) => (
      <Btn size="sm" variant="ghost" icon={<Eye size={13} />}
        onClick={e => { e.stopPropagation(); openDetail(row); }}>View</Btn>
    )},
  ];

  const tabs = ["Joining Formalities", "Offer Summary"];

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard","Onboarding"]}
        title="Onboarding"
        subtitle="Track joining formalities and finalize employee onboarding"
        action={<Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadRecords} />}
      />

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { label:"Total",       count:records.length,                                         color:"#6b7280", bg:"#f3f4f6" },
          { label:"In Progress", count:records.filter(r=>r.current_status==="In Progress").length, color:"#d97706", bg:"#fef3c7" },
          { label:"Completed",   count:records.filter(r=>r.current_status==="Completed").length,   color:"#059669", bg:"#d1fae5" },
        ].map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:20, background:s.bg }}>
            <span style={{ fontSize:16, fontWeight:700, color:s.color }}>{s.count}</span>
            <span style={{ fontSize:12, color:s.color, fontWeight:500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <Card style={{ padding:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", borderBottom:"1px solid #f0f0f0" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by candidate name or code…" />
          <div style={{ marginLeft:"auto", fontSize:12, color:"#6b7280" }}>
            {loading ? "Loading…" : `${visible.length} record${visible.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        {loading
          ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:48, color:"#6b7280" }}>
              <Loader2 size={20} style={{ animation:"spin 1s linear infinite" }} /> Loading…
            </div>
          : <Table columns={columns} data={visible} onRowClick={r => openDetail(r)} />
        }
      </Card>

      {/* ── Detail Modal ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)}
        title={`Onboarding — ${detail?.candidate_name || ""}`} width={640}
        footer={
          <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%" }}>
            {canEdit && detail?.current_status !== "Completed" && !detail?.finalized_at && (
              <Btn icon={<CheckSquare size={14} />} onClick={() => handleFinalize(detail.onboarding_id)} disabled={updating}>
                {updating ? "…" : "Finalize Onboarding"}
              </Btn>
            )}
            <div style={{ flex:1 }} />
            <Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>
          </div>
        }
      >
        {detail && (
          <div>
            {detailLoading && (
              <div style={{ display:"flex", alignItems:"center", gap:8, color:"#6b7280", fontSize:13, marginBottom:12 }}>
                <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> Loading details…
              </div>
            )}

            {/* Progress bar */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#6b7280", marginBottom:6 }}>
                <span>Onboarding Progress</span>
                <span style={{ fontWeight:700, color: completedSteps === totalSteps ? "#059669" : "#f18200" }}>
                  {completedSteps}/{totalSteps} steps
                </span>
              </div>
              <div style={{ height:8, background:"#f3f4f6", borderRadius:8, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(completedSteps/totalSteps)*100}%`, background: completedSteps === totalSteps ? "#059669" : "#f18200", transition:"width 0.4s", borderRadius:8 }} />
              </div>
            </div>

            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {activeTab === 0 && (
              <div style={{ marginTop:14 }}>
                {FORMALITY_STEPS.map((step, i) => {
                  const value = detail[step.key];
                  const isDone = value === true || value === 1 || value === "Completed" || value === "Confirmed" || value === "Approved";
                  return (
                    <div key={step.key} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"12px 14px", borderRadius:8, marginBottom:8,
                      background: isDone ? "#f0fdf4" : "#fafafa",
                      border: `1px solid ${isDone ? "#bbf7d0" : "#e5e7eb"}`,
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:28, height:28, borderRadius:"50%", background: isDone ? "#059669" : "#e5e7eb", color: isDone ? "#fff" : "#9ca3af", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700 }}>
                          {isDone ? "✓" : i+1}
                        </div>
                        <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{step.label}</span>
                      </div>
                      {canEdit && (
                        step.boolean ? (
                          <button
                            onClick={() => handleUpdateTask(detail.onboarding_id, step.key, value ? "false" : "true")}
                            disabled={updating}
                            style={{ cursor:"pointer", padding:"3px 12px", borderRadius:20, border:"none", fontSize:11, fontWeight:700,
                              background: (value === true || value === 1) ? "#d1fae5" : "#fee2e2",
                              color:      (value === true || value === 1) ? "#059669" : "#dc2626" }}
                          >
                            {(value === true || value === 1) ? "✓ Done" : "Pending"}
                          </button>
                        ) : (
                          <select
                            value={value || "Pending"}
                            onChange={e => handleUpdateTask(detail.onboarding_id, step.key, e.target.value)}
                            disabled={updating}
                            style={{ fontSize:12, fontWeight:600, border:"1px solid #e5e7eb", borderRadius:20, padding:"2px 10px", background:"transparent", cursor:"pointer" }}
                          >
                            {(ENUM_OPTS[step.key] || ["Pending","In Progress","Completed"]).map(s => <option key={s}>{s}</option>)}
                          </select>
                        )
                      )}
                      {!canEdit && <StepBadge value={step.boolean ? (value === true || value === 1) : value} boolean={step.boolean} />}
                    </div>
                  );
                })}

                <div style={{ marginTop:14 }}>
                  <Field label="Effective Date">
                    <Input type="date" value={detail.effective_date?.slice(0,10) || ""}
                      onChange={e => canEdit && handleUpdateTask(detail.onboarding_id, "effective_date", e.target.value)}
                      disabled={!canEdit} />
                  </Field>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div style={{ marginTop:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px", marginBottom:14 }}>
                  <DetailRow label="Candidate"      value={detail.candidate_name} />
                  <DetailRow label="Candidate Code" value={detail.candidate_code} />
                  <DetailRow label="Position"       value={detail.job_title} />
                  <DetailRow label="Designation"    value={detail.designation} />
                  <DetailRow label="Date of Joining" value={detail.date_of_joining?.slice(0,10) || "—"} />
                  <DetailRow label="Effective Date"  value={detail.effective_date?.slice(0,10) || "—"} />
                </div>
                {detail.ctc ? (
                  <div style={{ padding:"14px", background:"#fff7ed", borderRadius:8, borderLeft:"3px solid #f18200" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#92400e", marginBottom:10 }}>OFFER DETAILS</div>
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f3f4f6" }}>
                      <span style={{ fontSize:13, color:"#6b7280" }}>Cost to Company</span>
                      <span style={{ fontSize:13, fontWeight:700, color:"#f18200" }}>{fmt(detail.ctc)}</span>
                    </div>
                    {detail.ctc_in_words && (
                      <div style={{ marginTop:8, fontSize:12, color:"#78350f", fontStyle:"italic" }}>
                        <strong>In Words:</strong> {detail.ctc_in_words}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign:"center", padding:"30px 0", color:"#9ca3af", fontSize:13 }}>
                    No offer data linked to this onboarding record.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
