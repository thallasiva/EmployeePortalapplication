import React, { useState } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { useWorkflowDelegates } from "./hooks/useWorkflowDelegates";
import { WORKFLOWS } from "./constants";
import PageHeader from "./components/PageHeader";
import OooQuickSet from "./components/OooQuickSet";
import TabBar from "./components/TabBar";
import WorkflowRow from "./components/WorkflowRow";
import DelegatedToMe from "./components/DelegatedToMe";
import SaveFooter from "./components/SaveFooter";

export default function WorkflowDelegates() {
  const [tab, setTab] = useState("mine");

  const {
    employees, loading, delegates, saving,
    oooFrom, oooTo,
    setOooFrom, setOooTo,
    myId, activeDelegates, configuredCount,
    applyOoo, handleChange, handleRemove, handleSaveAll,
  } = useWorkflowDelegates();

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: 24 })}>
      <PageHeader activeDelegates={activeDelegates} />

      <OooQuickSet
        oooFrom={oooFrom}
        oooTo={oooTo}
        setOooFrom={setOooFrom}
        setOooTo={setOooTo}
        onApply={applyOoo}
      />

      <TabBar tab={tab} onTabChange={setTab} />

      {loading ? (
        <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 })}>
          Loading employees…
        </div>
      ) : tab === "mine" ? (
        <>
          <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
            {WORKFLOWS.map((wf) => (
              <WorkflowRow
                key={wf.id}
                wf={wf}
                entry={delegates[wf.id]}
                employees={employees}
                myId={myId}
                onChange={handleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
          <SaveFooter saving={saving} configuredCount={configuredCount} onSave={handleSaveAll} />
        </>
      ) : (
        <DelegatedToMe myId={myId} employees={employees} delegates={delegates} />
      )}
    </div>
  );
}
