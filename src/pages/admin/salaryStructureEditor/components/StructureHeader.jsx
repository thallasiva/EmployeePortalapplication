import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, Eye, ChevronDown, CheckCircle,
} from "lucide-react";
import { successToast } from "../../../../utils/ToastControllers";

const StructureHeader = React.memo(function StructureHeader({
  structure,
  draftName,
  setDraftName,
  editingName,
  setEditingName,
  saving,
  onPreview,
  onSave,
}) {
  const navigate = useNavigate();
  return (
    <div className="shrink-0 border-b border-gray-200 px-6 pt-4 pb-3 bg-white">
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
        <Link to="/dashboard/payroll" className="hover:text-gray-600 transition-colors">Payroll</Link>
        <span className="text-gray-300">›</span>
        <Link to="/dashboard/salary-structures" className="hover:text-gray-600 transition-colors">Salary Structures</Link>
        <span className="text-gray-300">›</span>
        <span className="text-gray-700 font-medium truncate max-w-56">{structure.structure_name}</span>
      </nav>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => navigate("/dashboard/salary-structures")}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
          >
            <ArrowLeft size={15} />
          </button>

          {editingName ? (
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              className="text-xl font-bold text-gray-900 border-b-2 border-indigo-400 outline-none bg-transparent min-w-72"
            />
          ) : (
            <h1
              onClick={() => setEditingName(true)}
              title="Click to rename"
              className="text-xl font-bold text-gray-900 cursor-text hover:text-indigo-700 transition-colors truncate"
            >
              {draftName}
            </h1>
          )}

          <span
            className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
              structure.is_default
                ? "bg-blue-50 text-blue-600 border-blue-200"
                : "bg-green-50 text-green-600 border-green-200"
            }`}
          >
            {structure.is_default ? "Default" : "Active"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onPreview}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3.5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-sm"
          >
            <Save size={14} /> {saving ? "Saving…" : "Save"}
          </button>
          <button
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            onClick={() => successToast("Structure published!")}
          >
            <CheckCircle size={14} /> Publish
          </button>
          <button className="flex items-center gap-1 border border-gray-200 text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
            More <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {structure.description && (
        <p className="text-xs text-gray-400 mt-1.5 ml-9">{structure.description}</p>
      )}
    </div>
  );
});

export default StructureHeader;
