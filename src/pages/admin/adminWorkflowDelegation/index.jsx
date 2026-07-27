import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GitBranch, RefreshCw } from "lucide-react";
import { cssClass } from "../../../utils/classStyles";
import { TABS, URL_TAB_MAP, BRAND } from "./constants/tabs";
import { useWorkflowData } from "./hooks/useWorkflowData";
import TabBar from "./components/TabBar";
import OverviewTab from "./components/OverviewTab";
import HierarchyTab from "./components/HierarchyTab";
import ManagersTab from "./components/ManagersTab";
import UnassignedTab from "./components/UnassignedTab";
import TransferTab from "./components/TransferTab";
import DelegationTab from "./components/DelegationTab";
import HistoryTab from "./components/HistoryTab";
import ManagerDetailModal from "./components/ManagerDetailModal";

export default function AdminWorkflowDelegation() {
  const { search } = useLocation();

  const initialTab = useMemo(() => {
    const p = new URLSearchParams(search).get("tab");
    return (p && URL_TAB_MAP[p]) || "overview";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(search).get("tab");
    const key = (p && URL_TAB_MAP[p]) || null;
    if (key && key !== activeTab) setActiveTab(key);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const data = useWorkflowData(activeTab);

  return (
    <div className={cssClass({ padding: "24px", maxWidth: 1200, margin: "0 auto", fontFamily: "inherit" })}>
      {/* Page header */}
      <div className={cssClass({
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 12,
      })}>
        <div>
          <div className={cssClass({ fontSize: 22, fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 10 })}>
            <GitBranch size={22} color={BRAND} />
            Workflow Delegation &amp; Reporting Hierarchy
          </div>
          <div className={cssClass({ fontSize: 13, color: "#6b7280", marginTop: 4 })}>
            Manage reporting relationships, org hierarchy, and approval delegation
          </div>
        </div>
        <button
          onClick={data.loadAll}
          disabled={data.loading}
          className={cssClass({
            display: "flex", alignItems: "center", gap: 6, background: "#fff",
            border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px",
            cursor: "pointer", fontSize: 13, color: "#374151",
          })}
        >
          <RefreshCw size={14} className={cssClass({ animation: data.loading ? "spin 1s linear infinite" : "none" })} />
          Refresh
        </button>
      </div>

      {/* Navigation tabs */}
      <TabBar tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} stats={data.stats} />

      {/* Active tab content */}
      <div>
        {activeTab === "overview" && (
          <OverviewTab
            stats={data.stats}
            delegations={data.delegations}
            setActiveTab={setActiveTab}
            loading={data.loading}
            visibleTree={data.visibleTree}
            highlightIds={data.highlightIds}
            setHighlightIds={data.setHighlightIds}
            setSelectedNode={setSelectedNode}
            treeSearch={data.treeSearch}
            setTreeSearch={data.setTreeSearch}
            searchQ={data.searchQ}
            setSearchQ={data.setSearchQ}
            searching={data.searching}
            searchResults={data.searchResults}
            focusedPath={data.focusedPath}
            setFocusedPath={data.setFocusedPath}
          />
        )}
        {activeTab === "hierarchy" && (
          <HierarchyTab
            loadTree={data.loadTree}
            loading={data.loading}
            visibleTree={data.visibleTree}
            highlightIds={data.highlightIds}
            setSelectedNode={setSelectedNode}
            treeSearch={data.treeSearch}
            setTreeSearch={data.setTreeSearch}
          />
        )}
        {activeTab === "managers" && (
          <ManagersTab
            managers={data.managers}
            mgSearch={data.mgSearch}
            setMgSearch={data.setMgSearch}
            setSelectedNode={setSelectedNode}
          />
        )}
        {activeTab === "unassigned" && (
          <UnassignedTab
            unassigned={data.unassigned}
            managers={data.managers}
            assignMap={data.assignMap}
            setAssignMap={data.setAssignMap}
            saving={data.saving}
            handleAssign={data.handleAssign}
            bulkSelected={data.bulkSelected}
            setBulkSelected={data.setBulkSelected}
            bulkManager={data.bulkManager}
            setBulkManager={data.setBulkManager}
            bulkSaving={data.bulkSaving}
            handleBulkAssign={data.handleBulkAssign}
          />
        )}
        {activeTab === "transfer" && (
          <TransferTab
            managers={data.managers}
            xferOldMgr={data.xferOldMgr}
            setXferOldMgr={data.setXferOldMgr}
            xferNewMgr={data.xferNewMgr}
            setXferNewMgr={data.setXferNewMgr}
            xferReason={data.xferReason}
            setXferReason={data.setXferReason}
            xferTeam={data.xferTeam}
            xferSaving={data.xferSaving}
            handleTransfer={data.handleTransfer}
          />
        )}
        {activeTab === "delegation" && (
          <DelegationTab
            managers={data.managers}
            delForm={data.delForm}
            setDelForm={data.setDelForm}
            delSaving={data.delSaving}
            handleCreateDelegation={data.handleCreateDelegation}
            delegations={data.delegations}
            handleCancelDelegation={data.handleCancelDelegation}
          />
        )}
        {activeTab === "history" && <HistoryTab history={data.history} />}
      </div>

      {/* Employee detail modal */}
      {selectedNode && (
        <ManagerDetailModal
          managerId={selectedNode.id}
          onClose={() => setSelectedNode(null)}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
