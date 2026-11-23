import React, { useState } from "react";
import { X } from "lucide-react";
import { DOCUMENT_CATEGORIES } from "../../../data/adminDocumentsData";
import { formatFileSize } from "./shared";
function UploadDocumentModal({
  open,
  onClose,
  onUpload
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("policies");
  const [file, setFile] = useState(null);
  if (!open) return null;
  const handleSubmit = e => {
    e.preventDefault();
    if (!title.trim()) return;
    const ext = file?.name?.split(".").pop()?.toUpperCase() || "PDF";
    onUpload({
      title: title.trim(),
      description: description.trim(),
      category,
      fileType: ext,
      size: formatFileSize(file?.size),
      icon: ext === "PPTX" ? "slides" : ext === "XLSX" ? "sheet" : "pdf"
    });
    setTitle("");
    setDescription("");
    setCategory("policies");
    setFile(null);
    onClose();
  };
  return <div className="admin-docs-modal-backdrop" onClick={onClose}>
      <div className="admin-docs-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-docs-modal__header">
          <h2 className="admin-docs-modal__title">Upload Document</h2>
          <button type="button" className="admin-docs-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form className="admin-docs-modal__form" onSubmit={handleSubmit}>
          <div className="admin-docs-modal__field">
            <label htmlFor="doc-title">Title</label>
            <input id="doc-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title" required />
          </div>
          <div className="admin-docs-modal__field">
            <label htmlFor="doc-desc">Description</label>
            <textarea id="doc-desc" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" />
          </div>
          <div className="admin-docs-modal__field">
            <label htmlFor="doc-category">Category</label>
            <select id="doc-category" value={category} onChange={e => setCategory(e.target.value)}>
              {DOCUMENT_CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>
                  {c.label}
                </option>)}
            </select>
          </div>
          <div className="admin-docs-modal__field">
            <label htmlFor="doc-file">File</label>
            <input id="doc-file" type="file" accept=".pdf,.doc,.docx,.xlsx,.pptx" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="admin-docs-modal__footer">
            <button data-cancel-button type="button" className="admin-docs-modal__btn admin-docs-modal__btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-docs-modal__btn admin-docs-modal__btn--submit">
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>;
}
export { UploadDocumentModal };
