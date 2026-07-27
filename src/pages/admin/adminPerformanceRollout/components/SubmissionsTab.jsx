import React, { useState, useEffect } from "react";
import { Users, Clock, CheckCircle2, Search } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { getAllAppraisals } from "../../../../api/appraisal.api";
import { BRAND } from "../constants";
import { fmtDate } from "../utils/dateUtils";
import { AppraisalBadge } from "./Badges";

const SubmissionsTab = React.memo(function SubmissionsTab({ cycles }) {
  const [cycleId, setCycleId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!cycles.length) return;
    const active = cycles.find((c) => c.status === "active");
    setCycleId((active || cycles[0]).cycle_id);
  }, [cycles]);

  useEffect(() => {
    if (!cycleId) return;
    setLoading(true);
    getAllAppraisals({ cycle_id: cycleId }).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [cycleId]);

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
    reviewed: all.filter((r) => r.appraisal_status === "reviewed").length
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

      <div className={cssClass({ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" })}>
        {[
          { key: "all", label: "Total", icon: <Users size={13} /> },
          { key: "draft", label: "Draft / New", icon: <Clock size={13} /> },
          { key: "submitted", label: "Submitted", icon: <CheckCircle2 size={13} /> },
          { key: "reviewed", label: "Reviewed", icon: <CheckCircle2 size={13} className={cssClass({ color: BRAND })} /> }
        ].map((s) => (
          <button key={s.key} onClick={() => setStatusFilter(s.key)}
            className={cssClass({ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", border: `1.5px solid ${statusFilter === s.key ? BRAND : "#e2e8f0"}`, borderRadius: 999, background: statusFilter === s.key ? "#fff7ed" : "#fff", color: statusFilter === s.key ? BRAND : "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600 })}>
            {s.icon} {s.label} <span className={cssClass({ fontWeight: 800 })}>{counts[s.key]}</span>
          </button>
        ))}
      </div>

      <div className={cssClass({ position: "relative", marginBottom: 14 })}>
        <Search size={14} className={cssClass({ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" })} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…"
          className={cssClass({ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" })} />
      </div>

      {loading
        ? <div className={cssClass({ textAlign: "center", padding: 40, color: "#94a3b8" })}>Loading…</div>
        : filtered.length === 0
          ? <div className={cssClass({ textAlign: "center", padding: 40, color: "#94a3b8" })}>No appraisals found.</div>
          : (
            <div className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" })}>
              <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
                <thead>
                  <tr className={cssClass({ background: "#f8fafc" })}>
                    {["Employee", "Designation", "Department", "Status", "Submitted", "Manager", "Mgr Rated"].map((h) => (
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
                          ? <span className={cssClass({ color: "#16a34a", fontWeight: 600 })}>✓ {fmtDate(row.manager_rated_at)}</span>
                          : <span className={cssClass({ color: "#94a3b8" })}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      }
    </div>
  );
});

export default SubmissionsTab;
