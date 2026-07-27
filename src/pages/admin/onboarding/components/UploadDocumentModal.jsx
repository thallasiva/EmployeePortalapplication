import React, { useState } from "react";
import { Upload, X } from "lucide-react";
import { uploadDocument } from "../../../../api/document.api";
import { errorToast, successToast } from "../../../../utils/ToastControllers";

const UploadDocumentModal = React.memo(function UploadDocumentModal({
  employee,
  onClose,
  onUploaded,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { errorToast("Please select a file"); return; }
    if (!title.trim()) { errorToast("Please enter a document title"); return; }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title.trim());
    if (description.trim()) fd.append("description", description.trim());
    fd.append("employee_id", employee.employee_id);
    fd.append("visibility", "private");

    setUploading(true);
    try {
      await uploadDocument(fd);
      successToast(`Document uploaded for ${employee.first_name}`);
      onUploaded();
      onClose();
    } catch (err) {
      errorToast(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Upload Document</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              For {employee.first_name} {employee.last_name || ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Offer Letter, I-9 Form, NDA"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this document"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 rounded-lg px-4 py-6 cursor-pointer hover:border-brand transition-colors">
              <Upload size={18} className="text-slate-400" />
              <span className="text-sm text-slate-500">
                {file ? file.name : "Click to choose a file"}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </label>
            {file && (
              <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 btn-primary py-2 text-sm disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default UploadDocumentModal;
