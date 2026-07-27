import React from "react";
import { TABS, TAB_META, tabFilter } from "../salary/salaryHelpers";
import AddEditComponentPanel from "../salary/AddEditComponentPanel";
import FormulaBuilderTab from "../salary/FormulaBuilderTab";
import SalaryPreviewTab from "../salary/SalaryPreviewTab";

import { COMPONENT_TABS, PLACEHOLDER_TABS } from "./constants";
import StructureHeader from "./components/StructureHeader";
import StructureMetaGrid from "./components/StructureMetaGrid";
import PlaceholderTab from "./components/PlaceholderTab";
import ComponentTab from "./components/ComponentTab";
import HistoryTab from "./components/HistoryTab";
import useSalaryStructure from "./hooks/useSalaryStructure";

export default function SalaryStructureEditor() {
  const {
    structure,
    masterComps,
    activeTab,
    setActiveTab,
    computed,
    panelOpen,
    editLine,
    saving,
    loading,
    editingName,
    setEditingName,
    draftName,
    setDraftName,
    handleSave,
    handlePanelSave,
    handleRemoveLine,
    openAdd,
    openEdit,
    closePanel,
  } = useSalaryStructure();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading structure…
      </div>
    );
  }
  if (!structure) return null;

  const tabLines = tabFilter(structure.lines, activeTab);
  const existingIds = new Set((structure.lines ?? []).map((l) => l.component_id));
  const defaultCat = (TAB_META[activeTab] ?? {}).category ?? "Earning";
  const strCode = `SAL-STR-${String(structure.structure_id || "NEW").padStart(3, "0")}`;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">

      <StructureHeader
        structure={structure}
        draftName={draftName}
        setDraftName={setDraftName}
        editingName={editingName}
        setEditingName={setEditingName}
        saving={saving}
        onPreview={() => setActiveTab("preview")}
        onSave={handleSave}
      />

      <StructureMetaGrid structure={structure} strCode={strCode} />

      {/* Tab bar */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto bg-white">
        {COMPONENT_TABS.includes(activeTab) && !PLACEHOLDER_TABS.includes(activeTab) && (
          <ComponentTab
            tab={activeTab}
            lines={tabLines}
            computed={computed}
            canAdd={!!structure.structure_id}
            onAdd={openAdd}
            onEdit={openEdit}
            onRemove={handleRemoveLine}
          />
        )}
        {PLACEHOLDER_TABS.includes(activeTab) && (
          <PlaceholderTab
            title={(TAB_META[activeTab] ?? {}).title}
            sub={(TAB_META[activeTab] ?? {}).sub}
          />
        )}
        {activeTab === "formula" && <FormulaBuilderTab lines={structure.lines ?? []} />}
        {activeTab === "preview" && <SalaryPreviewTab structureId={structure.structure_id} />}
        {activeTab === "history" && <HistoryTab />}
      </div>

      {/* Add/Edit panel overlay */}
      {panelOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={closePanel}
          />
          <AddEditComponentPanel
            initial={editLine}
            masterComponents={masterComps}
            existingIds={existingIds}
            defaultCategory={defaultCat}
            onSave={handlePanelSave}
            onClose={closePanel}
          />
        </>
      )}
    </div>
  );
}
