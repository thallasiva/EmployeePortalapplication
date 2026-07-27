import React, { useState, useEffect, useCallback } from "react";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import {
  getStructure,
  updateStructure,
  removeStructureLine,
} from "../../../../api/salaryComponent.api";
import { successToast, errorToast } from "../../../../utils/ToastControllers";
import { getErrorMessage } from "../../../../api/client";
import { CAT_ORDER, CAT_COLOR } from "../constants";
import { groupLinesByCategory } from "../utils";
import AddLineModal from "./AddLineModal";

const StructureDetail = React.memo(function StructureDetail({
  structure,
  allComponents,
  onRefresh,
}) {
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLD] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [savingLine, setSL] = useState(false);

  const loadDetail = useCallback(async () => {
    setLD(true);
    try {
      setDetail(await getStructure(structure.structure_id));
    } catch {
      errorToast("Failed to load structure detail");
    } finally {
      setLD(false);
    }
  }, [structure.structure_id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const lines = detail?.lines ?? [];
  const existingIds = new Set(lines.map((l) => l.component_id));

  const handleAddLine = useCallback(
    async (payload) => {
      setSL(true);
      try {
        await updateStructure(structure.structure_id, {
          structure_name: structure.structure_name,
          description: structure.description,
          is_default: structure.is_default,
          lines: [...lines, payload],
        });
        successToast("Component added");
        setAddOpen(false);
        await loadDetail();
        onRefresh();
      } catch (err) {
        errorToast(getErrorMessage(err, "Failed to add"));
      } finally {
        setSL(false);
      }
    },
    [structure, lines, loadDetail, onRefresh]
  );

  const handleRemoveLine = useCallback(
    async (componentId) => {
      if (!window.confirm("Remove this component from the structure?")) return;
      try {
        await removeStructureLine(structure.structure_id, componentId);
        successToast("Removed");
        await loadDetail();
      } catch (err) {
        errorToast(getErrorMessage(err, "Failed"));
      }
    },
    [structure.structure_id, loadDetail]
  );

  const grouped = groupLinesByCategory(lines);

  if (loadingDetail)
    return <div className="px-5 py-6 text-center text-sm text-gray-400">Loading…</div>;

  return (
    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">
          {lines.length} component{lines.length !== 1 ? "s" : ""} in this structure
        </span>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
        >
          <Plus size={12} /> Add Component
        </button>
      </div>

      {CAT_ORDER.map(
        (cat) =>
          grouped[cat]?.length > 0 && (
            <div key={cat} className="mb-4">
              <p className={`text-[11px] font-semibold px-2 py-1 rounded-md inline-block mb-2 ${CAT_COLOR[cat]}`}>
                {cat}
              </p>
              <div className="space-y-1">
                {grouped[cat].map((line) => (
                  <div
                    key={line.component_id}
                    className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 px-3 py-2"
                  >
                    <GripVertical size={13} className="text-gray-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-700">{line.component_name}</span>
                      <span className="text-[11px] text-gray-400 font-mono ml-2">{line.component_code}</span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {line.override_type ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                          Override: {line.override_type} {line.override_value}
                        </span>
                      ) : (
                        <span className="text-gray-400">Default calc</span>
                      )}
                    </div>
                    {!line.is_system && (
                      <button
                        onClick={() => handleRemoveLine(line.component_id)}
                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
      )}

      {lines.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-400">
          No components yet. Click "Add Component" to start building.
        </div>
      )}

      {addOpen && (
        <AddLineModal
          structureId={structure.structure_id}
          existingIds={existingIds}
          allComponents={allComponents}
          onAdded={handleAddLine}
          onClose={() => setAddOpen(false)}
          saving={savingLine}
        />
      )}
    </div>
  );
});

export default StructureDetail;
