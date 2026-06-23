import { useEffect, useState } from "react";
import { FileText, Download, Eye, Upload } from "lucide-react";
import { listDocuments, uploadDocument } from "../../api/document.api";
import apiClient from "../../api/client";

function fileUrl(relPath) {
  if (!relPath) return "#";
  const base = apiClient.defaults?.baseURL?.replace(/\/api\/?$/, "") || "";
  return `${base}${relPath}`;
}

function DocCard({ doc }) {
  const name = doc.document_name || doc.file_name || "Document";
  const category = doc.category_name || "Policy";
  const date = doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
  const url = fileUrl(doc.file_url);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-colors" title="View">
            <Eye size={13} />
          </a>
          <a href={url} download
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-colors" title="Download">
            <Download size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

export function EmployeeDocument() {
  const [docs, setDocs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr]           = useState("");

  const load = () => {
    setLoading(true);
    listDocuments({ visibility: "all", limit: 100 })
      .then(({ data }) => setDocs(data || []))
      .catch(() => setErr("Failed to load documents"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_name", file.name.replace(/\.[^.]+$/, ""));
      fd.append("visibility", "all");
      await uploadDocument(fd);
      setTimeout(load, 300);
    } catch { setErr("Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  // Group by category
  const groups = docs.reduce((acc, d) => {
    const cat = d.category_name || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-gray-800">Company Policies & Documents</h2>
          <p className="text-xs text-gray-400 mt-0.5">{docs.length} document{docs.length !== 1 ? "s" : ""} available</p>
        </div>
        <label className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:bg-brand-600 transition-colors">
          <Upload size={14} /> {uploading ? "Uploading…" : "Upload Document"}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {err && <p className="text-sm text-red-500">{err}</p>}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading documents…</div>
      ) : docs.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <FileText size={40} className="mx-auto opacity-30 mb-3" />
          <p className="text-sm">No documents uploaded yet.</p>
          <p className="text-xs mt-1">Upload company policies to make them available here.</p>
        </div>
      ) : (
        Object.entries(groups).map(([cat, items]) => (
          <div key={cat}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{cat}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(doc => <DocCard key={doc.document_id} doc={doc} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
