import React, { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Presentation,
  Search,
  Upload,
  X,
} from "lucide-react";
import {
  addAdminDocument,
  DOCUMENT_CATEGORIES,
  getAdminDocuments,
} from "../../data/adminDocumentsData";
import { successToast } from "../../utils/ToastControllers";
import "./adminDocuments.css";

function DocIcon({ icon, size = 18 }) {
  if (icon === "slides") return <Presentation size={size} />;
  if (icon === "sheet") return <FileSpreadsheet size={size} />;
  return <FileText size={size} />;
}

function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadDocumentModal({ open, onClose, onUpload }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("policies");
  const [file, setFile] = useState(null);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const ext = file?.name?.split(".").pop()?.toUpperCase() || "PDF";
    onUpload({
      title: title.trim(),
      description: description.trim(),
      category,
      fileType: ext,
      size: formatFileSize(file?.size),
      icon: ext === "PPTX" ? "slides" : ext === "XLSX" ? "sheet" : "pdf",
    });

    setTitle("");
    setDescription("");
    setCategory("policies");
    setFile(null);
    onClose();
  };

  return (
    <div className="admin-docs-modal-backdrop" onClick={onClose}>
      <div className="admin-docs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-docs-modal__header">
          <h2 className="admin-docs-modal__title">Upload Document</h2>
          <button type="button" className="admin-docs-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form className="admin-docs-modal__form" onSubmit={handleSubmit}>
          <div className="admin-docs-modal__field">
            <label htmlFor="doc-title">Title</label>
            <input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              required
            />
          </div>
          <div className="admin-docs-modal__field">
            <label htmlFor="doc-desc">Description</label>
            <textarea
              id="doc-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>
          <div className="admin-docs-modal__field">
            <label htmlFor="doc-category">Category</label>
            <select
              id="doc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {DOCUMENT_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-docs-modal__field">
            <label htmlFor="doc-file">File</label>
            <input
              id="doc-file"
              type="file"
              accept=".pdf,.doc,.docx,.xlsx,.pptx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="admin-docs-modal__footer">
            <button type="button" className="admin-docs-modal__btn admin-docs-modal__btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-docs-modal__btn admin-docs-modal__btn--submit">
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDocuments() {
  const [documents, setDocuments] = useState(() => getAdminDocuments());
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);

  const recentDocs = useMemo(
    () => documents.filter((d) => d.recent).slice(0, 5),
    [documents]
  );

  const filteredDocs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesTab = activeTab === "all" || doc.category === activeTab;
      const matchesSearch =
        !query ||
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.author.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [documents, activeTab, search]);

  const handleUpload = (payload) => {
    addAdminDocument(payload);
    setDocuments([...getAdminDocuments()]);
    successToast("Document uploaded");
  };

  return (
    <div className="admin-docs">
      <div className="admin-docs__header">
        <div className="admin-docs__title-row">
          <span className="admin-docs__icon-wrap">
            <FileText size={20} />
          </span>
          <div>
            <h1 className="admin-docs__title">Documents</h1>
            <p className="admin-docs__subtitle">
              Company policies, handbooks, templates, and forms
            </p>
          </div>
        </div>
        <button
          type="button"
          className="admin-docs__upload-btn"
          onClick={() => setUploadOpen(true)}
        >
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      <div className="admin-docs__search">
        <Search size={16} className="admin-docs__search-icon" />
        <input
          type="search"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {recentDocs.length > 0 && (
        <section>
          <p className="admin-docs__section-label">Recently Accessed</p>
          <div className="admin-docs__recent">
            {recentDocs.map((doc) => (
              <article key={doc.id} className="admin-docs__recent-card">
                <span className={`admin-docs__recent-icon admin-docs__recent-icon--${doc.icon}`}>
                  <DocIcon icon={doc.icon} size={16} />
                </span>
                <p className="admin-docs__recent-title" title={doc.title}>
                  {doc.title}
                </p>
                <p className="admin-docs__recent-size">{doc.size}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="admin-docs__tabs">
        {DOCUMENT_CATEGORIES.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-docs__tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="admin-docs__list">
        {filteredDocs.length === 0 ? (
          <p className="admin-docs__empty">No documents found.</p>
        ) : (
          filteredDocs.map((doc) => (
            <article key={doc.id} className="admin-docs__item">
              <span className="admin-docs__item-icon">
                <DocIcon icon={doc.icon} />
              </span>
              <div className="admin-docs__item-body">
                <div className="admin-docs__item-title-row">
                  <h3 className="admin-docs__item-title">{doc.title}</h3>
                  <span className="admin-docs__type-badge">{doc.fileType}</span>
                </div>
                <p className="admin-docs__item-desc">{doc.description}</p>
              </div>
              <div className="admin-docs__item-meta">
                <span className="admin-docs__item-size">{doc.size}</span>
                <span className="admin-docs__item-author">{doc.author}</span>
                <span className="admin-docs__item-date">{doc.date}</span>
              </div>
            </article>
          ))
        )}
      </section>

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
