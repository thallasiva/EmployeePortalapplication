import React from "react";
import { Lock, CheckCircle2, Clock, Users, RefreshCw } from "lucide-react";
import { cssClass } from "../../../utils/classStyles";
import ManagerTabs from "../ManagerTabs";
import { BRAND } from "./constants";
import { fmtDate } from "./utils";
import { usePerformanceAppraisal } from "./hooks/usePerformanceAppraisal";
import MemberCard from "./components/MemberCard";

function PerformanceApprisial() {
  const { loading, cycle, team, submitted, pending, isActive, load } = usePerformanceAppraisal();

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: 24 })}>
      <ManagerTabs />

      <div className={cssClass({ marginBottom: 20 })}>
        <h1 className={cssClass({ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" })}>
          Performance Appraisal
        </h1>
        <p className={cssClass({ fontSize: 13, color: "#64748b", margin: 0 })}>
          {cycle ? `${cycle.fy_label} · Deadline: ${fmtDate(cycle.deadline)}` : "Loading cycle…"}
        </p>
      </div>

      {!loading && (!cycle || !isActive) && (
        <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 40, textAlign: "center" })}>
          <Lock size={48} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
          <h2 className={cssClass({ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 8px" })}>
            No Active Appraisal Cycle
          </h2>
          <p className={cssClass({ fontSize: 13, color: "#94a3b8", margin: 0 })}>
            HR hasn't rolled out a performance appraisal yet.<br />
            You'll see your team's submissions here once it's active.
          </p>
        </div>
      )}

      {loading ? (
        <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8" })}>
          Loading team appraisals…
        </div>
      ) : isActive && (
        <>
          <div className={cssClass({ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" })}>
            {[
              { label: "Team Size", value: team.length, color: BRAND },
              { label: "Submitted", value: submitted.length, color: "#22c55e" },
              { label: "Pending", value: pending.length, color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label} className={cssClass({ background: "#fff", border: "1px solid #e2e8f0",
                borderRadius: 10, padding: "12px 20px", textAlign: "center", minWidth: 110,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)" })}>
                <p className={cssClass({ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 })}>{s.value}</p>
                <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: 0 })}>{s.label}</p>
              </div>
            ))}
            <button onClick={load} className={cssClass({ marginLeft: "auto", height: 48, padding: "0 16px",
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13,
              color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 })}>
              <RefreshCw size={13} />Refresh
            </button>
          </div>

          {submitted.length > 0 && (
            <>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 })}>
                <CheckCircle2 size={16} className={cssClass({ color: "#22c55e" })} />
                <p className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 })}>
                  Submitted ({submitted.length}) — Click to review & add your ratings
                </p>
              </div>
              {submitted.map((m) => (
                <MemberCard key={m.employee_id} member={m} appraisalId={m.appraisal_id} onSaved={load} />
              ))}
            </>
          )}

          {pending.length > 0 && (
            <>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 10px" })}>
                <Clock size={16} className={cssClass({ color: "#f59e0b" })} />
                <p className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 })}>
                  Awaiting Submission ({pending.length})
                </p>
              </div>
              {pending.map((m) => (
                <MemberCard key={m.employee_id} member={m} appraisalId={m.appraisal_id} onSaved={load} />
              ))}
            </>
          )}

          {team.length === 0 && (
            <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
              padding: 48, textAlign: "center" })}>
              <Users size={48} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
              <p className={cssClass({ fontSize: 14, color: "#94a3b8" })}>
                No team members found. Ensure employees have you set as their reporting manager.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default React.memo(PerformanceApprisial);
