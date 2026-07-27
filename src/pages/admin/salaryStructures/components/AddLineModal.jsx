import React, { useState } from "react";
import { X } from "lucide-react";
import { inp, sel, OVERRIDE_TYPES } from "../constants";

const AddLineModal = React.memo(function AddLineModal({
  existingIds,
  allComponents,
  onAdded,
  onClose,
  saving,
}) {
  const available = allComponents.filter(
    (c) => c.is_active && !existingIds.has(c.component_id)
  );
  const [selected, setSelected] = useState("");
  const [overrideType, setOverType] = useState("None");
  const [overrideValue, setOverVal] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Add Component to Structure</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={15} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAdded({
              component_id: Number(selected),
              override_type: overrideType === "None" ? null : overrideType,
              override_value: overrideValue || null,
              sort_order: sortOrder || null,
            });
          }}
          className="px-5 py-4 space-y-4"
        >
          <div>
            <label className="block text-xs text-gray-500 mb-1">Component *</label>
            <select
              required
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className={sel}
            >
              <option value="">— select —</option>
              {available.map((c) => (
                <option key={c.component_id} value={c.component_id}>
                  {c.component_name} ({c.component_code})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Override Type</label>
              <select
                value={overrideType}
                onChange={(e) => setOverType(e.target.value)}
                className={sel}
              >
                {OVERRIDE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            {overrideType !== "None" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Override Value</label>
                <input
                  type="number"
                  value={overrideValue}
                  onChange={(e) => setOverVal(e.target.value)}
                  className={inp}
                  step="0.01"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={inp}
              placeholder="Leave blank to use component default"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selected}
              className="flex-1 bg-[#1e3a5f] text-white rounded-xl py-2 text-sm font-medium hover:bg-[#16304f] disabled:opacity-60"
            >
              {saving ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default AddLineModal;
