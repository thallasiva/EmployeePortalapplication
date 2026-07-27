import React from "react";
import { Trash2, Info } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { STATUS_STYLE } from "../constants";
import { delegateStatus } from "../utils";
import EmpSelect from "./EmpSelect";

const WorkflowRow = React.memo(function WorkflowRow({
  wf, entry, employees, myId, onChange, onRemove,
}) {
  const status = delegateStatus(entry?.from, entry?.to);
  const st = status ? STATUS_STYLE[status] : null;
  const delegateName = entry?.delegateId
    ? (() => {
        const emp = employees.find((e) => String(e.employee_id) === String(entry.delegateId));
        return emp ? [emp.first_name, emp.last_name].filter(Boolean).join(" ") : "—";
      })()
    : null;

  return (
    <div
      className={cssClass({
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
        padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12,
      })}
    >
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between" })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 10 })}>
          <div
            className={cssClass({
              width: 36, height: 36, borderRadius: 8, background: wf.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: wf.color, flexShrink: 0,
            })}
          >
            {wf.icon}
          </div>
          <div>
            <p className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 })}>{wf.label}</p>
            <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: 0 })}>{wf.desc}</p>
          </div>
        </div>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
          {st && (
            <span
              className={cssClass({
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 600, padding: "3px 8px",
                borderRadius: 999, background: st.bg, color: st.color,
              })}
            >
              {st.icon} {st.label}
            </span>
          )}
          {entry?.delegateId && (
            <button
              type="button"
              onClick={() => onRemove(wf.id)}
              className={cssClass({
                background: "none", border: "none", cursor: "pointer",
                color: "#ef4444", padding: 4, display: "flex",
              })}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 })}>
        <div>
          <label className={cssClass({ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 })}>Delegate To</label>
          <EmpSelect value={entry?.delegateId || ""} onChange={(v) => onChange(wf.id, "delegateId", v)} employees={employees} excludeId={myId} />
        </div>
        <div>
          <label className={cssClass({ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 })}>From Date</label>
          <input
            type="date"
            value={entry?.from || ""}
            disabled={!entry?.delegateId}
            onChange={(e) => onChange(wf.id, "from", e.target.value)}
            className={cssClass({
              width: "100%", height: 36, padding: "0 10px", border: "1px solid #e2e8f0",
              borderRadius: 8, fontSize: 13, outline: "none",
              background: !entry?.delegateId ? "#f8fafc" : "#fff",
              color: !entry?.delegateId ? "#cbd5e1" : "#1e293b",
            })}
          />
        </div>
        <div>
          <label className={cssClass({ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 })}>To Date</label>
          <input
            type="date"
            value={entry?.to || ""}
            disabled={!entry?.delegateId}
            min={entry?.from || undefined}
            onChange={(e) => onChange(wf.id, "to", e.target.value)}
            className={cssClass({
              width: "100%", height: 36, padding: "0 10px", border: "1px solid #e2e8f0",
              borderRadius: 8, fontSize: 13, outline: "none",
              background: !entry?.delegateId ? "#f8fafc" : "#fff",
              color: !entry?.delegateId ? "#cbd5e1" : "#1e293b",
            })}
          />
        </div>
      </div>

      {entry?.delegateId && (
        <div
          className={cssClass({
            background: "#f8fafc", borderRadius: 8, padding: "8px 12px",
            fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6,
          })}
        >
          <Info size={13} className={cssClass({ color: wf.color, flexShrink: 0 })} />
          <span>
            <strong className={cssClass({ color: "#1e293b" })}>{delegateName}</strong> will handle{" "}
            <em>{wf.label}</em> approvals on your behalf
            {entry.from && entry.to
              ? ` from ${entry.from} to ${entry.to}.`
              : " (dates not set — set a date range to activate)."}
          </span>
        </div>
      )}
    </div>
  );
});

export default WorkflowRow;
