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

const STEP_STATUS_CLS = {
  Pending:       "bg-red-100 text-red-600",
  "In Progress": "bg-amber-100 text-amber-600",
  Completed:     "bg-emerald-100 text-emerald-600",
  Nominated:     "bg-blue-100 text-blue-700",
  Confirmed:     "bg-emerald-100 text-emerald-600",
  Submitted:     "bg-violet-100 text-violet-600",
  Approved:      "bg-emerald-100 text-emerald-600",
};

function fmt(v) {
  if (!v && v !== 0) return "—";
  return "₹" + Number(v).toLocaleString("en-IN");
}

function StepBadge({ value, boolean: isBool }) {
  if (isBool) {
    return value
      ? <span className="bg-emerald-100 text-emerald-600 px-2.5 py-[2px] rounded-full text-[11px] font-bold">✓ Done</span>
      : <span className="bg-red-100 text-red-600 px-2.5 py-[2px] rounded-full text-[11px] font-bold">Pending</span>;
  }
  const cls = STEP_STATUS_CLS[value] ?? "bg-gray-100 text-gray-500";
  return <span className={`px-2.5 py-[2px] rounded-full text-[11px] font-bold ${cls}`}>{value || "Pending"}</span>;
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
  const isTL    = role === 3 || role === 4;   // Reporting Manager + Recruiter Team Lead
  const canEdit = isAdmin || isTL;

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listOnboarding({ limit: 100 });
      setRecords(data ?? []);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load onboarding records"));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  async function openDetail(row) {
    setActiveTab(0);
    setDetailLoading(true);
    setDetail(row);
    try {
      const full = await getOnboarding(row.onboarding_id);
      setDetail(full);
    } catch { /* keep list row data */ }
    finally { setDetailLoading(false); }
  }

  async function handleUpdateTask(onboardingId, taskName, taskValue) {
    setUpdating(true);
    try {
      const updated = await updateOnboardingTask(onboardingId, taskName, taskValue);
      setDetail(updated);
      setRecords(rs => rs.map(r => r.onboarding_id === onboardingId ? { ...r, [taskName]: taskValue } : r));
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to update task"));
    } finally { setUpdating(false); }
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
    } finally { setUpdating(false); }
  }

  const visible = records.filter(r => {
    const q = search.toLowerCase();
    return !q || (r.candidate_name||"").toLowerCase().includes(q) || (r.candidate_code||"").toLowerCase().includes(q);
  });

  const completedSteps = detail
    ? FORMALITY_STEPS.filter(s => {
        const v = detail[s.key];
        return v === true || v === 1 || v === "Completed" || v === "Confirmed" || v === "Approved";
      }).length
    : 0;
  const totalSteps = FORMALITY_STEPS.length;

  const columns = [
    { header: "ID",             key: "onboarding_id", width: 60 },
    { header: "Candidate",      key: "candidate_name", render: (v, row) => (
      <div>
        <div className="font-semibold text-gray-900">{v}</div>
        <div className="text-[11px] text-gray-500">{row.job_title}</div>
      </div>
    )},
    { header: "Effective Date", key: "effective_date", render: v => v?.slice(0,10) || "—" },
    { header: "Joining Form.",  key: "joining_formalities", render: v => <StepBadge value={v} /> },
    { header: "PF Declaration", key: "pf_declaration", render: v => <StepBadge value={v} /> },
    { header: "HR Verified",    key: "hr_verified", render: v => <StepBadge value={v} boolean /> },
    { header: "Status",         key: "current_status", render: v => (
      <span className={`px-2.5 py-[2px] rounded-full text-[11px] font-bold ${
        v === "Completed" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
      }`}>{v}</span>
    )},
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

      <div className="flex gap-2.5 mb-5 flex-wrap">
        {[
          { label:"Total",       count:records.length,                                              colorCls:"text-gray-500",   bgCls:"bg-gray-100" },
          { label:"In Progress", count:records.filter(r=>r.current_status==="In Progress").length,  colorCls:"text-amber-600",  bgCls:"bg-amber-100" },
          { label:"Completed",   count:records.filter(r=>r.current_status==="Completed").length,    colorCls:"text-emerald-600",bgCls:"bg-emerald-100" },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full ${s.bgCls}`}>
            <span className={`text-base font-bold ${s.colorCls}`}>{s.count}</span>
            <span className={`text-[12px] font-medium ${s.colorCls}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <Card className="!p-0">
        <div className="flex items-center gap-3 px-[18px] py-3.5 border-b border-gray-100">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by candidate name or code…" />
          <div className="ml-auto text-[12px] text-gray-500">
            {loading ? "Loading…" : `${visible.length} record${visible.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        {loading
          ? <div className="flex items-center justify-center gap-2.5 py-12 text-gray-500"><Loader2 size={20} /> Loading…</div>
          : <Table columns={columns} data={visible} onRowClick={r => openDetail(r)} />
        }
      </Card>

      {/* ── Detail Modal ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)}
        title={`Onboarding — ${detail?.candidate_name || ""}`} width={640}
        footer={
          <div className="flex items-center gap-2.5 w-full">
            {canEdit && detail?.current_status !== "Completed" && !detail?.finalized_at && (
              <Btn icon={<CheckSquare size={14} />} onClick={() => handleFinalize(detail.onboarding_id)} disabled={updating}>
                {updating ? "…" : "Finalize Onboarding"}
              </Btn>
            )}
            <div className="flex-1" />
            <Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>
          </div>
        }
      >
        {detail && (
          <div>
            {detailLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-[13px] mb-3">
                <Loader2 size={14} /> Loading details…
              </div>
            )}

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[12px] text-gray-500 mb-1.5">
                <span>Onboarding Progress</span>
                <span className={`font-bold ${completedSteps === totalSteps ? "text-emerald-600" : "text-[#f18200]"}`}>
                  {completedSteps}/{totalSteps} steps
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-400 ${completedSteps === totalSteps ? "bg-emerald-500" : "bg-[#f18200]"}`}
                  style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {activeTab === 0 && (
              <div className="mt-3.5">
                {FORMALITY_STEPS.map((step, i) => {
                  const value = detail[step.key];
                  const isDone = value === true || value === 1 || value === "Completed" || value === "Confirmed" || value === "Approved";
                  return (
                    <div key={step.key}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-lg mb-2 border ${
                        isDone ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                      }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                          isDone ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                        }`}>
                          {isDone ? "✓" : i + 1}
                        </div>
                        <span className="text-[13px] font-semibold text-gray-900">{step.label}</span>
                      </div>
                      {canEdit && (
                        step.boolean ? (
                          <button
                            onClick={() => handleUpdateTask(detail.onboarding_id, step.key, value ? "false" : "true")}
                            disabled={updating}
                            className={`cursor-pointer px-3 py-[3px] rounded-full border-0 text-[11px] font-bold ${
                              (value === true || value === 1) ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                            }`}
                          >
                            {(value === true || value === 1) ? "✓ Done" : "Pending"}
                          </button>
                        ) : (
                          <select
                            value={value || "Pending"}
                            onChange={e => handleUpdateTask(detail.onboarding_id, step.key, e.target.value)}
                            disabled={updating}
                            className="text-[12px] font-semibold border border-gray-200 rounded-full px-2.5 py-[2px] bg-transparent cursor-pointer outline-none"
                            style={{ fontFamily: "inherit" }}
                          >
                            {(ENUM_OPTS[step.key] || ["Pending","In Progress","Completed"]).map(s => <option key={s}>{s}</option>)}
                          </select>
                        )
                      )}
                      {!canEdit && <StepBadge value={step.boolean ? (value === true || value === 1) : value} boolean={step.boolean} />}
                    </div>
                  );
                })}
                <div className="mt-3.5">
                  <Field label="Effective Date">
                    <Input type="date" value={detail.effective_date?.slice(0,10) || ""}
                      onChange={e => canEdit && handleUpdateTask(detail.onboarding_id, "effective_date", e.target.value)}
                      disabled={!canEdit} />
                  </Field>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="mt-3.5">
                <div className="grid grid-cols-2 gap-x-5 mb-3.5">
                  <DetailRow label="Candidate"       value={detail.candidate_name} />
                  <DetailRow label="Candidate Code"  value={detail.candidate_code} />
                  <DetailRow label="Position"        value={detail.job_title} />
                  <DetailRow label="Designation"     value={detail.designation} />
                  <DetailRow label="Date of Joining" value={detail.date_of_joining?.slice(0,10) || "—"} />
                  <DetailRow label="Effective Date"  value={detail.effective_date?.slice(0,10) || "—"} />
                </div>
                {detail.ctc ? (
                  <div className="px-3.5 py-3.5 bg-[#fff7ed] rounded-lg border-l-[3px] border-[#f18200]">
                    <div className="text-[12px] font-bold text-[#92400e] mb-2.5">OFFER DETAILS</div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-[13px] text-gray-500">Cost to Company</span>
                      <span className="text-[13px] font-bold text-[#f18200]">{fmt(detail.ctc)}</span>
                    </div>
                    {detail.ctc_in_words && (
                      <div className="mt-2 text-[12px] text-amber-900 italic">
                        <strong>In Words:</strong> {detail.ctc_in_words}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-[13px]">
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
