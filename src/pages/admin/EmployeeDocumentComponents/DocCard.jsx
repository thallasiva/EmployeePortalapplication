import { FileText, Download, Eye } from "lucide-react";
import { fileUrl } from "./shared";
function DocCard({
  doc
}) {
  const name = doc.document_name || doc.file_name || "Document";
  const category = doc.category_name || "Policy";
  const date = doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }) : "—";
  const url = fileUrl(doc.file_url);
  return <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{name}</p>
            <p className="text-[10px] text-gray-400">{category}</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{date}</span>
        <div className="flex gap-1">
          <a href={url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-colors" title="View">
            <Eye size={13} />
          </a>
          <a href={url} download className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-colors" title="Download">
            <Download size={13} />
          </a>
        </div>
      </div>
    </div>;
}
export { DocCard };
