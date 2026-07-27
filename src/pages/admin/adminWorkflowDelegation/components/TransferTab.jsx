import React from "react";
import { ArrowRightLeft } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND, BL } from "../constants/tabs";
import { SectionHead, Input, Btn } from "./SharedUI";
import ManagerSelect from "./ManagerSelect";

const TransferTab = React.memo(function TransferTab({
  managers,
  xferOldMgr,
  setXferOldMgr,
  xferNewMgr,
  setXferNewMgr,
  xferReason,
  setXferReason,
  xferTeam,
  xferSaving,
  handleTransfer,
}) {
  return (
    <div>
      <SectionHead>Manager Transfer</SectionHead>

      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 })}>
        <div>
          <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
            Old Reporting Manager
          </label>
          <ManagerSelect
            managers={managers}
            value={xferOldMgr}
            onChange={setXferOldMgr}
            placeholder="Select old manager…"
          />
          {xferOldMgr && xferTeam.length === 0 && (
            <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginTop: 6 })}>
              This manager has no active team members.
            </div>
          )}
        </div>
        <div>
          <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
            New Reporting Manager
          </label>
          <ManagerSelect
            managers={managers.filter((m) => m.employee_id !== xferOldMgr)}
            value={xferNewMgr}
            onChange={setXferNewMgr}
            placeholder="Select new manager…"
          />
        </div>
      </div>

      <div className={cssClass({ marginBottom: 20 })}>
        <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
          Reason
        </label>
        <Input
          value={xferReason}
          onChange={(e) => setXferReason(e.target.value)}
          placeholder="e.g. Manager resigned, restructuring…"
        />
      </div>

      {xferTeam.length > 0 && (
        <div className={cssClass({
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
          padding: 18, marginBottom: 20,
        })}>
          <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 })}>
            Employees to transfer ({xferTeam.length})
          </div>
          <div className={cssClass({ display: "flex", flexDirection: "column", gap: 8 })}>
            {xferTeam.map((e) => (
              <div key={e.employee_id} className={cssClass({
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", background: "#f9fafb", borderRadius: 8,
              })}>
                <div className={cssClass({
                  width: 30, height: 30, borderRadius: "50%", background: BRAND + "20",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: BRAND, flexShrink: 0,
                })}>
                  {e.full_name?.[0]}
                </div>
                <div className={cssClass({ flex: 1 })}>
                  <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#111827" })}>{e.full_name}</div>
                  <div className={cssClass({ fontSize: 11, color: "#6b7280" })}>{e.designation_name || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {xferOldMgr && xferNewMgr && xferTeam.length > 0 && (
        <div className={cssClass({
          background: BL, border: "1px solid #fed7aa", borderRadius: 10,
          padding: "14px 16px", marginBottom: 16,
        })}>
          <div className={cssClass({ fontSize: 13, color: "#92400e" })}>
            <strong>{xferTeam.length} employee{xferTeam.length !== 1 ? "s" : ""}</strong> will be transferred from{" "}
            <strong>{managers.find((m) => m.employee_id === xferOldMgr)?.full_name}</strong> to{" "}
            <strong>{managers.find((m) => m.employee_id === xferNewMgr)?.full_name}</strong>.
          </div>
        </div>
      )}

      <Btn
        onClick={handleTransfer}
        disabled={!xferOldMgr || !xferNewMgr || !xferTeam.length || xferSaving}
      >
        <ArrowRightLeft size={14} />
        {xferSaving
          ? "Transferring…"
          : `Transfer ${xferTeam.length ? xferTeam.length + " " : ""}Employee${xferTeam.length !== 1 ? "s" : ""}`}
      </Btn>
    </div>
  );
});

export default TransferTab;
