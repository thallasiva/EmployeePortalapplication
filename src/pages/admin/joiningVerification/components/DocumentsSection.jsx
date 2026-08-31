import React from "react";
import { CheckCircle, FileText, ExternalLink } from "lucide-react";
import { Sec } from "./SharedUI";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";

const DocumentsSection = React.memo(function DocumentsSection({ detail }) {
  return (
    <Sec icon={FileText} title="Document Acknowledgments & Uploads">
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between py-2 border-b border-amber-50 text-[13px]">
          <span className="text-gray-400 text-[12px]">Employee Handbook</span>
          <div className="flex items-center gap-2">
            {detail.handbook_acknowledged || detail.handbook_ack ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                <CheckCircle size={11} /> Acknowledged
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold">
                Not Acknowledged
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-amber-50 text-[13px]">
          <span className="text-gray-400 text-[12px]">Privacy Policy / HR Policy</span>
          <div className="flex items-center gap-2">
            {detail.privacy_policy_accepted || detail.hr_policy_acknowledged || detail.hr_policy_ack ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                <CheckCircle size={11} /> Acknowledged
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold">
                Not Acknowledged
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-2 mt-3">
        Uploaded Documents
      </p>
      <div className="space-y-2">
        {detail.aadhar_doc_url ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-amber-100 bg-amber-50/40">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-amber-700" />
              <span className="text-[12px] font-medium text-gray-700">Aadhaar Card</span>
            </div>
            <a
              href={`${API_BASE}${detail.aadhar_doc_url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white"
              style={{ backgroundColor: "#d97706" }}
            >
              <ExternalLink size={11} /> View
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/20">
            <FileText size={13} className="text-amber-300" />
            <span className="text-[12px] text-gray-400">Aadhaar Card — not uploaded</span>
          </div>
        )}
        {detail.pan_doc_url ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-amber-100 bg-amber-50/40">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-amber-700" />
              <span className="text-[12px] font-medium text-gray-700">PAN Card</span>
            </div>
            <a
              href={`${API_BASE}${detail.pan_doc_url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white"
              style={{ backgroundColor: "#d97706" }}
            >
              <ExternalLink size={11} /> View
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/20">
            <FileText size={13} className="text-amber-300" />
            <span className="text-[12px] text-gray-400">PAN Card — not uploaded</span>
          </div>
        )}
      </div>
    </Sec>
  );
});

export default DocumentsSection;
