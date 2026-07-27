import React from "react";
import { ChevronDown, ChevronRight, FileText, Search, Download } from "lucide-react";
import { PanelTitle } from "./Typography";
import JumpList from "./JumpList";
import { toJumpId, scrollElementIntoContainer, docFileUrl } from "../utils";

const DocumentsView = React.memo(function DocumentsView({
  myDocs, docsLoading, joiningDocs, docsByCategory,
  docSectionOpen, setDocSectionOpen
}) {
  const categoryNames = Object.keys(docsByCategory);

  const joiningItems = joiningDocs ? [
    { key: "aadhaar", label: "Aadhaar Card", url: joiningDocs.aadhar_doc_url || null, ack: !!joiningDocs.aadhar_doc_url, type: "upload" },
    { key: "pan", label: "PAN Card", url: joiningDocs.pan_doc_url || null, ack: !!joiningDocs.pan_doc_url, type: "upload" },
    { key: "handbook", label: "Employee Handbook", url: null, ack: !!joiningDocs.handbook_acknowledged, type: "acknowledgment" },
    { key: "privacy", label: "Privacy Policy", url: null, ack: !!joiningDocs.privacy_policy_accepted, type: "acknowledgment" }
  ] : [];
  const hasAnyJoiningData = joiningItems.some((i) => i.ack);

  return (
    <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
      <PanelTitle>Documents</PanelTitle>

      {hasAnyJoiningData &&
        <div className="mb-4">
          <h3 className="text-[13px] font-semibold text-[#3a4558] mb-2">Joining Documents</h3>
          <div className="border border-[#dfe5ed] bg-white">
            <div className="px-3 py-2 border-b border-[#edf1f5] flex items-center justify-between">
              <h4 className="text-[14px] font-semibold text-[#586377] flex items-center gap-1">
                <ChevronDown size={14} /> Joining Formalities
              </h4>
              <span className="text-[11px] text-[#a4afbf]">
                {joiningDocs?.reviewed_at ? `Approved ${new Date(joiningDocs.reviewed_at).toLocaleDateString()}` : ""}
              </span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {joiningItems.map((item) => (
                <div key={item.key} className="border border-[#e8edf3] rounded px-3 py-2 bg-[#fafbfc] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className={item.ack ? "text-green-500" : "text-[#c8d3e0]"} />
                    <div>
                      <p className="text-[13px] font-medium text-[#3a4558]">{item.label}</p>
                      <p className="text-[11px] mt-0.5">
                        {item.type === "acknowledgment"
                          ? item.ack ? <span className="text-green-600 font-medium">✓ Acknowledged</span> : <span className="text-gray-400">Not acknowledged</span>
                          : item.ack ? <span className="text-green-600 font-medium">✓ Uploaded</span> : <span className="text-gray-400">Not uploaded</span>
                        }
                      </p>
                    </div>
                  </div>
                  {item.url &&
                    <div className="flex gap-1 shrink-0">
                      <a href={docFileUrl(item.url)} target="_blank" rel="noopener noreferrer"
                        className="border border-[#dfe5ed] h-7 px-2 text-[12px] inline-flex items-center gap-1 hover:bg-[#f0f4f9] text-[#5a78ad]">
                        <Search size={12} /> View
                      </a>
                      <a href={docFileUrl(item.url)} download
                        className="border border-[#dfe5ed] h-7 px-2 text-[12px] inline-flex items-center gap-1 hover:bg-[#f0f4f9] text-[#8d9aad]">
                        <Download size={12} /> Download
                      </a>
                    </div>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      }

      {docsLoading ? (
        <div className="border border-[#dfe5ed] bg-white min-h-[200px] flex items-center justify-center">
          <p className="text-[13px] text-[#9ca8b8]">Loading your documents…</p>
        </div>
      ) : !myDocs || myDocs.length === 0 ? (
        <div className="border border-[#dfe5ed] bg-white min-h-[300px] flex flex-col items-center justify-center gap-3 p-8">
          <FileText size={40} className="text-[#c8d3e0]" />
          <p className="text-[16px] text-[#7a8799]">No documents yet</p>
          <p className="text-[13px] text-[#a2adbd] text-center">Documents shared with you by HR will appear here.</p>
        </div>
      ) : (
        <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
          <JumpList items={categoryNames.length > 0 ? categoryNames : ["Documents"]}
            onJump={(item) => { const el = document.getElementById(toJumpId(item)); if (el) scrollElementIntoContainer(el); }} />
          <div className="flex-1 p-3 space-y-3 max-h-[520px] overflow-y-auto" data-doc-scroll>
            {categoryNames.map((cat) => {
              const docs = docsByCategory[cat];
              const lastUpdated = docs.reduce((latest, d) => { const t = new Date(d.created_at).getTime(); return t > latest ? t : latest; }, 0);
              const lastUpdatedStr = lastUpdated
                ? new Date(lastUpdated).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "";
              return (
                <div key={cat} id={toJumpId(cat)} className="border border-[#dfe5ed]">
                  <button type="button" onClick={() => setDocSectionOpen((curr) => ({ ...curr, [cat]: !curr[cat] }))}
                    className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left">
                    <h4 className="text-[14px] font-semibold text-[#586377] inline-flex items-center gap-1">
                      {docSectionOpen[cat] !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {cat}
                      <span className="ml-2 text-[11px] font-normal text-[#a4afbf]">({docs.length})</span>
                    </h4>
                    {lastUpdatedStr && <span className="text-[11px] text-[#a4afbf]">Last updated {lastUpdatedStr}</span>}
                  </button>
                  {docSectionOpen[cat] !== false &&
                    <div className="p-3 space-y-2">
                      {docs.map((doc) => (
                        <div key={doc.document_id} className="flex items-center justify-between border border-[#e8edf3] rounded px-3 py-2 bg-[#fafbfc]">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="text-[#8b9fc0] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[#3a4558] truncate">{doc.title}</p>
                              {doc.description && <p className="text-[11px] text-[#9ca8b8] truncate">{doc.description}</p>}
                              <p className="text-[11px] text-[#b0bac7] mt-0.5">
                                {doc.file_type} · {doc.file_size} · {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 ml-3">
                            <a href={docFileUrl(doc.file_url)} target="_blank" rel="noopener noreferrer"
                              className="border border-[#dfe5ed] h-7 px-3 text-[12px] inline-flex items-center gap-1 hover:bg-[#f0f4f9] text-[#5a78ad]" title="View document">
                              <Search size={12} /> View
                            </a>
                            <a href={docFileUrl(doc.file_url)} download
                              className="border border-[#dfe5ed] h-7 px-3 text-[12px] inline-flex items-center gap-1 hover:bg-[#f0f4f9] text-[#8d9aad]" title="Download document">
                              <Download size={12} /> Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default DocumentsView;
