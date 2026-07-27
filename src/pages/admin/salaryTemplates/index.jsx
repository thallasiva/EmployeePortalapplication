import React, { useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import Pagination, { usePagination } from "../../../components/Pagination";
import TemplateCard from "./components/TemplateCard";
import TemplateForm from "./components/TemplateForm";
import { useSalaryTemplates } from "./hooks/useSalaryTemplates";

const SalaryTemplates = React.memo(function SalaryTemplates() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { templates, loading, saving, saveTemplate, deleteTemplate } = useSalaryTemplates();

  const openCreate = useCallback(() => { setEditing(null); setFormOpen(true); }, []);
  const openEdit = useCallback((t) => { setEditing(t); setFormOpen(true); }, []);
  const closeForm = useCallback(() => { setFormOpen(false); setEditing(null); }, []);

  const handleSave = useCallback(async (data) => {
    await saveTemplate(data, editing, closeForm);
  }, [saveTemplate, editing, closeForm]);

  const defaultTpl = useMemo(() => templates.find((t) => t.is_default), [templates]);
  const otherTpls = useMemo(() => templates.filter((t) => !t.is_default), [templates]);

  const { paged: pagedTpls, page: tplPage, setPage: setTplPage, totalPages: tplTotalPages, from: tplFrom, to: tplTo, total: tplTotal, pageSize: tplPageSize, setPageSize: setTplPageSize } = usePagination(otherTpls);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Salary Templates</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure reusable salary structures for offer creation
          </p>
        </div>
        <button onClick={openCreate}
        className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#16304f] transition-colors">
          <Plus size={15} /> New Template
        </button>
      </div>

      {loading ?
      <div className="text-center py-16 text-gray-400 text-sm">Loading templates…</div> :
      templates.length === 0 ?
      <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm mb-3">No salary templates yet</p>
          <button onClick={openCreate}
        className="text-indigo-600 text-sm font-medium hover:underline">
            Create your first template
          </button>
        </div> :

      <div className="space-y-6">
          {}
          {defaultTpl &&
        <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Default Template</p>
              <TemplateCard t={defaultTpl} onEdit={openEdit} onDelete={deleteTemplate} />
            </div>
        }

          {}
          {otherTpls.length > 0 &&
        <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                All Templates ({otherTpls.length})
              </p>
              <div className="grid gap-3">
                {pagedTpls.map((t) =>
            <TemplateCard key={t.template_id} t={t} onEdit={openEdit} onDelete={deleteTemplate} />
            )}
              </div>
              <Pagination page={tplPage} setPage={setTplPage} totalPages={tplTotalPages} from={tplFrom} to={tplTo} total={tplTotal} pageSize={tplPageSize} setPageSize={setTplPageSize} />
            </div>
        }
        </div>
      }

      {formOpen &&
      <TemplateForm
        initial={editing}
        onSave={handleSave}
        onClose={closeForm}
        saving={saving} />

      }
    </div>
  );
});

export default SalaryTemplates;
