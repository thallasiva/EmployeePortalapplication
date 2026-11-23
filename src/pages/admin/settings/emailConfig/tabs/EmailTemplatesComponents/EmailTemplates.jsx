import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Eye, Edit2, Copy, Trash2, Loader2 } from "lucide-react";
import { Btn, ConfirmDialog, Toast } from "../../components/SharedUI";
import { emailTemplatesApi } from "../../../../../../api/settings.api";
import Pagination from "../../../../../../components/Pagination";
import { PER, CATEGORIES, CAT_COLORS } from "./shared";
import { TemplateModal } from "./TemplateModal";
import { PreviewModal } from "./PreviewModal";
function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode:"edit"|"preview", item }
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({
      message: msg,
      type
    });
    setTimeout(() => setToast(null), 3000);
  };
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await emailTemplatesApi.list({
        search,
        category: category || undefined,
        status: status || undefined,
        page,
        limit: PER
      });
      setTemplates(res.rows || []);
      setTotal(res.total || 0);
    } catch {
      showToast("Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  }, [search, category, status, page]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [search, category, status]);
  const handleSave = async form => {
    if (modal?.item?.id) {
      await emailTemplatesApi.update(modal.item.id, form);
      showToast("Template updated");
    } else {
      await emailTemplatesApi.create(form);
      showToast("Template created");
    }
    load();
  };
  const handleClone = async id => {
    try {
      await emailTemplatesApi.clone(id);
      showToast("Template cloned");
      load();
    } catch {
      showToast("Clone failed", "error");
    }
  };
  const handleDelete = async id => {
    try {
      await emailTemplatesApi.delete(id);
      showToast("Deleted");
      load();
    } catch {
      showToast("Delete failed", "error");
    }
  };
  const totalPages = Math.max(1, Math.ceil(total / PER));
  return <div className="space-y-5">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {confirm && <ConfirmDialog message="Delete this template?" onConfirm={() => {
      handleDelete(confirm);
      setConfirm(null);
    }} onCancel={() => setConfirm(null)} />}
      {modal?.mode === "edit" && <TemplateModal tpl={modal.item} onClose={() => setModal(null)} onSave={handleSave} />}
      {modal?.mode === "preview" && <PreviewModal tpl={modal.item} onClose={() => setModal(null)} />}
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…" className="w-full pl-8 pr-3 h-[36px] border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="h-[36px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="h-[36px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]">
          <option value="">All Status</option>
          <option>Active</option><option>Inactive</option>
        </select>
        <Btn icon={<Plus size={14} />} onClick={() => setModal({
        mode: "edit",
        item: null
      })}>New Template</Btn>
      </div>
      {/* Grid */}
      {loading ? <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-[#e87500]" />
        </div> : templates.length === 0 ? <div className="bg-white rounded-xl border border-[#f1f5f9] py-16 text-center text-[#94a3b8] text-[13px]">
          No templates found. <button onClick={() => setModal({
        mode: "edit",
        item: null
      })} className="text-[#e87500] font-semibold ml-1">Create one</button>
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(t => <div key={t.id} className="bg-white rounded-xl border border-[#f1f5f9] p-4 hover:shadow-sm transition-shadow flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-[#e87500] truncate">{t.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                background: `${CAT_COLORS[t.category] || "#64748b"}18`,
                color: CAT_COLORS[t.category] || "#64748b"
              }}>
                      {t.category}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status === "Active" ? "bg-green-50 text-green-700" : "bg-[#f1f5f9] text-[#94a3b8]"}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-[#94a3b8] line-clamp-2">{t.subject || "No subject"}</div>
              <div className="flex items-center gap-1 pt-1 border-t border-[#f8fafc]">
                <button onClick={() => setModal({
            mode: "preview",
            item: t
          })} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]" title="Preview"><Eye size={13} /></button>
                <button onClick={() => setModal({
            mode: "edit",
            item: t
          })} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]" title="Edit"><Edit2 size={13} /></button>
                <button onClick={() => handleClone(t.id)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]" title="Clone"><Copy size={13} /></button>
                <button onClick={() => setConfirm(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Delete"><Trash2 size={13} /></button>
              </div>
            </div>)}
        </div>}
      {/* Pagination */}
      {total > 0 && <Pagination page={page} setPage={setPage} totalPages={totalPages} from={Math.min((page - 1) * PER + 1, total)} to={Math.min(page * PER, total)} total={total} pageSize={PER} />}
    </div>;
}
export { EmailTemplates };
