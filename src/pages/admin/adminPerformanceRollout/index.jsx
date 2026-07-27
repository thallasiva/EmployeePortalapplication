import React, { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { cssClass } from "../../../utils/classStyles";
import { useCycles } from "./hooks/useCycles";
import { BRAND, TABS } from "./constants";
import ActiveRolloutBanner from "./components/ActiveRolloutBanner";
import CyclesTab from "./components/CyclesTab";
import RolloutSettingsTab from "./components/RolloutSettingsTab";
import SubmissionsTab from "./components/SubmissionsTab";
import EnrollmentTab from "./components/EnrollmentTab";
import CreateCycleModal from "./components/CreateCycleModal";
import EditSettingsModal from "./components/EditSettingsModal";
import DisableConfirmModal from "./components/DisableConfirmModal";

export default function AdminPerformanceRollout() {
  const { cycles, loading, updateInList, prependCycle } = useCycles();
  const [tab, setTab] = useState("cycles");
  const [showCreate, setShowCreate] = useState(false);
  const [editCycle, setEditCycle] = useState(null);
  const [disableData, setDisableData] = useState(null);

  const activeCycle = cycles.find((c) => c.status === "active");

  const handleCreated = useCallback((c) => {
    prependCycle(c);
    setTab("cycles");
  }, [prependCycle]);

  const handleEditSaved = useCallback((u) => {
    updateInList(u);
    setEditCycle(null);
  }, [updateInList]);

  const handleDisabled = useCallback((u) => {
    updateInList(u);
    setDisableData(null);
  }, [updateInList]);

  return (
    <div className={cssClass({ padding: "28px 32px", maxWidth: 1080, margin: "0 auto" })}>
      <div className={cssClass({ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 })}>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e293b" })}>Performance Appraisal</h1>
          <p className={cssClass({ margin: "4px 0 0", color: "#64748b", fontSize: 14 })}>Manage appraisal cycles, configure rollout, and view submissions.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className={cssClass({ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: BRAND, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 })}>
          <Plus size={15} /> New Cycle
        </button>
      </div>

      <ActiveRolloutBanner
        activeCycle={activeCycle}
        onStopRollout={() => setDisableData(activeCycle)}
        onStartRollout={() => setTab("rollout")}
      />

      <div className={cssClass({ display: "flex", gap: 2, borderBottom: "2px solid #e2e8f0", marginBottom: 24 })}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cssClass({ padding: "10px 18px", border: "none", background: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, color: tab === t.id ? BRAND : "#64748b", borderBottom: tab === t.id ? `2.5px solid ${BRAND}` : "2.5px solid transparent", marginBottom: -2 })}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && (tab === "cycles" || tab === "rollout")
        ? <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8" })}>Loading…</div>
        : (
          <>
            {tab === "cycles" && (
              <CyclesTab cycles={cycles} onEdit={setEditCycle}
                onRollout={() => setTab("rollout")} onDisable={setDisableData}
                onReEnable={() => setTab("rollout")} onNew={() => setShowCreate(true)} />
            )}
            {tab === "rollout" && (
              <RolloutSettingsTab cycles={cycles} onCycleUpdated={updateInList}
                onDisable={setDisableData} onNew={() => setShowCreate(true)} />
            )}
            {tab === "submissions" && <SubmissionsTab cycles={cycles} />}
            {tab === "enrollment" && <EnrollmentTab cycles={cycles} />}
          </>
        )
      }

      {showCreate && <CreateCycleModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {editCycle && <EditSettingsModal cycle={editCycle} onClose={() => setEditCycle(null)} onSaved={handleEditSaved} />}
      {disableData && <DisableConfirmModal cycle={disableData} onClose={() => setDisableData(null)} onDisabled={handleDisabled} />}
    </div>
  );
}
