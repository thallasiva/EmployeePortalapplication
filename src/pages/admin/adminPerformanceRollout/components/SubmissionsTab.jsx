import React, { useState, useEffect, useCallback } from "react";
import { Users, Clock, CheckCircle2, Search, Check, ClipboardCheck } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import PageTabs from "../../../../components/PageTabs";
import { getAllAppraisals } from "../../../../api/appraisal.api";
import { BRAND } from "../constants";
import { fmtDate } from "../utils/dateUtils";
import { AppraisalBadge } from "./Badges";
import WorkflowModal from "./WorkflowModal";
const SubmissionsTab = React.memo(function SubmissionsTab({ cycles }) {
  const [cycleId, setCycleId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!cycles.length) return;
    const active = cycles.find((c) => c.status === "active");
    setCycleId((active || cycles[0]).cycle_id);
  }, [cycles]);
  const refresh = useCallback(async () => {
    if (!cycleId) return;
    setLoading(true);
    setError("");
    try {
      setData(await getAllAppraisals({ cycle_id: cycleId }));
    } catch (e) {
      setData(null);
      setError(e?.response?.data?.message || "Unable to load appraisal submissions.");
    } finally {
      setLoading(false);
    }
  }, [cycleId]);
  useEffect(() => { refresh(); }, [refresh]);
  const appraisals = data?.appraisals || [];
  const notSub = data?.notSubmitted || [];
  const all = [...appraisals, ...notSub.map((e) => ({ ...e, appraisal_status: "draft" }))];
  const filtered = all.filter((r) => {
    const nm = (r.employee_name || "").toLowerCase().includes(search.toLowerCase());
    const sm = statusFilter === "all" || (r.appraisal_status || "draft") === statusFilter;
    return nm && sm;
  });
  const counts = {
    all: all.length,
    draft: all.filter((r) => !r.appraisal_status || r.appraisal_status === "draft").length,
    submitted: all.filter((r) => r.appraisal_status === "submitted").length,
    manager_review: all.filter((r) => r.appraisal_status === "manager_review").length,
    hr_review: all.filter((r) => r.appraisal_status === "hr_review").length,
    changes_requested: all.filter((r) => r.appraisal_status === "changes_requested").length,
    shared: all.filter((r) => r.appraisal_status === "shared").length,
    acknowledged: all.filter((r) => r.appraisal_status === "acknowledged").length,
    closed: all.filter((r) => r.appraisal_status === "closed").length
  };
  return (
    <div>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" })}>
        <span className={cssClass({ fontSize: 13, fontWeight: 600, color: "#475569" })}>Cycle:</span>
        {cycles.map((c) => (
          <button key={c.cycle_id} onClick={() => setCycleId(c.cycle_id)}
            className={cssClass({ padding: "5px 14px", border: `1.5px solid ${cycleId === c.cycle_id ? BRAND : "#e2e8f0"}`, borderRadius: 999, background: cycleId === c.cycle_id ? "#fff7ed" : "#fff", color: cycleId === c.cycle_id ? BRAND : "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600 })}>
            {c.fy_label}
            {c.status === "active" && <span className={cssClass({ marginLeft: 5, fontSize: 10, background: "#16a34a", color: "#fff", borderRadius: 999, padding: "1px 5px" })}>Active</span>}
          </button>
        ))}
      </div>
      <div className={cssClass({ marginBottom: 16 })}>
        <PageTabs
          tabs={[
            { id: "all", label: "All", icon: Users, count: counts.all },
            { id: "draft", label: "Not Submitted", icon: Clock, count: counts.draft },
            { id: "submitted", label: "Submitted", icon: CheckCircle2, count: counts.submitted },
            { id: "manager_review", label: "Manager Review", icon: Clock, count: counts.manager_review },
            { id: "hr_review", label: "HR Review", icon: CheckCircle2, count: counts.hr_review },
            { id: "changes_requested", label: "Changes Requested", icon: Clock, count: counts.changes_requested },
            { id: "shared", label: "Shared", icon: CheckCircle2, count: counts.shared },
            { id: "acknowledged", label: "Acknowledged", icon: CheckCircle2, count: counts.acknowledged },
            { id: "closed", label: "Closed", icon: CheckCircle2, count: counts.closed },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          label="Appraisal submission statuses"
        />
      </div>
      <div className={cssClass({ position: "relative", marginBottom: 14 })}>
        <Search size={14} className={cssClass({ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" })} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…"
          className={cssClass({ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" })} />
      </div>
      {error && <p role="alert" className={cssClass({ color: "#b91c1c", fontSize: 13, margin: "0 0 12px" })}>{error}</p>}
      {loading
        ? <div className={cssClass({ textAlign: "center", padding: 40, color: "#94a3b8" })}>Loading…</div>
        : filtered.length === 0
          ? <div className={cssClass({ textAlign: "center", padding: 40, color: "#94a3b8" })}>No appraisals found.</div>
          : (
            <div className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" })}>
              <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
                <thead>
                  <tr className={cssClass({ background: "#f8fafc" })}>
                    {["Employee", "Designation", "Department", "Status", "Submitted", "Manager", "Mgr Rated", "Workflow"].map((h) => (
                      <th key={h} className={cssClass({ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" })}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i} className={cssClass({ borderBottom: "1px solid #f1f5f9" })}>
                      <td className={cssClass({ padding: "9px 12px", fontWeight: 600, color: "#1e293b" })}>
                        {row.employee_name || `${row.first_name || ""} ${row.last_name || ""}`.trim()}
                        <div className={cssClass({ fontSize: 11, color: "#64748b", fontWeight: 400 })}>{row.emp_code || ""}</div>
                      </td>
                      <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.emp_job_title || "—"}</td>
                      <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.department_name || "—"}</td>
                      <td className={cssClass({ padding: "9px 12px" })}><AppraisalBadge status={row.appraisal_status || "draft"} /></td>
                      <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{fmtDate(row.submitted_at)}</td>
                      <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.manager_name || "—"}</td>
                      <td className={cssClass({ padding: "9px 12px" })}>
                        {row.manager_rated_at
                          ? <span className={cssClass({ color: "#16a34a", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 })}><Check size={12} /> {fmtDate(row.manager_rated_at)}</span>
                          : <span className={cssClass({ color: "#94a3b8" })}>—</span>}
                      </td>
                      <td className={cssClass({ padding: "9px 12px" })}>
                        {row.appraisal_id && ["hr_review", "shared", "acknowledged", "closed"].includes(row.appraisal_status) ? (
                          <button type="button" onClick={() => setSelectedAppraisal(row)}
                            className={cssClass({ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 9px", border: `1px solid ${BRAND}`, borderRadius: 7, color: BRAND, background: "#fff", cursor: "pointer", whiteSpace: "nowrap" })}>
                            <ClipboardCheck size={13} /> Review
                          </button>
                        ) : <span className={cssClass({ color: "#94a3b8" })}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      }
      {selectedAppraisal && (
        <WorkflowModal
          appraisal={selectedAppraisal}
          onClose={() => setSelectedAppraisal(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  );
});
export default SubmissionsTab;
