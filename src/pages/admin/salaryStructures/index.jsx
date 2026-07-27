import React from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSalaryStructures } from "./hooks/useSalaryStructures";
import StructureCard from "./components/StructureCard";
import StructureForm from "./components/StructureForm";

export default function SalaryStructuresPage() {
  const navigate = useNavigate();
  const {
    structures,
    allComponents,
    loading,
    formOpen,
    editing,
    saving,
    openCreate,
    openEdit,
    closeForm,
    handleSave,
    load,
  } = useSalaryStructures();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Salary Structures</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Named structures with configurable component lines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/dashboard/salary-structures/new")}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={15} /> Build New Structure
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50"
          >
            <Plus size={15} /> Quick Create
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : structures.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No structures yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {structures.map((s) => (
            <StructureCard
              key={s.structure_id}
              s={s}
              allComponents={allComponents}
              onEdit={openEdit}
              onRefresh={load}
              onOpenEditor={(sid) => navigate(`/dashboard/salary-structures/${sid}`)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <StructureForm
          initial={editing}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
        />
      )}
    </div>
  );
}
