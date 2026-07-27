import React from "react";
import { Shield, X } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { fmtDate } from "../utils/formatters";
import { SectionHead, Input, Btn } from "./SharedUI";
import ManagerSelect from "./ManagerSelect";

const DelegationTab = React.memo(function DelegationTab({
  managers,
  delForm,
  setDelForm,
  delSaving,
  handleCreateDelegation,
  delegations,
  handleCancelDelegation,
}) {
  const statusColors = {
    Active: { bg: "#dcfce7", color: "#16a34a" },
    Expired: { bg: "#f3f4f6", color: "#6b7280" },
    Cancelled: { bg: "#fee2e2", color: "#dc2626" },
  };

  return (
    <div>
      {/* Create form */}
      <div className={cssClass({
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: 20, marginBottom: 24,
      })}>
        <SectionHead>Create Workflow Delegation</SectionHead>
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 })}>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              Delegating Employee
            </label>
            <ManagerSelect
              managers={managers}
              value={delForm.employee_id}
              onChange={(v) => setDelForm((f) => ({ ...f, employee_id: v }))}
              placeholder="Who is delegating?"
            />
          </div>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              Delegate To
            </label>
            <ManagerSelect
              managers={managers.filter((m) => m.employee_id !== delForm.employee_id)}
              value={delForm.delegate_employee_id}
              onChange={(v) => setDelForm((f) => ({ ...f, delegate_employee_id: v }))}
              placeholder="Who will handle approvals?"
            />
          </div>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              Start Date
            </label>
            <Input
              type="date"
              value={delForm.from_date}
              onChange={(e) => setDelForm((f) => ({ ...f, from_date: e.target.value }))}
            />
          </div>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              End Date
            </label>
            <Input
              type="date"
              value={delForm.to_date}
              min={delForm.from_date}
              onChange={(e) => setDelForm((f) => ({ ...f, to_date: e.target.value }))}
            />
          </div>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              Module
            </label>
            <select
              value={delForm.module}
              onChange={(e) => setDelForm((f) => ({ ...f, module: e.target.value }))}
              className={cssClass({
                border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px",
                fontSize: 13, width: "100%", outline: "none", background: "#fff",
              })}
            >
              <option value="all">All Modules</option>
              <option value="leave">Leave Approvals</option>
              <option value="timesheet">Timesheet</option>
              <option value="helpdesk">Helpdesk</option>
              <option value="appraisal">Appraisal</option>
            </select>
          </div>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              Reason
            </label>
            <Input
              value={delForm.reason}
              onChange={(e) => setDelForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Annual leave, Training…"
            />
          </div>
        </div>
        <Btn onClick={handleCreateDelegation} disabled={delSaving}>
          <Shield size={14} /> {delSaving ? "Creating…" : "Create Delegation"}
        </Btn>
      </div>

      {/* Delegations table */}
      <SectionHead>Active &amp; Recent Delegations</SectionHead>
      {delegations.length === 0 ? (
        <div className={cssClass({
          textAlign: "center", padding: 32, color: "#9ca3af",
          background: "#f9fafb", borderRadius: 12,
        })}>
          No delegations yet
        </div>
      ) : (
        <div className={cssClass({ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
            <thead>
              <tr className={cssClass({ background: "#f9fafb" })}>
                {["Employee", "Delegate To", "Module", "From", "To", "Status", ""].map((h) => (
                  <th key={h} className={cssClass({
                    padding: "10px 14px", textAlign: "left", fontWeight: 600,
                    color: "#6b7280", fontSize: 11, textTransform: "uppercase",
                  })}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {delegations.map((d, i) => {
                const sc = statusColors[d.status] || statusColors.Expired;
                return (
                  <tr key={d.id} className={cssClass({ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" })}>
                    <td className={cssClass({ padding: "10px 14px" })}>
                      <div className={cssClass({ fontWeight: 600, color: "#111827" })}>{d.employee_name}</div>
                      <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{d.employee_designation}</div>
                    </td>
                    <td className={cssClass({ padding: "10px 14px", color: "#374151" })}>{d.delegate_name}</td>
                    <td className={cssClass({ padding: "10px 14px" })}>
                      <span className={cssClass({ background: "#eff6ff", color: "#2563eb", borderRadius: 5, padding: "2px 8px", fontSize: 11 })}>
                        {d.module}
                      </span>
                    </td>
                    <td className={cssClass({ padding: "10px 14px", color: "#6b7280" })}>{fmtDate(d.from_date)}</td>
                    <td className={cssClass({ padding: "10px 14px", color: "#6b7280" })}>{fmtDate(d.to_date)}</td>
                    <td className={cssClass({ padding: "10px 14px" })}>
                      <span className={cssClass({ ...sc, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>
                        {d.status}
                      </span>
                    </td>
                    <td className={cssClass({ padding: "10px 14px" })}>
                      {d.status === "Active" && (
                        <button
                          onClick={() => handleCancelDelegation(d.id)}
                          className={cssClass({
                            background: "none", border: "1px solid #d1d5db", borderRadius: 6,
                            padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "#6b7280",
                            display: "flex", alignItems: "center", gap: 4,
                          })}
                        >
                          <X size={12} /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

export default DelegationTab;
