import React, { useState } from "react";
import { X } from "lucide-react";
import { inp } from "../constants";

const StructureForm = React.memo(function StructureForm({ initial, onSave, onClose, saving }) {
  const [name, setName] = useState(initial?.structure_name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [isDefault, setDef] = useState(!!initial?.is_default);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            {initial ? "Edit Structure" : "New Salary Structure"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={15} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ structure_name: name, description: desc, is_default: isDefault });
          }}
          className="px-5 py-4 space-y-4"
        >
          <div>
            <label className="block text-xs text-gray-500 mb-1">Structure Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inp}
              placeholder="e.g. Standard Monthly"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className={inp}
              placeholder="Brief note"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setDef(e.target.checked)}
            />
            Set as default structure
          </label>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#1e3a5f] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#16304f] disabled:opacity-60"
            >
              {saving ? "Saving…" : initial ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default StructureForm;
