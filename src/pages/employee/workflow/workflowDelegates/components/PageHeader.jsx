import React from "react";
import { GitBranch, CheckCircle2 } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { WORKFLOWS } from "../constants";

const PageHeader = React.memo(function PageHeader({ activeDelegates }) {
  return (
    <div
      className={cssClass({
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16, marginBottom: 24,
      })}
    >
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 12 })}>
        <div
          className={cssClass({
            width: 44, height: 44, borderRadius: 10,
            background: "#fff7ed", display: "flex",
            alignItems: "center", justifyContent: "center",
          })}
        >
          <GitBranch size={22} className={cssClass({ color: "#f18200" })} />
        </div>
        <div>
          <h1 className={cssClass({ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 })}>
            Workflow Delegates
          </h1>
          <p className={cssClass({ fontSize: 13, color: "#64748b", margin: 0 })}>
            Assign who handles approvals on your behalf when you're away
          </p>
        </div>
      </div>
      <div className={cssClass({ display: "flex", gap: 8, flexWrap: "wrap" })}>
        {activeDelegates > 0 && (
          <span
            className={cssClass({
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
              borderRadius: 999, fontSize: 12, fontWeight: 600, padding: "4px 10px",
            })}
          >
            <CheckCircle2 size={12} /> {activeDelegates} Active
          </span>
        )}
        <span
          className={cssClass({
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "#f1f5f9", color: "#475569",
            borderRadius: 999, fontSize: 12, padding: "4px 10px",
          })}
        >
          <GitBranch size={12} /> {WORKFLOWS.length} Workflows
        </span>
      </div>
    </div>
  );
});

export default PageHeader;
