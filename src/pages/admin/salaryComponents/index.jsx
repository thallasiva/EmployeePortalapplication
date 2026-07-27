import React from "react";
import { Plus, Search } from "lucide-react";
import { useSalaryComponents } from "./hooks/useSalaryComponents";
import { CATEGORIES, CAT_COLOR } from "./constants";
import ComponentRow from "./components/ComponentRow";
import ComponentForm from "./components/ComponentForm";

export default function SalaryComponentsPage() {
  const {
    components,
    loading,
    search,
    setSearch,
    catFilter,
    setCat,
    showInactive,
    setShowInactive,
    grouped,
    formOpen,
    editing,
    saving,
    openCreate,
    openEdit,
    closeForm,
    handleSave,
    handleToggle,
  } = useSalaryComponents();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Salary Components</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {components.filter((c) => c.is_active).length} active components
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#16304f]"
        >
          <Plus size={15} /> Add Component
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map(
            (cat) =>
              grouped[cat]?.length > 0 && (
                <div key={cat} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div
                    className={`px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 ${
                      cat === "Earning" ? "bg-green-50" : cat === "Deduction" ? "bg-red-50" : "bg-blue-50"
                    }`}
                  >
                    <span className={`text-xs font-semibold ${CAT_COLOR[cat].split(" ").slice(1).join(" ")}`}>
                      {cat}
                    </span>
                    <span className="text-[11px] text-gray-400">({grouped[cat].length})</span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left">
                        <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Component</th>
                        <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Category</th>
                        <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Calculation</th>
                        <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Frequency</th>
                        <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Visibility</th>
                        <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[cat].map((c) => (
                        <ComponentRow
                          key={c.component_id}
                          c={c}
                          onEdit={openEdit}
                          onToggle={handleToggle}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          )}
        </div>
      )}

      {formOpen && (
        <ComponentForm
          initial={editing}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
        />
      )}
    </div>
  );
}
