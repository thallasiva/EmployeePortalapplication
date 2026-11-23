import React from "react";
import { X, Mail } from "lucide-react";
import { renderPreview } from "./shared";
/* ── Preview Modal ── */
function PreviewModal({
  tpl,
  onClose
}) {
  if (!tpl) return null;
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" style={{
      maxHeight: "90vh"
    }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <span className="text-[15px] font-bold text-[#e87500]">Template Preview</span>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto" style={{
        maxHeight: "70vh"
      }}>
          <div className="bg-[#f8fafc] rounded-xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Mail size={16} className="text-[#e87500]" />
              <span className="text-[11px] text-[#94a3b8] uppercase tracking-wide font-semibold">{tpl.category}</span>
            </div>
            <div className="text-[12px] text-[#94a3b8]">Subject</div>
            <div className="text-[14px] font-semibold text-[#1e293b]" dangerouslySetInnerHTML={{
            __html: renderPreview(tpl.subject)
          }} />
          </div>
          <div className="bg-white rounded-xl border border-[#f1f5f9] p-5 text-[13px] text-[#475569] leading-relaxed" dangerouslySetInnerHTML={{
          __html: renderPreview(tpl.body) || "<em>No body content</em>"
        }} />
        </div>
        <div className="px-6 pb-5 border-t border-[#f1f5f9] pt-4">
          <button onClick={onClose} className="w-full h-[38px] bg-[#e87500] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold">Close</button>
        </div>
      </div>
    </div>;
}
export { PreviewModal };
