import React from "react";
import { BookOpen, CheckCircle, Download } from "lucide-react";
import handbookPdf from "../../../assets/employee_handbook.pdf";

export default function HandbookTab({ form, set }) {
  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#f18200] to-[#f18200]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/20"><BookOpen size={15} className="text-white" /></div>
          <h3 className="text-[13px] font-bold text-white tracking-wide">Employee Handbook</h3>
        </div>
        <a
          href={handbookPdf}
          download="NAT_IT_Services_Employee_Handbook.pdf"
          className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Download size={12} /> Download PDF
        </a>
      </div>

      <div className="p-5">
        {/* Embedded PDF viewer */}
        <div className="rounded-xl overflow-hidden border border-amber-200 mb-5" style={{ height: 520 }}>
          <iframe
            src={handbookPdf + "#toolbar=1&navpanes=0&scrollbar=1"}
            title="Employee Handbook"
            width="100%"
            height="100%"
            style={{ border: "none", display: "block" }}
          />
        </div>

        {/* Acknowledgement checkbox */}
        <label className={"flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-colors " +
          (form.handbookAcknowledged ? "bg-orange-50 border-[#d97706]" : "bg-gray-50 border-gray-200")}>
          <div className={"mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 " +
            (form.handbookAcknowledged ? "border-[#d97706] bg-[#d97706]" : "border-gray-300 bg-white")}>
            {form.handbookAcknowledged && <CheckCircle size={13} className="text-white" />}
          </div>
          <input type="checkbox" name="handbookAcknowledged" checked={form.handbookAcknowledged} onChange={set} className="sr-only" />
          <span className="text-[13px] text-gray-700 leading-relaxed">
            I have read and understood the Employee Handbook and agree to abide by all company policies.
            <span className="text-red-500 ml-1">*</span>
          </span>
        </label>
      </div>
    </div>
  );
}
